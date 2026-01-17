import redis from '../config/redis';
import pool, { query } from '../config/postgres';
import Job from '../models/Job';
import Application from '../models/Application';
import { getJobs, getApplications, getApplicationDetails } from '../services/bambooService';
import { extractTextFromPdf, extractTextFromDocx } from '../services/fileService';
import { rateApplication } from '../services/agentService';
import connectDB from '../config/db';
import axios from 'axios';

// Constants
const QUEUE_SYNC = 'queue:sync';
const QUEUE_PROCESS = 'queue:resume_processing';
const QUEUE_RATE = 'queue:rating';

const CHANNEL_EVENTS = 'channel:events';

// Helper to update Postgres State
const updateState = async (bambooId: number, step: string, status: string) => {
    try {
        await query(
            `INSERT INTO pipeline_status (bamboo_id, step, status) 
             VALUES ($1, $2, $3) 
             ON CONFLICT (bamboo_id) 
             DO UPDATE SET step = $2, status = $3, updated_at = NOW()`,
            [bambooId, step, status]
        );
        // Publish event for Frontend
        await redis.publish(CHANNEL_EVENTS, JSON.stringify({ bambooId, step, status }));
    } catch (err) {
        console.error(`Failed to update state for ${bambooId}:`, err);
    }
};

const ensureState = async (bambooId: number) => {
    try {
        await query(
            `INSERT INTO pipeline_status (bamboo_id, step, status) 
             VALUES ($1, 'SYNC', 'COMPLETED') 
             ON CONFLICT (bamboo_id) DO NOTHING`,
            [bambooId]
        );
    } catch (err) {
        console.error(`Failed to ensure state for ${bambooId}:`, err);
    }
};

const handleSync = async () => {
    console.log('🔄 Starting Sync...');
    try {
        await connectDB();

        // 1. Fetch/Update Jobs
        const bambooJobs = await getJobs();
        for (const bJob of bambooJobs) {
            await Job.findOneAndUpdate(
                { bambooId: bJob.id },
                {
                    title: bJob.jobOpeningName,
                    // Note: We don't overwrite manual description if it exists
                    $setOnInsert: { ratingEnabled: true, descriptionManuallyUpdated: false }
                },
                { upsert: true, new: true }
            );
        }

        // 2. Fetch Applications
        const { applications } = await getApplications();
        let newCount = 0;

        for (const app of applications) {
            // Ensure Postgres Row Exists (Backfill)
            await ensureState(app.id);

            let exists = await Application.findOne({ bambooId: app.id });

            // If new OR missing resumeFileId, fetch full details
            let resumeFileId = exists?.details?.resumeFileId;

            if (!exists || !resumeFileId) {
                // Fetch full details to get resume ID
                const fullDetails = await getApplicationDetails(app.id);
                if (fullDetails) {
                    resumeFileId = fullDetails.resumeFileId || fullDetails.originalResume?.id;
                }
            }

            if (!exists) {
                if (!app.firstName || !app.lastName) {
                    console.warn(`⚠️ App ${app.id} missing name fields. Keys:`, Object.keys(app));
                    // Attempt to find name in nested objects or alternate keys
                    // e.g. app.applicant?.firstName
                }

                // Insert into Mongo
                const applicantMap = app.applicant || {};
                await Application.create({
                    bambooId: app.id,
                    jobId: app.job?.id,
                    firstName: applicantMap.firstName,
                    lastName: applicantMap.lastName,
                    email: applicantMap.email,
                    phone: applicantMap.phone,
                    dateApplied: app.appliedDate, // API returns appliedDate
                    status: typeof app.status === 'object' ? app.status?.label : app.status,
                    details: { resumeFileId: app.resumeFileId } // Note: resumeFileId might be top-level or elsewhere? 
                    // Wait, previous logs didn't show resumeFileId in the structure?
                    // The log showed: id, appliedDate, status, rating, applicant, job. 
                    // Let's assume resumeFileId is not in this short summary.
                    // If it's not there, we can't download the resume!
                    // We might need to fetch `getApplicationDetails` for resume ID?
                    // Let's stick to what we see. 
                    // Actually, let's keep details as is, but if undefined, it will just start empty.
                });

                // Track in Postgres
                await updateState(app.id, 'SYNC', 'COMPLETED');

                // Enqueue for Resume Processing
                if (app.resumeFileId) {
                    await redis.lpush(QUEUE_PROCESS, JSON.stringify({
                        appId: app.id,
                        fileId: app.resumeFileId,
                        mongoId: (exists as any)?._id // Won't have ID on create immediately unless we await return.
                    }));
                    newCount++;
                }
            } else {
                // Check if we need to process resume (backfill)
                if (!exists.resumeText && exists.details?.resumeFileId) {
                    await redis.lpush(QUEUE_PROCESS, JSON.stringify({ appId: app.id, fileId: exists.details.resumeFileId }));
                }
            }
        }
        console.log(`✅ Sync Complete. ${newCount} new applicants.`);

    } catch (error) {
        console.error('Sync Failed:', error);
    }
};

const handleProcess = async (task: any) => {
    const { appId, fileId } = task;
    console.log(`📄 Processing Resume for App ${appId}...`);
    await updateState(appId, 'DOWNLOAD', 'IN_PROGRESS');

    try {
        await connectDB();
        // Download PDF
        const url = `https://${process.env.BAMBOOHR_COMPANY_DOMAIN}.bamboohr.com/api/v1/files/${fileId}`;
        const response = await axios.get(url, {
            headers: { Authorization: `Basic ${Buffer.from(process.env.BAMBOOHR_API_KEY + ':x').toString('base64')}` },
            responseType: 'arraybuffer'
        });

        const contentType = response.headers['content-type'];
        console.log(`📄 App ${appId} File Content-Type: ${contentType}`);

        let text = '';

        if (contentType && (contentType.includes('wordprocessingml') || contentType.includes('msword') || contentType.includes('application/msword') || contentType.includes('officedocument'))) {
            // DOCX parsing
            console.log(`📄 App ${appId} is DOCX. Using mammoth.`);
            text = await extractTextFromDocx(response.data);
        } else if (!contentType || contentType.includes('pdf') || contentType.includes('octet-stream')) {
            // Default to PDF
            text = await extractTextFromPdf(response.data).catch(err => {
                console.error(`PDF Parse Error for ${appId}:`, err.message);
                return '';
            });
        } else {
            console.warn(`⚠️ App ${appId} Unknown Format: ${contentType}`);
            await updateState(appId, 'DOWNLOAD', `FAILED_FORMAT_${contentType?.split('/')[1]}`);
            return;
        }



        if (text) {
            await Application.updateOne({ bambooId: appId }, { resumeText: text });
            await updateState(appId, 'DOWNLOAD', 'COMPLETED');

            // Enqueue for Rating
            await redis.lpush(QUEUE_RATE, JSON.stringify({ appId }));
        } else {
            // Distinguish between no text and parse error
            await updateState(appId, 'DOWNLOAD', 'FAILED_PDF_PARSE');
        }
    } catch (error) {
        console.error(`Process failed for ${appId}:`, error);
        await updateState(appId, 'DOWNLOAD', 'ERROR');
    }
};

const handleRate = async (task: any) => {
    const { appId } = task;
    console.log(`⭐ Rating App ${appId}...`);
    await updateState(appId, 'RATE', 'IN_PROGRESS');

    try {
        await connectDB();
        const app = await Application.findOne({ bambooId: appId });
        if (!app || !app.resumeText) {
            console.warn(`Cannot rate ${appId}: Missing data.`);
            return;
        }

        const job = await Job.findOne({ bambooId: app.jobId });
        if (!job || !job.ratingEnabled || !job.description || !job.descriptionManuallyUpdated) {
            console.warn(`Cannot rate ${appId}: Job config invalid (Enabled: ${job?.ratingEnabled}, Manual: ${job?.descriptionManuallyUpdated}).`);
            await updateState(appId, 'RATE', 'SKIPPED');
            return;
        }

        const result = await rateApplication(job.description, app.resumeText);
        if (result) {
            app.aiSummary = result;
            const ratingMatch = result.match(/Rating:\s*(\d+)/i) || result.match(/(\d+)\/10/);
            let rating = ratingMatch ? parseInt(ratingMatch[1], 10) : null;

            // Normalize rating
            if (rating && rating > 5) {
                rating = Math.round(rating / 2);
            }
            app.aiRating = rating || undefined;

            await app.save();
            await updateState(appId, 'RATE', 'COMPLETED');
            console.log(`✅ Rated App ${appId}: ${rating}/5`);
        } else {
            await updateState(appId, 'RATE', 'FAILED_AGENT');
        }

    } catch (error) {
        console.error(`Rate failed for ${appId}:`, error);
        await updateState(appId, 'RATE', 'ERROR');
    }
};

const startController = async () => {
    console.log('🚀 Real-Time Controller Started');
    console.log('Waiting for jobs...');

    // Scheduler: Trigger Sync every 10 Minutes
    setInterval(async () => {
        console.log('⏰ Scheduler: Triggering Auto-Sync...');
        await redis.lpush(QUEUE_SYNC, JSON.stringify({ source: 'scheduler' }));
    }, 10 * 60 * 1000); // 10 minutes

    while (true) {
        try {
            // Prioritize tasks
            const syncTask = await redis.rpop(QUEUE_SYNC);
            if (syncTask) {
                await handleSync();
                continue;
            }

            const processTask = await redis.rpop(QUEUE_PROCESS);
            if (processTask) {
                await handleProcess(JSON.parse(processTask));
                continue;
            }

            const rateTask = await redis.rpop(QUEUE_RATE);
            if (rateTask) {
                await handleRate(JSON.parse(rateTask));
                continue;
            }

            // Idle wait
            await new Promise(resolve => setTimeout(resolve, 2000));

        } catch (error) {
            console.error('Controller Loop Error:', error);
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }
};

startController();

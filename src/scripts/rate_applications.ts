import connectDB from '../config/db';
import Application from '../models/Application';
import Job, { IJob } from '../models/Job';
import { getJobDetails } from '../services/bambooService';
import { rateApplication } from '../services/agentService';
import mongoose from 'mongoose';

const runRating = async () => {
    await connectDB();

    try {
        // 1. Fetch all jobs and ensure they have descriptions
        const jobs = await Job.find({});
        const jobMap = new Map<number, IJob>(); // bambooId -> Job object

        for (const job of jobs) {
            if (job.description) {
                jobMap.set(job.bambooId, job); // Store the full job object
            } else {
                console.log(`Job ${job.bambooId} has no description. Please add one in the Admin UI.`);
            }
        }

        // 2. Find applications with resumeText but NO aiRating
        const appsToRate = await Application.find({
            resumeText: { $exists: true, $ne: null },
            $or: [
                { aiRating: { $exists: false } },
                { aiSummary: { $exists: false } }
            ]
        });

        console.log(`Found ${appsToRate.length} applications pending rating.`);

        for (const app of appsToRate) {
            const job = jobMap.get(app.jobId);
            if (!job) {
                console.warn(`Skipping App ${app.bambooId}: No job found for Job ID ${app.jobId}`);
                continue;
            }

            if (!job.ratingEnabled) {
                console.log(`Skipping App ${app.bambooId}: Rating disabled for Job ${job.bambooId}.`);
                continue;
            }

            if (!job.descriptionManuallyUpdated) {
                console.log(`Skipping App ${app.bambooId}: Job ${job.bambooId} description not manually updated.`);
                continue;
            }

            // If description is missing despite the flag (shouldn't happen), skip
            if (!job.description) {
                console.log(`Skipping App ${app.bambooId}: Job ${job.bambooId} description is empty.`);
                continue;
            }

            console.log(`Rating App ${app.bambooId}...`);
            const result = await rateApplication(job.description!, app.resumeText!);

            if (result) {
                // Let's assume it returns a JSON string or we need to ask user to clarify format.
                // Or maybe the agent returns structured data if we asked for it?
                // The prompt I sent was just "Job Description... Resume Text..."
                // The OUTPUT format depends on the Agent's system prompt which I don't control.
                // usage of "JSON" in the DO docs example suggests we might get JSON if the agent is configured that way.
                // OR just store the whole text in aiSummary and leave aiRating null if I can't parse it.
                // Actually, I'll save the whole response to aiSummary for now.

                app.aiSummary = result;

                // Attempt to find a number in the response for rating
                const ratingMatch = result.match(/Rating:\s*(\d+)/i) || result.match(/(\d+)\/10/);
                if (ratingMatch) {
                    app.aiRating = parseInt(ratingMatch[1], 10);
                }

                await app.save();
                console.log(`Rated App ${app.bambooId}.`);
            }
        }
        console.log('Rating complete.');

    } catch (error) {
        console.error('Rating failed:', error);
    } finally {
        mongoose.connection.close();
        process.exit();
    }
};

runRating();

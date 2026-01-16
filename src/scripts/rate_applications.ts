import connectDB from '../config/db';
import Application from '../models/Application';
import Job from '../models/Job';
import { getJobDetails, scrapeJobDescription } from '../services/bambooService';
import { rateApplication } from '../services/agentService';
import mongoose from 'mongoose';

const runRating = async () => {
    await connectDB();

    try {
        // 1. Fetch all jobs and ensure they have descriptions
        const jobs = await Job.find({});
        const jobMap = new Map<number, string>(); // bambooId -> description

        for (const job of jobs) {
            if (!job.description) {
                console.log(`Fetching description for Job ${job.bambooId} (scraping)...`);
                const description = await scrapeJobDescription(job.bambooId);

                if (description) {
                    console.log(`Found description (length ${description.length})`);
                    // Use updateOne to avoid validating other fields like 'title' if they are missing in legacy data
                    await Job.updateOne({ _id: job._id }, { description: description });
                    job.description = description; // Update local object for map
                    console.log(`Saved description for Job ${job.bambooId}`);
                } else {
                    console.log(`Could not scrape description for Job ${job.bambooId}`);
                }
            }
            if (job.description) {
                jobMap.set(job.bambooId, job.description);
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
            const description = jobMap.get(app.jobId);
            if (!description) {
                console.warn(`Skipping App ${app.bambooId}: No description for Job ${app.jobId}`);
                continue;
            }

            console.log(`Rating App ${app.bambooId}...`);
            const result = await rateApplication(description, app.resumeText || '');

            if (result) {
                // Parse result. User said it returns "summary and a rating".
                // Assuming JSON or text? The user didn't specify format.
                // "it will then return a summary and a rating"
                // Let's assume it returns a JSON string or we need to ask user to clarify format.
                // Or maybe the agent returns structured data if we asked for it?
                // The prompt I sent was just "Job Description... Resume Text..."
                // The OUTPUT format depends on the Agent's system prompt which I don't control.
                // usage of "JSON" in the DO docs example suggests we might get JSON if the agent is configured that way.
                // For now, I'll store the raw text in summary and try to extract a rating if possible, 
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

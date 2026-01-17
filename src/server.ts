import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import connectDB from './config/db';
import Job from './models/Job';
import Application from './models/Application';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware
app.use(cors());
app.use(express.json());

// Connect to Database
connectDB();

// Routes

// Get all jobs
app.get('/api/jobs', async (req, res) => {
    try {
        const jobs = await Job.find().sort({ dateOpened: -1 });
        res.json(jobs);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get single job
app.get('/api/jobs/:id', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        res.json(job);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Update job description (Manual Override & Toggle)
app.put('/api/jobs/:id', async (req, res) => {
    try {
        const { description, ratingEnabled } = req.body;

        const updateData: any = {};
        if (description !== undefined) {
            updateData.description = description;
            updateData.descriptionManuallyUpdated = true;
        }
        if (ratingEnabled !== undefined) {
            updateData.ratingEnabled = ratingEnabled;
        }

        const job = await Job.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }
        res.json(job);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get applicants for a job
app.get('/api/jobs/:id/applicants', async (req, res) => {
    try {
        // Find job first to get its bambooId if needed, 
        // but Application model uses jobId which seems to be the bambooId based on schema?
        // Let's check schema: Application.jobId type Number. Job.bambooId type Number.
        // Assuming the link is via bambooId if using typical relational logic, 
        // OR Application.jobId might be the MongoDB _id? 
        // Let's look at Application.ts: "jobId: { type: Number, required: true, index: true }"
        // This implies it links to Job.bambooId. 

        // However, the route parameter :id might be the MongoDB Object ID from the frontend if we link via _id.
        // Let's support both or check.

        const job = await Job.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

        // Find applications where jobId matches the job's bambooId
        const applications = await Application.find({ jobId: job.bambooId }).sort({ aiRating: -1 });
        res.json(applications);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Get single applicant
app.get('/api/applicants/:id', async (req, res) => {
    try {
        const application = await Application.findById(req.params.id);
        if (!application) {
            return res.status(404).json({ message: 'Application not found' });
        }
        res.json(application);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Server Error' });
    }
});

// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

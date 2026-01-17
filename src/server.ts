import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import http from 'http';
import { Server } from 'socket.io';
import Redis from 'ioredis';
import connectDB from './config/db';
import Job from './models/Job';
import Application from './models/Application';

// Load env vars
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = express();
const PORT = process.env.PORT || 5001;

// Create HTTP Server & Socket.IO
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*", // Allow all origins for simplicity (or configure specific frontend URL)
        methods: ["GET", "POST"]
    }
});

// Redis Subscriber for Real-Time Events
const redisUrl = process.env.REDIS_URL || process.env.VALKEY_URI || 'redis://localhost:6379';
const redisSub = new Redis(redisUrl, {
    tls: process.env.REDIS_URL?.includes('rediss://') ? { rejectUnauthorized: false } : undefined
});

redisSub.subscribe('channel:events', (err) => {
    if (err) console.error('Failed to subscribe to Redis events:', err);
    else console.log('✅ Subscribed to channel:events');
});

redisSub.on('message', (channel, message) => {
    if (channel === 'channel:events') {
        console.log('📡 Event received:', message);
        io.emit('pipeline_update', JSON.parse(message));
    }
});

io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);
    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

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

// Get applicants for a job (Merged with Pipeline Status)
// We need to fetch pipeline status from Postgres? 
// Or just let the frontend join via WebSocket events?
// Ideally, the initial load should include current status.
// I'll add a lightweight query if needed, but for now, let's keep Mongo as source
// and let Frontend fetch status or just start listening.
// Actually, I should probably expose an endpoint to get statuses.
// But for MVP, let's keep it simple.

app.get('/api/jobs/:id/applicants', async (req, res) => {
    try {
        const job = await Job.findById(req.params.id);
        if (!job) {
            return res.status(404).json({ message: 'Job not found' });
        }

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
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

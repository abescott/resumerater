import connectDB from '../config/db';
import Application from '../models/Application';
import mongoose from 'mongoose';

const inspect = async () => {
    await connectDB();
    try {
        const app = await Application.findOne({ details: { $exists: true } });
        if (app) {
            console.log('Application Details Keys:', Object.keys(app.details));
            console.log('Full Details:', JSON.stringify(app.details, null, 2));
        } else {
            console.log('No application with details found.');
        }
    } catch (err) {
        console.error(err);
    } finally {
        mongoose.connection.close();
    }
};

inspect();

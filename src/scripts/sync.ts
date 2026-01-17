import connectDB from '../config/db';
import { getJobs, getApplications, getApplicationDetails } from '../services/bambooService';
import Job from '../models/Job';
import Application from '../models/Application';
import mongoose from 'mongoose';

const syncData = async () => {
    await connectDB();

    try {
        console.log('Fetching Jobs...');
        const jobs = await getJobs();
        console.log(`Found ${jobs.length} jobs.`);

        for (const job of jobs) {
            await Job.findOneAndUpdate(
                { bambooId: job.id },
                {
                    bambooId: job.id,
                    title: job.title?.label || 'Untitled Job',
                    department: job.department?.label || (typeof job.department === 'string' ? job.department : 'Unknown'),
                    location: job.location?.label || (job.location?.address ? [job.location.address.city, job.location.address.state].filter(Boolean).join(', ') : 'Unknown'),
                    division: job.division?.label || (typeof job.division === 'string' ? job.division : 'Unknown'),
                    status: job.status?.label || (typeof job.status === 'string' ? job.status : 'Unknown'),
                    dateOpened: job.createdDate ? new Date(job.createdDate) : undefined,
                },
                { upsert: true, new: true }
            );
        }
        console.log('Jobs synced successfully.');

        console.log('Fetching Applications...');
        const applications = await getApplications(); // This might be paginated in reality
        console.log(`Found ${applications.applications.length} applications.`);
        if (applications.applications.length > 0) {
            console.log('Sample Application Data:', JSON.stringify(applications.applications[0], null, 2));
        }

        for (const app of applications.applications) {
            console.log(`Fetching details for application ${app.id}...`);
            const details = await getApplicationDetails(app.id);

            await Application.findOneAndUpdate(
                { bambooId: app.id },
                {
                    bambooId: app.id,
                    jobId: app.job?.id,
                    firstName: app.applicant?.firstName || 'Unknown',
                    lastName: app.applicant?.lastName || 'Unknown',
                    email: app.applicant?.email,
                    phone: app.applicant?.phone,
                    dateApplied: app.appliedDate ? new Date(app.appliedDate) : undefined,
                    status: app.status?.label || (typeof app.status === 'string' ? app.status : 'Unknown'),
                    rating: app.rating,
                    rawResponse: app,
                    details: details
                },
                { upsert: true, new: true }
            );
        }
        console.log('Applications synced successfully.');

    } catch (error) {
        console.error('Sync failed:', error);
    } finally {
        mongoose.connection.close();
        process.exit();
    }
};

syncData();

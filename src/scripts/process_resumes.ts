import connectDB from '../config/db';
import Application from '../models/Application';
import { extractTextFromPdf } from '../services/fileService';
import mongoose from 'mongoose';
import axios from 'axios';

const processResumes = async () => {
    await connectDB();

    try {
        // Find applications with resumeFileId but no resumeText
        // We look inside 'details.resumeFileId' since that's where we saved it
        const appsToProcess = await Application.find({
            'details.resumeFileId': { $ne: null },
            resumeText: { $exists: false }
        });

        console.log(`Found ${appsToProcess.length} applications with resumes to process.`);

        for (const app of appsToProcess) {
            const fileId = app.details.resumeFileId;
            console.log(`Processing App ${app.bambooId} (File ID: ${fileId})...`);

            try {
                // Download file
                const url = `https://${process.env.BAMBOOHR_COMPANY_DOMAIN}.bamboohr.com/api/v1/files/${fileId}`;
                const response = await axios.get(url, {
                    headers: {
                        Authorization: `Basic ${Buffer.from(process.env.BAMBOOHR_API_KEY + ':x').toString('base64')}`,
                    },
                    responseType: 'arraybuffer'
                });

                const contentType = response.headers['content-type'];
                if (contentType && !contentType.includes('pdf')) {
                    console.log(`Skipping non-PDF file (Type: ${contentType})`);
                    continue;
                }

                const text = await extractTextFromPdf(response.data);

                if (text) {
                    // Use updateOne to avoid full document validation issues (like missing jobId on old records)
                    await Application.updateOne({ _id: app._id }, { resumeText: text });
                    console.log(`Saved ${text.length} chars of resume text.`);
                } else {
                    console.log('No text extracted.');
                }
            } catch (err) {
                console.error(`Failed to process app ${app.bambooId}:`, err);
            }
        }
        console.log('Resume processing complete.');

    } catch (error) {
        console.error('Process failed:', error);
    } finally {
        mongoose.connection.close();
        process.exit();
    }
};

processResumes();

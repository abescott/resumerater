import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';
import { extractTextFromPdf, extractTextFromDocx } from '../services/fileService';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const debugDownload = async (fileId: string) => {
    console.log(`Testing Download for File ID: ${fileId}`);

    const url = `https://${process.env.BAMBOOHR_COMPANY_DOMAIN}.bamboohr.com/api/v1/files/${fileId}`;
    const auth = `Basic ${Buffer.from(process.env.BAMBOOHR_API_KEY + ':x').toString('base64')}`;

    try {
        console.log(`Fetching URL: ${url}`);
        const response = await axios.get(url, {
            headers: { Authorization: auth },
            responseType: 'arraybuffer'
        });

        console.log('--- HEADERS ---');
        console.log('Status:', response.status);
        console.log('Content-Type:', response.headers['content-type']);
        console.log('Content-Length:', response.headers['content-length']);

        const contentType = response.headers['content-type'];
        let text = '';
        if (contentType && (contentType.includes('word') || contentType.includes('officedocument'))) {
            console.log('Detected DOCX. Using mammoth...');
            text = await extractTextFromDocx(response.data);
        } else {
            console.log('Attempting PDF Extraction...');
            text = await extractTextFromPdf(response.data);
        }

        if (text) {
            console.log('✅ Success! Extracted Text Length:', text.length);
            console.log('Preview:', text.substring(0, 100));
        } else {
            console.error('❌ Failed: No text extracted');
        }

    } catch (error: any) {
        console.error('❌ HTTP Error:');
        if (error.response) {
            console.log('Status:', error.response.status);
            console.log('Data (first 100 chars):', error.response.data.toString().substring(0, 100));
        } else {
            console.log(error.message);
        }
    }
};

// Test with a file ID that failed (from previous logs, we don't have the file ID visible, only bamboo_id)
// But wait, the previous logs showed bamboo_id 1947.
// I need the RESUME FILE ID, not the Applicant ID.
// The Controller fetches it from Mongo.
// I'll query Mongo first to get the file ID for bamboo_id 1947.

import connectDB from '../config/db';
import Application from '../models/Application';

const run = async () => {
    await connectDB();
    const app = await Application.findOne({ bambooId: 1947 }); // Use a known ID
    if (app && app.details?.resumeFileId) {
        await debugDownload(app.details.resumeFileId);
    } else {
        console.log('Could not find app 1947 or missing resumeFileId');
        // Try finding ANY app with a resumeFileId
        const anyApp = await Application.findOne({ "details.resumeFileId": { $exists: true } });
        if (anyApp) {
            console.log(`Fallback: Testing with App ${anyApp.bambooId}, File ${anyApp.details?.resumeFileId}`);
            await debugDownload(anyApp.details?.resumeFileId!);
        }
    }
    process.exit();
};

run();

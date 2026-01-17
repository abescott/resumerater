import axios from 'axios';
const pdf = require('pdf-parse');
import mammoth from 'mammoth';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const API_KEY = process.env.BAMBOOHR_API_KEY;
const DOMAIN = process.env.BAMBOOHR_COMPANY_DOMAIN;

if (!API_KEY || !DOMAIN) {
    throw new Error('Missing API Config');
}

const authHeader = {
    Authorization: `Basic ${Buffer.from(API_KEY + ':x').toString('base64')}`,
};

export const downloadFile = async (fileId: number): Promise<Buffer> => {
    const url = `https://${DOMAIN}.bamboohr.com/api/v1/files/${fileId}`;
    try {
        const response = await axios.get(url, {
            headers: authHeader,
            responseType: 'arraybuffer'
        });
        console.log(`Downloaded ${response.data.length} bytes. Content-Type: ${response.headers['content-type']}`);
        const start = response.data.slice(0, 20).toString();
        console.log(`File start: ${start}`);
        return response.data;
    } catch (error) {
        console.error(`Error downloading file ${fileId}:`, error);
        throw error;
    }
};

export const extractTextFromPdf = async (buffer: Buffer): Promise<string> => {
    try {
        const data = await pdf(buffer);
        return data.text;
    } catch (error) {
        console.error('Error parsing PDF:', error);
        return '';
    }
};

export const extractTextFromDocx = async (buffer: Buffer): Promise<string> => {
    try {
        const result = await mammoth.extractRawText({ buffer });
        return result.value;
    } catch (error) {
        console.error('Error parsing DOCX:', error);
        return '';
    }
};

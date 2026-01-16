import axios from 'axios';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const API_KEY = process.env.BAMBOOHR_API_KEY;
const DOMAIN = process.env.BAMBOOHR_COMPANY_DOMAIN;
const BASE_URL = `https://api.bamboohr.com/api/gateway.php/${DOMAIN}/v1/applicant_tracking`;

if (!API_KEY || !DOMAIN) {
    console.error('Missing BAMBOOHR_API_KEY or BAMBOOHR_COMPANY_DOMAIN in .env');
    process.exit(1);
}

const authHeader = {
    Authorization: `Basic ${Buffer.from(API_KEY + ':x').toString('base64')}`,
    Accept: 'application/json',
};

export const getJobs = async () => {
    try {
        const response = await axios.get(`${BASE_URL}/jobs`, { headers: authHeader });
        return response.data;
    } catch (error) {
        console.error('Error fetching jobs:', error);
        throw error;
    }
};

export const getApplications = async () => {
    try {
        // Note: This endpoint usually supports pagination or filters. 
        // Fetching all for now.
        const response = await axios.get(`${BASE_URL}/applications`, { headers: authHeader });
        return response.data;
    } catch (error) {
        console.error('Error fetching applications:', error);
        throw error;
    }
};

export const getApplicationDetails = async (applicationId: number) => {
    try {
        const response = await axios.get(`${BASE_URL}/applications/${applicationId}`, { headers: authHeader });
        return response.data;
    } catch (error) {
        console.error(`Error fetching details for app ${applicationId}:`, error);
        return null; // Return null on failure to keep sync going
    }
};

export const getJobDetails = async (jobId: number) => {
    try {
        // The list endpoint doesn't give description. We need individual endpoint.
        // Assuming /jobs/{id} exists based on standard patterns or list item data.
        // Let's try fetching the individual job to get the description.
        // If not standard, we might need to check if list response has it hidden.
        // BambooHR API: GET /v1/applicant_tracking/jobs/{id}
        const response = await axios.get(`${BASE_URL}/jobs/${jobId}`, { headers: authHeader });
        return response.data;
    } catch (error) {
        console.error(`Error fetching job details for ${jobId}:`, error);
        return null;
    }
};

const cheerio = require('cheerio');

export const scrapeJobDescription = async (jobId: number): Promise<string | null> => {
    try {
        const domain = process.env.BAMBOOHR_COMPANY_DOMAIN;
        // The internal API endpoint used by the SPA
        const url = `https://${domain}.bamboohr.com/careers/${jobId}/detail`;
        console.log(`Scraping URL (API): ${url}`);

        // Headers are important to get JSON
        const response = await axios.get(url, {
            headers: {
                'Accept': 'application/json'
            }
        });

        const data = response.data;

        // Access nested description
        // Path: result.jobOpening.description
        let descriptionHtml = data?.result?.jobOpening?.description;

        if (!descriptionHtml) {
            console.log(`No description found in keys: ${Object.keys(data?.result?.jobOpening || {})}`);
            return null;
        }

        // Use cheerio to strip HTML tags
        const $ = cheerio.load(descriptionHtml);
        const text = $.text();

        return text.trim() || null;
    } catch (error) {
        console.error(`Error scraping job description for ${jobId}:`, error);
        return null;
    }
}

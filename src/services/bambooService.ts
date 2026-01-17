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
        let allApplications: any[] = [];
        let nextPageUrl = `${BASE_URL}/applications`;

        console.log('Fetching applications pages...');

        while (nextPageUrl) {
            console.log(`Fetching page: ${nextPageUrl}`);

            let urlToFetch = nextPageUrl;
            if (!nextPageUrl.startsWith('http')) {
                // The API returns a relative path like /v1/applicant_tracking/applications?page=2
                // We need to prepend the gateway domain and company domain
                // BASE_URL is https://api.bamboohr.com/api/gateway.php/${DOMAIN}/v1/applicant_tracking
                // We want https://api.bamboohr.com/api/gateway.php/${DOMAIN} + nextPageUrl

                const apiRoot = `https://api.bamboohr.com/api/gateway.php/${DOMAIN}`;
                urlToFetch = `${apiRoot}${nextPageUrl}`;
            }

            const response = await axios.get(urlToFetch, { headers: authHeader });
            const data = response.data;

            if (data.applications) {
                allApplications = allApplications.concat(data.applications);
            }

            // API returns nextPageUrl as null when done, or a string URL for next page
            nextPageUrl = data.nextPageUrl; // Check if this matches actual API response key

            if (!data.paginationComplete && !nextPageUrl) {
                // Break to avoid infinite loop if API behaves unexpectedly
                break;
            }
        }

        return { applications: allApplications };
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



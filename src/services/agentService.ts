import { OpenAI } from 'openai';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const AGENT_ENDPOINT = process.env.DIGITAL_OCEAN_AGENT_ENDPOINT;
const AGENT_KEY = process.env.DIGITAL_OCEAN_AGENT_KEY;

if (!AGENT_ENDPOINT || !AGENT_KEY) {
    console.warn('Missing Digital Ocean Agent Config');
}

// Adjust base URL to include /api/v1/ as per DO docs if not already there, 
// but OpenAI SDK usually handles base path. 
// Docs said: agent_endpoint = os.getenv("agent_endpoint") + "/api/v1/"
// The user provided https://tbe2zf2goa4y6vt5khr3c2ah.agents.do-ai.run
// So we should append /api/v1
const baseURL = AGENT_ENDPOINT ? `${AGENT_ENDPOINT}/api/v1` : undefined;

const client = new OpenAI({
    baseURL: baseURL,
    apiKey: AGENT_KEY,
});

export const rateApplication = async (jobDescription: string, resumeText: string) => {
    try {
        const response = await client.chat.completions.create({
            model: "n/a", // DO Agent ignores model name
            messages: [
                { role: "user", content: `Job Description: ${jobDescription}\n\nResume Text: ${resumeText}` }
            ],
        });

        const content = response.choices[0].message.content;
        return content;
    } catch (error) {
        console.error('Error calling AI Agent:', error);
        return null;
    }
};

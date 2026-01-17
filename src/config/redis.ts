import Redis from 'ioredis';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const redisUri = process.env.VALKEY_URI || process.env.REDIS_URI;

if (!redisUri) {
    console.warn('WARNING: VALKEY_URI or REDIS_URI is not defined in .env');
}

// Create a generic Redis client
const redis = new Redis(redisUri || 'redis://localhost:6379', {
    tls: redisUri?.startsWith('rediss://') ? { rejectUnauthorized: false } : undefined,
    maxRetriesPerRequest: 3,
    retryStrategy(times) {
        if (times > 3) {
            console.error('Redis connection failed. Retrying...');
            return null; // Stop retrying
        }
        return Math.min(times * 50, 2000);
    },
});

redis.on('error', (err) => {
    console.error('Redis Client Error:', err);
});

redis.on('connect', () => {
    console.log('Connected to Valkey/Redis');
});

export default redis;

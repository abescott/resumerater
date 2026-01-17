import redis from '../config/redis';

const triggerSync = async () => {
    try {
        console.log('Pushing SYNC job to queue...');
        await redis.lpush('queue:sync', JSON.stringify({ timestamp: Date.now() }));
        console.log('✅ SYNC job enqueued.');
    } catch (error) {
        console.error('Failed to enqueue sync job:', error);
    } finally {
        redis.disconnect();
    }
};

triggerSync();

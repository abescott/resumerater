import redis from '../config/redis';

const debugRedis = async () => {
    try {
        console.log('Checking Redis...');
        const syncLen = await redis.llen('queue:sync');
        console.log(`Length of queue:sync: ${syncLen}`);

        const pong = await redis.ping();
        console.log(`Redis PING response: ${pong}`);

        if (syncLen > 0) {
            console.log('Peeking at first item:');
            const item = await redis.lrange('queue:sync', 0, 0);
            console.log(item);
        }

    } catch (error) {
        console.error('Redis Error:', error);
    } finally {
        redis.disconnect();
    }
};

debugRedis();

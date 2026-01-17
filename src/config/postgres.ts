import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const postgresUri = process.env.POSTGRES_URI;

if (!postgresUri) {
    console.warn('WARNING: POSTGRES_URI is not defined in .env');
}

const pool = new Pool({
    connectionString: postgresUri,
    ssl: {
        rejectUnauthorized: false
    }
});

pool.on('error', (err, client) => {
    console.error('Unexpected error on idle Postgres client', err);
});

export const query = (text: string, params?: any[]) => pool.query(text, params);

export default pool;

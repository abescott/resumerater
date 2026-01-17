import { Pool } from 'pg';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const postgresUri = process.env.POSTGRES_URI;

if (!postgresUri) {
    console.warn('WARNING: POSTGRES_URI is not defined in .env');
} else {
    // FIX: Digital Ocean Managed DBs use self-signed certs.
    // If we simply pass the URI with sslmode=require, it fails.
    // We must force Node to accept the chain.
    if (postgresUri.includes('sslmode=require')) {
        process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
    }
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

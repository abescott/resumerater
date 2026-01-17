import { query } from '../config/postgres';

const checkTable = async () => {
    try {
        const res = await query('SELECT count(*) FROM pipeline_status');
        console.log('Row count in pipeline_status:', res.rows[0].count);

        const rows = await query('SELECT * FROM pipeline_status ORDER BY updated_at DESC LIMIT 5');
        console.log('Recent Rows:', rows.rows);
    } catch (err) {
        console.error('Query failed:', err);
    }
};

checkTable();

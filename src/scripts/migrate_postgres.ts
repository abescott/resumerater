import pool from '../config/postgres';

const migrate = async () => {
    console.log('Starting PostgreSQL Migration...');

    const createTableQuery = `
        CREATE TABLE IF NOT EXISTS pipeline_status (
            id SERIAL PRIMARY KEY,
            bamboo_id INTEGER UNIQUE NOT NULL,
            step VARCHAR(50) NOT NULL,
            status VARCHAR(50) NOT NULL,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    // Function to update updated_at automatically
    const createFunctionQuery = `
        CREATE OR REPLACE FUNCTION update_updated_at_column()
        RETURNS TRIGGER AS $$
        BEGIN
            NEW.updated_at = NOW();
            RETURN NEW;
        END;
        $$ language 'plpgsql';
    `;

    const createTriggerQuery = `
        DROP TRIGGER IF EXISTS update_pipeline_status_modtime ON pipeline_status;
        CREATE TRIGGER update_pipeline_status_modtime
        BEFORE UPDATE ON pipeline_status
        FOR EACH ROW
        EXECUTE PROCEDURE update_updated_at_column();
    `;

    try {
        await pool.query(createTableQuery);
        console.log('✓ Table "pipeline_status" created/verified.');

        await pool.query(createFunctionQuery);
        console.log('✓ Function "update_updated_at_column" created/verified.');

        await pool.query(createTriggerQuery);
        console.log('✓ Trigger "update_pipeline_status_modtime" created/verified.');

        console.log('Migration Complete.');
    } catch (err) {
        console.error('Migration Failed:', err);
    } finally {
        await pool.end();
    }
};

migrate();

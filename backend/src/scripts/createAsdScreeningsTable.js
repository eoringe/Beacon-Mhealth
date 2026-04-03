/**
 * Database Migration: Create asd_screenings table
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const createAsdScreeningsTable = async () => {
    const client = await pool.connect();
    try {
        console.log('Creating asd_screenings table...');

        const query = `
            CREATE TABLE IF NOT EXISTS asd_screenings (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
                responses JSONB NOT NULL,
                score INTEGER NOT NULL,
                risk_level VARCHAR(20) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            -- Create indexes for better query performance
            CREATE INDEX IF NOT EXISTS idx_asd_screenings_child_id ON asd_screenings(child_id);
            CREATE INDEX IF NOT EXISTS idx_asd_screenings_risk_level ON asd_screenings(risk_level);
        `;

        await client.query(query);
        console.log('✅ asd_screenings table created successfully!');
    } catch (error) {
        console.error('❌ Error creating asd_screenings table:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
};

if (require.main === module) {
    createAsdScreeningsTable()
        .then(() => {
            console.log('Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { createAsdScreeningsTable };

/**
 * Database Migration: Create doctor_unavailability table
 * Run this script to create the table for tracking when doctors are unavailable
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const createDoctorUnavailabilityTable = async () => {
    const client = await pool.connect();
    try {
        console.log('Creating doctor_unavailability table...');

        const query = `
            CREATE TABLE IF NOT EXISTS doctor_unavailability (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
                unavailable_date DATE NOT NULL,
                start_time TIME,
                end_time TIME,
                reason VARCHAR(255),
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            -- Create indexes for efficient querying
            CREATE INDEX IF NOT EXISTS idx_unavailability_doctor_date ON doctor_unavailability(doctor_id, unavailable_date);
        `;

        await client.query(query);
        console.log('✅ doctor_unavailability table created successfully!');
        console.log('✅ Indexes created successfully!');
    } catch (error) {
        console.error('❌ Error creating doctor_unavailability table:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
};

// Run migration
if (require.main === module) {
    createDoctorUnavailabilityTable()
        .then(() => {
            console.log('Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { createDoctorUnavailabilityTable };

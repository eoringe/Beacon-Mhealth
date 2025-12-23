/**
 * Database Migration: Create doctors table
 * Run this script to create the table for storing doctor/therapist information
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const createDoctorsTable = async () => {
    const client = await pool.connect();
    try {
        console.log('Creating doctors table...');

        const query = `
            CREATE TABLE IF NOT EXISTS doctors (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                name VARCHAR(255) NOT NULL,
                specialty VARCHAR(100) NOT NULL,
                email VARCHAR(255) UNIQUE NOT NULL,
                phone VARCHAR(50),
                photo_url TEXT,
                bio TEXT,
                is_available BOOLEAN DEFAULT true,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );

            -- Create indexes for better query performance
            CREATE INDEX IF NOT EXISTS idx_doctors_specialty ON doctors(specialty);
            CREATE INDEX IF NOT EXISTS idx_doctors_available ON doctors(is_available);
        `;

        await client.query(query);
        console.log('✅ doctors table created successfully!');
        console.log('✅ Indexes created successfully!');
    } catch (error) {
        console.error('❌ Error creating doctors table:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
};

// Run migration
if (require.main === module) {
    createDoctorsTable()
        .then(() => {
            console.log('Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { createDoctorsTable };

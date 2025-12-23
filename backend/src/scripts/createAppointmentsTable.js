/**
 * Database Migration: Create appointments table
 * Run this script to create the table for storing appointment bookings
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const createAppointmentsTable = async () => {
    const client = await pool.connect();
    try {
        console.log('Creating appointments table...');

        // Create table first
        await client.query(`
            CREATE TABLE IF NOT EXISTS appointments (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                parent_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
                child_id UUID REFERENCES children(id) ON DELETE SET NULL,
                doctor_id UUID NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
                appointment_date DATE NOT NULL,
                appointment_time TIME NOT NULL,
                duration_minutes INTEGER DEFAULT 60,
                status VARCHAR(50) DEFAULT 'scheduled',
                reason TEXT,
                notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        console.log('✅ appointments table created!');

        // Create unique constraint for preventing double-booking
        await client.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS unique_doctor_slot 
                ON appointments(doctor_id, appointment_date, appointment_time);
        `);

        // Create indexes for efficient querying
        await client.query(`CREATE INDEX IF NOT EXISTS idx_appointments_doctor_date ON appointments(doctor_id, appointment_date);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_appointments_parent ON appointments(parent_id);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_appointments_status ON appointments(status);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_appointments_child ON appointments(child_id);`);

        console.log('✅ Indexes created successfully!');
    } catch (error) {
        console.error('❌ Error creating appointments table:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
};

// Run migration
if (require.main === module) {
    createAppointmentsTable()
        .then(() => {
            console.log('Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { createAppointmentsTable };

/**
 * Simple script to manually create appointments table
 * This bypasses the problematic index creation
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const setupAppointments = async () => {
    const client = await pool.connect();
    try {
        console.log('Dropping existing appointments table if exists...');
        await client.query('DROP TABLE IF EXISTS appointments CASCADE;');

        console.log('Creating appointments table...');
        await client.query(`
            CREATE TABLE appointments (
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

        console.log('Creating unique index...');
        await client.query('CREATE UNIQUE INDEX unique_doctor_slot ON appointments(doctor_id, appointment_date, appointment_time);');

        console.log('Creating other indexes...');
        await client.query('CREATE INDEX idx_appointments_parent ON appointments(parent_id);');
        await client.query('CREATE INDEX idx_appointments_child ON appointments(child_id);');

        console.log('✅ appointments table setup complete!');
    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
};

setupAppointments().then(() => process.exit(0)).catch(() => process.exit(1));

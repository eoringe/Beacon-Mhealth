/**
 * Database Migration: Create appointments_mobile table
 * This table is separate from the existing 'appointments' table in the Laravel database
 * Run this script to create the table for mobile app appointment bookings
 */

require('dotenv').config();
const { Pool } = require('pg');

// Connect to the external database where appointments_mobile will be created
const pool = new Pool({
    connectionString: process.env.EXTERNAL_DATABASE_URL,
});

const createAppointmentsMobileTable = async () => {
    const client = await pool.connect();
    try {
        console.log('Creating appointments_mobile table in external database...');

        // Create table first
        await client.query(`
            CREATE TABLE IF NOT EXISTS appointments_mobile (
                id SERIAL PRIMARY KEY,
                parent_firebase_uid VARCHAR(255) NOT NULL,
                child_id INTEGER REFERENCES children(id) ON DELETE SET NULL,
                doctor_id INTEGER REFERENCES staff(id) ON DELETE CASCADE,
                appointment_date DATE NOT NULL,
                appointment_time TIME NOT NULL,
                duration_minutes INTEGER DEFAULT 60,
                status VARCHAR(50) DEFAULT 'scheduled',
                reason TEXT,
                notes TEXT,
                source VARCHAR(50) DEFAULT 'mobile_app',
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        console.log('✅ appointments_mobile table created!');

        // Create unique constraint for preventing double-booking
        await client.query(`
            CREATE UNIQUE INDEX IF NOT EXISTS unique_mobile_doctor_slot 
                ON appointments_mobile(doctor_id, appointment_date, appointment_time);
        `);

        // Create indexes for efficient querying
        await client.query(`CREATE INDEX IF NOT EXISTS idx_mobile_appt_parent ON appointments_mobile(parent_firebase_uid);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_mobile_appt_doctor_date ON appointments_mobile(doctor_id, appointment_date);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_mobile_appt_status ON appointments_mobile(status);`);
        await client.query(`CREATE INDEX IF NOT EXISTS idx_mobile_appt_child ON appointments_mobile(child_id);`);

        console.log('✅ Indexes created successfully!');

        // Verify table creation
        const verifyQuery = `
            SELECT column_name, data_type, is_nullable
            FROM information_schema.columns
            WHERE table_name = 'appointments_mobile'
            ORDER BY ordinal_position;
        `;
        const verifyResult = await client.query(verifyQuery);

        console.log('\n📋 Table structure:');
        verifyResult.rows.forEach(col => {
            console.log(`  - ${col.column_name}: ${col.data_type} (nullable: ${col.is_nullable})`);
        });

    } catch (error) {
        console.error('❌ Error creating appointments_mobile table:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
};

// Run migration
if (require.main === module) {
    createAppointmentsMobileTable()
        .then(() => {
            console.log('\n✅ Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('❌ Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { createAppointmentsMobileTable };

const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function addRegistrationColumn() {
    try {
        console.log('Adding registration_number column to children table...');

        await pool.query(`
            ALTER TABLE children 
            ADD COLUMN IF NOT EXISTS registration_number VARCHAR(255) NULL
        `);

        console.log('Successfully added registration_number column.');

        // Also add insurance_number and birth_cert while we are at it, as they might be useful
        await pool.query(`
            ALTER TABLE children 
            ADD COLUMN IF NOT EXISTS insurance_number VARCHAR(255) NULL,
            ADD COLUMN IF NOT EXISTS birth_cert VARCHAR(255) NULL
        `);
        console.log('Successfully added insurance_number and birth_cert columns.');

    } catch (err) {
        console.error('Error updating schema:', err);
    } finally {
        await pool.end();
    }
}

addRegistrationColumn();

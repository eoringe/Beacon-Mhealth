
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Make registration_number nullable to support manual child entry
        await client.query(`
      ALTER TABLE children 
      ALTER COLUMN registration_number DROP NOT NULL;
    `);

        // Proactively make insurance_number and birth_cert nullable too, just in case
        await client.query(`
      ALTER TABLE children 
      ALTER COLUMN insurance_number DROP NOT NULL;
    `);

        await client.query(`
      ALTER TABLE children 
      ALTER COLUMN birth_cert DROP NOT NULL;
    `);

        await client.query('COMMIT');
        console.log('Successfully made registration_number, insurance_number, and birth_cert nullable');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating schema:', err);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();


const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Make fullname nullable since we use first_name/last_name now
        await client.query(`
      ALTER TABLE children 
      ALTER COLUMN fullname DROP NOT NULL;
    `);

        // Also check other potentially problematic legacy columns
        // checking if 'dob' is nullable (we use date_of_birth now)
        await client.query(`
      ALTER TABLE children 
      ALTER COLUMN dob DROP NOT NULL;
    `);

        // checking if 'gender_id' is nullable (we use gender string now)
        await client.query(`
      ALTER TABLE children 
      ALTER COLUMN gender_id DROP NOT NULL;
    `);

        await client.query('COMMIT');
        console.log('Successfully made legacy columns (fullname, dob, gender_id) nullable');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating schema:', err);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();

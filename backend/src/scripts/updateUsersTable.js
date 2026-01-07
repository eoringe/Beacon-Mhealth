
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Add firebase_uid if not exists
        await client.query(`
      ALTER TABLE users 
      ADD COLUMN IF NOT EXISTS firebase_uid VARCHAR(255) UNIQUE,
      ADD COLUMN IF NOT EXISTS display_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS photo_url VARCHAR(255),
      ADD COLUMN IF NOT EXISTS phone_number VARCHAR(255),
      ADD COLUMN IF NOT EXISTS location VARCHAR(255),
      ADD COLUMN IF NOT EXISTS fcm_token TEXT,
      ADD COLUMN IF NOT EXISTS date_of_birth DATE;
    `);

        // Make password nullable since we're using Firebase Auth
        await client.query(`
      ALTER TABLE users 
      ALTER COLUMN password DROP NOT NULL;
    `);

        await client.query('COMMIT');
        console.log('Successfully updated users table schema');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating schema:', err);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();

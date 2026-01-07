
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // Make name nullable since we use display_name now
        await client.query(`
      ALTER TABLE users 
      ALTER COLUMN name DROP NOT NULL;
    `);

        await client.query('COMMIT');
        console.log('Successfully made name column nullable');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating schema:', err);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();

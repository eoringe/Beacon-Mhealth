const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        console.log('--- Adding photo_url column to children table ---');
        await client.query(`
            ALTER TABLE children 
            ADD COLUMN IF NOT EXISTS photo_url TEXT;
        `);

        await client.query('COMMIT');
        console.log('Successfully added photo_url column to children table.');
        process.exit(0);
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating children schema:', err);
        process.exit(1);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();

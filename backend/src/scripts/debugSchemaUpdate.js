
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function debugSchemaUpdate() {
    const client = await pool.connect();
    try {
        console.log('--- Debugging Schema Update ---');

        // Check current search path and schemas
        const schemaRes = await client.query('SHOW search_path');
        console.log('Search path:', schemaRes.rows[0].search_path);

        // Check table details
        const tableRes = await client.query(`
        SELECT table_schema, table_name 
        FROM information_schema.tables 
        WHERE table_name = 'children'
    `);
        console.log('Found tables:', tableRes.rows);

        // Try adding parent_id explicitly
        console.log('Attempting to add parent_id...');
        try {
            await client.query('ALTER TABLE children ADD COLUMN parent_id INTEGER');
            console.log('  SUCCESS: added parent_id');
        } catch (e) {
            console.log('  FAILED to add parent_id:', e.message);
        }

        // Check columns again
        const colRes = await client.query(`
        SELECT column_name 
        FROM information_schema.columns 
        WHERE table_name = 'children'
    `);
        console.log('Final Columns:', colRes.rows.map(r => r.column_name));

    } catch (err) {
        console.error('Meta Error:', err);
    } finally {
        client.release();
        pool.end();
    }
}

debugSchemaUpdate();

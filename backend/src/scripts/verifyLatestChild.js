const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function verifyLatestChild() {
    try {
        const res = await pool.query('SELECT * FROM children ORDER BY created_at DESC LIMIT 1');
        if (res.rows.length > 0) {
            console.log('Latest Child Record in Local Database:');
            console.log(JSON.stringify(res.rows[0], null, 2));
        } else {
            console.log('No children found in local database.');
        }
    } catch (err) {
        console.error('Error querying database:', err);
    } finally {
        await pool.end();
    }
}

verifyLatestChild();

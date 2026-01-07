
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkData() {
    try {
        const res = await pool.query('SELECT count(*) FROM children');
        console.log('Children count:', res.rows[0].count);
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkData();

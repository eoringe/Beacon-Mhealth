
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkGender() {
    try {
        const res = await pool.query('SELECT * FROM gender');
        console.log('Genders:', res.rows);
    } catch (err) {
        console.log('Error checking gender table (might not exist):', err.message);
    } finally {
        pool.end();
    }
}

checkGender();

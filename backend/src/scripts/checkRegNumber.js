const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function checkRegNumber() {
    try {
        const res = await pool.query('SELECT registration_number FROM children ORDER BY created_at DESC LIMIT 1');
        if (res.rows.length > 0) {
            console.log('REG_NUMBER:', res.rows[0].registration_number);
        } else {
            console.log('NO RECORDS');
        }
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

checkRegNumber();

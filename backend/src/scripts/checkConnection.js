
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkConnection() {
    try {
        const res = await pool.query('SELECT current_database(), inet_server_addr(), inet_server_port();');
        console.log('Connected to:', res.rows[0]);
        console.log('Connection String (masked):', process.env.DATABASE_URL.replace(/:[^:]*@/, ':****@'));
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkConnection();


const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function checkChildrenSchema() {
    try {
        const res = await pool.query(`
      SELECT column_name
      FROM information_schema.columns 
      WHERE table_name = 'children';
    `);
        console.log('--- COLUMNS START ---');
        res.rows.forEach(r => console.log(r.column_name));
        console.log('--- COLUMNS END ---');
    } catch (err) {
        console.error(err);
    } finally {
        pool.end();
    }
}

checkChildrenSchema();

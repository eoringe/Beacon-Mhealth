const { Pool } = require('pg');
require('dotenv').config({ path: 'src/config/.env' });

const externalDbUrl = process.env.EXTERNAL_DATABASE_URL;
const pool = new Pool({
    connectionString: externalDbUrl,
    ssl: { rejectUnauthorized: false }
});

async function inspect() {
    try {
        const potentialNames = ['phone', 'phone_number', 'mobile', 'telephone', 'contact', 'cell'];

        const res = await pool.query(`
            SELECT column_name
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `);

        const columns = res.rows.map(r => r.column_name);
        console.log("ALL COLUMNS:", columns.join(', '));

        const found = columns.filter(c => potentialNames.some(p => c.includes(p)));
        console.log("FOUND PHONE COLUMNS:", found);

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

inspect();

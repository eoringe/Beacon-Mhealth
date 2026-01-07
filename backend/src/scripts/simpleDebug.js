require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.EXTERNAL_DATABASE_URL,
});

const fs = require('fs');

async function run() {
    const client = await pool.connect();
    let output = '';
    try {
        output += '--- TRIAGE COLUMNS ---\n';
        const cols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'triage'
        `);
        output += cols.rows.map(r => `${r.column_name} (${r.data_type})`).join('\n') + '\n\n';

        output += '--- SAMPLE TRIAGE DATA (Top 5) ---\n';
        const res = await client.query('SELECT * FROM triage LIMIT 5');
        output += JSON.stringify(res.rows, null, 2) + '\n\n';

        output += '--- SAMPLE CHILDREN WITH REG NUMBER ---\n';
        const children = await client.query('SELECT id, fullname, registration_number FROM children WHERE registration_number IS NOT NULL LIMIT 5');
        output += JSON.stringify(children.rows, null, 2) + '\n';

        fs.writeFileSync('debug_output.txt', output);
        console.log('Output written to debug_output.txt');

    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        await pool.end();
    }
}
run();

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.EXTERNAL_DATABASE_URL,
});

async function checkTriage() {
    const client = await pool.connect();
    try {
        console.log('--- Checking Triage Table ---');

        // Count total rows
        const countRes = await client.query('SELECT count(*) FROM triage');
        console.log('Total rows in triage:', countRes.rows[0].count);

        // Check columns
        const colRes = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'triage'
        `);
        console.log('Triage Columns:', colRes.rows.map(r => r.column_name).join(', '));

        // Start from reg number
        const regNumber = '008-2025';
        const childRes = await client.query('SELECT id FROM children WHERE registration_number = $1', [regNumber]);

        if (childRes.rows.length > 0) {
            const childId = childRes.rows[0].id;
            console.log(`\nChecking child ${regNumber} (ID: ${childId})`);

            const visitRes = await client.query('SELECT id, visit_date FROM visits WHERE child_id = $1', [childId]);
            console.log(`Visits found: ${visitRes.rows.length}`);
            visitRes.rows.forEach(v => console.log(` - Visit ID: ${v.id}, Date: ${v.visit_date}`));

            const triageRes = await client.query('SELECT * FROM triage WHERE child_id = $1', [childId]);
            console.log(`Triage records found: ${triageRes.rows.length}`);
            if (triageRes.rows.length > 0) console.log('Sample:', triageRes.rows[0].data);
        }

    } catch (err) {
        console.error(err);
    } finally {
        client.release();
        await pool.end();
    }
}
checkTriage();

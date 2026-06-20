require('dotenv').config({ path: './backend/.env' });
const { pool } = require('./backend/src/config/database');

async function checkSchema() {
    try {
        console.log('--- growth_measurements Columns ---');
        const growthCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'growth_measurements'");
        console.log(growthCols.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));

        console.log('\n--- child_vaccinations Columns ---');
        const vacCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'child_vaccinations'");
        console.log(vacCols.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));

        console.log('\n--- vaccines Columns ---');
        const specCols = await pool.query("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'vaccines'");
        console.log(specCols.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));

        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
}

checkSchema();

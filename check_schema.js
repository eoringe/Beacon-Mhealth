require('dotenv').config({ path: './backend/.env' });
const { externalQuery } = require('./backend/src/config/externalDatabase');

async function checkSchema() {
    try {
        console.log('--- Appointments Columns ---');
        const apptCols = await externalQuery("SELECT column_name FROM information_schema.columns WHERE table_name = 'appointments'");
        console.log(apptCols.rows.map(r => r.column_name).join(', '));

        console.log('\n--- Doctor Unavailabilities Columns ---');
        const unavailCols = await externalQuery("SELECT column_name FROM information_schema.columns WHERE table_name = 'doctor_unavailabilities'");
        console.log(unavailCols.rows.map(r => r.column_name).join(', '));

        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
}

checkSchema();

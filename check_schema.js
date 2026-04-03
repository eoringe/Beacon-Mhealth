require('dotenv').config({ path: './backend/.env' });
const { externalQuery } = require('./backend/src/config/externalDatabase');

async function checkSchema() {
    try {
        console.log('--- Appointments Columns ---');
        const apptCols = await externalQuery("SELECT column_name FROM information_schema.columns WHERE table_name = 'appointments'");
        console.log(apptCols.rows.map(r => r.column_name).join(', '));

        console.log('\n--- Staff Columns ---');
        const staffCols = await externalQuery("SELECT column_name FROM information_schema.columns WHERE table_name = 'reports_staff'");
        console.log(staffCols.rows.map(r => r.column_name).join(', '));

        console.log('\n--- Staff Specialization Columns ---');
        const pivotCols = await externalQuery("SELECT column_name FROM information_schema.columns WHERE table_name = 'staff_specialization'");
        console.log(pivotCols.rows.map(r => r.column_name).join(', '));

        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
}

checkSchema();

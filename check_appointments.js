require('dotenv').config({ path: './backend/.env' });
const { externalQuery } = require('./backend/src/config/externalDatabase');

async function checkAppointments() {
    try {
        console.log('Fetching last 5 appointments...');
        const result = await externalQuery(`
            SELECT id, appointment_date, appointment_type, google_meet_link, google_calendar_html_link, status, created_at
            FROM appointments 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        result.rows.forEach(row => {
            console.log('-------------------');
            console.log(`ID: ${row.id}`);
            console.log(`Date: ${row.appointment_date}`);
            console.log(`Type: ${row.appointment_type}`);
            console.log(`Meet Link: ${row.google_meet_link}`);
            console.log(`Calendar Link: ${row.google_calendar_html_link}`);
            console.log(`Status: ${row.status}`);
            console.log(`Created At: ${row.created_at}`);
        });
        process.exit(0);
    } catch (err) {
        console.error('Check failed:', err);
        process.exit(1);
    }
}

checkAppointments();

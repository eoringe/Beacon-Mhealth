const { externalQuery } = require('../config/externalDatabase');

async function debugExternalDB() {
    try {
        console.log('--- Debugging External Database ---');

        // 1. Check Appointment Table Columns
        console.log('\n1. Checking "appointments" table columns:');
        const columns = await externalQuery(`
            SELECT column_name, data_type, udt_name
            FROM information_schema.columns
            WHERE table_name = 'appointments';
        `);
        columns.rows.forEach(col => {
            console.log(` - ${col.column_name} (${col.data_type} / ${col.udt_name})`);
        });

        // 2. Check Valid Statuses (if it's an enum, querying distinct values helps)
        console.log('\n2. Distinct Status values currently in DB:');
        const statuses = await externalQuery(`
            SELECT DISTINCT status FROM appointments;
        `);
        console.log(JSON.stringify(statuses.rows, null, 2));

        // 3. Check for specific appointment if ID provided (optional)
        // const appointmentId = 123; 
        // const apt = await externalQuery('SELECT * FROM appointments WHERE id = $1', [appointmentId]);
        // console.log('\n3. Specific Appointment:', apt.rows[0]);

    } catch (error) {
        console.error('Debug Error:', error);
    } finally {
        // Force exit since externalQuery might hold pool open
        process.exit();
    }
}

debugExternalDB();

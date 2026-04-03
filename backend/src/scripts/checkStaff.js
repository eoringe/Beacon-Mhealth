const { externalQuery } = require('../config/externalDatabase');

async function checkStaff() {
    try {
        console.log('--- Checking staff table ---');
        const result = await externalQuery('SELECT id, fullname, email FROM staff');
        result.rows.forEach(row => {
            console.log(`ID: ${row.id}, Name: ${row.fullname}, Email: ${row.email}`);
        });
        process.exit(0);
    } catch (error) {
        console.error('Error checking staff:', error);
        process.exit(1);
    }
}

checkStaff();

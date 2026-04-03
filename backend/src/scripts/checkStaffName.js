const { externalQuery } = require('../config/externalDatabase');

async function checkStaffName() {
    try {
        console.log('--- Inspecting staff name structure ---');
        const result = await externalQuery('SELECT id, fullname FROM staff WHERE id = 3');
        if (result.rows.length > 0) {
            console.log('ID 3 Fullname:', JSON.stringify(result.rows[0].fullname, null, 2));
        }
        process.exit(0);
    } catch (error) {
        console.error('Error checking staff name:', error);
        process.exit(1);
    }
}

checkStaffName();

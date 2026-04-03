const { externalQuery } = require('../config/externalDatabase');

async function checkUsers() {
    try {
        console.log('--- Checking users table ---');
        const result = await externalQuery('SELECT id, name, email FROM users');
        result.rows.forEach(row => {
            console.log(`ID: ${row.id}, Name: ${row.name}, Email: ${row.email}`);
        });
        process.exit(0);
    } catch (error) {
        console.error('Error checking users:', error);
        process.exit(1);
    }
}

checkUsers();

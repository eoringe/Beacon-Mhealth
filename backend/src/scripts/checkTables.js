const { externalQuery } = require('../config/externalDatabase');

async function checkTables() {
    try {
        console.log('--- Checking all tables in external database ---');
        const result = await externalQuery(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('Tables found:');
        result.rows.forEach(row => {
            console.log(`- ${row.table_name}`);
        });
        process.exit(0);
    } catch (error) {
        console.error('Error checking tables:', error);
        process.exit(1);
    }
}

checkTables();

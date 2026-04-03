// /tmp/list_external_tables.js
const { externalQuery } = require('./src/config/externalDatabase');

async function listTables() {
    try {
        const result = await externalQuery(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public' 
            AND table_type = 'BASE TABLE'
            ORDER BY table_name;
        `);
        console.log('--- External Tables ---');
        result.rows.forEach(r => console.log(r.table_name));
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

listTables();

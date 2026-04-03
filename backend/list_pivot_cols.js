// backend/list_pivot_cols.js
const { externalQuery } = require('./src/config/externalDatabase');

async function listCols() {
    try {
        const result = await externalQuery("SELECT column_name FROM information_schema.columns WHERE table_name = 'staff_specialization'");
        console.log('--- Columns ---');
        console.log(result.rows.map(r => r.column_name));
        process.exit();
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
}

listCols();

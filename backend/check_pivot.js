// backend/check_pivot.js
const { externalQuery } = require('./src/config/externalDatabase');

async function checkPivot() {
    try {
        const columns = await externalQuery(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'staff_specialization';
        `);
        console.log('--- staff_specialization Columns ---');
        columns.rows.forEach(col => console.log(` - ${col.column_name} (${col.data_type})`));
        
        const sample = await externalQuery('SELECT * FROM staff_specialization LIMIT 5');
        console.log('\n--- Sample Data ---');
        console.log(JSON.stringify(sample.rows, null, 2));
        
    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

checkPivot();

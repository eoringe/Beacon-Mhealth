const { externalQuery } = require('../config/externalDatabase');

async function checkSchema() {
    try {
        console.log('--- Checking media table columns ---');
        const result = await externalQuery(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'media'
            ORDER BY ordinal_position
        `);
        console.log('Columns in media table:');
        result.rows.forEach(row => {
            console.log(`- ${row.column_name} (${row.data_type})`);
        });

        console.log('\n--- Checking for potential uploader fields ---');
        const uploaderFields = result.rows.filter(row => 
            row.column_name.includes('user') || 
            row.column_name.includes('upload') || 
            row.column_name.includes('author') ||
            row.column_name.includes('created_by')
        );
        console.log('Potential fields:', uploaderFields.map(f => f.column_name).join(', ') || 'None found');

        process.exit(0);
    } catch (error) {
        console.error('Error checking schema:', error);
        process.exit(1);
    }
}

checkSchema();

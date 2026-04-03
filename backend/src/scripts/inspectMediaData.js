const { externalQuery } = require('../config/externalDatabase');

async function checkMediaData() {
    try {
        console.log('--- Inspecting media data (custom_properties) ---');
        const result = await externalQuery(`
            SELECT id, name, custom_properties 
            FROM media 
            ORDER BY created_at DESC 
            LIMIT 5
        `);
        
        result.rows.forEach(row => {
            console.log(`\nID: ${row.id}, Name: ${row.name}`);
            console.log('Custom Properties:', JSON.stringify(row.custom_properties, null, 2));
        });

        process.exit(0);
    } catch (error) {
        console.error('Error checking data:', error);
        process.exit(1);
    }
}

checkMediaData();

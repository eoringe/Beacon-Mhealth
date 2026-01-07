/**
 * Test External Database Connection
 * Run this script to verify connectivity to the Laravel database
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.EXTERNAL_DATABASE_URL,
});

const testConnection = async () => {
    const client = await pool.connect();
    try {
        console.log('🔌 Testing connection to external Laravel database...\n');

        // Test basic connectivity
        const timeResult = await client.query('SELECT NOW() as current_time');
        console.log('✅ Connection successful!');
        console.log(`   Server time: ${timeResult.rows[0].current_time}\n`);

        // Check if required tables exist
        const tables = ['children', 'parents', 'child_parent', 'visits', 'triage', 'staff', 'genders'];
        console.log('📋 Checking required tables:');

        for (const table of tables) {
            const result = await client.query(`
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = $1
                );
            `, [table]);

            const exists = result.rows[0].exists;
            console.log(`   ${exists ? '✅' : '❌'} ${table}`);
        }

        // Sample query to verify data access
        console.log('\n📊 Sample data check:');

        const childCount = await client.query('SELECT COUNT(*) as count FROM children');
        console.log(`   Children records: ${childCount.rows[0].count}`);

        const parentCount = await client.query('SELECT COUNT(*) as count FROM parents');
        console.log(`   Parent records: ${parentCount.rows[0].count}`);

        const visitCount = await client.query('SELECT COUNT(*) as count FROM visits');
        console.log(`   Visit records: ${visitCount.rows[0].count}`);

        // Get a sample registration number if any exist
        const sampleChild = await client.query(`
            SELECT registration_number, fullname 
            FROM children 
            WHERE registration_number IS NOT NULL 
            LIMIT 1
        `);

        if (sampleChild.rows.length > 0) {
            console.log(`\n💡 Sample registration number for testing: ${sampleChild.rows[0].registration_number}`);
        }

        console.log('\n✅ External database connection test completed!');
    } catch (error) {
        console.error('❌ Connection test failed:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
};

// Run test
if (require.main === module) {
    testConnection()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { testConnection };

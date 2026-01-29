/**
 * Database Reset Script
 * Truncates all tables in the public schema to clear the database.
 * Usage: node src/scripts/resetDatabase.js
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const resetDatabase = async () => {
    const client = await pool.connect();
    try {
        console.log('🗑️  Starting database reset...');

        // 1. Get all table names in the public schema
        const tablesQuery = `
            SELECT tablename 
            FROM pg_tables 
            WHERE schemaname = 'public';
        `;
        const tablesResult = await client.query(tablesQuery);

        if (tablesResult.rows.length === 0) {
            console.log('⚠️  No tables found to reset.');
            return;
        }

        const tables = tablesResult.rows.map(row => `"${row.tablename}"`).join(', ');

        console.log(`📋 Found ${tablesResult.rows.length} tables: ${tables}`);

        // 2. Truncate all tables
        // CASCADE is required to handle foreign key constraints
        const truncateQuery = `TRUNCATE TABLE ${tables} RESTART IDENTITY CASCADE;`;

        console.log('🔥 Truncating tables...');
        await client.query(truncateQuery);

        console.log('✅ Database successfully reset! All tables are now empty.');

    } catch (error) {
        console.error('❌ Error resetting database:', error.message);
        process.exit(1);
    } finally {
        client.release();
        await pool.end();
    }
};

// Run the script
if (require.main === module) {
    resetDatabase();
}

/**
 * Migration: Create insurance_providers table and update children table
 * Run this script to add the missing insurance tables to the external database
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.EXTERNAL_DATABASE_URL,
});

const createInsuranceTables = async () => {
    const client = await pool.connect();
    try {
        console.log('Creating insurance_providers table...');

        // Create insurance_providers table
        await client.query(`
            CREATE TABLE IF NOT EXISTS insurance_providers (
                id SERIAL PRIMARY KEY,
                insurance VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        console.log('✅ insurance_providers table created!');

        // Check if columns exist on children table
        const colCheck = await client.query(`
            SELECT column_name 
            FROM information_schema.columns 
            WHERE table_name = 'children' 
            AND column_name IN ('insurance_provider_id', 'insurance_number')
        `);

        const existingCols = colCheck.rows.map(r => r.column_name);

        // Add insurance_provider_id column if not exists
        if (!existingCols.includes('insurance_provider_id')) {
            console.log('Adding insurance_provider_id column to children table...');
            await client.query(`
                ALTER TABLE children 
                ADD COLUMN insurance_provider_id INTEGER REFERENCES insurance_providers(id)
            `);
            console.log('✅ insurance_provider_id column added!');
        } else {
            console.log('ℹ️  insurance_provider_id column already exists');
        }

        // Add insurance_number column if not exists
        if (!existingCols.includes('insurance_number')) {
            console.log('Adding insurance_number column to children table...');
            await client.query(`
                ALTER TABLE children 
                ADD COLUMN insurance_number VARCHAR(255)
            `);
            console.log('✅ insurance_number column added!');
        } else {
            console.log('ℹ️  insurance_number column already exists');
        }

        console.log('\n✅ Migration completed successfully!');

    } catch (error) {
        console.error('❌ Error:', error.message);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
};

// Run migration
if (require.main === module) {
    createInsuranceTables()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { createInsuranceTables };

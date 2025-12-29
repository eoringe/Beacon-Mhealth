/**
 * Database Migration: Create growth_measurements table
 * Run this script to create the table for storing child growth data
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const createGrowthTable = async () => {
    const client = await pool.connect();
    try {
        console.log('Creating growth_measurements table...');

        // Drop table if exists to ensure clean state during development
        await client.query(`DROP TABLE IF EXISTS growth_measurements;`);

        // Create table
        await client.query(`
            CREATE TABLE growth_measurements (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
                recorded_date DATE NOT NULL,
                weight DECIMAL(5,2), -- in kg
                height DECIMAL(5,2), -- in cm
                head_circumference DECIMAL(5,2), -- in cm
                notes TEXT,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        console.log('✅ growth_measurements table created!');

        // Create indexes for efficient querying
        await client.query(`CREATE INDEX idx_growth_child_date ON growth_measurements(child_id, recorded_date);`);

        console.log('✅ Indexes created successfully!');
    } catch (error) {
        console.error('❌ Error creating growth_measurements table:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
};

// Run migration
if (require.main === module) {
    createGrowthTable()
        .then(() => {
            console.log('Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { createGrowthTable };

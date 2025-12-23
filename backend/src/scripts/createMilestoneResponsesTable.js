/**
 * Database Migration: Create milestone_responses table
 * Run this script to create the table for storing milestone tracking data
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

const createMilestoneResponsesTable = async () => {
    const client = await pool.connect();
    try {
        console.log('Creating milestone_responses table...');

        const query = `
            CREATE TABLE IF NOT EXISTS milestone_responses (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                child_id UUID NOT NULL REFERENCES children(id) ON DELETE CASCADE,
                age_months INTEGER NOT NULL,
                category VARCHAR(50) NOT NULL,
                responses JSONB NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                UNIQUE(child_id, age_months, category)
            );

            -- Create indexes for better query performance
            CREATE INDEX IF NOT EXISTS idx_milestone_responses_child_id ON milestone_responses(child_id);
            CREATE INDEX IF NOT EXISTS idx_milestone_responses_age_months ON milestone_responses(age_months);
            CREATE INDEX IF NOT EXISTS idx_milestone_responses_category ON milestone_responses(category);
        `;

        await client.query(query);
        console.log('✅ milestone_responses table created successfully!');
        console.log('✅ Indexes created successfully!');
    } catch (error) {
        console.error('❌ Error creating milestone_responses table:', error);
        throw error;
    } finally {
        client.release();
        await pool.end();
    }
};

// Run migration
if (require.main === module) {
    createMilestoneResponsesTable()
        .then(() => {
            console.log('Migration completed successfully');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Migration failed:', error);
            process.exit(1);
        });
}

module.exports = { createMilestoneResponsesTable };

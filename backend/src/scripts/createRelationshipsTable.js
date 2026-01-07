/**
 * Migration: Create relationships table
 * Run this script to add the missing relationships table to the external database
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.EXTERNAL_DATABASE_URL,
});

const createRelationshipsTable = async () => {
    const client = await pool.connect();
    try {
        console.log('Creating relationships table...');

        // Create relationships table
        await client.query(`
            CREATE TABLE IF NOT EXISTS relationships (
                id SERIAL PRIMARY KEY,
                name VARCHAR(255) NOT NULL,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
            );
        `);
        console.log('✅ relationships table created!');

        // Insert common relationships if table is empty
        const countResult = await client.query('SELECT COUNT(*) as count FROM relationships');
        if (parseInt(countResult.rows[0].count) === 0) {
            console.log('Seeding common relationships...');
            await client.query(`
                INSERT INTO relationships (name) VALUES
                ('Father'),
                ('Mother'),
                ('Guardian'),
                ('Grandparent'),
                ('Sibling'),
                ('Other')
            `);
            console.log('✅ Relationships seeded!');
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
    createRelationshipsTable()
        .then(() => process.exit(0))
        .catch(() => process.exit(1));
}

module.exports = { createRelationshipsTable };

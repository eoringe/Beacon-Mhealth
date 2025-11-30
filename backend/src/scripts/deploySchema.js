const { Pool } = require('pg');
require('dotenv').config();
const fs = require('fs');
const path = require('path');

async function deploySchema() {
    const pool = new Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });

    try {
        console.log('🔄 Connecting to database...');

        // Read the schema file
        const schemaPath = path.join(__dirname, '../../prisma/schema.sql');
        const schema = fs.readFileSync(schemaPath, 'utf-8');

        console.log('📝 Deploying schema...');
        await pool.query(schema);

        console.log('✅ Schema deployed successfully!');
        console.log('\n📊 Tables created:');
        console.log('  - users');
        console.log('  - children');
        console.log('  - milestones');
        console.log('  - child_milestones');
        console.log('  - vaccines');
        console.log('  - child_vaccinations');
        console.log('  - growth_measurements');
        console.log('  - appointments');
        console.log('  - notifications');

    } catch (error) {
        console.error('❌ Error deploying schema:', error.message);
        throw error;
    } finally {
        await pool.end();
    }
}

deploySchema()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));

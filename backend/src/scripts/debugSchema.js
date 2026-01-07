/**
 * Debug script to check external database schema
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.EXTERNAL_DATABASE_URL,
});

const checkSchema = async () => {
    const client = await pool.connect();
    try {
        console.log('📋 Checking external database schema...\n');

        // Check children table columns
        console.log('CHILDREN table columns:');
        const childCols = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'children'
            ORDER BY ordinal_position
        `);
        childCols.rows.forEach(c => console.log(`  - ${c.column_name}: ${c.data_type}`));

        // Check genders table
        console.log('\nGENDERS table:');
        const genderCheck = await client.query(`
            SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'genders')
        `);
        console.log(`  Exists: ${genderCheck.rows[0].exists}`);

        if (genderCheck.rows[0].exists) {
            const genderCols = await client.query(`
                SELECT column_name FROM information_schema.columns WHERE table_name = 'genders'
            `);
            console.log(`  Columns: ${genderCols.rows.map(c => c.column_name).join(', ')}`);
        }

        // Check insurance_providers table
        console.log('\nINSURANCE_PROVIDERS table:');
        const insCheck = await client.query(`
            SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'insurance_providers')
        `);
        console.log(`  Exists: ${insCheck.rows[0].exists}`);

        // Check relationships table
        console.log('\nRELATIONSHIPS table:');
        const relCheck = await client.query(`
            SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'relationships')
        `);
        console.log(`  Exists: ${relCheck.rows[0].exists}`);

        // Get a sample child record
        console.log('\n📊 Sample child record:');
        const sample = await client.query(`SELECT * FROM children LIMIT 1`);
        if (sample.rows.length > 0) {
            console.log(JSON.stringify(sample.rows[0], null, 2));
        }

        // Try to find the patient
        console.log('\n🔍 Looking for registration number 008-2025:');
        const patient = await client.query(`
            SELECT * FROM children WHERE registration_number = $1
        `, ['008-2025']);
        if (patient.rows.length > 0) {
            console.log('Found patient:');
            console.log(JSON.stringify(patient.rows[0], null, 2));
        } else {
            console.log('Not found. Checking available registration numbers:');
            const regs = await client.query(`
                SELECT registration_number FROM children 
                WHERE registration_number IS NOT NULL 
                LIMIT 5
            `);
            regs.rows.forEach(r => console.log(`  - ${r.registration_number}`));
        }

    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
};

checkSchema();

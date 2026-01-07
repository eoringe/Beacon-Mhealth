
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function fixColumns() {
    const client = await pool.connect();
    try {
        console.log('--- Fixing Missing Columns ---');

        const columnsToAdd = [
            { name: 'first_name', type: 'VARCHAR(255)' },
            { name: 'last_name', type: 'VARCHAR(255)' },
            { name: 'date_of_birth', type: 'DATE' },
            { name: 'gender', type: 'VARCHAR(50)' },
            { name: 'blood_type', type: 'VARCHAR(10)' },
            { name: 'allergies', type: 'TEXT' }
        ];

        for (const col of columnsToAdd) {
            try {
                console.log(`Adding ${col.name}...`);
                await client.query(`ALTER TABLE children ADD COLUMN "${col.name}" ${col.type}`);
                console.log(`  SUCCESS: Added ${col.name}`);
            } catch (e) {
                console.log(`  FAILED to add ${col.name}: ${e.message}`);
            }
        }

        // Migrate data after adding columns
        await client.query(`
        UPDATE children 
        SET first_name = split_part(fullname, ' ', 1),
            last_name = substring(fullname from position(' ' in fullname) + 1),
            date_of_birth = TO_DATE(dob, 'YYYY-MM-DD'),
            gender = (SELECT gender FROM gender WHERE gender.id::text = children.gender_id::text)
    `);
        console.log('Data migration executed.');

    } catch (err) {
        console.error('Meta Error:', err);
    } finally {
        client.release();
        pool.end();
    }
}

fixColumns();

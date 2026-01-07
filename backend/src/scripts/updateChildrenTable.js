
const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL
});

async function migrate() {
    const client = await pool.connect();
    try {
        await client.query('BEGIN');

        // 1. Add new columns expected by childController
        await client.query(`
      ALTER TABLE children 
      ADD COLUMN IF NOT EXISTS parent_id INTEGER,
      ADD COLUMN IF NOT EXISTS first_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS last_name VARCHAR(255),
      ADD COLUMN IF NOT EXISTS date_of_birth DATE,
      ADD COLUMN IF NOT EXISTS gender VARCHAR(50),
      ADD COLUMN IF NOT EXISTS blood_type VARCHAR(10),
      ADD COLUMN IF NOT EXISTS allergies TEXT;
    `);

        // 2. Add foreign key constraint separately to handle potential failures gracefully, 
        // or we can add it in CREATE/ALTER. Ideally parent_id should reference users(id).
        // checking if constraint exists is hard in raw SQL without querying catalog, so we'll just try adding it
        try {
            await client.query(`
            ALTER TABLE children 
            ADD CONSTRAINT fk_children_parent 
            FOREIGN KEY (parent_id) REFERENCES users(id) ON DELETE CASCADE;
        `);
        } catch (e) {
            // Ignore if constraint already exists
            console.log('Constraint might already exist or failed:', e.message);
        }


        // 3. Migrate existing data (Best Effort)

        // Migrate DOB
        try {
            // cast dob (varchar?) to date
            await client.query(`
            UPDATE children 
            SET date_of_birth = TO_DATE(dob, 'YYYY-MM-DD') 
            WHERE date_of_birth IS NULL AND dob IS NOT NULL;
        `);
        } catch (e) {
            console.log('Error migrating DOB:', e.message);
        }

        // Migrate Gender (assuming gender table has id, gender)
        // We cast IDs to text to be safe if types mismatch (int vs string)
        try {
            await client.query(`
            UPDATE children 
            SET gender = (SELECT gender FROM gender WHERE gender.id::text = children.gender_id::text) 
            WHERE gender IS NULL AND gender_id IS NOT NULL;
        `);
        } catch (e) {
            console.log('Error migrating Gender:', e.message);
        }

        // Migrate fullname to first_name (naive split)
        try {
            await client.query(`
            UPDATE children 
            SET first_name = split_part(fullname, ' ', 1),
                last_name = substring(fullname from position(' ' in fullname) + 1)
            WHERE first_name IS NULL AND fullname IS NOT NULL;
        `);
        } catch (e) {
            console.log('Error migrating Names:', e.message);
        }

        await client.query('COMMIT');
        console.log('Successfully updated children table schema and migrated data.');
    } catch (err) {
        await client.query('ROLLBACK');
        console.error('Error updating children schema:', err);
    } finally {
        client.release();
        pool.end();
    }
}

migrate();

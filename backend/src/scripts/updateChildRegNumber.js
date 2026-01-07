const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

async function updateChildReg() {
    try {
        console.log('Updating registration_number for latest child to 008-2025...');

        // Update the most recently created child
        const res = await pool.query(`
            UPDATE children 
            SET registration_number = '008-2025'
            WHERE id = (
                SELECT id FROM children ORDER BY created_at DESC LIMIT 1
            )
            RETURNING id, first_name, last_name, registration_number
        `);

        if (res.rows.length > 0) {
            console.log('Successfully updated child:', res.rows[0]);
        } else {
            console.log('No child found to update.');
        }

    } catch (err) {
        console.error('Error updating child:', err);
    } finally {
        await pool.end();
    }
}

updateChildReg();

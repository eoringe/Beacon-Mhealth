require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    connectionString: process.env.EXTERNAL_DATABASE_URL,
});

async function explorePrescriptions() {
    const client = await pool.connect();
    let output = '';

    try {
        output += '=== PRESCRIPTION TABLE EXPLORATION ===\n\n';

        // 1. Check prescriptions table columns
        output += '--- PRESCRIPTION TABLE COLUMNS ---\n';
        const colRes = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'prescriptions'
            ORDER BY ordinal_position
        `);

        if (colRes.rows.length === 0) {
            output += 'ERROR: prescriptions table not found!\n';
        } else {
            colRes.rows.forEach(r => {
                output += `  ${r.column_name} (${r.data_type})\n`;
            });
        }

        // 2. Check staff table columns
        output += '\n--- STAFF TABLE COLUMNS ---\n';
        const staffCols = await client.query(`
            SELECT column_name FROM information_schema.columns WHERE table_name = 'staff'
        `);
        output += staffCols.rows.map(r => r.column_name).join(', ') + '\n';

        // 3. Get prescription count
        output += '\n--- PRESCRIPTION TABLE STATS ---\n';
        const countRes = await client.query('SELECT COUNT(*) as total FROM prescriptions');
        output += `Total prescriptions: ${countRes.rows[0].total}\n`;

        // 4. Find child 008-2025
        output += '\n--- FINDING PRESCRIPTIONS FOR CHILD 008-2025 ---\n';
        const childRes = await client.query(
            'SELECT id FROM children WHERE registration_number = $1',
            ['008-2025']
        );

        if (childRes.rows.length > 0) {
            const childId = childRes.rows[0].id;
            output += `Child ID: ${childId}\n`;

            // Get prescriptions
            const prescRes = await client.query(`
                SELECT * FROM prescriptions WHERE child_id = $1 ORDER BY created_at DESC
            `, [childId]);

            output += `Found ${prescRes.rows.length} prescription(s)\n`;
            if (prescRes.rows.length > 0) {
                output += JSON.stringify(prescRes.rows[0], null, 2) + '\n';
            }
        }

        // 5. Sample prescriptions
        output += '\n--- SAMPLE PRESCRIPTIONS ---\n';
        const sampleRes = await client.query('SELECT * FROM prescriptions LIMIT 3');
        output += JSON.stringify(sampleRes.rows, null, 2) + '\n';

        fs.writeFileSync('prescription_lookup_output.txt', output);
        console.log('Output written to prescription_lookup_output.txt');

    } catch (err) {
        output += `\nERROR: ${err.message}\n`;
        fs.writeFileSync('prescription_lookup_output.txt', output);
        console.error('Error:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

explorePrescriptions();

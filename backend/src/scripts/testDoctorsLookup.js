require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    connectionString: process.env.EXTERNAL_DATABASE_URL,
});

async function exploreDoctors() {
    const client = await pool.connect();
    let output = '';

    try {
        output += '=== STAFF/DOCTORS TABLE EXPLORATION ===\n\n';

        // 1. Get roles
        output += '--- ROLES ---\n';
        const rolesRes = await client.query('SELECT * FROM roles');
        rolesRes.rows.forEach(r => {
            output += `  ${r.id}: ${r.role}\n`;
        });

        // 2. Get specializations
        output += '\n--- DOCTOR SPECIALIZATIONS ---\n';
        const specRes = await client.query('SELECT * FROM doctor_specialization');
        specRes.rows.forEach(r => {
            output += `  ${r.id}: ${r.specialization} (role_id: ${r.role_id})\n`;
        });

        // 3. Get sample staff
        output += '\n--- SAMPLE STAFF (doctors) ---\n';
        const staffRes = await client.query(`
            SELECT 
                s.id, s.fullname, s.staff_no, s.email,
                r.role, ds.specialization
            FROM staff s
            LEFT JOIN roles r ON s.role_id = r.id
            LEFT JOIN doctor_specialization ds ON s.specialization_id = ds.id
            WHERE r.role ILIKE '%doctor%' OR ds.specialization IS NOT NULL
            LIMIT 10
        `);

        output += `Found ${staffRes.rows.length} doctor(s):\n`;
        staffRes.rows.forEach((s, i) => {
            output += `\n[${i + 1}] ID: ${s.id}\n`;
            output += `    Name: ${JSON.stringify(s.fullname)}\n`;
            output += `    Staff No: ${s.staff_no}\n`;
            output += `    Email: ${s.email}\n`;
            output += `    Role: ${s.role || 'N/A'}\n`;
            output += `    Specialization: ${s.specialization || 'N/A'}\n`;
        });

        // 4. Count all staff by role
        output += '\n--- STAFF COUNT BY ROLE ---\n';
        const countRes = await client.query(`
            SELECT r.role, COUNT(*) as count
            FROM staff s
            LEFT JOIN roles r ON s.role_id = r.id
            GROUP BY r.role
        `);
        countRes.rows.forEach(r => {
            output += `  ${r.role || 'No Role'}: ${r.count}\n`;
        });

        fs.writeFileSync('doctors_lookup_output.txt', output);
        console.log('Output written to doctors_lookup_output.txt');

    } catch (err) {
        output += `\nERROR: ${err.message}\n`;
        fs.writeFileSync('doctors_lookup_output.txt', output);
        console.error('Error:', err.message);
    } finally {
        client.release();
        await pool.end();
    }
}

exploreDoctors();

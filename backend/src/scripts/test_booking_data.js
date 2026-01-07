
require('dotenv').config();
const { externalQuery } = require('../config/externalDatabase');

async function testBookingData() {
    try {
        console.log('--- Testing Doctor Fetch ---');
        // Simulate the query used in doctorController.getDoctors
        const doctorResult = await externalQuery(`
            SELECT 
                s.id,
                s.fullname,
                s.staff_no,
                s.email,
                r.role,
                ds.specialization
            FROM staff s
            LEFT JOIN roles r ON s.role_id = r.id
            LEFT JOIN doctor_specialization ds ON s.specialization_id = ds.id
            WHERE r.role IN ('Doctor', 'Therapist')
               OR ds.specialization IS NOT NULL
            ORDER BY r.role, s.fullname->>'first_name'
        `);

        console.log(`Found ${doctorResult.rows.length} doctors/therapists.`);

        if (doctorResult.rows.length > 0) {
            console.log('Sample Doctor (raw):', doctorResult.rows[0]);

            // Test formatting logic
            const formatted = doctorResult.rows.map(d => ({
                id: d.id,
                name: formatStaffName(d.fullname),
                role: d.role,
                specialization: d.specialization || 'General',
            }));
            console.log('Sample Doctor (formatted):', formatted[0]);
        }

        console.log('\n--- Testing Specialization Fetch ---');
        const specResult = await externalQuery(`
            SELECT id, specialization, role_id
            FROM doctor_specialization
            ORDER BY specialization
        `);
        console.log(`Found ${specResult.rows.length} specializations.`);
        if (specResult.rows.length > 0) {
            console.log('Sample Spec:', specResult.rows[0]);
        }

    } catch (error) {
        console.error('Test Failed:', error);
    } finally {
        // We need to close the pool to exit the script
        const { externalPool } = require('../config/externalDatabase');
        await externalPool.end();
    }
}

function formatStaffName(fullname) {
    if (!fullname) return 'Unknown';
    if (typeof fullname === 'object') {
        const parts = [];
        if (fullname.first_name) parts.push(fullname.first_name);
        if (fullname.middle_name) parts.push(fullname.middle_name);
        if (fullname.last_name) parts.push(fullname.last_name);
        return parts.join(' ') || 'Unknown';
    }
    try {
        const parsed = JSON.parse(fullname);
        return formatStaffName(parsed);
    } catch {
        return fullname;
    }
}

testBookingData();

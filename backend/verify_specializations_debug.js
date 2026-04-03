// backend/verify_specializations_debug.js
const { externalQuery } = require('./src/config/externalDatabase');

async function verify() {
    try {
        console.log('--- 1. Testing Specializations List (Public) ---');
        const q1 = `
            SELECT 
                ds.id, 
                ds.specialization, 
                COUNT(s.id)::int as doctor_count
            FROM doctor_specialization ds
            JOIN staff_specialization ss ON ss.specialization_id = ds.id
            JOIN staff s ON ss.staff_id = s.id AND s.is_active = true
            GROUP BY ds.id, ds.specialization
            ORDER BY ds.specialization
        `;
        const specResult = await externalQuery(q1);
        console.table(specResult.rows);

        console.log('\n--- 2. Testing Doctors with Aggregated Specializations ---');
        // Using MIN() on staff columns to avoid grouping by everything
        const q2 = `
            SELECT 
                s.id,
                MIN(s.fullname->>'first_name') as first_name,
                MIN(s.fullname->>'last_name') as last_name,
                STRING_AGG(ds.specialization, ', ') as specializations
            FROM staff s
            LEFT JOIN staff_specialization ss ON s.id = ss.staff_id
            LEFT JOIN doctor_specialization ds ON ss.specialization_id = ds.id
            WHERE s.is_active = true
            GROUP BY s.id
            HAVING STRING_AGG(ds.specialization, ', ') IS NOT NULL
            ORDER BY s.id
        `;
        const docResult = await externalQuery(q2);
        console.table(docResult.rows);

    } catch (e) {
        console.error('SQL Error Message:', e.message);
        console.error('SQL Error Position:', e.position);
    } finally {
        process.exit();
    }
}

verify();

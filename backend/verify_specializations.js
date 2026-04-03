// backend/verify_specializations.js
const { externalQuery } = require('./src/config/externalDatabase');

async function verify() {
    try {
        console.log('--- 1. Testing Specializations List (Public) ---');
        const specResult = await externalQuery(`
            SELECT 
                ds.id, 
                ds.specialization, 
                COUNT(s.id)::int as doctor_count
            FROM doctor_specialization ds
            JOIN staff_specialization ss ON ss.doctor_specialization_id = ds.id
            JOIN staff s ON ss.staff_id = s.id AND s.is_active = true
            GROUP BY ds.id, ds.specialization
            ORDER BY ds.specialization
        `);
        console.table(specResult.rows);

        console.log('\n--- 2. Testing Doctors with Aggregated Specializations ---');
        const docResult = await externalQuery(`
            SELECT 
                s.id,
                s.fullname->>'first_name' as first_name,
                s.fullname->>'last_name' as last_name,
                STRING_AGG(ds.specialization, ', ') as specializations
            FROM staff s
            LEFT JOIN staff_specialization ss ON s.id = ss.staff_id
            LEFT JOIN doctor_specialization ds ON ss.doctor_specialization_id = ds.id
            WHERE s.is_active = true
            GROUP BY s.id, s.fullname->>'first_name', s.fullname->>'last_name'
            HAVING STRING_AGG(ds.specialization, ', ') IS NOT NULL
            ORDER BY s.id
        `);
        console.table(docResult.rows);

        console.log('\n--- 3. Testing Specific Specialization (e.g., ID 1) ---');
        const specId = 1; // Change if needed
        const availableResult = await externalQuery(
            `SELECT s.id, s.fullname->>'first_name' as first_name 
             FROM staff s 
             JOIN staff_specialization ss ON ss.staff_id = s.id 
             WHERE ss.doctor_specialization_id = $1 AND s.is_active = true`,
            [specId]
        );
        console.log(`Doctors in Specialization ID ${specId}:`);
        console.table(availableResult.rows);

    } catch (e) {
        console.error(e);
    } finally {
        process.exit();
    }
}

verify();

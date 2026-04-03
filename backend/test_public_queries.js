// backend/test_public_queries.js
const { externalQuery } = require('./src/config/externalDatabase');

async function testQuery(name, sql, params = []) {
    try {
        console.log(`Testing query: ${name}`);
        await externalQuery(sql, params);
        console.log(`✅ ${name} passed`);
    } catch (e) {
        console.error(`❌ ${name} FAILED: ${e.message}`);
    }
}

async function runTests() {
    // 1. getPublicSpecializations
    await testQuery('getPublicSpecializations', `
        SELECT 
            ds.id, 
            ds.specialization, 
            ds.role_id,
            COUNT(s.id)::int as doctor_count,
        EXISTS(
            SELECT 1 FROM doctor_teleconsultation_availabilities ta
            JOIN staff s2 ON ta.doctor_id = s2.id
            JOIN staff_specialization ss2 ON ss2.staff_id = s2.id
            WHERE ss2.specialization_id = ds.id AND s2.is_active = true
        ) as has_teleconsult
        FROM doctor_specialization ds
        JOIN staff_specialization ss ON ss.specialization_id = ds.id
        JOIN staff s ON ss.staff_id = s.id AND s.is_active = true
        GROUP BY ds.id, ds.specialization, ds.role_id
        ORDER BY ds.specialization
    `);

    // 2. autoAssignDoctor (using a dummy spec ID 1)
    await testQuery('autoAssignDoctor', `
        SELECT s.id FROM staff s 
        JOIN staff_specialization ss ON ss.staff_id = s.id 
        WHERE ss.specialization_id = $1 AND s.is_active = true`,
        [1]
    );

    // 3. getPublicAvailability (using dummy params)
    await testQuery('getPublicAvailability', `
        SELECT s.id FROM staff s 
        JOIN staff_specialization ss ON ss.staff_id = s.id 
        WHERE ss.specialization_id = $1 AND s.is_active = true`,
        [1]
    );

    process.exit();
}

runTests();

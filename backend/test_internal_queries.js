// backend/test_internal_queries.js — mirrors SQL used in appointmentController (staff_specialization pivot)
const { externalQuery } = require('./src/config/externalDatabase');

async function testQuery(name, sql, params = []) {
    try {
        console.log(`Testing query: ${name}`);
        const result = await externalQuery(sql, params);
        console.log(`✅ ${name} passed (${result.rows?.length ?? 0} rows)`);
    } catch (e) {
        console.error(`❌ ${name} FAILED: ${e.message}`);
        process.exitCode = 1;
    }
}

async function runTests() {
    const specId = 1;

    // getSpecializationAvailability — doctor list
    await testQuery('getSpecializationAvailability (staff list)', `
        SELECT DISTINCT ON (s.id) s.id, s.fullname FROM staff s
        INNER JOIN staff_specialization ss ON ss.staff_id = s.id
        WHERE ss.specialization_id = $1 AND s.is_active = true
        ORDER BY s.id
    `, [specId]);

    // getSpecializationTeleWindows — same staff filter + tele join pattern
    await testQuery('getSpecializationTeleWindows (windows for spec doctors)', `
        SELECT ta.day_of_week, ta.start_time, ta.end_time, s.fullname as doctor_name
        FROM doctor_teleconsultation_availabilities ta
        JOIN staff s ON ta.doctor_id = s.id
        INNER JOIN staff_specialization ss ON ss.staff_id = s.id
        WHERE ss.specialization_id = $1 AND s.is_active = true
        ORDER BY s.fullname::text, ta.day_of_week, ta.start_time
        LIMIT 5
    `, [specId]);

    // autoAssignDoctor — candidate staff list
    await testQuery('autoAssignDoctor (candidate staff)', `
        SELECT DISTINCT s.id FROM staff s
        INNER JOIN staff_specialization ss ON ss.staff_id = s.id
        WHERE ss.specialization_id = $1 AND s.is_active = true
    `, [specId]);

    // in-person windows lookup used by doctor/specialization availability and booking guard
    await testQuery('inPersonWindows (window_type filter)', `
        SELECT start_time, end_time FROM doctor_teleconsultation_availabilities
        WHERE doctor_id = $1 AND day_of_week = $2 AND window_type = 'in_person'
        LIMIT 5
    `, [1, 1]);

    process.exit(process.exitCode || 0);
}

runTests();

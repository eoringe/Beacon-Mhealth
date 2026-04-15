/**
 * Debug script: checks what teleconsult windows exist for
 * the Developmental Paediatrician specialization and simulates
 * the autoAssignDoctor logic step-by-step.
 *
 * Usage: node src/scripts/debugTeleWindows.js [date] [time]
 * Example: node src/scripts/debugTeleWindows.js 2026-04-16 09:00
 */
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.EXTERNAL_DATABASE_URL,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
});

const q = (text, params) => pool.query(text, params);

const isTimeInWindows = (time, windows) => {
    if (!Array.isArray(windows) || windows.length === 0) return false;
    return windows.some(w => {
        const start = w.start_time.substring(0, 5);
        const end = w.end_time.substring(0, 5);
        const inWindow = time >= start && time < end;
        console.log(`   Window check: ${time} in [${start} - ${end}]? ${inWindow}`);
        return inWindow;
    });
};

async function main() {
    const testDate = process.argv[2] || new Date().toISOString().split('T')[0];
    const testTime = process.argv[3] || '09:00';
    const dayOfWeek = new Date(testDate).getDay();
    const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    console.log('\n=== TELECONSULT DEBUG ===');
    console.log(`Date: ${testDate} (${dayNames[dayOfWeek]}), Time: ${testTime}\n`);

    // 1. Find Developmental Paediatrician specialization
    const specResult = await q(
        `SELECT id, specialization FROM doctor_specialization WHERE LOWER(specialization) LIKE '%developmental%'`
    );
    if (specResult.rows.length === 0) {
        console.log('❌ No Developmental Paediatrician specialization found!');
        return;
    }
    const spec = specResult.rows[0];
    console.log(`✅ Specialization: "${spec.specialization}" (ID: ${spec.id})\n`);

    // 2. Find doctors in that specialization
    const doctorsResult = await q(
        `SELECT DISTINCT s.id, s.fullname::text, s.is_active FROM staff s
         INNER JOIN staff_specialization ss ON ss.staff_id = s.id
         WHERE ss.specialization_id = $1`,
        [spec.id]
    );
    console.log(`Doctors in specialization: ${doctorsResult.rows.length}`);
    doctorsResult.rows.forEach(d => {
        console.log(`  - Staff ID: ${d.id}, Active: ${d.is_active}, Name: ${d.fullname}`);
    });
    console.log();

    // 3. For each doctor, simulate autoAssignDoctor checks
    for (const doc of doctorsResult.rows) {
        console.log(`\n--- Doctor ID: ${doc.id} ---`);

        if (!doc.is_active) {
            console.log(`  ❌ SKIP: Doctor is not active`);
            continue;
        }

        // Check unavailability
        const unavail = await q(
            `SELECT reason FROM doctor_unavailabilities WHERE doctor_id = $1 AND unavailable_date::date = $2::date`,
            [doc.id, testDate]
        );
        if (unavail.rows.length > 0) {
            console.log(`  ❌ SKIP: Unavailable: ${unavail.rows[0].reason}`);
            continue;
        }
        console.log(`  ✅ Not marked unavailable`);

        // Check ALL tele windows for this day
        const allWindows = await q(
            `SELECT start_time, end_time, window_type FROM doctor_teleconsultation_availabilities
             WHERE doctor_id = $1 AND day_of_week = $2`,
            [doc.id, dayOfWeek]
        );
        console.log(`  Availability windows for ${dayNames[dayOfWeek]}: ${allWindows.rows.length} found`);
        allWindows.rows.forEach(w => {
            console.log(`    window_type: ${w.window_type || 'null'}, ${w.start_time.substring(0,5)} - ${w.end_time.substring(0,5)}`);
        });

        if (allWindows.rows.length === 0) {
            console.log(`  ❌ SKIP: No windows at all for ${dayNames[dayOfWeek]}`);
            continue;
        }

        const inWindow = isTimeInWindows(testTime, allWindows.rows);
        if (!inWindow) {
            console.log(`  ❌ SKIP: Time ${testTime} not in any window`);
            continue;
        }
        console.log(`  ✅ Time ${testTime} is within a window`);

        // Daily count
        const count = await q(
            `SELECT COUNT(*) as count FROM appointments WHERE (staff_id = $1 OR doctor_id = $1) AND appointment_date = $2`,
            [doc.id, testDate]
        );
        const dailyCount = parseInt(count.rows[0].count);
        console.log(`  Daily bookings: ${dailyCount}/10`);
        if (dailyCount >= 10) {
            console.log(`  ❌ SKIP: Daily limit reached`);
            continue;
        }

        // Conflict check
        const normalizedTime = testTime.substring(0, 5);
        const conflict = await q(
            `SELECT id, start_time FROM appointments
             WHERE (staff_id = $1 OR doctor_id = $1)
             AND appointment_date = $2
             AND start_time::text LIKE $3
             AND status != 'cancelled'`,
            [doc.id, testDate, `${normalizedTime}%`]
        );
        if (conflict.rows.length > 0) {
            console.log(`  ❌ SKIP: Conflict - appointment ${conflict.rows[0].id} exists at ${conflict.rows[0].start_time}`);
            continue;
        }

        console.log(`  ✅ CANDIDATE! Doctor ${doc.id} is available`);
    }

    console.log('\n=== END DEBUG ===\n');
    await pool.end();
}

main().catch(err => {
    console.error('Script error:', err);
    pool.end();
});

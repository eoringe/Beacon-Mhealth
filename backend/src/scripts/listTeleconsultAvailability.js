require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.EXTERNAL_DATABASE_URL,
    ssl: process.env.EXTERNAL_DATABASE_URL && process.env.EXTERNAL_DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : false
});

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

async function listTeleconsultAvailability() {
    try {
        console.log("--- DOCTORS AVAILABLE FOR TELECONSULTATION AND THEIR TIME SLOTS ---\n");

        const res = await pool.query(`
            SELECT 
                s.id, 
                s.fullname, 
                ds.specialization,
                ta.day_of_week,
                ta.start_time,
                ta.end_time
            FROM staff s 
            JOIN doctor_teleconsultation_availabilities ta ON s.id = ta.doctor_id
            LEFT JOIN doctor_specialization ds ON s.specialization_id = ds.id
            WHERE s.is_active = true
            ORDER BY ds.specialization, s.fullname::text, ta.day_of_week, ta.start_time
        `);

        if (res.rows.length === 0) {
            console.log("No doctors found with teleconsultation availability.");
            return;
        }

        let currentCategory = '';
        let currentDoctor = null;

        res.rows.forEach(row => {
            const category = row.specialization || 'General / Uncategorized';

            // Handle Category change
            if (category !== currentCategory) {
                console.log(`\nCATEGORY: ${category}`);
                currentCategory = category;
                currentDoctor = null; // Reset doctor display for new category
            }

            // Handle Doctor name parsing
            let name = row.fullname;
            try {
                if (typeof row.fullname === 'string' && row.fullname.startsWith('{')) {
                    const parsed = JSON.parse(row.fullname);
                    name = `${parsed.first_name || ''} ${parsed.middle_name || ''} ${parsed.last_name || ''}`.trim().replace(/\s+/g, ' ');
                } else if (typeof row.fullname === 'object') {
                    name = `${row.fullname.first_name || ''} ${row.fullname.middle_name || ''} ${row.fullname.last_name || ''}`.trim().replace(/\s+/g, ' ');
                }
            } catch (e) { }

            // Handle Doctor change
            if (currentDoctor !== row.id) {
                console.log(`\n  Doctor: ${name} [ID: ${row.id}]`);
                currentDoctor = row.id;
            }

            // Print Slot
            const dayName = dayNames[row.day_of_week];
            const startTime = row.start_time.substring(0, 5);
            const endTime = row.end_time.substring(0, 5);
            console.log(`    • ${dayName}: ${startTime} - ${endTime}`);
        });

    } catch (err) {
        console.error("Error listing teleconsult availability:", err.message);
        if (err.code) console.error("Error code:", err.code);
    } finally {
        await pool.end();
    }
}

listTeleconsultAvailability();

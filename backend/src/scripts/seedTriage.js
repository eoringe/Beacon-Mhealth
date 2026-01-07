require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.EXTERNAL_DATABASE_URL,
});

async function seedTriage() {
    const client = await pool.connect();
    try {
        console.log('--- Seeding Triage Data ---');

        const regNumber = '008-2025';

        // 1. Get Child ID
        const childRes = await client.query('SELECT id FROM children WHERE registration_number = $1', [regNumber]);
        if (childRes.rows.length === 0) {
            console.log(`Child ${regNumber} not found!`);
            return;
        }
        const childId = childRes.rows[0].id; // Should be 8
        console.log(`Child ID: ${childId}`);

        // Get a valid doctor ID
        const staffRes = await client.query('SELECT id FROM staff LIMIT 1');
        const doctorId = staffRes.rows.length > 0 ? staffRes.rows[0].id : 1;

        // 2. Check/Create Visit
        let visitId;
        const visitRes = await client.query('SELECT id FROM visits WHERE child_id = $1 ORDER BY visit_date DESC LIMIT 1', [childId]);
        if (visitRes.rows.length > 0) {
            visitId = visitRes.rows[0].id;
            console.log(`Found existing visit ID: ${visitId}`);
        } else {
            console.log('No visit found, creating dummy visit...');
            const insertVisit = await client.query(`
                INSERT INTO visits (child_id, doctor_id, visit_date, visit_type, created_at, updated_at)
                VALUES ($1, $2, NOW(), 1, NOW(), NOW())
                RETURNING id
            `, [childId, doctorId]);
            visitId = insertVisit.rows[0].id;
            console.log(`Created new visit ID: ${visitId}`);
        }

        // 3. Create Triage Data
        let assessmentId = 1; // Default guess
        try {
            // Try to create a dummy assessment
            const assessRes = await client.query(`
                INSERT INTO assessments (name, description, created_at, updated_at)
                VALUES ('Initial Triage', 'Standard vitals check', NOW(), NOW())
                RETURNING id
             `);
            assessmentId = assessRes.rows[0].id;
            console.log(`Created new Assessment ID: ${assessmentId}`);
        } catch (e) {
            console.log('Could not create assessment, trying to use ID 1. Error:', e.message);
        }

        const triageData = JSON.stringify({
            "Temperature": "37.5 C",
            "Weight": "12.5 kg",
            "Height": "95 cm",
            "Blood Pressure": "90/60",
            "Heart Rate": "100 bpm",
            "Oxygen Saturation": "98%"
        });

        const insertTriage = await client.query(`
            INSERT INTO triage (child_id, visit_id, staff_id, assessment_id, data, created_at, updated_at)
            VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
            RETURNING id
        `, [childId, visitId, doctorId, assessmentId, triageData]);

        console.log(`Successfully inserted Triage Record ID: ${insertTriage.rows[0].id}`);

    } catch (err) {
        console.error('Error seeding data:', err.message);
        if (err.detail) console.error('Detail:', err.detail);
        if (err.table) console.error('Table:', err.table);
        if (err.constraint) console.error('Constraint:', err.constraint);
    } finally {
        client.release();
        await pool.end();
    }
}
seedTriage();

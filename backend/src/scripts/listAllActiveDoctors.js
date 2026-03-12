require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.EXTERNAL_DATABASE_URL,
    ssl: process.env.EXTERNAL_DATABASE_URL && process.env.EXTERNAL_DATABASE_URL.includes('railway') ? { rejectUnauthorized: false } : false
});

async function listAllActiveDoctors() {
    try {
        console.log("--- ALL ACTIVE DOCTORS ACROSS CATEGORIES ---\n");

        const res = await pool.query(`
            SELECT s.id, s.fullname, ds.specialization 
            FROM staff s 
            LEFT JOIN doctor_specialization ds ON s.specialization_id = ds.id
            WHERE s.is_active = true
            ORDER BY ds.specialization, s.fullname::text
        `);

        if (res.rows.length === 0) {
            console.log("No active doctors found.");
            return;
        }

        let currentCategory = '';
        res.rows.forEach(d => {
            let name = d.fullname;
            try {
                if (typeof d.fullname === 'string' && d.fullname.startsWith('{')) {
                    const parsed = JSON.parse(d.fullname);
                    name = `${parsed.first_name || ''} ${parsed.middle_name || ''} ${parsed.last_name || ''}`.trim().replace(/\s+/g, ' ');
                } else if (typeof d.fullname === 'object') {
                    name = `${d.fullname.first_name || ''} ${d.fullname.middle_name || ''} ${d.fullname.last_name || ''}`.trim().replace(/\s+/g, ' ');
                }
            } catch (e) { }

            const category = d.specialization || 'General / Uncategorized';
            if (category !== currentCategory) {
                console.log(`\nCATEGORY: ${category}`);
                currentCategory = category;
            }
            console.log(`  - [ID: ${d.id}] ${name}`);
        });

    } catch (err) {
        console.error("Error listing doctors:", err.message);
        if (err.code) console.error("Error code:", err.code);
    } finally {
        await pool.end();
    }
}

listAllActiveDoctors();

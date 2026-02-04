const { Pool } = require('pg');
require('dotenv').config({ path: 'src/config/.env' });

// Use the EXTERNAL_DATABASE_URL from the .env
const externalDbUrl = process.env.EXTERNAL_DATABASE_URL;

console.log("---------------------------------------------------");
console.log("INSPECTING DATABASE: " + externalDbUrl.split('@')[1]); // Log host safely
console.log("---------------------------------------------------");

const pool = new Pool({
    connectionString: externalDbUrl,
    ssl: { rejectUnauthorized: false }
});

async function inspect() {
    try {
        console.log("\n--- Specializations ---");
        const specs = await pool.query('SELECT * FROM doctor_specialization LIMIT 10');
        if (specs.rows.length === 0) {
            console.log("No specializations found.");
        } else {
            console.table(specs.rows);
        }

        console.log("\n--- Staff (Doctors) ---");
        // Try to join with doctor_specialization if possible
        const docs = await pool.query(`
            SELECT s.id, s.fullname, s.email, ds.specialization 
            FROM staff s 
            LEFT JOIN doctor_specialization ds ON s.specialization_id = ds.id
            WHERE ds.specialization IS NOT NULL 
            LIMIT 10
        `);

        if (docs.rows.length === 0) {
            console.log("No doctors found linked to specialization.");
        } else {
            // Parse fullname if it's JSON/string to make it readable
            const formattedDocs = docs.rows.map(d => {
                let name = d.fullname;
                try {
                    if (typeof d.fullname === 'string' && d.fullname.startsWith('{')) {
                        const parsed = JSON.parse(d.fullname);
                        name = `${parsed.first_name} ${parsed.last_name}`;
                    } else if (typeof d.fullname === 'object') {
                        name = `${d.fullname.first_name} ${d.fullname.last_name}`;
                    }
                } catch (e) { }
                return { ...d, fullname: name };
            });
            console.table(formattedDocs);
        }

    } catch (err) {
        console.error("Error executing query:", err);
    } finally {
        await pool.end();
    }
}

inspect();

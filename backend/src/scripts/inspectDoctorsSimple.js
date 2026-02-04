const { Pool } = require('pg');
require('dotenv').config({ path: 'src/config/.env' });

const externalDbUrl = process.env.EXTERNAL_DATABASE_URL;
const pool = new Pool({
    connectionString: externalDbUrl,
    ssl: { rejectUnauthorized: false }
});

async function inspect() {
    try {
        const HOST = externalDbUrl.split('@')[1].split(':')[0];
        console.log("DB HOST:", HOST);

        const specs = await pool.query('SELECT specialization FROM doctor_specialization ORDER BY specialization LIMIT 20');
        console.log("\nSPECIALIZATIONS:");
        specs.rows.forEach(r => console.log(`- ${r.specialization}`));

        const docs = await pool.query(`
            SELECT s.fullname, ds.specialization 
            FROM staff s 
            LEFT JOIN doctor_specialization ds ON s.specialization_id = ds.id
            WHERE ds.specialization IS NOT NULL 
            LIMIT 20
        `);

        console.log("\nDOCTORS:");
        docs.rows.forEach(d => {
            let name = d.fullname;
            try {
                if (typeof d.fullname === 'string' && d.fullname.startsWith('{')) {
                    const parsed = JSON.parse(d.fullname);
                    name = `${parsed.first_name || ''} ${parsed.last_name || ''}`;
                } else if (typeof d.fullname === 'object') {
                    name = `${d.fullname.first_name || ''} ${d.fullname.last_name || ''}`;
                }
            } catch (e) { }
            console.log(`- ${name} (${d.specialization})`);
        });

    } catch (err) {
        console.error("Error:", err);
    } finally {
        await pool.end();
    }
}

inspect();

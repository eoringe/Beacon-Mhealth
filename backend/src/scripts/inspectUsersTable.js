const { Pool } = require('pg');
require('dotenv').config({ path: 'src/config/.env' });

const externalDbUrl = process.env.EXTERNAL_DATABASE_URL;

if (!externalDbUrl) {
    console.error("No EXTERNAL_DATABASE_URL found in env");
    process.exit(1);
}

const pool = new Pool({
    connectionString: externalDbUrl,
    ssl: { rejectUnauthorized: false }
});

async function inspect() {
    try {
        console.log("Connected to:", externalDbUrl.split('@')[1]);

        const res = await pool.query(`
            SELECT column_name
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `);

        console.log("Columns in 'users' table:", res.rows.map(r => r.column_name).join(', '));

    } catch (err) {
        console.error("Error inspecting schema:", err);
    } finally {
        await pool.end();
    }
}

inspect();

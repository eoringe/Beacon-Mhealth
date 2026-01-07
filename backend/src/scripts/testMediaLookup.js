require('dotenv').config();
const { Pool } = require('pg');
const fs = require('fs');

const pool = new Pool({
    connectionString: process.env.EXTERNAL_DATABASE_URL,
});

async function testMediaLookup() {
    const client = await pool.connect();
    let output = '';

    try {
        output += '=== MEDIA TABLE EXPLORATION ===\n\n';

        // 1. Check if media table exists and get its columns
        output += '--- MEDIA TABLE COLUMNS ---\n';
        const colRes = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'media'
            ORDER BY ordinal_position
        `);

        if (colRes.rows.length === 0) {
            output += 'ERROR: media table not found!\n';
        } else {
            colRes.rows.forEach(r => {
                output += `  ${r.column_name} (${r.data_type})\n`;
            });
        }

        // 2. Get total count of media records
        output += '\n--- MEDIA TABLE STATS ---\n';
        const countRes = await client.query('SELECT COUNT(*) as total FROM media');
        output += `Total media records: ${countRes.rows[0].total}\n`;

        // 3. Get distinct collections
        const collectionsRes = await client.query('SELECT DISTINCT collection_name FROM media');
        output += `Collections: ${collectionsRes.rows.map(r => r.collection_name).join(', ')}\n`;

        // 4. Get distinct model types
        const modelsRes = await client.query('SELECT DISTINCT model_type FROM media');
        output += `Model types: ${modelsRes.rows.map(r => r.model_type).join(', ')}\n`;

        // 5. Find child 008-2025
        output += '\n--- FINDING CHILD 008-2025 ---\n';
        const childRes = await client.query(
            'SELECT id, fullname, registration_number FROM children WHERE registration_number = $1',
            ['008-2025']
        );

        if (childRes.rows.length === 0) {
            output += 'Child not found!\n';
        } else {
            const child = childRes.rows[0];
            output += `Child ID: ${child.id}\n`;
            output += `Name: ${JSON.stringify(child.fullname)}\n`;
            output += `Reg Number: ${child.registration_number}\n`;

            // 6. Get media for this child
            output += '\n--- MEDIA FOR CHILD 008-2025 ---\n';
            const mediaRes = await client.query(`
                SELECT id, collection_name, name, file_name, mime_type, disk, size, 
                       custom_properties, created_at
                FROM media 
                WHERE model_id = $1 AND model_type LIKE '%Children%'
                ORDER BY created_at DESC
            `, [child.id]);

            if (mediaRes.rows.length === 0) {
                output += 'No media found for this child.\n';

                // Try broader search
                output += '\n--- TRYING BROADER SEARCH ---\n';
                const allMedia = await client.query(`
                    SELECT id, model_type, model_id, collection_name, name, file_name
                    FROM media 
                    LIMIT 10
                `);
                output += `Sample media records:\n${JSON.stringify(allMedia.rows, null, 2)}\n`;
            } else {
                output += `Found ${mediaRes.rows.length} media record(s):\n`;
                mediaRes.rows.forEach((m, i) => {
                    output += `\n[${i + 1}] ID: ${m.id}\n`;
                    output += `    Collection: ${m.collection_name}\n`;
                    output += `    Name: ${m.name}\n`;
                    output += `    Filename: ${m.file_name}\n`;
                    output += `    MIME: ${m.mime_type}\n`;
                    output += `    Disk: ${m.disk}\n`;
                    output += `    Size: ${m.size} bytes\n`;
                    output += `    Custom Props: ${JSON.stringify(m.custom_properties)}\n`;
                    output += `    Created: ${m.created_at}\n`;
                });
            }
        }

        // Write output to file
        fs.writeFileSync('media_lookup_output.txt', output);
        console.log('Output written to media_lookup_output.txt');

    } catch (err) {
        console.error('Error:', err.message);
        output += `\nERROR: ${err.message}\n`;
        fs.writeFileSync('media_lookup_output.txt', output);
    } finally {
        client.release();
        await pool.end();
    }
}

testMediaLookup();

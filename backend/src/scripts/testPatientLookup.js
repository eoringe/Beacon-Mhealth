/**
 * Quick test script to lookup a patient by registration number
 * Usage: node src/scripts/testPatientLookup.js 008-2025
 */

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.EXTERNAL_DATABASE_URL,
});

const lookupPatient = async (registrationNumber) => {
    const client = await pool.connect();
    try {
        console.log(`\n🔍 Looking up patient with registration number: ${registrationNumber}\n`);

        // Get child/patient details
        const childQuery = `
            SELECT 
                c.id,
                c.fullname,
                c.dob,
                c.birth_cert,
                c.registration_number,
                c.insurance_number,
                g.gender as gender,
                ip.insurance as insurance_provider
            FROM children c
            LEFT JOIN gender g ON c.gender_id = g.id
            LEFT JOIN insurance_providers ip ON c.insurance_provider_id = ip.id
            WHERE c.registration_number = $1
        `;
        const childResult = await client.query(childQuery, [registrationNumber]);

        if (childResult.rows.length === 0) {
            console.log('❌ Patient not found with this registration number');
            return;
        }

        const child = childResult.rows[0];

        // Parse fullname
        let patientName = child.fullname;
        if (typeof patientName === 'string') {
            try { patientName = JSON.parse(patientName); } catch (e) { }
        }

        console.log('👶 PATIENT DETAILS:');
        console.log('─'.repeat(50));
        console.log(`   Registration #: ${child.registration_number}`);
        console.log(`   Name: ${patientName?.first_name || ''} ${patientName?.middle_name || ''} ${patientName?.last_name || ''}`);
        console.log(`   DOB: ${child.dob}`);
        console.log(`   Gender: ${child.gender || 'N/A'}`);
        console.log(`   Insurance: ${child.insurance_provider || 'N/A'} (${child.insurance_number || 'N/A'})`);

        // Get parent/guardian details
        const parentQuery = `
            SELECT 
                p.fullname,
                p.telephone,
                p.email,
                p.national_id,
                r.relationship as relationship
            FROM parents p
            INNER JOIN child_parent cp ON p.id = cp.parent_id
            LEFT JOIN relationships r ON p.relationship_id = r.id
            WHERE cp.child_id = $1
        `;
        const parentResult = await client.query(parentQuery, [child.id]);

        if (parentResult.rows.length > 0) {
            console.log('\n👨‍👩‍👧 PARENT/GUARDIAN:');
            console.log('─'.repeat(50));
            parentResult.rows.forEach((parent, i) => {
                let parentName = parent.fullname;
                if (typeof parentName === 'string') {
                    try { parentName = JSON.parse(parentName); } catch (e) { }
                }
                console.log(`   Name: ${parentName?.first_name || ''} ${parentName?.middle_name || ''} ${parentName?.last_name || ''}`);
                console.log(`   Phone: ${parent.telephone || 'N/A'}`);
                console.log(`   Email: ${parent.email || 'N/A'}`);
                console.log(`   National ID: ${parent.national_id || 'N/A'}`);
                console.log(`   Relationship: ${parent.relationship || 'N/A'}`);
            });
        }

        // Get last visit
        const visitQuery = `
            SELECT 
                v.visit_date,
                vt.visit_type,
                s.fullname as doctor_fullname,
                ds.specialization as specialization
            FROM visits v
            LEFT JOIN visit_type vt ON v.visit_type = vt.id
            LEFT JOIN staff s ON v.doctor_id = s.id
            LEFT JOIN doctor_specialization ds ON s.specialization_id = ds.id
            WHERE v.child_id = $1
            ORDER BY v.visit_date DESC, v.created_at DESC
            LIMIT 1
        `;
        const visitResult = await client.query(visitQuery, [child.id]);

        if (visitResult.rows.length > 0) {
            const visit = visitResult.rows[0];
            let doctorName = visit.doctor_fullname;
            // Handle both string JSON and already-parsed object
            if (typeof doctorName === 'string') {
                try { doctorName = JSON.parse(doctorName); } catch (e) { }
            }
            if (doctorName && typeof doctorName === 'object') {
                doctorName = `${doctorName?.first_name || ''} ${doctorName?.last_name || ''}`.trim();
            }

            console.log('\n🏥 LAST VISIT:');
            console.log('─'.repeat(50));
            console.log(`   Date: ${visit.visit_date}`);
            console.log(`   Type: ${visit.visit_type || 'N/A'}`);
            console.log(`   Doctor: ${doctorName || 'N/A'}`);
            console.log(`   Specialization: ${visit.specialization || 'N/A'}`);
        }

        // Get latest triage
        const triageQuery = `
            SELECT t.data, t.created_at
            FROM triage t
            WHERE t.child_id = $1
            ORDER BY t.created_at DESC
            LIMIT 1
        `;
        const triageResult = await client.query(triageQuery, [child.id]);

        if (triageResult.rows.length > 0) {
            console.log('\n📋 LATEST TRIAGE:');
            console.log('─'.repeat(50));
            console.log(`   Recorded: ${triageResult.rows[0].created_at}`);

            let triageData = triageResult.rows[0].data;
            if (triageData) {
                // Try to parse if it's JSON string
                if (typeof triageData === 'string') {
                    try { triageData = JSON.parse(triageData); } catch (e) {
                        console.log('   (Data is encrypted)');
                    }
                }
                if (typeof triageData === 'object') {
                    Object.entries(triageData).forEach(([key, value]) => {
                        console.log(`   ${key}: ${value}`);
                    });
                }
            }
        }

        console.log('\n✅ Lookup complete!\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
    } finally {
        client.release();
        await pool.end();
    }
};

// Run with command line argument
const regNumber = process.argv[2] || '008-2025';
lookupPatient(regNumber);

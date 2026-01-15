const { externalQuery } = require('../src/config/externalDatabase');

async function inspectChild() {
    const regNum = '002-2025';
    console.log(`Inspecting child with Reg Number: ${regNum}`);

    try {
        const query = `
            SELECT 
                c.id,
                c.fullname,
                c.dob,
                c.birth_cert,
                c.registration_number
            FROM children c
            WHERE c.registration_number = $1
        `;

        const result = await externalQuery(query, [regNum]);

        if (result.rows.length === 0) {
            console.log('No child found!');
            return;
        }

        const child = result.rows[0];
        console.log('\n=== RAW DB RECORD ===');
        console.log(JSON.stringify(child, null, 2));

        console.log('\n=== PARSED VALUES ===');

        // Name Parsing
        let patientName = {};
        try {
            patientName = typeof child.fullname === 'string'
                ? JSON.parse(child.fullname)
                : child.fullname;
        } catch (e) { console.log('Parsed name error:', e); }

        console.log('Parsed Name:', JSON.stringify(patientName, null, 2));

        const dbNameParts = [
            patientName.first_name,
            patientName.middle_name,
            patientName.last_name
        ]
            .filter(n => n && typeof n === 'string' && n.trim().length > 0)
            .map(n => n.trim().toLowerCase());

        console.log('Normalized Name Parts (for check):', dbNameParts);

        // DOB
        const dbDob = new Date(child.dob).toISOString().split('T')[0];
        console.log(`DOB Raw: ${child.dob}`);
        console.log(`DOB ISO: ${new Date(child.dob).toISOString()}`);
        console.log(`DOB Check string: ${dbDob}`);

        // Birth Cert
        const dbBirthCert = (child.birth_cert || '').trim().toLowerCase();
        console.log(`Birth Cert Raw: "${child.birth_cert}"`);
        console.log(`Birth Cert Check string: "${dbBirthCert}"`);

    } catch (error) {
        console.error('Error:', error);
    }
}

inspectChild()
    .catch(console.error)
    .finally(() => process.exit());

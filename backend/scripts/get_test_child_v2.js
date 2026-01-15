const { externalQuery, externalPool } = require('../src/config/externalDatabase');

async function getTestChild() {
    try {
        const query = `
            SELECT 
                c.id,
                c.fullname,
                c.dob,
                c.birth_cert,
                c.registration_number
            FROM children c
            WHERE c.registration_number IS NOT NULL
              AND c.birth_cert IS NOT NULL
            LIMIT 1
        `;

        const result = await externalPool.query(query); // Bypass helper logging

        if (result.rows.length > 0) {
            const child = result.rows[0];
            let name = { first_name: '', last_name: '' };
            try {
                if (typeof child.fullname === 'string') {
                    name = JSON.parse(child.fullname);
                } else {
                    name = child.fullname;
                }
            } catch (e) { }

            const out = {
                RegNumber: child.registration_number,
                FirstName: name.first_name,
                LastName: name.last_name,
                DOB: new Date(child.dob).toISOString().split('T')[0],
                BirthCert: child.birth_cert
            };
            console.log('\n\nJSON_START');
            console.log(JSON.stringify(out, null, 2));
            console.log('JSON_END\n\n');
        } else {
            console.log('No child found');
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await externalPool.end();
    }
}

getTestChild();

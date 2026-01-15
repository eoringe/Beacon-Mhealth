/**
 * Patient Controller
 * Handles patient lookup from external Laravel database
 */

const { externalQuery } = require('../config/externalDatabase');

/**
 * Lookup patient by registration number
 * Returns comprehensive patient data including parent, last visit, and latest triage
 */
exports.lookupByRegistrationNumber = async (req, res) => {
    const { registrationNumber } = req.params;
    console.log('[PatientController] Looking up patient by reg number:', registrationNumber);

    try {
        if (!registrationNumber) {
            console.warn('[PatientController] Registration number missing');
            return res.status(400).json({ error: 'Registration number is required' });
        }

        // Get child/patient details with gender
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
        const childResult = await externalQuery(childQuery, [registrationNumber]);

        if (childResult.rows.length === 0) {
            console.log('[PatientController] Patient not found');
            return res.status(404).json({ error: 'Patient not found with this registration number' });
        }

        const child = childResult.rows[0];
        console.log('[PatientController] Found patient:', child.id);

        // Parse fullname JSON
        let patientName = { first_name: '', middle_name: '', last_name: '' };
        try {
            if (typeof child.fullname === 'string') {
                patientName = JSON.parse(child.fullname);
            } else if (child.fullname) {
                patientName = child.fullname;
            }
        } catch (e) {
            console.error('[PatientController] Error parsing patient fullname:', e);
        }

        // Get parent/guardian details
        const parentQuery = `
            SELECT 
                p.id,
                p.fullname,
                p.dob,
                p.telephone,
                p.email,
                p.national_id,
                p.employer,
                p.insurance,
                g.gender as gender,
                r.relationship as relationship
            FROM parents p
            INNER JOIN child_parent cp ON p.id = cp.parent_id
            LEFT JOIN gender g ON p.gender_id = g.id
            LEFT JOIN relationships r ON p.relationship_id = r.id
            WHERE cp.child_id = $1
            LIMIT 1
        `;
        const parentResult = await externalQuery(parentQuery, [child.id]);

        let parentData = null;
        if (parentResult.rows.length > 0) {
            const parent = parentResult.rows[0];
            let parentName = { first_name: '', middle_name: '', last_name: '' };
            try {
                if (typeof parent.fullname === 'string') {
                    parentName = JSON.parse(parent.fullname);
                } else if (parent.fullname) {
                    parentName = parent.fullname;
                }
            } catch (e) {
                console.error('[PatientController] Error parsing parent fullname:', e);
            }

            parentData = {
                id: parent.id,
                fullname: parentName,
                displayName: `${parentName.first_name || ''} ${parentName.middle_name || ''} ${parentName.last_name || ''}`.trim(),
                dob: parent.dob,
                telephone: parent.telephone,
                email: parent.email,
                national_id: parent.national_id,
                employer: parent.employer,
                insurance: parent.insurance,
                gender: parent.gender,
                relationship: parent.relationship
            };
        } else {
            console.log('[PatientController] No parent found for patient');
        }

        // Get last visit with doctor details
        const visitQuery = `
            SELECT 
                v.id,
                v.visit_date,
                v.triage_pass,
                v.has_copay,
                v.copay_amount,
                vt.visit_type,
                s.fullname as doctor_fullname,
                ds.specialization as doctor_specialization
            FROM visits v
            LEFT JOIN visit_type vt ON v.visit_type = vt.id
            LEFT JOIN staff s ON v.doctor_id = s.id
            LEFT JOIN doctor_specialization ds ON s.specialization_id = ds.id
            WHERE v.child_id = $1
            ORDER BY v.visit_date DESC, v.created_at DESC
            LIMIT 1
        `;
        const visitResult = await externalQuery(visitQuery, [child.id]);

        let lastVisit = null;
        if (visitResult.rows.length > 0) {
            const visit = visitResult.rows[0];
            let doctorName = 'Unknown';
            try {
                if (visit.doctor_fullname) {
                    const parsedName = typeof visit.doctor_fullname === 'string'
                        ? JSON.parse(visit.doctor_fullname)
                        : visit.doctor_fullname;
                    doctorName = `${parsedName.first_name || ''} ${parsedName.middle_name || ''} ${parsedName.last_name || ''}`.trim();
                }
            } catch (e) {
                console.error('[PatientController] Error parsing doctor fullname:', e);
            }

            lastVisit = {
                id: visit.id,
                visitDate: visit.visit_date,
                visitType: visit.visit_type,
                triagePass: visit.triage_pass,
                hasCopay: visit.has_copay,
                copayAmount: visit.copay_amount,
                doctorName: doctorName,
                doctorSpecialization: visit.doctor_specialization
            };
        } else {
            console.log('[PatientController] No visit history found');
        }

        // Get latest triage vitals
        const triageQuery = `
            SELECT 
                t.id,
                t.data,
                t.created_at,
                t.visit_id
            FROM triage t
            WHERE t.child_id = $1
            ORDER BY t.created_at DESC
            LIMIT 1
        `;
        const triageResult = await externalQuery(triageQuery, [child.id]);

        let latestTriage = null;
        if (triageResult.rows.length > 0) {
            const triage = triageResult.rows[0];
            // Note: The triage data is encrypted in the Laravel database
            // We'll try to parse it, but it may need decryption
            let triageData = null;
            try {
                if (typeof triage.data === 'string') {
                    // Try to parse as JSON first (in case it's not encrypted)
                    triageData = JSON.parse(triage.data);
                } else if (triage.data) {
                    triageData = triage.data;
                }
            } catch (e) {
                // Data is likely encrypted - we can't decrypt it here
                console.log('[PatientController] Triage data appears to be encrypted');
                triageData = { note: 'Encrypted data - requires Laravel decryption' };
            }

            latestTriage = {
                id: triage.id,
                visitId: triage.visit_id,
                createdAt: triage.created_at,
                data: triageData
            };
        }

        // Build response
        const response = {
            patient: {
                id: child.id,
                registrationNumber: child.registration_number,
                fullname: patientName,
                displayName: `${patientName.first_name || ''} ${patientName.middle_name || ''} ${patientName.last_name || ''}`.trim(),
                dob: child.dob,
                gender: child.gender,
                birthCertificate: child.birth_cert,
                insuranceNumber: child.insurance_number,
                insuranceProvider: child.insurance_provider
            },
            parent: parentData,
            lastVisit: lastVisit,
            latestTriage: latestTriage
        };

        console.log('[PatientController] Lookup successful, sending response');
        res.json(response);
    } catch (error) {
        console.error('[PatientController] Error looking up patient:', error);
        res.status(500).json({ error: 'Server error looking up patient' });
    }
};

/**
 * Search patients by name or registration number
 */
exports.searchPatients = async (req, res) => {
    const { query } = req.query;
    console.log('[PatientController] Searching patients with query:', query);

    try {
        if (!query || query.length < 2) {
            console.warn('[PatientController] Search query too short');
            return res.status(400).json({ error: 'Search query must be at least 2 characters' });
        }

        const searchQuery = `
            SELECT 
                c.id,
                c.fullname,
                c.dob,
                c.registration_number,
                g.gender as gender
            FROM children c
            LEFT JOIN gender g ON c.gender_id = g.id
            WHERE 
                c.registration_number ILIKE $1
                OR c.fullname::text ILIKE $1
            ORDER BY c.created_at DESC
            LIMIT 20
        `;

        const result = await externalQuery(searchQuery, [`%${query}%`]);
        console.log('[PatientController] Found matching patients:', result.rows.length);

        const patients = result.rows.map(child => {
            let patientName = { first_name: '', middle_name: '', last_name: '' };
            try {
                if (typeof child.fullname === 'string') {
                    patientName = JSON.parse(child.fullname);
                } else if (child.fullname) {
                    patientName = child.fullname;
                }
            } catch (e) { }

            return {
                id: child.id,
                registrationNumber: child.registration_number,
                fullname: patientName,
                displayName: `${patientName.first_name || ''} ${patientName.middle_name || ''} ${patientName.last_name || ''}`.trim(),
                dob: child.dob,
                gender: child.gender
            };
        });

        res.json(patients);
    } catch (error) {
        console.error('[PatientController] Error searching patients:', error);
        res.status(500).json({ error: 'Server error searching patients' });
    }
};

/**
 * Secure verification of patient details
 * Requires strict match of Registration Number and Date of Birth
 */
exports.verifyPatientSecure = async (req, res) => {
    const { registrationNumber, dateOfBirth } = req.body;

    try {
        if (!registrationNumber || !dateOfBirth) {
            return res.status(400).json({ error: 'Registration Number and Date of Birth are required' });
        }

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

        const childResult = await externalQuery(childQuery, [registrationNumber]);

        if (childResult.rows.length === 0) {
            return res.status(404).json({ error: 'Patient not found or details do not match' });
        }

        const child = childResult.rows[0];

        // Strict DOB Check
        const dbDob = new Date(child.dob).toISOString().split('T')[0];
        const reqDob = new Date(dateOfBirth).toISOString().split('T')[0];

        if (dbDob !== reqDob) {
            return res.status(404).json({ error: 'Patient not found or details do not match' });
        }

        let patientName = { first_name: '', middle_name: '', last_name: '' };
        try {
            if (typeof child.fullname === 'string') {
                patientName = JSON.parse(child.fullname);
            } else if (child.fullname) {
                patientName = child.fullname;
            }
        } catch (e) { console.error('Error parsing name', e); }

        const responsePatient = {
            id: child.id,
            registrationNumber: child.registration_number,
            fullname: patientName,
            displayName: `${patientName.first_name || ''} ${patientName.middle_name || ''} ${patientName.last_name || ''}`.trim(),
            dob: child.dob,
            gender: child.gender,
            birthCertificate: child.birth_cert,
            insuranceNumber: child.insurance_number,
            insuranceProvider: child.insurance_provider
        };

        res.json({ patient: responsePatient });

    } catch (error) {
        console.error('[PatientController] Error in secure verification:', error);
        res.status(500).json({ error: 'Server error verifying patient' });
    }
};

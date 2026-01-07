const { externalQuery } = require('../config/externalDatabase');

/**
 * Get all prescriptions for a child by registration number
 */
const getPrescriptionsByRegistration = async (req, res) => {
    const { registrationNumber } = req.params;

    try {
        // Get child ID
        const childResult = await externalQuery(
            'SELECT id FROM children WHERE registration_number = $1',
            [registrationNumber]
        );

        if (childResult.rows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Child not found'
            });
        }

        const childId = childResult.rows[0].id;

        // Get prescriptions with doctor info
        const prescResult = await externalQuery(`
            SELECT 
                p.id,
                p.data,
                p.created_at,
                p.updated_at,
                s.fullname as doctor_name,
                v.visit_date
            FROM prescriptions p
            LEFT JOIN staff s ON p.staff_id = s.id
            LEFT JOIN visits v ON p.visit_id = v.id
            WHERE p.child_id = $1
            ORDER BY p.created_at DESC
        `, [childId]);

        // Format response
        const prescriptions = prescResult.rows.map(p => {
            // Parse the data JSON
            let drugs = [];
            try {
                const data = typeof p.data === 'string' ? JSON.parse(p.data) : p.data;
                drugs = data.prescribed_drugs || [];
            } catch (e) {
                console.error('Error parsing prescription data:', e);
            }

            return {
                id: p.id,
                doctorName: formatDoctorName(p.doctor_name),
                visitDate: p.visit_date,
                prescribedAt: p.created_at,
                drugs: drugs
            };
        });

        res.json({
            success: true,
            count: prescriptions.length,
            data: prescriptions
        });

    } catch (error) {
        console.error('Error fetching prescriptions:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch prescriptions'
        });
    }
};

/**
 * Format doctor name from fullname JSON or string
 */
function formatDoctorName(fullname) {
    if (!fullname) return 'Unknown Doctor';

    // Handle JSON format like {"first_name": "John", "last_name": "Doe"}
    if (typeof fullname === 'object') {
        const parts = [];
        if (fullname.first_name) parts.push(fullname.first_name);
        if (fullname.middle_name) parts.push(fullname.middle_name);
        if (fullname.last_name) parts.push(fullname.last_name);
        return parts.join(' ') || 'Unknown Doctor';
    }

    // Handle string format
    try {
        const parsed = JSON.parse(fullname);
        return formatDoctorName(parsed);
    } catch {
        return fullname;
    }
}

module.exports = {
    getPrescriptionsByRegistration
};

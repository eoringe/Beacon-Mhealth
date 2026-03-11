const { externalQuery } = require('../config/externalDatabase');

/**
 * Get all doctors/therapists from the clinic
 * Returns staff who can provide medical services
 */
const getDoctors = async (req, res) => {
    try {
        const result = await externalQuery(`
            SELECT 
                s.id,
                s.fullname,
                s.staff_no,
                s.email,
                r.role,
                ds.specialization
            FROM staff s
            LEFT JOIN roles r ON s.role_id = r.id
            LEFT JOIN doctor_specialization ds ON s.specialization_id = ds.id
            WHERE r.role IN ('Doctor', 'Therapist')
               OR ds.specialization IS NOT NULL
            ORDER BY r.role, s.fullname->>'first_name'
        `);

        // Format response with proper name parsing
        const doctors = result.rows.map(d => ({
            id: d.id,
            name: formatStaffName(d.fullname),
            staffNo: d.staff_no,
            email: d.email,
            role: d.role || 'Staff',
            specialization: d.specialization || 'General',
        }));

        res.json({
            success: true,
            count: doctors.length,
            data: doctors
        });

        console.log(`[DoctorController] Fetched ${doctors.length} doctors:`, doctors.map(d => d.name));

    } catch (error) {
        console.error('Error fetching doctors:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch doctors'
        });
    }
};

/**
 * Get doctors by specialization
 */
const getDoctorsBySpecialization = async (req, res) => {
    const { specialization } = req.params;

    try {
        const result = await externalQuery(`
            SELECT 
                s.id,
                s.fullname,
                s.staff_no,
                ds.specialization
            FROM staff s
            LEFT JOIN doctor_specialization ds ON s.specialization_id = ds.id
            WHERE ds.specialization ILIKE $1
            ORDER BY s.fullname->>'first_name'
        `, [`%${specialization}%`]);

        const doctors = result.rows.map(d => ({
            id: d.id,
            name: formatStaffName(d.fullname),
            staffNo: d.staff_no,
            specialization: d.specialization,
        }));

        res.json({
            success: true,
            count: doctors.length,
            data: doctors
        });

    } catch (error) {
        console.error('Error fetching doctors by specialization:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch doctors'
        });
    }
};

/**
 * Get all available specializations
 */
const getSpecializations = async (req, res) => {
    try {
        const result = await externalQuery(`
            SELECT ds.id, ds.specialization, ds.role_id,
                   COUNT(s.id)::int as doctor_count
            FROM doctor_specialization ds
            LEFT JOIN staff s ON s.specialization_id = ds.id
            GROUP BY ds.id, ds.specialization, ds.role_id
            ORDER BY ds.specialization
        `);

        res.json({
            success: true,
            count: result.rows.length,
            data: result.rows.map(s => ({
                id: s.id,
                name: s.specialization,
                roleId: s.role_id,
                doctorCount: s.doctor_count
            }))
        });

    } catch (error) {
        console.error('Error fetching specializations:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch specializations'
        });
    }
};

/**
 * Format staff name from JSON fullname field
 */
function formatStaffName(fullname) {
    if (!fullname) return 'Unknown';

    if (typeof fullname === 'object') {
        const parts = [];
        if (fullname.first_name) parts.push(fullname.first_name);
        if (fullname.middle_name) parts.push(fullname.middle_name);
        if (fullname.last_name) parts.push(fullname.last_name);
        return parts.join(' ') || 'Unknown';
    }

    try {
        const parsed = JSON.parse(fullname);
        return formatStaffName(parsed);
    } catch {
        return fullname;
    }
}

module.exports = {
    getDoctors,
    getDoctorsBySpecialization,
    getSpecializations
};

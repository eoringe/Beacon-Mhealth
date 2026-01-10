const { query } = require('../config/database');

/**
 * Get sync timestamps for cache validation
 * Returns the latest updated_at for each data type
 */
const getSyncTimestamps = async (req, res) => {
    try {
        const userId = req.user.uid;

        // Get latest timestamps for each data type
        const timestamps = {};

        // Children - get max updated_at for this user's children
        const childrenResult = await query(
            `SELECT MAX(COALESCE(updated_at, created_at)) as last_updated 
             FROM children WHERE firebase_uid = $1`,
            [userId]
        );
        timestamps.children = childrenResult.rows[0]?.last_updated || null;

        // Growth measurements - get max updated_at for this user's children
        const growthResult = await query(
            `SELECT MAX(gm.created_at) as last_updated 
             FROM growth_measurements gm
             JOIN children c ON gm.child_id = c.id
             WHERE c.firebase_uid = $1`,
            [userId]
        );
        timestamps.growth = growthResult.rows[0]?.last_updated || null;

        // Milestones - get max created_at for this user's children
        const milestonesResult = await query(
            `SELECT MAX(mr.created_at) as last_updated 
             FROM milestone_responses mr
             JOIN children c ON mr.child_id = c.id
             WHERE c.firebase_uid = $1`,
            [userId]
        );
        timestamps.milestones = milestonesResult.rows[0]?.last_updated || null;

        // Appointments - get max updated_at for this user
        const appointmentsResult = await query(
            `SELECT MAX(COALESCE(updated_at, created_at)) as last_updated 
             FROM appointments WHERE firebase_uid = $1`,
            [userId]
        );
        timestamps.appointments = appointmentsResult.rows[0]?.last_updated || null;

        res.json({
            success: true,
            timestamps,
            serverTime: new Date().toISOString()
        });
    } catch (error) {
        console.error('Error getting sync timestamps:', error);
        res.status(500).json({ error: 'Failed to get sync timestamps' });
    }
};

module.exports = {
    getSyncTimestamps
};

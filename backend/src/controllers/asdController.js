const { pool } = require('../config/database');

// Save ASD screening result for a child
exports.saveAsdScreening = async (req, res) => {
    const client = await pool.connect();
    try {
        const { childId } = req.params;
        const { responses, score, riskLevel } = req.body;
        const userId = req.user.id;

        if (!childId || !responses || score === undefined || !riskLevel) {
            return res.status(400).json({ error: 'Child ID, responses, score, and risk level are required' });
        }

        // Verify child belongs to user
        const checkQuery = 'SELECT * FROM children WHERE id = $1 AND parent_id = $2';
        const checkResult = await client.query(checkQuery, [childId, userId]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Child not found or unauthorized' });
        }

        // Insert new record
        const insertQuery = `
            INSERT INTO asd_screenings (child_id, responses, score, risk_level)
            VALUES ($1, $2, $3, $4)
            RETURNING *
        `;
        const result = await client.query(insertQuery, [childId, JSON.stringify(responses), score, riskLevel]);

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error saving ASD screening:', error);
        res.status(500).json({ error: 'Server error saving ASD screening' });
    } finally {
        client.release();
    }
};

// Get ASD screenings for a specific child
exports.getAsdScreeningsForChild = async (req, res) => {
    const client = await pool.connect();
    try {
        const { childId } = req.params;
        const userId = req.user.id;

        // Verify child belongs to user
        const checkQuery = 'SELECT * FROM children WHERE id = $1 AND parent_id = $2';
        const checkResult = await client.query(checkQuery, [childId, userId]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Child not found or unauthorized' });
        }

        const query = `
            SELECT * FROM asd_screenings 
            WHERE child_id = $1
            ORDER BY created_at DESC
        `;
        const result = await client.query(query, [childId]);

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching ASD screenings:', error);
        res.status(500).json({ error: 'Server error fetching ASD screenings' });
    } finally {
        client.release();
    }
};

const { pool } = require('../config/database');

// Save or update milestone responses for a child
exports.saveMilestoneResponses = async (req, res) => {
    const client = await pool.connect();
    try {
        const { childId } = req.params;
        const { ageMonths, category, responses } = req.body;
        const userId = req.user.id;

        // Validation - use explicit checks since ageMonths can be 0 (Birth)
        if (!childId || ageMonths === undefined || ageMonths === null || !category || !responses) {
            return res.status(400).json({ error: 'Child ID, age, category, and responses are required' });
        }

        // Verify child belongs to user
        const checkQuery = 'SELECT * FROM children WHERE id = $1 AND parent_id = $2';
        const checkResult = await client.query(checkQuery, [childId, userId]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Child not found or unauthorized' });
        }

        // Check if milestone record exists
        const existingQuery = `
            SELECT * FROM milestone_responses 
            WHERE child_id = $1 AND age_months = $2 AND category = $3
        `;
        const existingResult = await client.query(existingQuery, [childId, ageMonths, category]);

        let result;
        if (existingResult.rows.length > 0) {
            // Update existing record
            const updateQuery = `
                UPDATE milestone_responses 
                SET responses = $1, updated_at = NOW()
                WHERE child_id = $2 AND age_months = $3 AND category = $4
                RETURNING *
            `;
            result = await client.query(updateQuery, [JSON.stringify(responses), childId, ageMonths, category]);
        } else {
            // Insert new record
            const insertQuery = `
                INSERT INTO milestone_responses (child_id, age_months, category, responses)
                VALUES ($1, $2, $3, $4)
                RETURNING *
            `;
            result = await client.query(insertQuery, [childId, ageMonths, category, JSON.stringify(responses)]);
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error saving milestone responses:', error);
        res.status(500).json({ error: 'Server error saving milestone responses' });
    } finally {
        client.release();
    }
};

// Get milestone responses for a specific child, age, and category
exports.getMilestoneResponses = async (req, res) => {
    const client = await pool.connect();
    try {
        const { childId } = req.params;
        const { ageMonths, category } = req.query;
        const userId = req.user.id;

        // Convert ageMonths to integer (comes as string from query params)
        const ageMonthsInt = parseInt(ageMonths);

        console.log('Getting milestone responses:', { childId, ageMonths: ageMonthsInt, category });

        // Verify child belongs to user
        const checkQuery = 'SELECT * FROM children WHERE id = $1 AND parent_id = $2';
        const checkResult = await client.query(checkQuery, [childId, userId]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Child not found or unauthorized' });
        }

        const query = `
            SELECT * FROM milestone_responses 
            WHERE child_id = $1 AND age_months = $2 AND category = $3
        `;
        const result = await client.query(query, [childId, ageMonthsInt, category]);

        console.log('Query result:', result.rows.length > 0 ? 'Found' : 'Not found');

        if (result.rows.length === 0) {
            return res.json({ responses: {} });
        }

        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error fetching milestone responses:', error);
        res.status(500).json({ error: 'Server error fetching milestone responses' });
    } finally {
        client.release();
    }
};

// Get all milestone responses for a child (for summary/overview)
exports.getAllMilestoneResponsesForChild = async (req, res) => {
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
            SELECT * FROM milestone_responses 
            WHERE child_id = $1
            ORDER BY age_months DESC, category
        `;
        const result = await client.query(query, [childId]);

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching all milestone responses:', error);
        res.status(500).json({ error: 'Server error fetching milestone responses' });
    } finally {
        client.release();
    }
};

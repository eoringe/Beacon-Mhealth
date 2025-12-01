const { Pool } = require('pg');
const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
});

// Add a new child
exports.addChild = async (req, res) => {
    const client = await pool.connect();
    try {
        const { firstName, lastName, dateOfBirth, gender, bloodType, allergies } = req.body;
        const userId = req.user.id; // From auth middleware

        // Validation
        if (!firstName || !dateOfBirth || !gender) {
            return res.status(400).json({ error: 'First name, date of birth, and gender are required' });
        }

        const query = `
            INSERT INTO children (parent_id, first_name, last_name, date_of_birth, gender, blood_type, allergies)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING *
        `;
        const values = [userId, firstName, lastName, dateOfBirth, gender, bloodType, allergies];

        const result = await client.query(query, values);
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding child:', error);
        res.status(500).json({ error: 'Server error adding child' });
    } finally {
        client.release();
    }
};

// Get all children for the logged-in user
exports.getChildren = async (req, res) => {
    const client = await pool.connect();
    try {
        const userId = req.user.id;
        const query = 'SELECT * FROM children WHERE parent_id = $1 ORDER BY created_at DESC';
        const result = await client.query(query, [userId]);
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching children:', error);
        res.status(500).json({ error: 'Server error fetching children' });
    } finally {
        client.release();
    }
};

// Update a child
exports.updateChild = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const { firstName, lastName, dateOfBirth, gender, bloodType, allergies } = req.body;
        const userId = req.user.id;

        // Verify ownership
        const checkQuery = 'SELECT * FROM children WHERE id = $1 AND parent_id = $2';
        const checkResult = await client.query(checkQuery, [id, userId]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Child not found or unauthorized' });
        }

        const updateQuery = `
            UPDATE children 
            SET first_name = $1, last_name = $2, date_of_birth = $3, gender = $4, blood_type = $5, allergies = $6, updated_at = NOW()
            WHERE id = $7
            RETURNING *
        `;
        const values = [firstName, lastName, dateOfBirth, gender, bloodType, allergies, id];
        const result = await client.query(updateQuery, values);
        res.json(result.rows[0]);
    } catch (error) {
        console.error('Error updating child:', error);
        res.status(500).json({ error: 'Server error updating child' });
    } finally {
        client.release();
    }
};

// Delete a child
exports.deleteChild = async (req, res) => {
    const client = await pool.connect();
    try {
        const { id } = req.params;
        const userId = req.user.id;

        const query = 'DELETE FROM children WHERE id = $1 AND parent_id = $2 RETURNING *';
        const result = await client.query(query, [id, userId]);

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Child not found or unauthorized' });
        }

        res.json({ message: 'Child deleted successfully' });
    } catch (error) {
        console.error('Error deleting child:', error);
        res.status(500).json({ error: 'Server error deleting child' });
    } finally {
        client.release();
    }
};

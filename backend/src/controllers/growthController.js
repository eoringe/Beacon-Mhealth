const { pool } = require('../config/database');

// Add a new growth measurement
exports.addMeasurement = async (req, res) => {
    const { childId } = req.params;
    const { date, weight, height, headCircumference, notes } = req.body;

    try {
        // Validate input
        if (!date) {
            return res.status(400).json({ error: 'Date is required' });
        }

        // Check for existing measurement on the same date to prevent duplicates
        const existingCheck = await pool.query(
            `SELECT id FROM growth_measurements WHERE child_id = $1 AND recorded_date = $2`,
            [childId, date]
        );

        let result;
        if (existingCheck.rows.length > 0) {
            // Update existing measurement
            result = await pool.query(
                `UPDATE growth_measurements 
                SET weight = $1, height = $2, head_circumference = $3, notes = $4
                WHERE id = $5 
                RETURNING *`,
                [weight, height, headCircumference, notes, existingCheck.rows[0].id]
            );
            res.status(200).json(result.rows[0]);
        } else {
            // Insert new measurement
            result = await pool.query(
                `INSERT INTO growth_measurements 
                (child_id, recorded_date, weight, height, head_circumference, notes) 
                VALUES ($1, $2, $3, $4, $5, $6) 
                RETURNING *`,
                [childId, date, weight, height, headCircumference, notes]
            );
            res.status(201).json(result.rows[0]);
        }
    } catch (error) {
        console.error('Error adding/updating growth measurement:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Get all growth measurements for a child
exports.getMeasurements = async (req, res) => {
    const { childId } = req.params;

    try {
        const result = await pool.query(
            `SELECT * FROM growth_measurements 
            WHERE child_id = $1 
            ORDER BY recorded_date ASC`,
            [childId]
        );

        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching growth measurements:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

// Delete a growth measurement
exports.deleteMeasurement = async (req, res) => {
    const { id } = req.params;

    try {
        const result = await pool.query(
            `DELETE FROM growth_measurements WHERE id = $1 RETURNING *`,
            [id]
        );

        if (result.rowCount === 0) {
            return res.status(404).json({ error: 'Measurement not found' });
        }

        res.json({ message: 'Measurement deleted successfully' });
    } catch (error) {
        console.error('Error deleting growth measurement:', error);
        res.status(500).json({ error: 'Internal server error', details: error.message });
    }
};

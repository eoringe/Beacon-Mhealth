const { pool } = require('../config/database');

// Add a new child
exports.addChild = async (req, res) => {
    console.log('[ChildController] ======= ADD CHILD START =======');
    console.log('[ChildController] User ID (from auth):', req.user.id);
    console.log('[ChildController] User UID (firebase):', req.user.uid);
    console.log('[ChildController] Request body:', JSON.stringify(req.body));
    
    const client = await pool.connect();
    try {
        const { firstName, lastName, dateOfBirth, gender, registrationNumber } = req.body;
        const userId = req.user.id; // From auth middleware

        console.log('[ChildController] Parsed fields:', { firstName, lastName, dateOfBirth, gender, registrationNumber, userId });

        // Validation
        if (!firstName || !dateOfBirth || !gender) {
            console.warn('[ChildController] Validation failed: missing fields');
            return res.status(400).json({ error: 'First name, date of birth, and gender are required' });
        }

        if (!userId) {
            console.error('[ChildController] No user ID found - user may not exist in DB yet');
            return res.status(400).json({ error: 'User not found in database. Please re-login.' });
        }

        // 1. If registration number is provided, check if it's already linked to this user
        if (registrationNumber) {
            console.log('[ChildController] Checking registration number:', registrationNumber);
            try {
                const regCheck = await client.query(
                    'SELECT * FROM children WHERE parent_id = $1 AND registration_number = $2',
                    [userId, registrationNumber]
                );
                if (regCheck.rows.length > 0) {
                    return res.status(400).json({ error: 'This child record is already linked to your account.' });
                }
            } catch (regErr) {
                // registration_number column might not exist - skip this check
                console.warn('[ChildController] Registration number check failed (column may not exist):', regErr.message);
            }
        }

        // 2. Check for duplicate name + DOB under the same parent to prevent double-submissions on network retries
        const cleanDob = dateOfBirth.split('T')[0];
        console.log('[ChildController] Checking duplicate with cleanDob:', cleanDob);
        const nameCheck = await client.query(
            `SELECT * FROM children 
             WHERE parent_id = $1 
               AND LOWER(first_name) = LOWER($2) 
               AND (
                 (last_name IS NULL AND ($3 IS NULL OR $3 = '')) OR 
                 (LOWER(last_name) = LOWER($3))
               )
               AND date_of_birth = $4::date`,
            [userId, firstName, lastName || null, cleanDob]
        );
        if (nameCheck.rows.length > 0) {
            console.log('[ChildController] Child already exists, returning existing child profile:', nameCheck.rows[0].id);
            return res.status(200).json(nameCheck.rows[0]);
        }

        // 3. Try inserting with registration_number first, fall back without it
        let result;
        try {
            console.log('[ChildController] Attempting INSERT with registration_number...');
            const query = `
                INSERT INTO children (parent_id, first_name, last_name, date_of_birth, gender, registration_number, photo_url)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                RETURNING *
            `;
            const values = [userId, firstName, lastName || null, cleanDob, gender, registrationNumber || null, req.body.photoUrl || null];
            console.log('[ChildController] INSERT values:', values);
            result = await client.query(query, values);
        } catch (insertErr) {
            // If registration_number column doesn't exist, retry without it
            if (insertErr.message && insertErr.message.includes('registration_number')) {
                console.warn('[ChildController] registration_number column not found, retrying without it...');
                const fallbackQuery = `
                    INSERT INTO children (parent_id, first_name, last_name, date_of_birth, gender, photo_url)
                    VALUES ($1, $2, $3, $4, $5, $6)
                    RETURNING *
                `;
                const fallbackValues = [userId, firstName, lastName || null, cleanDob, gender, req.body.photoUrl || null];
                console.log('[ChildController] Fallback INSERT values:', fallbackValues);
                result = await client.query(fallbackQuery, fallbackValues);
            } else {
                throw insertErr;
            }
        }

        console.log('[ChildController] ✔ Child added successfully:', result.rows[0].id);
        console.log('[ChildController] ======= ADD CHILD END =======');
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('[ChildController] ✖ Error adding child:', error.message);
        console.error('[ChildController] ✖ Error stack:', error.stack);
        console.error('[ChildController] ✖ Error code:', error.code);
        console.error('[ChildController] ✖ Error detail:', error.detail);
        res.status(500).json({ 
            error: 'Server error adding child',
            debugMessage: error.message,
            debugCode: error.code,
            debugDetail: error.detail
        });
    } finally {
        client.release();
    }
};

// Get all children for the logged-in user
exports.getChildren = async (req, res) => {
    console.log('[ChildController] Fetching children for user:', req.user.id);
    const client = await pool.connect();
    try {
        const userId = req.user.id;
        const query = 'SELECT * FROM children WHERE parent_id = $1 ORDER BY created_at DESC';
        const result = await client.query(query, [userId]);
        console.log('[ChildController] Found children count:', result.rows.length);
        res.json(result.rows);
    } catch (error) {
        console.error('[ChildController] Error fetching children:', error);
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
        const { firstName, lastName, dateOfBirth, gender } = req.body;
        const userId = req.user.id;

        // Verify ownership
        const checkQuery = 'SELECT * FROM children WHERE id = $1 AND parent_id = $2';
        const checkResult = await client.query(checkQuery, [id, userId]);
        if (checkResult.rows.length === 0) {
            return res.status(404).json({ error: 'Child not found or unauthorized' });
        }

        const updateQuery = `
            UPDATE children 
            SET first_name = COALESCE($1, first_name), 
                last_name = COALESCE($2, last_name), 
                date_of_birth = COALESCE($3, date_of_birth), 
                gender = COALESCE($4, gender), 
                photo_url = COALESCE($5, photo_url),
                updated_at = NOW()
            WHERE id = $6
            RETURNING *
        `;
        const values = [firstName, lastName, dateOfBirth, gender, req.body.photoUrl, id];
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

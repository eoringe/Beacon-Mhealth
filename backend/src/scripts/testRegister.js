
const { query } = require('../config/database');
require('dotenv').config();

async function testRegister() {
    console.log('--- Starting Registration Test ---');
    const mockUser = {
        firebaseUid: 'test_uid_' + Date.now(),
        email: 'test_' + Date.now() + '@example.com',
        displayName: 'Test User',
        photoUrl: 'http://example.com/photo.jpg'
    };

    console.log('Testing with user:', mockUser);

    try {
        console.log('1. Checking if user exists by email...');
        const existingUser = await query(
            'SELECT id FROM users WHERE email = $1',
            [mockUser.email]
        );
        console.log('   User exists?', existingUser.rows.length > 0);

        if (existingUser.rows.length > 0) {
            console.log('2a. Updating existing user...');
            // Logic mimicking controller
            await query(
                `UPDATE users 
                 SET firebase_uid = $1, 
                     display_name = $2, 
                     photo_url = $3, 
                     updated_at = NOW()
                 WHERE email = $4`,
                [mockUser.firebaseUid, mockUser.displayName, mockUser.photoUrl, mockUser.email]
            );
            console.log('   Update successful');
        } else {
            console.log('2b. Inserting new user...');
            // Logic mimicking controller
            await query(
                `INSERT INTO users (firebase_uid, email, display_name, photo_url, created_at, updated_at)
                 VALUES ($1, $2, $3, $4, NOW(), NOW())`,
                [mockUser.firebaseUid, mockUser.email, mockUser.displayName, mockUser.photoUrl]
            );
            console.log('   Insert successful');
        }

        console.log('3. Verifying insertion...');
        const check = await query('SELECT * FROM users WHERE email = $1', [mockUser.email]);
        console.log('   User record:', check.rows[0]);

        console.log('--- Test Complete: Success ---');

    } catch (error) {
        console.error('--- Test Failed ---');
        console.error(error);
    }
    // We won't close pool immediately to let pending queries finish if any, though await should handle it.
    // process.exit(0);
}

testRegister();

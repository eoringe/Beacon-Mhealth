
// Native fetch is available in Node 18+

// Target Local Backend (Node.js) which now handles the DB writes directly
const API_URL = 'http://localhost:3000/api/appointments/guest';

const testGuestBooking = async () => {
    console.log(`Testing Endpoint: ${API_URL}`);

    // Randomize parent/child names to avoid unique constraint collisions on phone if any
    const randomSuffix = Math.floor(Math.random() * 10000);

    const payload = {
        parent_first_name: "Test",
        parent_last_name: "Parent",
        parent_phone: `0799${randomSuffix}`, // Unique-ish phone
        parent_email: `test.guest.${randomSuffix}@example.com`,
        parent_gender: "Male",
        child_first_name: "Test",
        child_last_name: "Child",
        child_dob: "2024-01-01",
        child_gender: "Male",
        doctor_id: 2, // Saw ID 2 in previous logs as valid
        appointment_date: "2026-06-01",
        start_time: "10:00",
        end_time: "11:00"
    };

    console.log('Sending Payload:', JSON.stringify(payload, null, 2));

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                // Auth token might be needed if the route is protected!
                // The route in appointmentController.js is protected by authMiddleware.
                // We need a valid token.
            },
            body: JSON.stringify(payload)
        });

        console.log(`Status Code: ${response.status}`);

        const contentType = response.headers.get('content-type');
        console.log(`Content-Type: ${contentType}`);

        const text = await response.text();
        console.log('Raw Response Body:');
        console.log(text.substring(0, 1000)); // Print first 1000 chars

        if (text.trim().startsWith('<')) {
            console.error('❌ FAIL: Received HTML instead of JSON');
        } else {
            try {
                const json = JSON.parse(text);
                console.log('✅ SUCCESS: Parsed JSON response:', json);
            } catch (e) {
                console.error('❌ FAIL: Response is not valid JSON');
            }
        }

    } catch (error) {
        console.error('❌ Network Error:', error);
    }
};

testGuestBooking();

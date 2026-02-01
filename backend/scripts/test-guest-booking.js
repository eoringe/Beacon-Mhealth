
// Native fetch is available in Node 18+

const LARAVEL_API_URL = 'https://beaconchildrencenter-production.up.railway.app/api/book-guest-appointment';

const testGuestBooking = async () => {
    console.log(`Testing Endpoint: ${LARAVEL_API_URL}`);

    const payload = {
        parent_first_name: "Test",
        parent_last_name: "Parent",
        parent_phone: "0799999999",
        parent_email: "test.guest@example.com",
        parent_gender: "Male",
        child_first_name: "Test",
        child_last_name: "Child",
        child_dob: "2024-01-01",
        child_gender: "Male",
        doctor_id: 19, // Assuming 19 exists based on previous logs, otherwise might fail validation
        appointment_date: "2026-06-01",
        start_time: "10:00",
        end_time: "11:00"
    };

    console.log('Sending Payload:', JSON.stringify(payload, null, 2));

    try {
        const response = await fetch(LARAVEL_API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Accept': 'application/json',
                'X-Requested-With': 'XMLHttpRequest'
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

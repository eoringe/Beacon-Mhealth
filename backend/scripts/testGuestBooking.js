const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testGuestBooking() {
    console.log('--- Starting Guest Booking API Test ---');

    const payload = {
        parent_first_name: "Test",
        parent_last_name: "Guest",
        parent_phone: "0799999999",
        parent_email: "test.guest@example.com",
        parent_gender: "Male",
        child_first_name: "BabyTest",
        child_last_name: "Guest",
        child_dob: "2024-01-01",
        child_gender: "Male",
        doctor_id: process.env.TEST_DOCTOR_ID || "1", // Needs a valid doctor ID
        appointment_date: "2026-03-20", // Future date
        start_time: "09:00",
        end_time: "10:00"
    };

    try {
        console.log('Sending request to:', `${BASE_URL}/book-guest-appointment`);
        const response = await axios.post(`${BASE_URL}/book-guest-appointment`, payload);

        console.log('Response Status:', response.status);
        console.log('Response Data:', response.data);

        if (response.data.success) {
            console.log('✅ PASS: Booking Success');
        } else {
            console.log('❌ FAIL: Booking Failed Logic', response.data.message);
        }

    } catch (error) {
        if (error.response) {
            console.log('❌ FAIL: API Error', error.response.status, error.response.data);
        } else {
            console.log('❌ FAIL: Network Error', error.message);
        }
    }
}

// Test Validation Error
async function testValidationError() {
    console.log('\n--- Testing Validation Error ---');
    const payload = {
        // Missing fields
        parent_first_name: "Test"
    };

    try {
        await axios.post(`${BASE_URL}/book-guest-appointment`, payload);
        console.log('❌ FAIL: Should have failed validation');
    } catch (error) {
        if (error.response && error.response.status === 422) {
            console.log('✅ PASS: Captured 422 Validation Error');
        } else {
            console.log('❌ FAIL: Unexpected error', error.message);
        }
    }
}

async function run() {
    await testGuestBooking();
    await testValidationError();
}

run();

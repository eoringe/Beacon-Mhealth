
const axios = require('axios');

async function testServer() {
    console.log('Testing Running Server at localhost:3000...');

    try {
        const response = await axios.post('http://localhost:3000/api/mpesa/stk-push', {
            phone: '254708374149',
            amount: 1,
            appointment_data: {
                child_id: 1, // Assumes child 1 exists, otherwise might error during DB insert if FK check? 
                // Wait, our migration didn't enforce FK on appointment_data (it's JSONB).
                // But createAppointment logic DOES. 
                // STK push just saves to mpesa_transactions, which has NO FK on appointment_data.
                // So this should work for STK push initiation.
                test: true
            },
            reference_id: 0
        });

        console.log('Server Responsed:', response.data);
    } catch (error) {
        console.error('Server Error:', error.response ? error.response.data : error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('Server is NOT running or not reachable on port 3000');
        }
    }
}

testServer();

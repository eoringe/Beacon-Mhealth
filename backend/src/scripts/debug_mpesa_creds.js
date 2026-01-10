
const axios = require('axios');

const MPESA_ENV = 'sandbox';
const MPESA_CONSUMER_KEY = "NyGRxLOx1wGcUhXAMwE497E9SVI49OwI1u2UTGngipCpW30n";
const MPESA_CONSUMER_SECRET = "5v05OGMAcFLFG9elCQoM2cAgffQCM73Gu0htlRRlG7UpDEcV5aCAmSmvGGDUdARE";
const MPESA_SHORTCODE = "174379";
const MPESA_PASSKEY = "bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919";

async function testMpesa() {
    console.log('Testing M-Pesa Credentials...');

    // 1. Get Token
    const auth = Buffer.from(`${MPESA_CONSUMER_KEY}:${MPESA_CONSUMER_SECRET}`).toString('base64');
    const url = 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials';

    let token;
    try {
        console.log('Fetching Access Token...');
        const response = await axios.get(url, {
            headers: { Authorization: `Basic ${auth}` }
        });
        token = response.data.access_token;
        console.log('Access Token Received:', token.substring(0, 10) + '...');
    } catch (error) {
        console.error('Token Error:', error.response ? error.response.data : error.message);
        return;
    }

    // 2. STK Push
    console.log('Initiating STK Push...');
    const timestamp = new Date().toISOString().replace(/[^0-9]/g, '').slice(0, 14);
    const password = Buffer.from(`${MPESA_SHORTCODE}${MPESA_PASSKEY}${timestamp}`).toString('base64');

    const stkUrl = 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest';
    const stkRequest = {
        BusinessShortCode: MPESA_SHORTCODE,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: 1,
        PartyA: '254708374149', // Test phone number
        PartyB: MPESA_SHORTCODE,
        PhoneNumber: '254708374149',
        CallBackURL: 'https://google.com', // Dummy callback
        AccountReference: 'Test',
        TransactionDesc: 'Test'
    };

    try {
        const response = await axios.post(stkUrl, stkRequest, {
            headers: { Authorization: `Bearer ${token}` }
        });
        console.log('STK Push Success:', response.data);
    } catch (error) {
        console.error('STK Push Error:', error.response ? error.response.data : error.message);
    }
}

testMpesa();

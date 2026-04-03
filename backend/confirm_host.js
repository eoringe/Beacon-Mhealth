require('dotenv').config();
const { google } = require('googleapis');

async function confirmHost() {
    console.log('--- Google Calendar Host Confirmation ---');
    console.log('Time:', new Date().toLocaleString());

    if (!process.env.GOOGLE_CLIENT_ID || !process.env.GOOGLE_CLIENT_SECRET || !process.env.GOOGLE_REFRESH_TOKEN) {
        console.error('❌ Missing GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, or GOOGLE_REFRESH_TOKEN in .env');
        process.exit(1);
    }

    const oauth2Client = new google.auth.OAuth2(
        process.env.GOOGLE_CLIENT_ID,
        process.env.GOOGLE_CLIENT_SECRET
    );

    oauth2Client.setCredentials({
        refresh_token: process.env.GOOGLE_REFRESH_TOKEN
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    try {
        console.log('\nStep 1: Fetching primary calendar details...');
        const response = await calendar.calendars.get({ calendarId: 'primary' });
        
        console.log('\n==============================================');
        console.log('✅ GOOGLE CALENDAR HOST CONFIRMED');
        console.log('==============================================');
        console.log(`Email Account: ${response.data.id}`);
        console.log(`Display Name:  ${response.data.summary}`);
        console.log(`Timezone:      ${response.data.timeZone}`);
        console.log('==============================================\n');
        
        process.exit(0);
    } catch (error) {
        console.error('❌ Failed to confirm host:', error.message);
        if (error.message.includes('No refresh token is set') || error.message.includes('invalid_grant')) {
            console.error('TIP: Your GOOGLE_REFRESH_TOKEN might be expired or invalid.');
        }
        process.exit(1);
    }
}

confirmHost();

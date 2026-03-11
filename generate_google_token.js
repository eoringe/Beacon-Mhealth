/**
 * Run this script to generate a new Google OAuth refresh token.
 * Steps:
 * 1. Run: node generate_google_token.js
 * 2. Open the URL printed in the console in your browser
 * 3. Authorize the app with the Google account that owns the Calendar
 * 4. Copy the "code" from the redirect URL
 * 5. Paste it when prompted
 * 6. Copy the new refresh_token into your .env file as GOOGLE_REFRESH_TOKEN
 */
require('dotenv').config({ path: './backend/.env' });
const { google } = require('googleapis');
const readline = require('readline');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env');
    process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(
    CLIENT_ID,
    CLIENT_SECRET,
    'urn:ietf:wg:oauth:2.0:oob'  // This is the redirect URI for installed apps (prompts user to paste code)
);

const SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
];

const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',  // Force consent screen to ensure we get a fresh refresh_token
});

console.log('\n==============================================');
console.log('STEP 1: Open this URL in your browser:');
console.log('==============================================');
console.log(authUrl);
console.log('\n==============================================');
console.log('STEP 2: Authorize with your Google account');
console.log('STEP 3: Copy the authorization code shown');
console.log('==============================================\n');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
rl.question('Paste the authorization code here: ', async (code) => {
    rl.close();
    try {
        const { tokens } = await oauth2Client.getToken(code.trim());
        console.log('\n==============================================');
        console.log('SUCCESS! Your new tokens:');
        console.log('==============================================');
        console.log('Access Token:', tokens.access_token);
        console.log('\nREFRESH TOKEN (put this in .env as GOOGLE_REFRESH_TOKEN):');
        console.log(tokens.refresh_token);
        console.log('\n==============================================');
        console.log('Update your .env:');
        console.log(`GOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"`);
        console.log('==============================================\n');
    } catch (err) {
        console.error('Error getting tokens:', err.message);
        process.exit(1);
    }
});

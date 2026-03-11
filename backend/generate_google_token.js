/**
 * Google OAuth Token Generator (localhost redirect)
 * Run: node generate_google_token.js
 * Then open the URL that appears in your browser.
 * The token will be printed automatically after you authorize.
 */
require('dotenv').config();
const { google } = require('googleapis');
const http = require('http');
const url = require('url');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const REDIRECT_URI = 'http://localhost:3001/oauth2callback';

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('❌ Missing GOOGLE_CLIENT_ID or GOOGLE_CLIENT_SECRET in .env');
    process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(CLIENT_ID, CLIENT_SECRET, REDIRECT_URI);

const SCOPES = [
    'https://www.googleapis.com/auth/calendar',
    'https://www.googleapis.com/auth/calendar.events',
];

const authUrl = oauth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
});

// Start a local server to catch the OAuth redirect
const server = http.createServer(async (req, res) => {
    if (!req.url.startsWith('/oauth2callback')) {
        res.end('Waiting for OAuth callback...');
        return;
    }

    const qs = new url.URL(req.url, 'http://localhost:3001').searchParams;
    const code = qs.get('code');
    const error = qs.get('error');

    if (error) {
        res.end(`<h2>Authorization failed: ${error}</h2>`);
        server.close();
        process.exit(1);
    }

    res.end('<h2>✅ Authorization successful! You can close this tab.</h2><p>Check your terminal for the refresh token.</p>');

    try {
        const { tokens } = await oauth2Client.getToken(code);
        server.close();

        console.log('\n==============================================');
        console.log('✅ SUCCESS! Update your backend/.env:');
        console.log('==============================================');
        console.log(`GOOGLE_REFRESH_TOKEN="${tokens.refresh_token}"`);
        console.log('==============================================\n');
        process.exit(0);
    } catch (err) {
        console.error('❌ Error exchanging code for tokens:', err.message);
        server.close();
        process.exit(1);
    }
});

server.listen(3001, () => {
    console.log('\n==============================================');
    console.log('🔗 Open this URL in your browser to authorize:');
    console.log('==============================================');
    console.log(authUrl);
    console.log('\nWaiting for authorization...');
    console.log('==============================================\n');
});

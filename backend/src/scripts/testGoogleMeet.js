/**
 * Test Google Meet Link Generation
 * Standalone script to verify Google Calendar credentials and Meet functionality
 */
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
const googleCalendarService = require('../services/googleCalendarService');

async function testMeetLink() {
    console.log('--- Google Meet Link Generation Test ---');
    console.log('Time:', new Date().toLocaleString());
    
    // 1. Initialize Service
    console.log('\nStep 1: Initializing Google Calendar Service...');
    googleCalendarService.initialize();
    
    if (!googleCalendarService.isConfigured()) {
        console.error('ERROR: Google Calendar service failed to initialize.');
        console.error('Check your .env file for GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN.');
        process.exit(1);
    }
    
    // 2. Prepare Test Event
    const now = new Date();
    const startTime = new Date(now.getTime() + 5 * 60000); // 5 minutes from now
    const endTime = new Date(startTime.getTime() + 30 * 60000); // 30 minutes later
    
    const dateStr = startTime.toISOString().split('T')[0];
    const startTimeStr = startTime.toTimeString().substring(0, 5); // HH:mm
    const endTimeStr = endTime.toTimeString().substring(0, 5); // HH:mm
    
    const eventDetails = {
        summary: 'TEST: Beacon Teleconsultation (Automated Test)',
        description: 'This is a test event created to verify Google Meet link generation.',
        date: dateStr,
        startTime: startTimeStr,
        endTime: endTimeStr,
        attendees: ['test@example.com']
    };
    
    const idempotencyKey = `test-${Date.now()}`;
    
    // 3. Create Event
    console.log('\nStep 2: Creating test calendar event with Meet conferencing...');
    console.log(`Event: ${eventDetails.summary} on ${dateStr} at ${startTimeStr}`);
    
    try {
        const result = await googleCalendarService.createCalendarEvent(eventDetails, idempotencyKey);
        
        console.log('\nSUCCESS!');
        console.log('Event ID:', result.eventId);
        console.log('Google Meet Link:', result.meetLink);
        console.log('HTML Link:', result.htmlLink);
        
        if (!result.meetLink) {
            console.warn('\nWARNING: Event created but NO Google Meet link was generated.');
            console.warn('Check if "Google Meet" is enabled for your Google Workspace/Account.');
        } else {
            console.log('\n--- VERIFIED: Google Meet link generation is working! ---');
        }
        
        // 4. Cleanup
        console.log('\nStep 3: Cleaning up (deleting test event)...');
        await googleCalendarService.deleteCalendarEvent(result.eventId);
        console.log('Cleanup complete. Test event deleted.');
        
    } catch (error) {
        console.error('\nFAILED to create calendar event:');
        console.error(error.message);
        process.exit(1);
    }
}

testMeetLink();

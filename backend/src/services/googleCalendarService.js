/**
 * Google Calendar Service
 * Handles Google Calendar API integration for teleconsultation appointments
 */

const { google } = require('googleapis');
const crypto = require('crypto');

class GoogleCalendarService {
    constructor() {
        this.oauth2Client = null;
        this.calendar = null;
        this.initialized = false;
    }

    /**
     * Initialize the OAuth2 client with credentials from environment
     */
    initialize() {
        if (this.initialized) return;

        const clientId = process.env.GOOGLE_CLIENT_ID;
        const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
        const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

        if (!clientId || !clientSecret || !refreshToken) {
            console.warn('Google Calendar credentials not configured. Teleconsultation will not work.');
            return;
        }

        this.oauth2Client = new google.auth.OAuth2(
            clientId,
            clientSecret
        );

        this.oauth2Client.setCredentials({
            refresh_token: refreshToken
        });

        this.calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
        this.initialized = true;
        console.log('Google Calendar service initialized successfully');
    }

    /**
     * Check if the service is properly configured
     */
    isConfigured() {
        return this.initialized && this.calendar !== null;
    }

    /**
     * Generate an idempotency key from appointment details
     * This ensures the same appointment doesn't create duplicate calendar events
     */
    generateIdempotencyKey(childId, doctorId, date, time) {
        const data = `${childId}-${doctorId}-${date}-${time}`;
        return crypto.createHash('sha256').update(data).digest('hex').substring(0, 32);
    }

    /**
     * Create a Google Calendar event with Google Meet conferencing
     * @param {Object} eventDetails - Event details
     * @param {string} eventDetails.summary - Event title (e.g., "Teleconsultation: John Doe")
     * @param {string} eventDetails.description - Event description
     * @param {string} eventDetails.date - Date in YYYY-MM-DD format
     * @param {string} eventDetails.startTime - Start time in HH:mm format
     * @param {string} eventDetails.endTime - End time in HH:mm format
     * @param {string} eventDetails.timezone - Timezone (default: Africa/Nairobi)
     * @param {Array} eventDetails.attendees - Array of attendee emails [{email: 'user@example.com'}]
     * @param {string} idempotencyKey - Unique key to prevent duplicate events
     * @returns {Object} - { eventId, meetLink }
     */
    async createCalendarEvent(eventDetails, idempotencyKey) {
        if (!this.isConfigured()) {
            throw new Error('Google Calendar service is not configured');
        }

        const {
            summary,
            description = '',
            date,
            startTime,
            endTime,
            timezone = process.env.GOOGLE_CALENDAR_TIMEZONE || 'Africa/Nairobi',
            attendees = []
        } = eventDetails;

        // Construct ISO date-time strings
        const startDateTime = `${date}T${startTime}:00`;
        const endDateTime = `${date}T${endTime}:00`;

        const event = {
            summary,
            description,
            start: {
                dateTime: startDateTime,
                timeZone: timezone
            },
            end: {
                dateTime: endDateTime,
                timeZone: timezone
            },
            conferenceData: {
                createRequest: {
                    requestId: idempotencyKey,
                    conferenceSolutionKey: {
                        type: 'hangoutsMeet'
                    }
                }
            }
        };

        // Add attendees if provided (they will receive email invites)
        if (attendees.length > 0) {
            event.attendees = attendees.map(email => ({
                email: typeof email === 'string' ? email : email.email,
                responseStatus: 'needsAction'
            }));
        }

        try {
            const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

            const response = await this.calendar.events.insert({
                calendarId,
                resource: event,
                conferenceDataVersion: 1,
                sendUpdates: attendees.length > 0 ? 'all' : 'none' // Send email invites to attendees
            });

            const createdEvent = response.data;

            // Extract Meet link from conference data
            const meetLink = createdEvent.conferenceData?.entryPoints?.find(
                ep => ep.entryPointType === 'video'
            )?.uri || null;

            console.log(`Calendar event created: ${createdEvent.id}, Meet link: ${meetLink}`);

            return {
                eventId: createdEvent.id,
                meetLink,
                htmlLink: createdEvent.htmlLink
            };
        } catch (error) {
            // Check if this is a duplicate request (idempotency)
            if (error.code === 409) {
                console.log('Duplicate calendar event request detected, fetching existing event');
                // Try to find the existing event by idempotency key in extended properties
                // For now, we'll re-throw as this shouldn't happen with proper idempotency
            }

            console.error('Error creating calendar event:', error.message);
            throw new Error(`Failed to create Google Calendar event: ${error.message}`);
        }
    }

    /**
     * Delete a calendar event (for cancellations)
     * @param {string} eventId - The Google Calendar event ID
     */
    async deleteCalendarEvent(eventId) {
        if (!this.isConfigured()) {
            console.warn('Google Calendar service not configured, skipping event deletion');
            return;
        }

        try {
            const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

            await this.calendar.events.delete({
                calendarId,
                eventId
            });

            console.log(`Calendar event deleted: ${eventId}`);
            return true;
        } catch (error) {
            // Event might already be deleted
            if (error.code === 404 || error.code === 410) {
                console.log(`Calendar event ${eventId} already deleted or not found`);
                return true;
            }

            console.error('Error deleting calendar event:', error.message);
            throw new Error(`Failed to delete Google Calendar event: ${error.message}`);
        }
    }

    /**
     * Get an existing calendar event by ID
     * @param {string} eventId - The Google Calendar event ID
     */
    async getCalendarEvent(eventId) {
        if (!this.isConfigured()) {
            throw new Error('Google Calendar service is not configured');
        }

        try {
            const calendarId = process.env.GOOGLE_CALENDAR_ID || 'primary';

            const response = await this.calendar.events.get({
                calendarId,
                eventId
            });

            return response.data;
        } catch (error) {
            if (error.code === 404) {
                return null;
            }
            throw error;
        }
    }
}

// Export singleton instance
const googleCalendarService = new GoogleCalendarService();

module.exports = googleCalendarService;

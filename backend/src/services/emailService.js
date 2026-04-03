const nodemailer = require('nodemailer');

class EmailService {
    constructor() {
        this.transporter = null;
        this.initialized = false;
    }

    /**
     * Initialize the SMTP transporter
     */
    initialize() {
        if (this.initialized) return;

        const host = process.env.SMTP_HOST;
        const port = process.env.SMTP_PORT || 465;
        const user = process.env.SMTP_USER;
        const pass = process.env.SMTP_PASS;
        const secure = process.env.SMTP_SECURE === 'true';

        if (!host || !user || !pass) {
            console.warn('[EmailService] SMTP credentials not fully configured. Email notifications will be skipped.');
            return;
        }

        this.transporter = nodemailer.createTransport({
            host,
            port,
            secure, // true for 465, false for other ports
            auth: {
                user,
                pass,
            },
        });

        this.initialized = true;
        console.log('[EmailService] SMTP transporter initialized successfully');
    }

    /**
     * Send an email with graceful fallback
     */
    async sendEmail(options) {
        this.initialize();

        if (!this.initialized) {
            console.log('[EmailService] Skipping email push: Transporter not initialized.');
            return false;
        }

        try {
            const info = await this.transporter.sendMail({
                from: process.env.EMAIL_FROM || process.env.SMTP_USER,
                ...options,
            });
            console.log(`[EmailService] Email sent successfully: ${info.messageId}`);
            return true;
        } catch (error) {
            console.error('[EmailService] Error sending email:', error.message);
            // Fallback gracefully: don't throw, just log
            return false;
        }
    }

    /**
     * Send booking confirmation email
     */
    async sendBookingConfirmation(email, appointment) {
        if (!email) {
            console.log('[EmailService] Skipping email: No email address provided.');
            return false;
        }

        const isTeleconsult = appointment.appointment_type === 'TELECONSULT';
        const dateStr = new Date(appointment.appointment_date).toLocaleDateString('en-GB', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const visitTypeFormatted = appointment.appointment_type === 'TELECONSULT' ? 'Teleconsultation' : 'In-Person Visit';
        const subject = `Booking Confirmation: ${appointment.appointment_title}`;
        
        const html = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee;">
                <h2 style="color: #2c3e50;">Booking Confirmation</h2>
                <p>Hello,</p>
                <p>An appointment has been successfully booked for <strong>${appointment.appointment_title}</strong>.</p>
                
                <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin: 20px 0;">
                    <p><strong>Date:</strong> ${dateStr}</p>
                    <p><strong>Time:</strong> ${appointment.start_time}</p>
                    <p><strong>Visit Type:</strong> ${visitTypeFormatted}</p>
                    ${isTeleconsult && appointment.google_meet_link ? `
                    <p><strong>Meeting Link:</strong> <a href="${appointment.google_meet_link}">${appointment.google_meet_link}</a></p>
                    <p style="font-size: 0.9em; color: #666;">(Please use this link at the scheduled time for your teleconsultation)</p>
                    ` : ''}
                </div>

                <p>If you need to cancel or reschedule, please contact Beacon Children's Center.</p>
                <p>Thank you for choosing us.</p>
                <hr style="border: none; border-top: 1px solid #eee; margin-top: 30px;">
                <p style="font-size: 0.8em; color: #888;">Beacon Children's Center | Dedicated to your child's health.</p>
            </div>
        `;

        return this.sendEmail({
            to: email,
            subject,
            html,
        });
    }
}

// Export singleton
const emailService = new EmailService();
module.exports = emailService;

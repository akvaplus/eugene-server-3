const nodemailer = require('nodemailer');
const crypto = require('crypto');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

class EmailService {
    constructor() {
        // Check if required environment variables are set
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.warn('Warning: Email credentials not configured. Email functionality will be disabled.');
            console.warn('EMAIL_USER:', process.env.EMAIL_USER ? 'Set' : 'Not Set');
            console.warn('EMAIL_PASS:', process.env.EMAIL_PASS ? 'Set' : 'Not Set');
            this.isConfigured = false;
            return;
        }

        this.isConfigured = true;
        this.transporter = nodemailer.createTransport({
            service: 'gmail',  // Using Gmail service directly
            auth: {
                user: process.env.EMAIL_USER,
                pass: process.env.EMAIL_PASS
            },
            debug: true, // Enable debug logs
            logger: true // Log to console
        });

        // Log configuration status
        console.log('Email Service Configuration:');
        console.log('- EMAIL_USER:', process.env.EMAIL_USER);
        console.log('- FRONTEND_URL:', process.env.FRONTEND_URL);

        // Verify email configuration on startup
        this.verifyConfiguration();
    }

    async verifyConfiguration() {
        if (!this.isConfigured) {
            console.warn('Email service not configured, skipping verification');
            return;
        }

        try {
            const result = await this.transporter.verify();
            console.log('Email service configured successfully:', result);
            
            // Test the connection by sending a test email
            await this.sendTestEmail();
        } catch (error) {
            console.error('Email configuration error:', {
                message: error.message,
                code: error.code,
                command: error.command,
                response: error.response
            });
            this.isConfigured = false;
        }
    }

    async sendTestEmail() {
        try {
            const info = await this.transporter.sendMail({
                from: `"System Test" <${process.env.EMAIL_USER}>`,
                to: process.env.EMAIL_USER,
                subject: 'Email Service Test',
                text: 'If you receive this email, the email service is configured correctly.'
            });
            console.log('Test email sent successfully:', info.messageId);
        } catch (error) {
            console.error('Failed to send test email:', error);
            throw error;
        }
    }

    async sendVerificationEmail(user) {
        if (!this.isConfigured) {
            throw new Error('Email service not configured. Please contact administrator.');
        }

        try {
            const verificationToken = crypto.randomBytes(32).toString('hex');
            user.emailVerificationToken = verificationToken;
            user.emailVerificationExpires = Date.now() + 24 * 3600000; // 24 hours
            await user.save();

            // Use verify-email route instead of api/auth/verify-email, with /user prefix
            const verificationUrl = `${process.env.FRONTEND_URL}/user/verify-email/${verificationToken}`;
            
            const mailOptions = {
                from: `"Measurement Data Platform" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: 'Verify Your Email Address',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Welcome to Measurement Data Platform!</h2>
                        <p>Hello ${user.firstName},</p>
                        <p>Thank you for registering. Please verify your email address by clicking the button below:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${verificationUrl}" 
                               style="background-color: #007bff; color: white; padding: 12px 30px; 
                                      text-decoration: none; border-radius: 5px; display: inline-block;">
                                Verify Email Address
                            </a>
                        </div>
                        <p>Or copy and paste this link in your browser:</p>
                        <p style="color: #666;">${verificationUrl}</p>
                        <p>This verification link will expire in 24 hours.</p>
                        <p>If you did not create an account, please ignore this email.</p>
                        <hr style="border: 1px solid #eee; margin: 20px 0;">
                        <p style="color: #666; font-size: 12px;">
                            This is an automated email, please do not reply.
                        </p>
                    </div>
                `
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Verification email sent:', info.messageId);
            return info;
        } catch (error) {
            console.error('Error sending verification email:', error);
            if (error.code === 'EAUTH') {
                throw new Error('Email authentication failed. Please check email configuration.');
            }
            throw new Error('Failed to send verification email. Please try again later.');
        }
    }

    async sendPasswordResetEmail(user, resetToken) {
        if (!this.isConfigured) {
            throw new Error('Email service not configured. Please contact administrator.');
        }

        try {
            const resetUrl = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
            
            const mailOptions = {
                from: `"Measurement Data Platform" <${process.env.EMAIL_USER}>`,
                to: user.email,
                subject: 'Password Reset Request',
                html: `
                    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                        <h2 style="color: #333;">Password Reset Request</h2>
                        <p>Hello ${user.firstName},</p>
                        <p>You requested to reset your password. Click the button below to proceed:</p>
                        <div style="text-align: center; margin: 30px 0;">
                            <a href="${resetUrl}" 
                               style="background-color: #dc3545; color: white; padding: 12px 30px; 
                                      text-decoration: none; border-radius: 5px; display: inline-block;">
                                Reset Password
                            </a>
                        </div>
                        <p>Or copy and paste this link in your browser:</p>
                        <p style="color: #666;">${resetUrl}</p>
                        <p>This reset link will expire in 1 hour.</p>
                        <p>If you did not request this reset, please ignore this email.</p>
                        <hr style="border: 1px solid #eee; margin: 20px 0;">
                        <p style="color: #666; font-size: 12px;">
                            This is an automated email, please do not reply.
                        </p>
                    </div>
                `
            };

            const info = await this.transporter.sendMail(mailOptions);
            console.log('Password reset email sent:', info.messageId);
            return info;
        } catch (error) {
            console.error('Error sending password reset email:', error);
            if (error.code === 'EAUTH') {
                throw new Error('Email authentication failed. Please check email configuration.');
            }
            throw new Error('Failed to send password reset email. Please try again later.');
        }
    }
}

module.exports = new EmailService(); 
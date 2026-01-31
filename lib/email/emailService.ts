import { transporter } from './transporter';
import { emailTemplates } from './templates';

/**
 * Send email using reusable templates
 * @param {Object} options - Email options
 * @returns {Promise<Object>} - Send result
 */
export async function sendEmail(options) {
  try {
    const {
      to,
      templateName,
      templateData = {},
      subject,
      cc,
      bcc,
      attachments,
      from = `"Your App" <${process.env.YAHOO_EMAIL}>`
    } = options;

    // Get template
    const template = emailTemplates[templateName];
    if (!template) {
      throw new Error(`Template "${templateName}" not found`);
    }

    // Generate HTML from template
    const html = template(templateData);

    // Prepare email
    const mailOptions = {
      from,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html,
      cc,
      bcc,
      attachments
    };

    // Send email
    const info = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl(info) // For testing
    };
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

/**
 * Quick send functions for common use cases
 */
export const emailService = {
  sendWelcome: async (to, name, email) => {
    return sendEmail({
      to,
      templateName: 'welcome',
      templateData: { name, email },
      subject: `Welcome to Our Service, ${name}!`
    });
  },

  sendPasswordReset: async (to, resetToken) => {
    const resetLink = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${resetToken}`;
    
    return sendEmail({
      to,
      templateName: 'resetPassword',
      templateData: { resetLink },
      subject: 'Password Reset Request'
    });
  },

  sendNotification: async (to, title, message, actionUrl = null) => {
    return sendEmail({
      to,
      templateName: 'notification',
      templateData: { title, message, actionUrl },
      subject: title
    });
  }
};

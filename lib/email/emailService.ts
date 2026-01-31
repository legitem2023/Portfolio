import { transporter } from './transporter';
import { emailTemplates } from './templates';

export async function sendEmail(options) {
  try {
    const {
      to,
      templateName,
      templateData = {},
      subject,
      from = `"Your App" <${process.env.YAHOO_EMAIL}>`
    } = options;

    const template = emailTemplates[templateName];
    if (!template) {
      throw new Error(`Template "${templateName}" not found`);
    }

    const html = template(templateData);

    const mailOptions = {
      from,
      to: Array.isArray(to) ? to.join(', ') : to,
      subject,
      html
    };

    const info = await transporter.sendMail(mailOptions);
    
    return {
      success: true,
      messageId: info.messageId,
      accepted: info.accepted,
      rejected: info.rejected
    };
  } catch (error) {
    console.error('Email send error:', error);
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

// Mutation-specific email functions
export const emailMutations = {
  sendWelcomeEmail: async (userData) => {
    return sendEmail({
      to: userData.email,
      templateName: 'welcome',
      templateData: {
        name: userData.name,
        email: userData.email,
        verificationToken: userData.verificationToken
      },
      subject: `Welcome to Our App, ${userData.name}!`
    });
  },

  sendPasswordResetEmail: async (userData) => {
    const resetLink = `${process.env.NEXT_PUBLIC_SITE_URL}/reset-password?token=${userData.resetToken}`;
    
    return sendEmail({
      to: userData.email,
      templateName: 'resetPassword',
      templateData: { 
        name: userData.name,
        resetLink,
        expiresIn: '1 hour'
      },
      subject: 'Password Reset Request'
    });
  },

  sendVerificationEmail: async (userData) => {
    const verifyLink = `${process.env.NEXT_PUBLIC_SITE_URL}/verify-email?token=${userData.verificationToken}`;
    
    return sendEmail({
      to: userData.email,
      templateName: 'verification',
      templateData: {
        name: userData.name,
        verifyLink,
        expiresIn: '24 hours'
      },
      subject: 'Verify Your Email Address'
    });
  },

  sendNotificationEmail: async (notificationData) => {
    return sendEmail({
      to: notificationData.recipientEmail,
      templateName: 'notification',
      templateData: {
        title: notificationData.title,
        message: notificationData.message,
        actionUrl: notificationData.actionUrl,
        userName: notificationData.userName
      },
      subject: notificationData.subject || notificationData.title
    });
  }
};

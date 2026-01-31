import { transporter } from './transporter';
import { emailTemplates } from './templates';

export interface EmailOptions {
  to: string | string[];
  templateName: string;
  templateData?: Record<string, any>;
  subject: string;
  from?: string;
}

export interface EmailResult {
  success: boolean;
  messageId: string;
  accepted: string[];
  rejected: string[];
}

export interface UserData {
  email: string;
  name: string;
  verificationToken?: string;
  resetToken?: string;
}

export interface NotificationData {
  recipientEmail: string;
  title: string;
  message: string;
  actionUrl?: string;
  userName?: string;
  subject?: string;
}

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  const {
    to,
    templateName,
    templateData = {},
    subject,
    from = `"Your App" <${process.env.YAHOO_EMAIL}>`
  } = options;

  const template = emailTemplates[templateName as keyof typeof emailTemplates];
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
    accepted: info.accepted || [],
    rejected: info.rejected || []
  };
}

export const emailMutations = {
  sendWelcomeEmail: async (userData: UserData) => {
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

  sendPasswordResetEmail: async (userData: UserData) => {
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

  sendVerificationEmail: async (userData: UserData) => {
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

  sendNotificationEmail: async (notificationData: NotificationData) => {
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

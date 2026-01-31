import { transporter } from './transporter';
import { emailTemplates } from './templates';

export interface EmailOptions {
  to: string | string[];
  templateName: string;
  templateData?: Record<string, any>;
  subject: string;
  from?: string;
}

// Update the EmailResult interface to match what nodemailer actually returns
export interface EmailResult {
  success: boolean;
  messageId: string;
  accepted: Array<string | { address: string; name?: string }>;
  rejected: Array<string | { address: string; name?: string }>;
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

// Or if you really want only strings in the arrays, you can map them:
export async function sendEmailStringOnly(options: EmailOptions): Promise<Omit<EmailResult, 'accepted' | 'rejected'> & {
  accepted: string[];
  rejected: string[];
}> {
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
  
  // Convert Address objects to strings
  const accepted = (info.accepted || []).map(addr => 
    typeof addr === 'string' ? addr : addr.address
  ).filter(Boolean) as string[];
  
  const rejected = (info.rejected || []).map(addr => 
    typeof addr === 'string' ? addr : addr.address
  ).filter(Boolean) as string[];
  
  return {
    success: true,
    messageId: info.messageId,
    accepted,
    rejected
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

// src/services/EmailService.ts (Updated - Only adding logistics functionality)

// Keep all your existing imports
import { generatePasswordResetEmail } from '../emailTemplates/passwordResetEmail';
// Add this import for logistics emails
import { 
  generateLogisticsContactEmail, 
  generateCustomerNotificationEmail 
} from '../emailTemplates/logisticsContactEmail';

// Keep your existing interfaces and add new ones
export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  cc?: string | string[];
  bcc?: string | string[];
}

export interface EmailServiceConfig {
  service: 'nodemailer';
  apiKey?: string;
  fromEmail?: string;
  appName?: string;
  baseUrl?: string;
  // Add these new config options
  logoUrl?: string;
  logisticsTeamEmail?: string;
  supportEmail?: string;
  supportPhone?: string;
}

// ADD THESE NEW INTERFACES for logistics
export interface ContactFormData {
  name: string;
  email: string;
  phone?: string;
  company?: string;
  service: string;
  message: string;
}

export interface ContactEmailResult {
  success: boolean;
  referenceNumber: string;
  teamEmailSent: boolean;
  customerEmailSent: boolean;
  errors?: string[];
}

export class EmailService {
  private config: EmailServiceConfig;

  constructor(config: EmailServiceConfig) {
    this.config = {
      fromEmail: 'noreply@vendorcity.com',
      appName: 'VendorCity',
      baseUrl: 'https://vendorcity.net',
      logoUrl: 'https://vendorcity.net/VendorCity_Store.webp', // Added default
      supportEmail: 'support@vendorcity.com', // Added default
      supportPhone: '+639153392813', // Added default
      ...config
    };
  }

  // KEEP ALL YOUR EXISTING sendEmail, sendWithSendGrid, sendWithResend, sendWithNodemailer, sendToConsole methods EXACTLY AS THEY ARE
  // Don't change any of these methods - they're perfect as they are
  
  private async sendEmail(options: EmailOptions): Promise<boolean> {
    // KEEP THIS METHOD EXACTLY AS YOU HAD IT
    try {
      switch (this.config.service) {
        case 'nodemailer':
          return await this.sendWithNodemailer(options);
        default:
          return await this.sendWithNodemailer(options);
      }
    } catch (error) {
      console.error('Email sending failed:', error);
      return false;
    }
  }



  private async sendWithNodemailer(options: EmailOptions): Promise<boolean> {
    // KEEP THIS METHOD EXACTLY AS YOU HAD IT
    const nodemailer = await import('nodemailer');

    const User = options.from;
    const Password = process.env.YAHOO_APP_PASSWORD;

    if (!User || !Password) {
      throw new Error('Google SMTP credentials not found. Please set GMAIL_USER and GMAIL_APP_PASSWORD environment variables.');
    }

    const transporter = nodemailer.createTransport({
      host: 'smtp.mail.google.com',
      port: 465,
      secure: true,
      auth: {
        user: User,
        pass: Password,
      }
    });

    try {
      await transporter.verify();
      console.log("✅ GOOGLE SMTP connection verified successfully");
    } catch (error: any) {
      console.error("❌ GOOGLE SMTP connection failed:", error.message);
      
      if (error.code === 'EAUTH') {
        console.error("\n⚠️  AUTHENTICATION ERROR: You need to use a Google App Password.");
        console.error("1. Enable 2-Step Verification at: https://myaccount.google.com/security");
        console.error("2. Generate an 'App Password' for 'Mail'");
        console.error("3. Use that 16-character password as GMAIL_APP_PASSWORD");
        console.error(`4. password: ${Password}`);
        console.error(`5. user: ${User}`);
      }
      
      return false;
    }

    const mailOptions = {
      from: `"${this.config.appName}" <${User}>`,
      to: options.to,
      subject: options.subject,
      html: options.html,
      text: options.html.replace(/<[^>]*>/g, ''),
    };

    try {
      const info = await transporter.sendMail(mailOptions);
      console.log("✅ Email sent successfully:", {
        messageId: info.messageId,
        accepted: info.accepted,
        response: info.response
      });
      return true;
    } catch (error: any) {
      console.error("❌ Email sending failed:", {
        error: error.message,
        code: error.code,
        response: error.response
      });
      return false;
    }
  }
  
  

  // KEEP YOUR EXISTING sendPasswordResetEmail method EXACTLY AS IS
  public async sendPasswordResetEmail(
    email: string, 
    resetToken: string,
    expiryTime: string = '1 hour'
  ): Promise<boolean> {
    const resetLink = `${this.config.baseUrl}/reset-password?token=${resetToken}`;
    
    const htmlContent = generatePasswordResetEmail({
      userEmail: email,
      resetLink,
      expiryTime,
      appName: this.config.appName,
      logoUrl: this.config.logoUrl
    });

    const emailOptions: EmailOptions = {
      to: email,
      subject: `Reset Your Password - ${this.config.appName}`,
      html: htmlContent,
      from: this.config.fromEmail,
    };

    return await this.sendEmail(emailOptions);
  }

  // ==============================================
  // ADD THIS NEW METHOD FOR LOGISTICS CONTACT FORM
  // ==============================================
  public async sendLogisticsContactEmails(
    formData: ContactFormData,
    logisticsTeamEmail?: string
  ): Promise<ContactEmailResult> {
    // Generate a unique reference number
    const referenceNumber = `LOG-${Date.now().toString().slice(-8)}-${Math.random().toString(36).substr(2, 4).toUpperCase()}`;
    const submissionTime = new Date().toLocaleString();
    const teamEmail = logisticsTeamEmail || 'adivisojay@gmail.com';
    const errors: string[] = [];
     console.log(formData);
    if (!teamEmail) {
      throw new Error('Logistics team email is required. Set it in config or pass as parameter.');
    }

    // Generate team email HTML using the template
    const teamEmailHtml = generateLogisticsContactEmail({
      formData,
      referenceNumber,
      submissionTime,
      appName: this.config.appName,
      logoUrl: this.config.logoUrl
    });

    // Generate customer confirmation email HTML
    const customerEmailHtml = generateCustomerNotificationEmail({
      name: formData.name,
      referenceNumber,
      appName: this.config.appName,
      logoUrl: this.config.logoUrl,
      supportEmail: this.config.supportEmail,
      supportPhone: this.config.supportPhone
    });

    // Send email to logistics team
    let teamEmailSent = false;
    try {
      const teamEmailOptions: EmailOptions = {
        to: teamEmail,
        subject: `New Logistics Inquiry from ${formData.name} - ${referenceNumber}`,
        html: teamEmailHtml,
        from: this.config.fromEmail,
        replyTo: formData.email,
      };

      teamEmailSent = await this.sendEmail(teamEmailOptions);
      if (!teamEmailSent) {
        errors.push('Failed to send email to logistics team');
      }
    } catch (error: any) {
      errors.push(`Team email error: ${error.message}`);
    }

    // Send confirmation email to customer
    let customerEmailSent = false;
    try {
      const customerEmailOptions: EmailOptions = {
        to: formData.email,
        subject: `We've received your logistics inquiry - ${referenceNumber}`,
        html: customerEmailHtml,
        from: this.config.fromEmail,
      };

      customerEmailSent = await this.sendEmail(customerEmailOptions);
      if (!customerEmailSent) {
        errors.push('Failed to send confirmation email to customer');
      }
    } catch (error: any) {
      errors.push(`Customer email error: ${error.message}`);
    }

    return {
      success: teamEmailSent || customerEmailSent,
      referenceNumber,
      teamEmailSent,
      customerEmailSent,
      ...(errors.length > 0 && { errors })
    };
  }

  // ==============================================
  // ADD THIS OPTIONAL HELPER METHOD (if you need it)
  // ==============================================
  public async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const testEmail: EmailOptions = {
        to: 'test@example.com',
        subject: `Test Email - ${this.config.appName}`,
        html: `<p>This is a test email from ${this.config.appName}</p>`,
        from: this.config.fromEmail,
      };

  
      const result = await this.sendEmail(testEmail);
      
      return {
        success: result,
        message: result 
          ? 'Email service connection successful' 
          : 'Email service connection failed'
      };
    } catch (error: any) {
      return {
        success: false,
        message: `Connection test failed: ${error.message}`
      };
    }
  }
        }

import dotenv from 'dotenv';
import nodemailer from 'nodemailer';

// Load environment variables from .env file
dotenv.config();

// Define the transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: '54.95.240.249',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

interface MailOptions {
  to: string;
  subject: string;
  text: string;
  html: string;
}

export async function sendEmail(options: MailOptions): Promise<void> {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: options.to,
    subject: options.subject,
    text: options.text,
    html: options.html
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ', info.response);
  } catch (error) {
    console.error('Error occurred: ', error);
  }
}
import nodemailer from 'nodemailer';

export const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.mail.yahoo.com',
    port: 465,
    secure: true,
    auth: {
      user: process.env.YAHOO_EMAIL,
      pass: process.env.YAHOO_APP_PASSWORD,
    },
    tls: {
      rejectUnauthorized: false // For local development only
    }
  });
};

export const transporter = createTransporter();

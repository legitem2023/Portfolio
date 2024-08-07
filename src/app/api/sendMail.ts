// pages/api/sendMail.ts
import type { NextApiRequest, NextApiResponse } from 'next';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  host: 'smtp.example.com', // Replace with your SMTP server
  port: 587, // Replace with the appropriate port
  secure: false, // Set to true if you are using SSL/TTLS
  auth: {
    user: process.env.EMAIL_USER, // Replace with your email
    pass: process.env.EMAIL_PASS // Replace with your email password
  }
});

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'POST') {
    const { fullname, email, contactNo, details } = req.body;

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: 'digitaloutofhome2019@gmail.com',
      subject: 'From Portfolio Message',
      text: `Fullname: ${fullname}\nEmail: ${email}\nContact No.: ${contactNo}\nDetails: ${details}`,
      html: `
        <p>Fullname: ${fullname}</p>
        <p>Email: ${email}</p>
        <p>Contact No.: ${contactNo}</p>
        <p>Details: ${details}</p>
      `
    };

    try {
      await transporter.sendMail(mailOptions);
      res.status(200).json({ message: 'Email sent successfully!' });
    } catch (error) {
      console.error('Error occurred:', error);
      res.status(500).json({ error: 'Failed to send email.' });
    }
  } else {
    res.setHeader('Allow', ['POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

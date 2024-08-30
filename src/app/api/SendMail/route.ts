import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'yahoo',
  auth: {
    user: process.env.YAHOO_EMAIL_USER as string, // Yahoo email from .env.local
    pass: process.env.YAHOO_EMAIL_PASS as string, // Yahoo app password from .env.local
  },
});

interface EmailRequestBody {
  fullname: string;
  email: string;
  contactNo: string;
  details: string;
}

export async function POST(req: NextRequest) {
  try {
    const body: EmailRequestBody = await req.json();

    const mailOptions = {
      from: process.env.YAHOO_EMAIL_USER, // Yahoo email address used to send the email
      to: 'legitem2023@gmail.com', // Recipient email address
      subject: 'From Portfolio Message',
      text: `Fullname: ${body.fullname}\nEmail: ${body.email}\nContact No.: ${body.contactNo}\nDetails: ${body.details}`,
      html: `
        <p>Fullname: ${body.fullname}</p>
        <p>Email: ${body.email}</p>
        <p>Contact No.: ${body.contactNo}</p>
        <p>Details: ${body.details}</p>
      `,
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ message: 'Email sent successfully!' }, { status: 200 });
  } catch (error) {
    console.error('Error occurred:', error);
    return NextResponse.json({ error: 'Failed to send email.' }, { status: 500 });
  }
}

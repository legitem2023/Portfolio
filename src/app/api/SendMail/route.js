import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'yahoo',
  auth: {
    user: process.env.YAHOO_EMAIL_USER, // Replace with your Yahoo email in the .env file
    pass: process.env.YAHOO_EMAIL_PASS // Replace with your Yahoo email password in the .env file
  }
});

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const { fullname, email, contactNo, details } = req.body;
    const mailOptions = {
      from: process.env.YAHOO_EMAIL_USER, // Ensure this matches the Yahoo email used in the transporter
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
    transporter
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

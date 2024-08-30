import { Icon } from '@iconify/react/dist/iconify.js';
import Link from 'next/link';
import React, { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({
    fullname: '',
    email: '',
    contactNo: '',
    details: '',
    file: null as File | null
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFormData({
        ...formData,
        file: e.target.files[0]
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { fullname, email, contactNo, details } = formData;
    try {
      const response = await fetch('/api/SendMail/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fullname, email, contactNo, details })
      });

      if (response.ok) {
        alert('Email sent successfully!');
      } else {
        alert('Failed to send email.');
      }
    } catch (error) {
      console.error('Error sending email:', error);
      alert('Failed to send email.');
    }
  };

  return (
    <div className='Main_child' id='Contact'>
      <div className='center_body'>
        <div className='FullStack'>
          <Icon icon="ic:sharp-phone" /><code>Contact</code>
        </div>
        <div className='center_body_contact'>
          {/* <form onSubmit={handleSubmit}>
            <div>
              <input
                type='text'
                name='fullname'
                placeholder='Fullname'
                value={formData.fullname}
                onChange={handleChange}
              />
            </div>
            <div>
              <input
                type='text'
                name='email'
                placeholder='Email Address'
                value={formData.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <input
                type='text'
                name='contactNo'
                placeholder='Contact No.'
                value={formData.contactNo}
                onChange={handleChange}
              />
            </div>
            <div>
              <textarea
                name='details'
                placeholder='More Details'
                value={formData.details}
                onChange={handleChange}
              />
            </div>
            <div>
              <input
                type='file'
                onChange={handleFileChange}
              />
            </div>
            <br />
          </form> */}
            <div className='AlternativeContact'>
            <Link href="https://line.me/ti/p/RuxBmA_Q5X" target='_blank'><Icon icon="bi:line"/></Link>
            <Link href="https://m.me/robert.marquez.9404362" target='_blank'><Icon icon="bi:messenger"/></Link>
            <Link href="https://t.me/RobertMarquez" target='_blank'><Icon icon="bi:telegram" /></Link>
            </div>
          </div>

      </div>
    </div>
  );
};

export default Contact;

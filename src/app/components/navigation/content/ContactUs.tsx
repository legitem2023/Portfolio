// components/content/ContactUs.jsx
'use client';

import { useState } from 'react';

const ContactUs = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: ''
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    // You would typically send this data to your backend
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8 text-gold-400">Contact Us</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
            Full Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-black/20 backdrop-blur-md border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500 transition-all"
            placeholder="Enter your full name"
            required
          />
        </div>
        
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-2">
            Email Address
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-black/20 backdrop-blur-md border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500 transition-all"
            placeholder="Enter your email address"
            required
          />
        </div>
        
        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-300 mb-2">
            Message
          </label>
          <textarea
            id="message"
            name="message"
            rows="5"
            value={formData.message}
            onChange={handleChange}
            className="w-full px-4 py-3 bg-black/20 backdrop-blur-md border border-white/10 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gold-500 transition-all"
            placeholder="How can we help you?"
            required
          ></textarea>
        </div>
        
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-gold-500 to-gold-700 text-black font-bold py-3 px-4 rounded-lg hover:from-gold-600 hover:to-gold-800 transition-all transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-gold-500 focus:ring-opacity-50 shadow-lg shadow-gold-500/30"
        >
          Send Message
        </button>
      </form>
      
      <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="text-center p-4 bg-black/20 backdrop-blur-md rounded-lg border border-white/10">
          <div className="text-gold-400 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
          </div>
          <h3 className="font-semibold text-white">Phone Support</h3>
          <p className="text-gray-300">+1 (555) 123-4567</p>
        </div>
        
        <div className="text-center p-4 bg-black/20 backdrop-blur-md rounded-lg border border-white/10">
          <div className="text-gold-400 mb-2">
            <svg className="w-8 h-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="font-semibold text-white">Email Us</h3>
          <p className="text-gray-300">support@luxuryexample.com</p>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;

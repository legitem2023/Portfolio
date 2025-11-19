// pages/contact.tsx
"use client";
import { useState } from 'react';
import Head from 'next/head';
import Footer from '../components/Footer';
import Header from '../components/Header';

export default function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
    inquiryType: 'general'
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Handle form submission here
    console.log('Form submitted:', formData);
    alert('Thank you for your message! We will get back to you soon.');
    setFormData({
      name: '',
      email: '',
      subject: '',
      message: '',
      inquiryType: 'general'
    });
  };

  const contactMethods = [
    {
      icon: "📧",
      title: "Email Us",
      description: "Send us an email anytime",
      details: "hello@dvn.com",
      link: "mailto:hello@dvn.com"
    },
    {
      icon: "💬",
      title: "Live Chat",
      description: "Mon-Fri from 9am to 5pm EST",
      details: "Start chat",
      link: "#chat"
    },
    {
      icon: "📱",
      title: "Social Media",
      description: "Follow us for updates",
      details: "@dvn_official",
      link: "#social"
    },
    {
      icon: "🏢",
      title: "Office",
      description: "Come say hello at our office",
      details: "123 Innovation Drive, Tech City",
      link: "#map"
    }
  ];

  return (
    <>
      <Head>
        <title>Contact Us - DVN | Get In Touch</title>
        <meta name="description" content="Contact DVN team for partnerships, inquiries, or support. We would love to hear from you." />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-violet-50">
        <Header />
        
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-12 md:py-16 px-4">
          <div className="container mx-auto max-w-6xl text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">Get In Touch</h1>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Have questions about our 2026 launch? Interested in partnerships? We would love to hear from you.
            </p>
          </div>
        </section>

        <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-12">
          <div className="grid lg:grid-cols-2 gap-12">
            {/* Contact Information */}
            <div>
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Let us start a conversation</h2>
              <p className="text-gray-600 mb-8 leading-relaxed">
                We are building something special for 2026 and we would love to connect with 
                potential partners, early adopters, and anyone excited about the future of e-commerce.
              </p>
              
              <div className="grid sm:grid-cols-2 gap-6 mb-8">
                {contactMethods.map((method, index) => (
                  <div key={index} className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="text-2xl mb-3">{method.icon}</div>
                    <h3 className="font-bold text-lg text-gray-900 mb-2">{method.title}</h3>
                    <p className="text-gray-600 text-sm mb-2">{method.description}</p>
                    <a 
                      href={method.link} 
                      className="text-indigo-600 font-semibold hover:text-indigo-700 transition-colors"
                    >
                      {method.details}
                    </a>
                  </div>
                ))}
              </div>

              {/* Additional Info */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-6">
                <h3 className="font-bold text-lg text-indigo-700 mb-3">Response Time</h3>
                <p className="text-indigo-800 mb-2">
                  We typically respond to all inquiries within 24-48 hours during business days.
                </p>
                <p className="text-indigo-800 text-sm">
                  For partnership inquiries, please allow additional time as we carefully review each opportunity.
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-6">Send us a message</h2>
              
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                      Full Name *
                    </label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="Your full name"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                      placeholder="your.email@example.com"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="inquiryType" className="block text-sm font-medium text-gray-700 mb-2">
                    Inquiry Type *
                  </label>
                  <select
                    id="inquiryType"
                    name="inquiryType"
                    value={formData.inquiryType}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                  >
                    <option value="general">General Inquiry</option>
                    <option value="partnership">Partnership Opportunity</option>
                    <option value="press">Press & Media</option>
                    <option value="careers">Careers</option>
                    <option value="technical">Technical Question</option>
                  </select>
                </div>

                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                    Subject *
                  </label>
                  <input
                    type="text"
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors"
                    placeholder="Brief subject of your message"
                  />
                </div>

                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                    Message *
                  </label>
                  <textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    required
                    rows={6}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors resize-vertical"
                    placeholder="Tell us more about your inquiry..."
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-indigo-600 text-white py-3 px-6 rounded-lg font-semibold hover:bg-indigo-700 transition-colors focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                >
                  Send Message
                </button>
                
                <p className="text-gray-500 text-sm text-center">
                  By submitting this form, you agree to our privacy policy and terms of service.
                </p>
              </form>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    </>
  );
              }

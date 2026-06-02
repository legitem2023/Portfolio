// pages/faq.tsx
"use client";
import { useState } from 'react';
import Head from 'next/head';
import Footer from '../components/Footer';
import Header from '../components/Header';

export default function FAQ() {
  const [openItems, setOpenItems] = useState<number[]>([]);

  const toggleItem = (index: number) => {
    setOpenItems(prev =>
      prev.includes(index)
        ? prev.filter(item => item !== index)
        : [...prev, index]
    );
  };

  const faqCategories = [
    {
      title: "General Information",
      questions: [
        {
          question: "What is VendorCity?",
          answer: "VendorCity is a delivery service platform that connects customers with local vendors for fast, reliable food and product delivery. Think of us as your go-to app for getting what you need, when you need it."
        },
        {
          question: "Where is VendorCity available?",
          answer: "We are launching in major cities starting Q3 2026. Join our waitlist to be notified when we launch in your area!"
        },
        {
          question: "How do I download the VendorCity app?",
          answer: "The VendorCity app will be available on both iOS App Store and Google Play Store at launch. Join our waitlist to get a download link as soon as we go live!"
        }
      ]
    },
    {
      title: "Ordering & Delivery",
      questions: [
        {
          question: "How does delivery work?",
          answer: "Simply browse local vendors, place your order through the app, and our delivery partners will pick up and deliver your items right to your doorstep. You can track your delivery in real-time!"
        },
        {
          question: "How long does delivery take?",
          answer: "Delivery times vary by vendor and distance, but most deliveries are completed within 30-45 minutes. You'll see an estimated delivery time before you place your order."
        },
        {
          question: "What is the delivery fee?",
          answer: "Delivery fees vary based on distance and demand. Some vendors offer free delivery over a certain order amount. The exact fee will be shown before you confirm your order."
        },
        {
          question: "Can I schedule deliveries in advance?",
          answer: "Yes! VendorCity allows you to schedule orders up to 7 days in advance. Perfect for planning lunches, events, or regular deliveries."
        }
      ]
    },
    {
      title: "Payment & Pricing",
      questions: [
        {
          question: "What payment methods do you accept?",
          answer: "We accept all major credit cards, debit cards, digital wallets (Apple Pay, Google Pay), and cash on delivery (in select locations)."
        },
        {
          question: "Are there any hidden fees?",
          answer: "No hidden fees! You'll see the complete breakdown including delivery fee, service fee, and taxes before confirming your order. What you see is what you pay."
        },
        {
          question: "Can I use coupons or promo codes?",
          answer: "Absolutely! Enter your promo code at checkout to apply discounts. First-time users get special welcome offers, and we regularly run promotions for our customers."
        }
      ]
    },
    {
      title: "For Vendors & Partners",
      questions: [
        {
          question: "How can my restaurant or store join VendorCity?",
          answer: "We're actively onboarding local vendors! Visit our Partnerships page or contact our vendor relations team to learn about commission rates, requirements, and how we can help grow your business."
        },
        {
          question: "What are the benefits of partnering with VendorCity?",
          answer: "Vendors get access to our growing customer base, dedicated delivery support, real-time analytics dashboard, promotional tools, and competitive commission rates."
        },
        {
          question: "Is there a contract or commitment period?",
          answer: "No long-term contracts! We believe in earning your business every day. You can pause or end your partnership at any time."
        }
      ]
    },
    {
      title: "Support & Policies",
      questions: [
        {
          question: "What if my order is wrong or missing items?",
          answer: "We've got you covered! Contact our support team through the app within 24 hours, and we'll make it right with refunds or credits for missing or incorrect items."
        },
        {
          question: "Can I cancel my order?",
          answer: "You can cancel an order for free within 2 minutes of placing it. After that, if the vendor hasn't started preparing, a small cancellation fee may apply. Once food is being prepared, cancellations may not be possible."
        },
        {
          question: "How do I contact customer support?",
          answer: "Our support team is available 7 days a week via in-app chat, email at support@vendorcity.com, or phone at 1-800-VENDORCITY."
        },
        {
          question: "What if my delivery is late?",
          answer: "While we strive for on-time delivery, delays can happen. If your order is significantly late, contact support and we'll provide compensation credits for the inconvenience."
        }
      ]
    },
    {
      title: "Early Access & Waitlist",
      questions: [
        {
          question: "What benefits do early access users get?",
          answer: "Early access users receive exclusive launch discounts, free delivery on first 5 orders, priority support, and special rewards for providing feedback."
        },
        {
          question: "Is there a cost to join the waitlist?",
          answer: "No, joining our waitlist is completely free! You'll receive updates and early access opportunities without any charges."
        },
        {
          question: "When will VendorCity launch?",
          answer: "We're scheduled to launch in Q3 2026. Waitlist members will get early access and be the first to know when we go live in their city!"
        }
      ]
    }
  ];

  return (
    <>
      <Head>
        <title>FAQ - VendorCity | Delivery Service Questions Answered</title>
        <meta name="description" content="Find answers to common questions about VendorCity delivery platform. Learn about ordering, delivery times, payments, and how to become a vendor partner." />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-b from-orange-50 to-red-50">
        <Header />
        
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-orange-600 to-red-600 text-white py-12 md:py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Everything you need to know about ordering, delivering, and partnering with VendorCity
            </p>
          </div>
        </section>

        {/* FAQ Content */}
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-12">
          {faqCategories.map((category, categoryIndex) => (
            <div key={categoryIndex} className="mb-12 last:mb-0">
              <h2 className="text-2xl font-bold text-gray-900 mb-6 pb-2 border-b border-gray-200">
                {category.title}
              </h2>
              <div className="space-y-4">
                {category.questions.map((item, itemIndex) => {
                  const globalIndex = categoryIndex * 10 + itemIndex;
                  const isOpen = openItems.includes(globalIndex);
                  
                  return (
                    <div key={globalIndex} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                      <button
                        className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                        onClick={() => toggleItem(globalIndex)}
                      >
                        <span className="font-semibold text-gray-900 pr-4">{item.question}</span>
                        <svg
                          className={`w-5 h-5 text-orange-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {isOpen && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                          <p className="text-gray-700 leading-relaxed">{item.answer}</p>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* CTA Section */}
        <section className="bg-white border-t border-gray-200">
          <div className="container mx-auto max-w-4xl px-4 py-12 text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Still have questions?</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Can&apos;t find the answer you&apos;re looking for? Our support team is here to help!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="/contact" className="bg-orange-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-orange-700 transition-colors inline-block">
                Contact Support
              </a>
              <a href="/waitlist" className="border border-orange-600 text-orange-600 px-8 py-3 rounded-lg font-semibold hover:bg-orange-50 transition-colors inline-block">
                Join Waitlist
              </a>
            </div>
          </div>
        </section>
        
        <Footer />
      </div>
    </>
  );
}

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
          question: "When will DVN officially launch?",
          answer: "DVN is scheduled to launch in Q3 2026. We are currently in the development phase and will have a beta release in Q1 2026 for early access users."
        },
        {
          question: "What makes DVN different from other e-commerce platforms?",
          answer: "DVN integrates cutting-edge technologies like AI-powered recommendations, augmented reality try-ons, blockchain security, and sustainable practices from day one. We are building a complete ecosystem, not just a shopping platform."
        },
        {
          question: "How can I stay updated on your progress?",
          answer: "Join our waitlist to receive regular updates, behind-the-scenes insights, and exclusive early access opportunities as we approach our launch date."
        }
      ]
    },
    {
      title: "Technology & Features",
      questions: [
        {
          question: "What is AI-powered shopping?",
          answer: "Our AI system learns your preferences and shopping habits to provide personalized product recommendations, size predictions, and style suggestions tailored specifically to you."
        },
        {
          question: "How does the virtual try-on feature work?",
          answer: "Using augmented reality technology, you can visualize products like clothing, accessories, and home decor in your actual space or on yourself through your device camera, helping you make better purchasing decisions."
        },
        {
          question: "What blockchain technology will you use?",
          answer: "We will implement blockchain for secure transactions, transparent supply chain tracking, and authentic product verification to ensure complete trust and security for our customers."
        }
      ]
    },
    {
      title: "Sustainability & Ethics",
      questions: [
        {
          question: "What are your sustainability commitments?",
          answer: "We are committed to 100% carbon-neutral shipping by 2027, plastic-free biodegradable packaging, ethical sourcing partnerships, and complete supply chain transparency."
        },
        {
          question: "How will you ensure ethical practices?",
          answer: "We will partner with certified fair-trade organizations, conduct regular supplier audits, and provide complete transparency about product origins and manufacturing conditions."
        },
        {
          question: "Will you feature sustainable brands?",
          answer: "Yes, we are curating a selection of brands that meet our strict sustainability and ethical standards, making it easy for customers to make environmentally conscious choices."
        }
      ]
    },
    {
      title: "Partnerships & Early Access",
      questions: [
        {
          question: "How can brands partner with DVN?",
          answer: "We are actively seeking innovative brands that align with our values. Interested brands can contact our partnership team through the contact form with details about their products and sustainability practices."
        },
        {
          question: "What benefits do early access users get?",
          answer: "Early access users will get first look at new features, exclusive launch discounts, direct input on platform development, and special rewards for providing feedback."
        },
        {
          question: "Is there a cost to join the waitlist?",
          answer: "No, joining our waitlist is completely free. You will receive updates and early access opportunities without any charges."
        }
      ]
    }
  ];

  return (
    <>
      <Head>
        <title>FAQ - DVN | Frequently Asked Questions</title>
        <meta name="description" content="Find answers to common questions about DVN e-commerce platform launching in 2026" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-violet-50">
        <Header />
        
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-12 md:py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">Frequently Asked Questions</h1>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Everything you need to know about DVN and our upcoming 2026 launch
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
                          className={`w-5 h-5 text-indigo-600 transition-transform ${isOpen ? 'rotate-180' : ''}`}
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
              Can not find the answer you are looking for? Please reach out to our friendly team.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                Contact Us
              </button>
              <button className="border border-indigo-600 text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors">
                Join Waitlist
              </button>
            </div>
          </div>
        </section>
        
        <Footer />
      </div>
    </>
  );
                      }

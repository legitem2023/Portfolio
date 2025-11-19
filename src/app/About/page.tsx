// pages/about.tsx
"use client";
import { useState } from 'react';
import Head from 'next/head';
import Footer from '../components/Footer';
import Header from '../components/Header';

export default function About() {
  const [activeTab, setActiveTab] = useState('vision');

  const features = [
    {
      icon: "🚀",
      title: "AI-Powered Shopping",
      description: "Intelligent product recommendations and personalized shopping experiences"
    },
    {
      icon: "🌱",
      title: "Sustainable Commerce",
      description: "Eco-friendly packaging and carbon-neutral delivery options"
    },
    {
      icon: "🔒",
      title: "Blockchain Security",
      description: "Advanced security and transparent supply chain tracking"
    },
    {
      icon: "👗",
      title: "Virtual Try-On",
      description: "AR technology to try products before you buy"
    }
  ];

  const timeline = [
    {
      year: "2024",
      event: "Concept Development",
      status: "completed"
    },
    {
      year: "2025",
      event: "Platform Development",
      status: "current"
    },
    {
      year: "2026 Q1",
      event: "Beta Launch",
      status: "upcoming"
    },
    {
      year: "2026 Q3",
      event: "Full Launch",
      status: "upcoming"
    }
  ];

  return (
    <>
      <Head>
        <title>About Us - DVN | The Future of E-Commerce</title>
        <meta name="description" content="Discover DVN - The next-generation e-commerce platform launching in 2026 with AI, AR, and sustainable shopping experiences" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-violet-50">
        <Header />
        
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-12 md:py-20 px-4">
          <div className="container mx-auto max-w-6xl text-center">
            <div className="inline-block bg-yellow-500 text-indigo-900 px-4 py-2 rounded-full text-sm font-bold mb-4">
              Launching 2026
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 md:mb-6">Redefining E-Commerce</h1>
            <p className="text-lg md:text-xl opacity-90 max-w-2xl mx-auto">
              DVN is building the future of online shopping with cutting-edge technology, 
              sustainable practices, and unparalleled customer experiences.
            </p>
          </div>
        </section>

        {/* Main Content */}
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-12 md:py-16">
          {/* Tabs Section */}
          <div className="max-w-4xl mx-auto mb-12 md:mb-16">
            <div className="flex border-b border-gray-200 mb-6 md:mb-8 overflow-x-auto">
              {['vision', 'technology', 'sustainability'].map((tab) => (
                <button
                  key={tab}
                  className={`flex-shrink-0 py-3 px-4 sm:px-6 font-semibold border-b-2 transition-colors text-sm sm:text-base ${
                    activeTab === tab
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700'
                  }`}
                  onClick={() => setActiveTab(tab)}
                >
                  {tab.charAt(0).toUpperCase() + tab.slice(1)}
                </button>
              ))}
            </div>

            <div className="text-base sm:text-lg text-gray-700 leading-relaxed">
              {activeTab === 'vision' && (
                <div className="space-y-4 sm:space-y-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Our Vision for 2026</h3>
                  <p>
                    We are creating more than just another e-commerce platform. DVN will be a complete 
                    ecosystem that blends artificial intelligence, augmented reality, and sustainable 
                    practices to deliver shopping experiences unlike anything available today.
                  </p>
                  <p>
                    Imagine trying on clothes virtually with perfect fit prediction, receiving AI-curated 
                    style recommendations, and knowing every purchase supports ethical and sustainable practices.
                  </p>
                  <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 sm:p-6 mt-6">
                    <h4 className="font-bold text-lg text-indigo-700 mb-2">Join Our Journey</h4>
                    <p className="text-indigo-800">
                      Be among the first to experience the future of e-commerce. Sign up for early access 
                      and product updates as we build toward our 2026 launch.
                    </p>
                  </div>
                </div>
              )}

              {activeTab === 'technology' && (
                <div className="space-y-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Next-Gen Technology</h3>
                  <p>
                    DVN is being built from the ground up with the most advanced technologies 
                    to create seamless, intuitive, and personalized shopping experiences.
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mt-6 md:mt-8">
                    {features.map((feature, index) => (
                      <div key={index} className="bg-white p-4 sm:p-6 rounded-lg shadow-sm border border-gray-100">
                        <div className="text-2xl mb-3">{feature.icon}</div>
                        <h4 className="font-bold text-lg text-gray-900 mb-2">{feature.title}</h4>
                        <p className="text-gray-600 text-sm sm:text-base">{feature.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'sustainability' && (
                <div className="space-y-6">
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Sustainable Commerce</h3>
                  <p>
                    We believe the future of e-commerce must be environmentally responsible. 
                    That is why we are committing to carbon-neutral operations, eco-friendly packaging, 
                    and partnerships with sustainable brands from day one.
                  </p>
                  <div className="bg-green-50 border border-green-100 rounded-lg p-4 sm:p-6">
                    <h4 className="font-bold text-lg text-green-700 mb-2">Our Commitments</h4>
                    <ul className="list-disc list-inside space-y-2 text-green-800">
                      <li>100% carbon-neutral shipping by 2027</li>
                      <li>Plastic-free, biodegradable packaging</li>
                      <li>Ethical sourcing and fair trade partnerships</li>
                      <li>Transparent supply chain tracking</li>
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Timeline Section */}
          <section className="max-w-4xl mx-auto mb-12 md:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-center text-gray-900 mb-8 sm:mb-12">Our Journey to Launch</h2>
            <div className="relative">
              {/* Timeline line - hidden on mobile, visible on medium+ */}
              <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 h-full w-1 bg-indigo-200"></div>
              
              {timeline.map((item, index) => (
                <div key={index} className="relative flex flex-col md:flex-row items-start md:items-center mb-6 md:mb-8 last:mb-0">
                  {/* Mobile timeline dot */}
                  <div className="md:hidden absolute left-4 top-6 w-3 h-3 rounded-full bg-indigo-500 border-4 border-white z-10"></div>
                  
                  {/* Desktop timeline dot */}
                  <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2 w-3 h-3 rounded-full bg-indigo-500 border-4 border-white z-10"></div>
                  
                  {/* Content */}
                  <div className={`w-full md:w-1/2 ${index % 2 === 0 ? 'md:pr-8 md:text-right' : 'md:pl-8'}`}>
                    <div className={`bg-white p-4 sm:p-6 rounded-lg shadow-sm border ml-8 md:ml-0 ${
                      item.status === 'completed' ? 'border-green-200' :
                      item.status === 'current' ? 'border-indigo-300' : 'border-gray-200'
                    }`}>
                      <div className={`inline-block px-3 py-1 rounded-full text-xs font-bold mb-2 ${
                        item.status === 'completed' ? 'bg-green-100 text-green-800' :
                        item.status === 'current' ? 'bg-indigo-100 text-indigo-800' : 'bg-gray-100 text-gray-800'
                      }`}>
                        {item.status.charAt(0).toUpperCase() + item.status.slice(1)}
                      </div>
                      <h3 className="font-bold text-lg text-gray-900">{item.year}</h3>
                      <p className="text-gray-600">{item.event}</p>
                    </div>
                  </div>
                  
                  {/* Spacer for alternating layout on desktop */}
                  <div className={`hidden md:block w-1/2 ${index % 2 === 0 ? 'md:pl-8' : 'md:pr-8'}`}></div>
                </div>
              ))}
            </div>
          </section>

          {/* CTA Section */}
          <section className="max-w-2xl mx-auto text-center bg-white rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg border border-indigo-100">
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-4">Be Part of the Future</h2>
            <p className="text-gray-600 mb-6 text-sm sm:text-base">
              Join our waiting list to get early access, exclusive updates, and special 
              launch offers for our 2026 debut.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center">
              <button className="bg-indigo-600 text-white px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors text-sm sm:text-base">
                Join Waitlist
              </button>
              <button className="border border-indigo-600 text-indigo-600 px-6 sm:px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors text-sm sm:text-base">
                Learn More
              </button>
            </div>
          </section>
        </div>
        
        <Footer />
      </div>
    </>
  );
}

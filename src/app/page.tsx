'use client';

import { useState } from 'react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Navigation, Pagination, Autoplay } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/navigation';
import 'swiper/css/pagination';

export default function LuxuryNavigation() {
  const [activeTab, setActiveTab] = useState(0);
  
  const tabs = [
    { id: 'faq', label: 'FAQ' },
    { id: 'contact', label: 'Contact Us' },
    { id: 'terms', label: 'Terms of Service' },
    { id: 'privacy', label: 'Privacy Policy' }
  ];

  const tabContent = [
    {
      id: 'faq',
      title: 'Frequently Asked Questions',
      content: `Explore our comprehensive FAQ section to find answers to common questions about our luxury services and offerings.`,
      items: [
        {
          question: 'What makes your service luxurious?',
          answer: 'Our service features premium materials, exceptional craftsmanship, and personalized attention to detail.'
        },
        {
          question: 'How do I customize my experience?',
          answer: 'You can work with our dedicated consultants to tailor every aspect of your experience.'
        },
        {
          question: 'What payment methods do you accept?',
          answer: 'We accept all major credit cards, wire transfers, and luxury payment options.'
        }
      ]
    },
    {
      id: 'contact',
      title: 'Contact Our Luxury Team',
      content: `Reach out to our dedicated team of luxury consultants who are available to assist you with any inquiries.`,
      methods: [
        {
          type: 'Phone',
          details: '+1 (888) LUXURY-0',
          availability: '24/7 Concierge Service'
        },
        {
          type: 'Email',
          details: 'concierge@luxuryexample.com',
          availability: 'Response within 2 hours'
        },
        {
          type: 'Private Appointment',
          details: 'Book a private consultation at our flagship store',
          availability: 'By appointment only'
        }
      ]
    },
    {
      id: 'terms',
      title: 'Terms of Service',
      content: `Our terms and conditions outline the exceptional standards we maintain in providing our luxury services.`,
      sections: [
        {
          heading: 'Premium Services',
          content: 'We commit to delivering services of the highest quality and standards.'
        },
        {
          heading: 'Client Responsibilities',
          content: 'Clients are expected to provide accurate information for personalized services.'
        },
        {
          heading: 'Modification of Terms',
          content: 'We reserve the right to update these terms to reflect our evolving luxury standards.'
        }
      ]
    },
    {
      id: 'privacy',
      title: 'Privacy Policy',
      content: `We maintain the highest standards of privacy and discretion for our esteemed clients.`,
      commitments: [
        {
          aspect: 'Data Collection',
          description: 'We collect only essential information to provide our luxury services.'
        },
        {
          aspect: 'Confidentiality',
          description: 'Your information is handled with utmost discretion and security.'
        },
        {
          aspect: 'Third-Party Sharing',
          description: 'We never share your data with third parties without explicit consent.'
        }
      ]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-purple-900 text-white">
      {/* Navigation Header */}
      <nav className="sticky top-0 z-50 bg-black/80 backdrop-blur-md border-b border-purple-500/30">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center py-4">
            <div className="text-2xl font-serif font-light tracking-wider">
              Luxury<span className="text-purple-400">Brand</span>
            </div>
            
            {/* Desktop Tabs */}
            <div className="hidden md:flex space-x-8">
              {tabs.map((tab, index) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(index)}
                  className={`py-2 px-4 rounded-lg transition-all duration-300 ${
                    activeTab === index
                      ? 'bg-purple-600/20 text-purple-300 border border-purple-500/50'
                      : 'text-gray-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Mobile Menu Button */}
            <button className="md:hidden p-2">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Mobile Tabs */}
          <div className="md:hidden pb-4">
            <Swiper
              slidesPerView={3}
              spaceBetween={10}
              className="mobile-tabs-swiper"
            >
              {tabs.map((tab, index) => (
                <SwiperSlide key={tab.id}>
                  <button
                    onClick={() => setActiveTab(index)}
                    className={`w-full py-2 px-3 text-sm rounded-lg transition-all ${
                      activeTab === index
                        ? 'bg-purple-600 text-white'
                        : 'bg-gray-800 text-gray-300'
                    }`}
                  >
                    {tab.label}
                  </button>
                </SwiperSlide>
              ))}
            </Swiper>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Content Swiper */}
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={50}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          onSlideChange={(swiper) => setActiveTab(swiper.activeIndex)}
          initialSlide={activeTab}
          className="luxury-swiper"
        >
          {tabContent.map((content, index) => (
            <SwiperSlide key={content.id}>
              <div className="bg-gradient-to-br from-gray-800/50 to-purple-900/30 rounded-3xl p-8 backdrop-blur-md border border-purple-500/20">
                <h2 className="text-4xl font-serif font-light mb-6 text-purple-200">
                  {content.title}
                </h2>
                
                <p className="text-xl text-gray-300 mb-8 leading-relaxed">
                  {content.content}
                </p>

                {/* FAQ Content */}
                {content.id === 'faq' && (
                  <div className="space-y-6">
                    {content.items?.map((item, i) => (
                      <div key={i} className="bg-black/30 p-6 rounded-xl border border-purple-500/10">
                        <h3 className="text-xl text-purple-300 mb-3 font-semibold">
                          {item.question}
                        </h3>
                        <p className="text-gray-300">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Contact Content */}
                {content.id === 'contact' && (
                  <div className="grid md:grid-cols-2 gap-6">
                    {content.methods?.map((method, i) => (
                      <div key={i} className="bg-black/30 p-6 rounded-xl border border-purple-500/10">
                        <h3 className="text-xl text-purple-300 mb-2">{method.type}</h3>
                        <p className="text-lg text-white mb-2">{method.details}</p>
                        <p className="text-gray-400">{method.availability}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Terms Content */}
                {content.id === 'terms' && (
                  <div className="space-y-6">
                    {content.sections?.map((section, i) => (
                      <div key={i} className="bg-black/30 p-6 rounded-xl border border-purple-500/10">
                        <h3 className="text-xl text-purple-300 mb-3">{section.heading}</h3>
                        <p className="text-gray-300">{section.content}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Privacy Content */}
                {content.id === 'privacy' && (
                  <div className="space-y-6">
                    {content.commitments?.map((commitment, i) => (
                      <div key={i} className="bg-black/30 p-6 rounded-xl border border-purple-500/10">
                        <h3 className="text-xl text-purple-300 mb-3">{commitment.aspect}</h3>
                        <p className="text-gray-300">{commitment.description}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </SwiperSlide>
          ))}
        </Swiper>
      </main>

      {/* Additional Luxury Elements */}
      <style jsx global>{`
        .luxury-swiper {
          border-radius: 2rem;
          overflow: hidden;
          box-shadow: 0 25px 50px -12px rgba(147, 51, 234, 0.25);
        }
        
        .luxury-swiper .swiper-button-next,
        .luxury-swiper .swiper-button-prev {
          color: rgba(192, 132, 252, 0.8);
          background: rgba(0, 0, 0, 0.3);
          padding: 1.5rem;
          border-radius: 50%;
          backdrop-filter: blur(10px);
          border: 1px solid rgba(192, 132, 252, 0.2);
        }
        
        .luxury-swiper .swiper-pagination-bullet {
          background: rgba(192, 132, 252, 0.6);
          opacity: 0.6;
          width: 12px;
          height: 12px;
        }
        
        .luxury-swiper .swiper-pagination-bullet-active {
          background: rgba(192, 132, 252, 1);
          opacity: 1;
        }
        
        .mobile-tabs-swiper {
          padding: 0.5rem 0;
        }
        
        @media (max-width: 768px) {
          .luxury-swiper .swiper-button-next,
          .luxury-swiper .swiper-button-prev {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

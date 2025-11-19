// pages/shipping-returns.tsx
"use client";
import { useState } from 'react';
import Head from 'next/head';
import Footer from '../components/Footer';
import Header from '../components/Header';

export default function ShippingReturns() {
  const [activeTab, setActiveTab] = useState('shipping');

  const shippingOptions = [
    {
      name: "Standard Shipping",
      price: "Free",
      delivery: "5-7 business days",
      description: "Our eco-friendly standard shipping option",
      features: ["Carbon-neutral delivery", "Plastic-free packaging", "Tracking included"]
    },
    {
      name: "Express Shipping",
      price: "$9.99",
      delivery: "2-3 business days",
      description: "Faster delivery for urgent orders",
      features: ["Priority processing", "Real-time tracking", "Carbon offset included"]
    },
    {
      name: "Next Day Delivery",
      price: "$19.99",
      delivery: "1 business day",
      description: "Get your order the next business day",
      features: ["Order by 2pm local time", "Direct signature required", "Premium handling"]
    }
  ];

  const returnReasons = [
    {
      reason: "Wrong Size/Fit",
      policy: "Free returns within 30 days",
      notes: "We recommend using our virtual try-on feature for better fit accuracy"
    },
    {
      reason: "Changed Mind",
      policy: "Free returns within 14 days",
      notes: "Item must be unused with original tags attached"
    },
    {
      reason: "Defective/Damaged",
      policy: "Free immediate replacement",
      notes: "Contact us within 7 days of delivery for fastest resolution"
    },
    {
      reason: "Wrong Item Received",
      policy: "Free exchange & return shipping",
      notes: "We will expedite the correct item immediately"
    }
  ];

  const coverageAreas = [
    {
      region: "United States",
      status: "Available",
      shipping: "All 50 states",
      notes: "Free standard shipping on orders over $50"
    },
    {
      region: "Canada",
      status: "Available",
      shipping: "Major cities",
      notes: "Additional customs fees may apply"
    },
    {
      region: "European Union",
      status: "Coming 2026",
      shipping: "Select countries",
      notes: "Launching with platform release"
    },
    {
      region: "Australia & NZ",
      status: "Coming 2027",
      shipping: "Major metropolitan areas",
      notes: "Expansion planned for phase 2"
    }
  ];

  return (
    <>
      <Head>
        <title>Shipping & Returns - DVN | Delivery Policies</title>
        <meta name="description" content="Learn about DVN shipping options, delivery times, and return policies for our 2026 e-commerce platform" />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-violet-50">
        <Header />
        
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-12 md:py-16 px-4">
          <div className="container mx-auto max-w-6xl text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">Shipping & Returns</h1>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Transparent shipping options and hassle-free return policies designed with you in mind
            </p>
          </div>
        </section>

        {/* Main Content */}
        <div className="container mx-auto max-w-6xl px-4 sm:px-6 py-12">
          {/* Tabs Navigation */}
          <div className="flex border-b border-gray-200 mb-8 overflow-x-auto">
            {['shipping', 'returns', 'coverage'].map((tab) => (
              <button
                key={tab}
                className={`flex-shrink-0 py-4 px-6 font-semibold border-b-2 transition-colors text-sm sm:text-base ${
                  activeTab === tab
                    ? 'border-indigo-600 text-indigo-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'shipping' && 'Shipping Options'}
                {tab === 'returns' && 'Returns & Exchanges'}
                {tab === 'coverage' && 'Coverage Areas'}
              </button>
            ))}
          </div>

          {/* Shipping Options */}
          {activeTab === 'shipping' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Delivery Options</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  Choose the shipping method that works best for you. All options include our sustainable packaging and carbon-neutral delivery commitment.
                </p>
              </div>

              <div className="grid md:grid-cols-3 gap-6 mb-8">
                {shippingOptions.map((option, index) => (
                  <div key={index} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="text-center mb-4">
                      <h3 className="text-xl font-bold text-gray-900 mb-2">{option.name}</h3>
                      <div className="text-2xl font-bold text-indigo-600 mb-1">{option.price}</div>
                      <div className="text-sm text-gray-500">{option.delivery}</div>
                    </div>
                    <p className="text-gray-600 text-center mb-4">{option.description}</p>
                    <ul className="space-y-2">
                      {option.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-center text-sm text-gray-600">
                          <svg className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>

              {/* Shipping Information */}
              <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-blue-50 border border-blue-100 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-blue-900 mb-3">Sustainable Shipping</h3>
                  <ul className="space-y-2 text-blue-800">
                    <li>• All packaging is 100% plastic-free and biodegradable</li>
                    <li>• Carbon emissions are offset for every delivery</li>
                    <li>• Partners with eco-friendly logistics providers</li>
                    <li>• Minimal packaging design to reduce waste</li>
                  </ul>
                </div>

                <div className="bg-green-50 border border-green-100 rounded-lg p-6">
                  <h3 className="text-lg font-bold text-green-900 mb-3">Order Processing</h3>
                  <ul className="space-y-2 text-green-800">
                    <li>• Orders processed within 24-48 hours</li>
                    <li>• Weekend orders processed Monday</li>
                    <li>• Real-time tracking provided for all orders</li>
                    <li>• Delivery exceptions notified promptly</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Returns & Exchanges */}
          {activeTab === 'returns' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Hassle-Free Returns</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  We want you to love your purchase. If you are not completely satisfied, our return process is simple and straightforward.
                </p>
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Return Policy Overview</h3>
                <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div className="p-4 bg-indigo-50 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600 mb-1">30</div>
                    <div className="text-sm text-gray-600">Days for Returns</div>
                  </div>
                  <div className="p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600 mb-1">Free</div>
                    <div className="text-sm text-gray-600">Return Shipping</div>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600 mb-1">14</div>
                    <div className="text-sm text-gray-600">Days for Exchanges</div>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-lg">
                    <div className="text-2xl font-bold text-purple-600 mb-1">24h</div>
                    <div className="text-sm text-gray-600">Refund Processing</div>
                  </div>
                </div>
              </div>

              <div className="grid gap-6 mb-8">
                {returnReasons.map((item, index) => (
                  <div key={index} className="bg-white rounded-lg border border-gray-200 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                      <h4 className="text-lg font-semibold text-gray-900 mb-2 sm:mb-0">{item.reason}</h4>
                      <span className="inline-block bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
                        {item.policy}
                      </span>
                    </div>
                    <p className="text-gray-600">{item.notes}</p>
                  </div>
                ))}
              </div>

              {/* Return Process */}
              <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                <h3 className="text-xl font-bold text-gray-900 mb-4">How to Return an Item</h3>
                <div className="grid md:grid-cols-4 gap-4">
                  {[
                    { step: "1", title: "Start Return", description: "Initiate return in your account" },
                    { step: "2", title: "Print Label", description: "Download & print free shipping label" },
                    { step: "3", title: "Pack Item", description: "Include original packaging and tags" },
                    { step: "4", title: "Drop Off", description: "Drop at any authorized shipping location" }
                  ].map((step, index) => (
                    <div key={index} className="text-center">
                      <div className="w-12 h-12 bg-indigo-600 text-white rounded-full flex items-center justify-center font-bold text-lg mx-auto mb-3">
                        {step.step}
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-1">{step.title}</h4>
                      <p className="text-sm text-gray-600">{step.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Coverage Areas */}
          {activeTab === 'coverage' && (
            <div className="space-y-8">
              <div className="text-center mb-8">
                <h2 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4">Where We Ship</h2>
                <p className="text-gray-600 max-w-2xl mx-auto">
                  We are continuously expanding our delivery network to serve customers worldwide with our sustainable shipping solutions.
                </p>
              </div>

              <div className="grid gap-6 mb-8">
                {coverageAreas.map((area, index) => (
                  <div key={index} className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-3">
                      <h3 className="text-lg font-semibold text-gray-900">{area.region}</h3>
                      <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium mt-2 sm:mt-0 ${
                        area.status === 'Available' 
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {area.status}
                      </span>
                    </div>
                    <div className="grid sm:grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium text-gray-700">Shipping Areas:</span>
                        <p className="text-gray-600 mt-1">{area.shipping}</p>
                      </div>
                      <div>
                        <span className="font-medium text-gray-700">Notes:</span>
                        <p className="text-gray-600 mt-1">{area.notes}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* International Shipping Info */}
              <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-6">
                <h3 className="text-lg font-bold text-indigo-900 mb-3">International Shipping Notes</h3>
                <div className="grid md:grid-cols-2 gap-6 text-indigo-800">
                  <div>
                    <h4 className="font-semibold mb-2">Customs & Duties</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• Customers are responsible for customs fees</li>
                      <li>• Duties calculated at checkout when possible</li>
                      <li>• Required documentation provided</li>
                    </ul>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-2">Delivery Times</h4>
                    <ul className="space-y-1 text-sm">
                      <li>• International customs clearance may add 2-5 days</li>
                      <li>• Rural areas may experience longer delivery times</li>
                      <li>• Tracking provided for all international orders</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Support CTA */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 text-center mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Need Help with Shipping or Returns?</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Our customer service team is here to help you with any questions about delivery, returns, or exchanges.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <button className="bg-indigo-600 text-white px-8 py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors">
                Contact Support
              </button>
              <button className="border border-indigo-600 text-indigo-600 px-8 py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors">
                Track Your Order
              </button>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    </>
  );
                }

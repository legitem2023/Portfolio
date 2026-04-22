// pages/about.tsx
"use client";
import Footer from "../components/Footer";
import Header from "../components/Header";

export default function About() {
  const features = [
    { icon: "👗", title: "Virtual Try-On", description: "Try products before you buy with AR technology" },
    { icon: "🌱", title: "Sustainable Commerce", description: "Eco-friendly packaging and practices" },
    { icon: "🔒", title: "Secure Shopping", description: "Safe and transparent transactions" },
    { icon: "📦", title: "Fast Delivery", description: "Quick and reliable shipping" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-violet-50">
      <Header />
      
      {/* Hero */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">Redefining E-Commerce</h1>
        <p className="text-xl opacity-90 max-w-2xl mx-auto">
          VendorCity is building the future of online shopping with AR and sustainable practices.
        </p>
      </section>

      {/* Features */}
      <div className="container mx-auto max-w-6xl px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">What Makes Us Different</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-6 rounded-lg shadow-sm">
              <div className="text-3xl mb-3">{feature.icon}</div>
              <h3 className="font-bold text-lg text-gray-900 mb-2">{feature.title}</h3>
              <p className="text-gray-600">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Vision Box */}
        <div className="bg-indigo-50 rounded-lg p-8 mt-16 text-center">
          <h3 className="text-2xl font-bold text-indigo-900 mb-3">Our Vision</h3>
          <p className="text-indigo-800 max-w-2xl mx-auto">
            We&apos;re creating an e-commerce platform that blends AR technology and sustainable practices 
            to deliver shopping experiences unlike anything available today.
          </p>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

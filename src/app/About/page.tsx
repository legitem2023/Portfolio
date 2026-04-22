// pages/about.tsx
"use client";
import Footer from "../components/Footer";
import Header from "../components/Header";

export default function About() {
  const features = [
    { icon: "👗", title: "Virtual Try-On", description: "Try products before you buy with AR technology" },
    { icon: "🌱", title: "Sustainable Commerce", description: "Eco-friendly packaging and practices" },
    { icon: "🔒", title: "Secure Shopping", description: "Safe and transparent transactions" },
    { icon: "🛵", title: "Fast Delivery", description: "Once a rider accepts your order, it gets processed and shipped the same day" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-violet-50">
      <Header />
      
      {/* Features */}
      <div className="container mx-auto px-4 sm:px-6 py-8 sm:py-12 md:py-16">
        <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-900 mb-2 sm:mb-4">
          About VendorCity
        </h1>
        <p className="text-base sm:text-lg text-center text-gray-600 max-w-2xl mx-auto mb-8 sm:mb-12 px-2">
          We&apos;re building the future of online shopping with AR and sustainable practices.
        </p>

        <h2 className="text-xl sm:text-2xl font-bold text-center text-gray-900 mb-6 sm:mb-8">
          What Makes Us Different
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <div key={index} className="bg-white p-5 sm:p-6 rounded-lg shadow-sm hover:shadow-md transition-shadow">
              <div className="text-3xl sm:text-4xl mb-2 sm:mb-3">{feature.icon}</div>
              <h3 className="font-bold text-base sm:text-lg text-gray-900 mb-1 sm:mb-2">{feature.title}</h3>
              <p className="text-sm sm:text-base text-gray-600 leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>

        {/* Vision Box */}
        <div className="bg-indigo-50 rounded-lg p-5 sm:p-6 md:p-8 mt-10 sm:mt-12 md:mt-16 text-center mx-2 sm:mx-0">
          <h3 className="text-xl sm:text-2xl font-bold text-indigo-900 mb-2 sm:mb-3">Our Vision</h3>
          <p className="text-sm sm:text-base text-indigo-800 max-w-2xl mx-auto leading-relaxed">
            We&apos;re creating an e-commerce platform that blends AR technology and sustainable practices 
            to deliver shopping experiences unlike anything available today.
          </p>
        </div>

        {/* CTA */}
        <div className="bg-white rounded-xl p-6 sm:p-8 mt-10 sm:mt-12 md:mt-16 text-center shadow-lg mx-2 sm:mx-0">
          <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-3 sm:mb-4">Be Part of the Future</h2>
          <p className="text-sm sm:text-base text-gray-600 mb-5 sm:mb-6 px-2">
            Join our waiting list for early access to our launch.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4 sm:px-0">
            <button className="bg-indigo-600 text-white px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-indigo-700 transition-colors text-sm sm:text-base w-full sm:w-auto">
              Join Waitlist
            </button>
            <button className="border border-indigo-600 text-indigo-600 px-6 sm:px-8 py-2.5 sm:py-3 rounded-lg font-semibold hover:bg-indigo-50 transition-colors text-sm sm:text-base w-full sm:w-auto">
              Learn More
            </button>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}

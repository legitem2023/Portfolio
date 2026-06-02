// pages/privacy.tsx
"use client";
import Head from 'next/head';
import Footer from '../components/Footer';
import Header from '../components/Header';

export default function PrivacyPolicy() {
  return (
    <>
      <Head>
        <title>Privacy Policy - VendorCity | Your Privacy Matters</title>
        <meta name="description" content="Read VendorCity's privacy policy to understand how we collect, use, and protect your personal information when using our delivery platform." />
      </Head>
      
      <div className="min-h-screen bg-gradient-to-b from-indigo-50 to-violet-50">
        <Header />
        
        {/* Hero Section */}
        <section className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-12 md:py-16 px-4">
          <div className="container mx-auto max-w-4xl text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-4">Privacy Policy</h1>
            <p className="text-lg opacity-90 max-w-2xl mx-auto">
              Last Updated: January 1, 2026
            </p>
          </div>
        </section>

        {/* Privacy Content */}
        <div className="container mx-auto max-w-4xl px-4 sm:px-6 py-12">
          <div className="bg-white rounded-xl shadow-md p-6 md:p-8">
            
            {/* Introduction */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-700 leading-relaxed mb-4">
                Welcome to VendorCity. Your privacy is important to us. This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our delivery platform, website, and mobile application (collectively, the &quot;Service&quot;).
              </p>
              <p className="text-gray-700 leading-relaxed">
                By using VendorCity, you consent to the data practices described in this policy. If you do not agree with any part of this policy, please do not use our Service.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">2. Information We Collect</h2>
              
              <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">Personal Information</h3>
              <p className="text-gray-700 leading-relaxed mb-2">When you use VendorCity, we may collect:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1 mb-4">
                <li>Full name and contact information (email, phone number)</li>
                <li>Delivery addresses and location data</li>
                <li>Payment information (credit/debit card details, billing address)</li>
                <li>Account credentials (username, password)</li>
                <li>Order history and preferences</li>
                <li>Communication preferences</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">Social Media Information</h3>
              <p className="text-gray-700 leading-relaxed mb-2">When you connect your social media accounts to VendorCity, we may collect:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1 mb-4">
                <li>Social media profile information (name, profile picture, username)</li>
                <li>Email address associated with your social media account</li>
                <li>Friends or connections list (with your permission)</li>
                <li>Content you share or post related to VendorCity</li>
                <li>Social media interactions (likes, shares, comments)</li>
              </ul>

              <h3 className="text-xl font-semibold text-gray-800 mt-4 mb-2">Automatically Collected Information</h3>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Device information (IP address, browser type, operating system)</li>
                <li>Usage data (pages visited, time spent, features used)</li>
                <li>Location data (GPS, WiFi, or cellular network)</li>
                <li>Cookies and similar tracking technologies</li>
              </ul>
            </section>

            {/* How We Use Your Information */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-3">We use the information we collect to:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Process and deliver your orders</li>
                <li>Create and manage your account</li>
                <li>Provide customer support and respond to inquiries</li>
                <li>Process payments and prevent fraud</li>
                <li>Improve our delivery services and user experience</li>
                <li>Send order updates, promotions, and marketing communications (with your consent)</li>
                <li>Enable social media features and integrations</li>
                <li>Analyze usage trends and optimize our platform</li>
                <li>Comply with legal obligations</li>
              </ul>
            </section>

            {/* Social Media Features */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">4. Social Media Features</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                VendorCity integrates with various social media platforms to enhance your experience. These features include:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1 mb-4">
                <li><strong>Social Login:</strong> Sign up or log in using your Google, Facebook, or Apple account</li>
                <li><strong>Social Sharing:</strong> Share your orders, reviews, or referral codes on social media</li>
                <li><strong>Social Feeds:</strong> View and interact with VendorCity content on our social media channels</li>
                <li><strong>Referral Programs:</strong> Invite friends via social media and earn rewards</li>
              </ul>
              <p className="text-gray-700 leading-relaxed">
                Please note that social media platforms have their own privacy policies. We encourage you to review them. We are not responsible for the privacy practices of third-party social media platforms.
              </p>
            </section>

            {/* Information Sharing */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">5. When We Share Your Information</h2>
              <p className="text-gray-700 leading-relaxed mb-3">We may share your information with:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li><strong>Delivery Partners:</strong> To fulfill your orders (name, address, contact number)</li>
                <li><strong>Vendors/Restaurants:</strong> To prepare your orders (name, order details, special instructions)</li>
                <li><strong>Payment Processors:</strong> To handle secure transactions</li>
                <li><strong>Service Providers:</strong> For analytics, customer support, and marketing assistance</li>
                <li><strong>Legal Authorities:</strong> When required by law or to protect our rights</li>
                <li><strong>Business Transfers:</strong> In connection with mergers, acquisitions, or asset sales</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                We do not sell your personal information to third parties.
              </p>
            </section>

            {/* Your Rights and Choices */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Your Rights and Choices</h2>
              <p className="text-gray-700 leading-relaxed mb-3">Depending on your location, you may have the following rights:</p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li><strong>Access:</strong> Request a copy of your personal data</li>
                <li><strong>Correction:</strong> Update or correct inaccurate information</li>
                <li><strong>Deletion:</strong> Request deletion of your account and data</li>
                <li><strong>Opt-out:</strong> Unsubscribe from marketing communications</li>
                <li><strong>Data Portability:</strong> Receive your data in a transferable format</li>
                <li><strong>Cookie Preferences:</strong> Manage cookie settings in your browser</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                To exercise these rights, contact us at <span className="text-indigo-600">privacy@vendorcity.com</span>
              </p>
            </section>

            {/* Data Security */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Security</h2>
              <p className="text-gray-700 leading-relaxed">
                We implement industry-standard security measures including encryption, secure servers, and regular security audits to protect your information. However, no method of transmission over the internet is 100% secure. While we strive to protect your data, we cannot guarantee absolute security.
              </p>
            </section>

            {/* Cookies and Tracking */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. Cookies and Tracking Technologies</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc pl-6 text-gray-700 space-y-1">
                <li>Remember your login status and preferences</li>
                <li>Analyze site traffic and usage patterns</li>
                <li>Personalize content and recommendations</li>
                <li>Measure marketing campaign effectiveness</li>
              </ul>
              <p className="text-gray-700 leading-relaxed mt-3">
                You can control cookies through your browser settings. Disabling cookies may affect some features of our Service.
              </p>
            </section>

            {/* Children's Privacy */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children{"'"}s Privacy</h2>
              <p className="text-gray-700 leading-relaxed">
                VendorCity is not intended for users under the age of 18. We do not knowingly collect personal information from children. If you believe a child has provided us with personal information, please contact us immediately.
              </p>
            </section>

            {/* International Users */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. International Data Transfers</h2>
              <p className="text-gray-700 leading-relaxed">
                If you are accessing VendorCity from outside the United States, please be aware that your information may be transferred to, stored, and processed in the United States where our servers are located. By using our Service, you consent to this transfer.
              </p>
            </section>

            {/* Policy Updates */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Updates to This Privacy Policy</h2>
              <p className="text-gray-700 leading-relaxed">
                We may update this Privacy Policy from time to time. We will notify you of material changes by posting the new policy on this page and updating the &quot;Last Updated&quot; date. We encourage you to review this policy periodically.
              </p>
            </section>

            {/* Contact Us */}
            <section className="mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">12. Contact Us</h2>
              <p className="text-gray-700 leading-relaxed mb-3">
                If you have questions about this Privacy Policy or our data practices, please contact us:
              </p>
              <ul className="list-none space-y-2 text-gray-700">
                <li>📧 <strong>Email:</strong> privacy@vendorcity.com</li>
                <li>📞 <strong>Phone:</strong> 1-800-VENDORCITY</li>
                <li>📍 <strong>Address:</strong> 123 Delivery Lane, Suite 100, San Francisco, CA 94105</li>
                <li>🐦 <strong>Social Media:</strong> @VendorCity on Instagram, Facebook, Twitter, and TikTok</li>
              </ul>
            </section>

            {/* Social Media Links Footer */}
            <div className="mt-8 pt-6 border-t border-gray-200 text-center">
              <p className="text-gray-600 mb-4">Follow us for updates and privacy notices:</p>
              <div className="flex justify-center space-x-6">
                <a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">
                  📷 Instagram
                </a>
                <a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">
                  👍 Facebook
                </a>
                <a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">
                  🐦 Twitter
                </a>
                <a href="#" className="text-gray-600 hover:text-indigo-600 transition-colors">
                  🎵 TikTok
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <Footer />
      </div>
    </>
  );
}

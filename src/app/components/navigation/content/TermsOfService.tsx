// components/content/TermsOfService.jsx
const TermsOfService = () => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8 text-gold-400">Terms of Service</h2>
      
      <div className="prose prose-invert prose-lg max-w-none">
        <div className="bg-black/20 backdrop-blur-md rounded-xl border border-white/10 p-6 md:p-8">
          <div className="space-y-6">
            <section>
              <h3 className="text-xl font-semibold text-gold-300 mb-3">1. Acceptance of Terms</h3>
              <p className="text-gray-300">
                By accessing and using our premium services, you accept and agree to be bound by the terms and provision of this agreement.
              </p>
            </section>
            
            <section>
              <h3 className="text-xl font-semibold text-gold-300 mb-3">2. User Responsibilities</h3>
              <p className="text-gray-300">
                As a user of our services, you are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account.
              </p>
            </section>
            
            <section>
              <h3 className="text-xl font-semibold text-gold-300 mb-3">3. Premium Subscription Terms</h3>
              <p className="text-gray-300">
                Our premium services are offered on a subscription basis. By subscribing, you agree to pay all applicable fees and taxes associated with your subscription.
              </p>
              <ul className="list-disc list-inside text-gray-300 mt-2 space-y-1">
                <li>Subscriptions automatically renew until canceled</li>
                <li>All fees are non-refundable except as required by law</li>
                <li>We reserve the right to change subscription fees with 30 days notice</li>
              </ul>
            </section>
            
            <section>
              <h3 className="text-xl font-semibold text-gold-300 mb-3">4. Intellectual Property</h3>
              <p className="text-gray-300">
                All content included on this site, such as text, graphics, logos, button icons, images, audio clips, digital downloads, data compilations, and software, is the property of our company or its content suppliers and protected by international copyright laws.
              </p>
            </section>
            
            <section>
              <h3 className="text-xl font-semibold text-gold-300 mb-3">5. Limitation of Liability</h3>
              <p className="text-gray-300">
                We shall not be liable for any indirect, incidental, special, consequential or punitive damages, including but not limited to, loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the services.
              </p>
            </section>
            
            <div className="text-sm text-gray-400 mt-8">
              <p>Last updated: September 2, 2025</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TermsOfService;

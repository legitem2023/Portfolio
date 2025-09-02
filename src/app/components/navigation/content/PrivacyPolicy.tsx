// components/content/PrivacyPolicy.tsx
import React from "react";

const PrivacyPolicy: React.FC = () => {
  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8 text-gold-400">
        Privacy Policy
      </h2>

      <div className="prose prose-invert prose-lg max-w-none">
        <div className="bg-black/20 backdrop-blur-md rounded-xl border border-white/10 p-6 md:p-8">
          <div className="space-y-6">
            <section>
              <h3 className="text-xl font-semibold text-gold-300 mb-3">
                1. Information We Collect
              </h3>
              <p className="text-gray-300">
                We collect information you provide directly to us, such as when
                you create an account, subscribe to our services, or contact us
                for support. This may include personal information like your
                name, email address, and payment information.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gold-300 mb-3">
                2. How We Use Your Information
              </h3>
              <p className="text-gray-300">
                We use the information we collect to provide, maintain, and
                improve our services, to develop new services, and to protect
                our company and our users.
              </p>
              <ul className="list-disc list-inside text-gray-300 mt-2 space-y-1">
                <li>Provide and deliver products and services you request</li>
                <li>Process transactions and send related information</li>
                <li>Send you technical notices, updates, and support messages</li>
                <li>Respond to your comments, questions, and requests</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gold-300 mb-3">
                3. Information Sharing
              </h3>
              <p className="text-gray-300">
                We do not sell, trade, or otherwise transfer to outside parties
                your personally identifiable information except in the following
                circumstances:
              </p>
              <ul className="list-disc list-inside text-gray-300 mt-2 space-y-1">
                <li>With your consent</li>
                <li>For external processing by our trusted service providers</li>
                <li>For legal reasons or to prevent harm</li>
              </ul>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gold-300 mb-3">
                4. Data Security
              </h3>
              <p className="text-gray-300">
                We implement appropriate technical and organizational measures
                to protect the security of your personal information against
                unauthorized access, alteration, disclosure, or destruction.
              </p>
            </section>

            <section>
              <h3 className="text-xl font-semibold text-gold-300 mb-3">
                5. Your Rights
              </h3>
              <p className="text-gray-300">
                You have the right to access, correct, or delete your personal
                information. You can also object to the processing of your
                personal information, ask us to restrict processing, or request
                portability of your personal information.
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

export default PrivacyPolicy;

"use client";

import { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ: React.FC = () => {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  const faqData: FAQItem[] = [
    {
      question: "What makes your service premium?",
      answer:
        "Our premium service offers exclusive features, priority support, and enhanced customization options that aren't available in our standard plans.",
    },
    {
      question: "How do I upgrade my account?",
      answer:
        "You can upgrade your account through your dashboard settings or by contacting our support team for assistance with the process.",
    },
    {
      question: "What payment methods do you accept?",
      answer:
        "We accept all major credit cards, PayPal, and bank transfers for premium subscriptions.",
    },
    {
      question: "Can I cancel my subscription anytime?",
      answer:
        "Yes, you can cancel your premium subscription at any time, and you'll continue to have access until the end of your billing period.",
    },
    {
      question: "Is there a free trial available?",
      answer:
        "We offer a 14-day free trial for our premium service with full access to all features.",
    },
  ];

  const toggleFAQ = (index: number) => {
    setActiveIndex(activeIndex === index ? null : index);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <h2 className="text-3xl font-bold text-center mb-8 text-yellow-400">
        Frequently Asked Questions
      </h2>

      <div className="space-y-4">
        {faqData.map((item, index) => (
          <div
            key={index}
            className="bg-black/20 backdrop-blur-md rounded-xl border border-white/10 overflow-hidden"
          >
            <button
              className="flex justify-between items-center w-full p-5 text-left font-semibold text-lg"
              onClick={() => toggleFAQ(index)}
            >
              <span>{item.question}</span>
              <svg
                className={`w-5 h-5 transform transition-transform duration-300 ${
                  activeIndex === index ? "rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                activeIndex === index ? "max-h-96 opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="p-5 pt-0 text-gray-300">
                <p>{item.answer}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;

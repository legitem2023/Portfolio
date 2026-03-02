import React from 'react';
import { useState } from 'react';
import Header from './Header';
interface FormData {
  businessName: string;
  contactName: string;
  email: string;
  phone: string;
  businessType: string;
  productCategory: string;
  website: string;
  description: string;
  agreeTerms: boolean;
}

export default function VendorApplicationForm() {
  const [formData, setFormData] = useState<FormData>({
    businessName: '',
    contactName: '',
    email: '',
    phone: '',
    businessType: '',
    productCategory: '',
    website: '',
    description: '',
    agreeTerms: false,
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus('idle');
    
    // Simulate API call
    try {
      await new Promise(resolve => setTimeout(resolve, 1500));
      console.log('Form submitted:', formData);
      setSubmitStatus('success');
      // Reset form after success
      setFormData({
        businessName: '',
        contactName: '',
        email: '',
        phone: '',
        businessType: '',
        productCategory: '',
        website: '',
        description: '',
        agreeTerms: false,
      });
    } catch (error) {
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#e6d9f0] to-[#d4c0e8] flex flex-col items-center justify-center p-0">
      <Header/>
      <div className="max-w-4xl w-full">
        <div className="bg-white/80 backdrop-blur-sm shadow-2xl border border-white/40 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#b79ad4] to-[#dac0f0] px-8 py-6">
            <div className="flex items-center gap-3">
              <i className="fas fa-store text-white text-3xl"></i>
              <div>
                <h1 className="text-3xl font-bold text-white">Vendor Application</h1>
                <p className="text-[#f8f0ff] text-sm mt-1 opacity-90">Join our marketplace community</p>
              </div>
            </div>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="px-8 py-8 space-y-6">
            {/* Business Name */}
            <div>
              <label htmlFor="businessName" className="block text-sm font-medium text-[#4a3f5c] mb-2">
                Business Name <span className="text-[#b279d6]">*</span>
              </label>
              <input
                type="text"
                id="businessName"
                name="businessName"
                value={formData.businessName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-[#d9c0e8] bg-white/60 focus:bg-white focus:ring-2 focus:ring-[#b38fd9] focus:border-transparent outline-none transition-all placeholder:text-[#9b8bb0]"
                placeholder="e.g., Lavender Dreams Boutique"
              />
            </div>

            {/* Contact Name */}
            <div>
              <label htmlFor="contactName" className="block text-sm font-medium text-[#4a3f5c] mb-2">
                Contact Person <span className="text-[#b279d6]">*</span>
              </label>
              <input
                type="text"
                id="contactName"
                name="contactName"
                value={formData.contactName}
                onChange={handleChange}
                required
                className="w-full px-4 py-3 rounded-xl border border-[#d9c0e8] bg-white/60 focus:bg-white focus:ring-2 focus:ring-[#b38fd9] focus:border-transparent outline-none transition-all"
                placeholder="Full name"
              />
            </div>

            {/* Email & Phone - Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-[#4a3f5c] mb-2">
                  Email Address <span className="text-[#b279d6]">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#d9c0e8] bg-white/60 focus:bg-white focus:ring-2 focus:ring-[#b38fd9] focus:border-transparent outline-none transition-all"
                  placeholder="you@example.com"
                />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-[#4a3f5c] mb-2">
                  Phone Number <span className="text-[#b279d6]">*</span>
                </label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#d9c0e8] bg-white/60 focus:bg-white focus:ring-2 focus:ring-[#b38fd9] focus:border-transparent outline-none transition-all"
                  placeholder="(555) 123-4567"
                />
              </div>
            </div>

            {/* Business Type & Category - Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="businessType" className="block text-sm font-medium text-[#4a3f5c] mb-2">
                  Business Type <span className="text-[#b279d6]">*</span>
                </label>
                <select
                  id="businessType"
                  name="businessType"
                  value={formData.businessType}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#d9c0e8] bg-white/60 focus:bg-white focus:ring-2 focus:ring-[#b38fd9] focus:border-transparent outline-none transition-all appearance-none cursor-pointer"
                >
                  <option value="">Select type</option>
                  <option value="retail">Retail / E-commerce</option>
                  <option value="handmade">Handmade / Crafts</option>
                  <option value="food">Food & Beverage</option>
                  <option value="service">Service Provider</option>
                  <option value="art">Art / Photography</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div>
                <label htmlFor="productCategory" className="block text-sm font-medium text-[#4a3f5c] mb-2">
                  Product Category <span className="text-[#b279d6]">*</span>
                </label>
                <input
                  type="text"
                  id="productCategory"
                  name="productCategory"
                  value={formData.productCategory}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 rounded-xl border border-[#d9c0e8] bg-white/60 focus:bg-white focus:ring-2 focus:ring-[#b38fd9] focus:border-transparent outline-none transition-all"
                  placeholder="e.g., Jewelry, Home Decor, Bakery"
                />
              </div>
            </div>

            {/* Website (Optional) */}
            <div>
              <label htmlFor="website" className="block text-sm font-medium text-[#4a3f5c] mb-2">
                Website / Social Media
              </label>
              <input
                type="url"
                id="website"
                name="website"
                value={formData.website}
                onChange={handleChange}
                className="w-full px-4 py-3 rounded-xl border border-[#d9c0e8] bg-white/60 focus:bg-white focus:ring-2 focus:ring-[#b38fd9] focus:border-transparent outline-none transition-all"
                placeholder="https://..."
              />
            </div>

            {/* Business Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-[#4a3f5c] mb-2">
                Tell us about your business <span className="text-[#b279d6]">*</span>
              </label>
              <textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                required
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-[#d9c0e8] bg-white/60 focus:bg-white focus:ring-2 focus:ring-[#b38fd9] focus:border-transparent outline-none transition-all resize-none"
                placeholder="Describe your products, story, and what makes you unique..."
              />
            </div>

            {/* Terms Checkbox */}
            <div className="flex items-start gap-3 pt-2">
              <input
                type="checkbox"
                id="agreeTerms"
                name="agreeTerms"
                checked={formData.agreeTerms}
                onChange={handleChange}
                required
                className="mt-1 w-5 h-5 rounded border-[#d9c0e8] text-[#b38fd9] focus:ring-[#b38fd9] focus:ring-offset-0 bg-white/60"
              />
              <label htmlFor="agreeTerms" className="text-sm text-[#4a3f5c]">
                I agree to the <a href="#" className="text-[#9b6fc7] hover:text-[#7b4fa3] underline font-medium">Terms & Conditions</a> and <a href="#" className="text-[#9b6fc7] hover:text-[#7b4fa3] underline font-medium">Vendor Agreement</a>. <span className="text-[#b279d6]">*</span>
              </label>
            </div>

            {/* Status Messages */}
            {submitStatus === 'success' && (
              <div className="bg-green-100 border border-green-300 text-green-700 px-4 py-3 rounded-xl flex items-center gap-2">
                <i className="fas fa-check-circle text-green-600"></i>
                
               <span>Application submitted successfully! We&#39;ll be in touch soon.</span>
              </div>
            )}
            {submitStatus === 'error' && (
              <div className="bg-red-100 border border-red-300 text-red-700 px-4 py-3 rounded-xl flex items-center gap-2">
                <i className="fas fa-exclamation-circle text-red-600"></i>
                <span>Something went wrong. Please try again.</span>
              </div>
            )}

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-[#b79ad4] to-[#d0b0e8] hover:from-[#a987c4] hover:to-[#c29fdb] text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-lg flex items-center justify-center gap-3 text-lg"
              >
                {isSubmitting ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i>
                    Submitting...
                  </>
                ) : (
                  <>
                    <i className="fas fa-paper-plane"></i>
                    Submit Application
                  </>
                )}
              </button>
              <p className="text-center text-xs text-[#6b5b7c] mt-4">
                Fields marked with <span className="text-[#b279d6]">*</span> are required
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

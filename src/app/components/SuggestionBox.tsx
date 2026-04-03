// app/components/SuggestionBox.tsx
'use client';

import { useState, FormEvent } from 'react';

interface Suggestion {
  id: string;
  text: string;
  category: string;
  createdAt: Date;
}

export default function SuggestionBox() {
  const [suggestion, setSuggestion] = useState('');
  const [category, setCategory] = useState('general');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState<'idle' | 'success' | 'error'>('idle');
  const [recentSuggestions, setRecentSuggestions] = useState<Suggestion[]>([]);

  const categories = [
    { value: 'general', label: 'General Feedback', emoji: '💬' },
    { value: 'feature', label: 'Feature Request', emoji: '✨' },
    { value: 'bug', label: 'Bug Report', emoji: '🐛' },
    { value: 'improvement', label: 'Improvement', emoji: '⚡' },
    { value: 'other', label: 'Other', emoji: '📝' },
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!suggestion.trim()) return;
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 800));
    
    try {
      const newSuggestion: Suggestion = {
        id: Date.now().toString(),
        text: suggestion,
        category,
        createdAt: new Date(),
      };
      
      setRecentSuggestions(prev => [newSuggestion, ...prev].slice(0, 3));
      setSubmitStatus('success');
      setSuggestion('');
      setCategory('general');
      setIsAnonymous(false);
      
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } catch (error) {
      setSubmitStatus('error');
      setTimeout(() => setSubmitStatus('idle'), 3000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCategoryEmoji = (catValue: string) => {
    return categories.find(c => c.value === catValue)?.emoji || '📝';
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 sm:py-8 md:py-10">
      {/* Header - Professional & clean */}
      <div className="mb-8 md:mb-10">
        <div className="flex items-center gap-3 mb-4">
          <div className="h-8 w-1 bg-indigo-500 rounded-full"></div>
          <h1 className="text-2xl sm:text-3xl font-semibold text-gray-900 tracking-tight">
            Suggestion Box
          </h1>
        </div>
        <p className="text-gray-500 text-sm sm:text-base ml-4">
          Share your ideas to help us build better products.
        </p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
        {/* Suggestion Form - Main column */}
        <div className="lg:col-span-2">
          <div className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
            <div className="px-5 py-4 sm:px-6 sm:py-5 border-b border-gray-100 bg-gray-50/40">
              <h2 className="text-base font-medium text-gray-900 flex items-center gap-2">
                <span>✍️</span> Submit new suggestion
              </h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-5">
              {/* Category Selection - Horizontal scroll on mobile, grid on larger */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <div className="flex flex-nowrap sm:grid sm:grid-cols-3 gap-2 overflow-x-auto pb-2 sm:pb-0 -mx-1 px-1 sm:mx-0 sm:px-0">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`flex-shrink-0 px-3 py-1.5 rounded text-sm font-medium transition-all duration-150 flex items-center gap-1.5 whitespace-nowrap ${
                        category === cat.value
                          ? 'bg-indigo-600 text-white shadow-sm'
                          : 'bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Suggestion Text */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your suggestion <span className="text-gray-400">*</span>
                </label>
                <textarea
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  placeholder="What's on your mind? Be specific and constructive..."
                  rows={5}
                  className="w-full px-4 py-2.5 border border-gray-300 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none transition text-gray-900 placeholder-gray-400 resize-none text-sm"
                  required
                />
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-gray-400">{suggestion.length} characters</span>
                </div>
              </div>

              {/* Anonymous Toggle */}
              <div className="flex items-center justify-between py-2">
                <div className="flex items-center gap-2">
                  <span className="text-gray-500 text-sm">🕊️ Submit anonymously</span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className={`relative inline-flex h-5 w-9 flex-shrink-0 rounded-full transition-colors duration-200 ease-in-out focus:outline-none ${
                    isAnonymous ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition duration-200 ease-in-out ${
                      isAnonymous ? 'translate-x-4' : 'translate-x-0.5'
                    } mt-0.5`}
                  />
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !suggestion.trim()}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded shadow-sm transition-colors duration-150 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-indigo-600 text-sm"
              >
                {isSubmitting ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Submitting...
                  </span>
                ) : (
                  'Submit suggestion'
                )}
              </button>

              {/* Status Messages */}
              {submitStatus === 'success' && (
                <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm">
                  ✓ Thank you! Your suggestion has been received.
                </div>
              )}
              {submitStatus === 'error' && (
                <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
                  ⚠️ Submission failed. Please try again.
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Sidebar - Stats & Recent */}
        <div className="space-y-6">
          {/* Stats Card */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/40">
              <h3 className="text-sm font-medium text-gray-900">Community impact</h3>
            </div>
            <div className="p-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <div className="text-2xl font-semibold text-indigo-600">127</div>
                  <div className="text-xs text-gray-500 mt-0.5">Total suggestions</div>
                </div>
                <div>
                  <div className="text-2xl font-semibold text-indigo-600">34</div>
                  <div className="text-xs text-gray-500 mt-0.5">Implemented</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Suggestions */}
          <div className="bg-white border border-gray-200 shadow-sm rounded-lg overflow-hidden">
            <div className="px-5 py-3 border-b border-gray-100 bg-gray-50/40">
              <h3 className="text-sm font-medium text-gray-900">Recent activity</h3>
            </div>
            <div className="p-5">
              {recentSuggestions.length > 0 ? (
                <div className="space-y-3">
                  {recentSuggestions.map((item) => (
                    <div key={item.id} className="pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-sm">{getCategoryEmoji(item.category)}</span>
                        <span className="text-xs text-gray-400">
                          {item.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-sm text-gray-700 line-clamp-2">{item.text}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-400">
                  <span className="text-2xl block mb-2">📭</span>
                  <p className="text-sm">No suggestions yet</p>
                  <p className="text-xs mt-1">Be the first to share an idea</p>
                </div>
              )}
            </div>
          </div>

          {/* Tip Card - Professional tone */}
          <div className="bg-indigo-50/40 border border-indigo-100 rounded-lg p-4">
            <div className="flex gap-3">
              <span className="text-indigo-500 text-base">💡</span>
              <div>
                <p className="text-sm font-medium text-indigo-900">Guidelines</p>
                <p className="text-xs text-indigo-700 mt-1">
                  Clear, actionable suggestions are reviewed within 2 business days.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

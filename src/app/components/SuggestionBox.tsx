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
    { value: 'general', label: 'General', emoji: '💬' },
    { value: 'feature', label: 'Feature', emoji: '✨' },
    { value: 'bug', label: 'Bug', emoji: '🐛' },
    { value: 'improvement', label: 'Improvement', emoji: '⚡' },
    { value: 'other', label: 'Other', emoji: '📝' },
  ];

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!suggestion.trim()) return;
    
    setIsSubmitting(true);
    setSubmitStatus('idle');
    
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
    <div className="w-full">
      {/* Header - Clean & Professional */}
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <div className="h-6 w-1 bg-indigo-500 rounded"></div>
          <h2 className="text-xl font-semibold text-gray-900">Suggestion Box</h2>
        </div>
        <p className="text-sm text-gray-500 ml-3">
          Share your feedback to help us improve
        </p>
      </div>

      {/* Two column layout - stacks on mobile */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Form Section - Full width on mobile */}
        <div className="flex-1 min-w-0">
          <div className="bg-white border border-gray-200 rounded shadow-sm">
            <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
              <h3 className="text-sm font-medium text-gray-900">Submit new suggestion</h3>
            </div>
            
            <form onSubmit={handleSubmit} className="p-4 space-y-4">
              {/* Category Buttons - Horizontal scroll on mobile, grid on desktop */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Category
                </label>
                <div className="flex flex-wrap gap-2">
                  {categories.map((cat) => (
                    <button
                      key={cat.value}
                      type="button"
                      onClick={() => setCategory(cat.value)}
                      className={`px-3 py-1.5 rounded text-sm font-medium transition-colors flex items-center gap-1 ${
                        category === cat.value
                          ? 'bg-indigo-600 text-white'
                          : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                      }`}
                    >
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Text Area */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Your suggestion <span className="text-gray-400">*</span>
                </label>
                <textarea
                  value={suggestion}
                  onChange={(e) => setSuggestion(e.target.value)}
                  placeholder="What's on your mind? Be specific..."
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 focus:outline-none text-sm"
                  required
                />
                <div className="flex justify-end mt-1">
                  <span className="text-xs text-gray-400">{suggestion.length} chars</span>
                </div>
              </div>

              {/* Anonymous Toggle */}
              <div className="flex items-center justify-between py-1">
                <span className="text-sm text-gray-700">Submit anonymously</span>
                <button
                  type="button"
                  onClick={() => setIsAnonymous(!isAnonymous)}
                  className={`relative inline-flex h-5 w-9 rounded-full transition-colors ${
                    isAnonymous ? 'bg-indigo-600' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      isAnonymous ? 'translate-x-4' : 'translate-x-0.5'
                    } mt-0.5`}
                  />
                </button>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting || !suggestion.trim()}
                className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm"
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
                <div className="p-2 bg-green-50 border border-green-200 rounded text-green-700 text-sm text-center">
                  ✓ Thank you! Suggestion received.
                </div>
              )}
              {submitStatus === 'error' && (
                <div className="p-2 bg-red-50 border border-red-200 rounded text-red-700 text-sm text-center">
                  ⚠️ Failed. Please try again.
                </div>
              )}
            </form>
          </div>
        </div>

        {/* Sidebar - Full width on mobile, below form */}
        <div className="lg:w-80 flex-shrink-0">
          <div className="space-y-4">
            
            {/* Stats Card */}
            <div className="bg-white border border-gray-200 rounded shadow-sm">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-900">Community impact</h3>
              </div>
              <div className="p-4">
                <div className="flex justify-around">
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-indigo-600">127</div>
                    <div className="text-xs text-gray-500 mt-1">Suggestions</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-semibold text-indigo-600">34</div>
                    <div className="text-xs text-gray-500 mt-1">Implemented</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Suggestions */}
            <div className="bg-white border border-gray-200 rounded shadow-sm">
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50">
                <h3 className="text-sm font-medium text-gray-900">Recent suggestions</h3>
              </div>
              <div className="p-4">
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
                  <div className="text-center py-6">
                    <div className="text-3xl mb-2">📭</div>
                    <p className="text-sm text-gray-400">No suggestions yet</p>
                    <p className="text-xs text-gray-400 mt-1">Be the first to share</p>
                  </div>
                )}
              </div>
            </div>

            {/* Tip Card */}
            <div className="bg-indigo-50 border border-indigo-100 rounded p-3">
              <div className="flex gap-2">
                <span className="text-indigo-500">💡</span>
                <div>
                  <p className="text-xs font-medium text-indigo-900">Pro tip</p>
                  <p className="text-xs text-indigo-700 mt-0.5">
                    Specific, actionable suggestions get reviewed faster
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

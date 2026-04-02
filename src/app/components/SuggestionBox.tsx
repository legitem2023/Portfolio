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
      // In a real app, you would send this to your API
      // const response = await fetch('/api/suggestions', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ text: suggestion, category, isAnonymous })
      // });
      
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
      
      // Reset success message after 3 seconds
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
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl shadow-lg mb-4">
          <span className="text-3xl">📬</span>
        </div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          Suggestion Box
        </h1>
        <p className="text-gray-500 mt-2">Your voice matters — share your ideas with us!</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Suggestion Form */}
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>✍️</span> Share Your Suggestion
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Category Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <div className="grid grid-cols-2 gap-2">
                {categories.map((cat) => (
                  <button
                    key={cat.value}
                    type="button"
                    onClick={() => setCategory(cat.value)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center justify-center gap-1 ${
                      category === cat.value
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-md scale-105'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    <span>{cat.emoji}</span>
                    <span className="hidden sm:inline">{cat.label.split(' ')[0]}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Suggestion Text */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Your Suggestion <span className="text-red-500">*</span>
              </label>
              <textarea
                value={suggestion}
                onChange={(e) => setSuggestion(e.target.value)}
                placeholder="What's on your mind? Share your ideas, feedback, or suggestions..."
                rows={5}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-purple-400 focus:ring-2 focus:ring-purple-200 focus:outline-none transition-all resize-none"
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                {suggestion.length} characters
              </p>
            </div>

            {/* Anonymous Toggle */}
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
              <div className="flex items-center gap-2">
                <span className="text-lg">🕵️</span>
                <span className="text-sm text-gray-700">Submit anonymously</span>
              </div>
              <button
                type="button"
                onClick={() => setIsAnonymous(!isAnonymous)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  isAnonymous ? 'bg-purple-500' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    isAnonymous ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting || !suggestion.trim()}
              className="w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-xl hover:shadow-lg transform hover:scale-[1.02] transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Submitting...
                </span>
              ) : (
                '📮 Submit Suggestion'
              )}
            </button>

            {/* Status Messages */}
            {submitStatus === 'success' && (
              <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm text-center animate-in fade-in duration-300">
                ✨ Thank you for your suggestion! We appreciate your feedback.
              </div>
            )}
            {submitStatus === 'error' && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm text-center">
                ⚠️ Something went wrong. Please try again.
              </div>
            )}
          </form>
        </div>

        {/* Recent Suggestions & Info */}
        <div className="space-y-6">
          {/* Stats Card */}
          <div className="bg-gradient-to-br from-purple-50 to-pink-50 rounded-2xl p-6 border border-purple-100">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span>📊</span> Impact So Far
            </h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">127</div>
                <div className="text-xs text-gray-500">Total Suggestions</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-pink-600">34</div>
                <div className="text-xs text-gray-500">Implemented</div>
              </div>
            </div>
          </div>

          {/* Recent Suggestions */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6">
            <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
              <span>🕒</span> Recent Suggestions
            </h3>
            {recentSuggestions.length > 0 ? (
              <div className="space-y-3">
                {recentSuggestions.map((item) => (
                  <div key={item.id} className="p-3 bg-gray-50 rounded-xl">
                    <div className="flex items-center gap-2 mb-1">
                      <span>{getCategoryEmoji(item.category)}</span>
                      <span className="text-xs text-gray-400">
                        {item.createdAt.toLocaleTimeString()}
                      </span>
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-2">{item.text}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-400">
                <span className="text-4xl block mb-2">💭</span>
                <p className="text-sm">No suggestions yet. Be the first!</p>
              </div>
            )}
          </div>

          {/* Tip Card */}
          <div className="bg-amber-50 rounded-2xl p-4 border border-amber-100">
            <div className="flex gap-3">
              <span className="text-xl">💡</span>
              <div>
                <p className="text-sm font-medium text-amber-800">Pro Tip</p>
                <p className="text-xs text-amber-700 mt-1">
                  The best suggestions are specific, actionable, and kind. We review every submission!
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

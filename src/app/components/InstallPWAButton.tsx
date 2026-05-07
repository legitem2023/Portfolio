"use client";

import { useEffect, useState } from "react";

export default function InstallPWAButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Detect in-app browsers (Messenger, Telegram, Instagram, Facebook)
    const isMessenger = /fbios|fban|messenger/.test(userAgent);
    const isTelegram = /telegram/.test(userAgent);
    const isInstagram = /instagram/.test(userAgent);
    const isFacebook = /facebook/.test(userAgent);
    const isInApp = isMessenger || isTelegram || isInstagram || isFacebook;
    setIsInAppBrowser(isInApp);

    // Listen for beforeinstallprompt event
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: { outcome: string }) => {
        if (choiceResult.outcome === "accepted") {
          console.log("User accepted the install prompt");
        }
        setDeferredPrompt(null);
        setIsInstallable(false);
      });
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert("Copy this link to open in browser: " + window.location.href);
    }
  };

  const handleOpenInBrowser = () => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      alert("Tap the Share button (⬆️) → 'Open in Safari'");
    } else {
      alert("Tap the 3 dots menu (⋮) → 'Open in Chrome Browser'");
    }
  };

  if (!isMounted) return null;
  if (!isVisible) return null;

  // Show for Messenger/Telegram/Instagram/Facebook in-app browsers
  if (isInAppBrowser) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg shadow-xl p-4 max-w-sm border border-amber-300">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">📱</span>
              <h3 className="text-white font-semibold text-sm">Open in Browser</h3>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-white/70 hover:text-white text-lg leading-none"
            >
              ×
            </button>
          </div>
          <p className="text-white/90 text-xs mb-3">
            You're in an in-app browser. For the best experience and to install our app, please open this in Chrome or Safari.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleCopyLink}
              className="flex-1 bg-white/20 hover:bg-white/30 text-white text-xs font-medium py-2 px-3 rounded-lg transition-colors"
            >
              {copied ? "✓ Copied!" : "📋 Copy Link"}
            </button>
            <button
              onClick={handleOpenInBrowser}
              className="flex-1 bg-white text-amber-600 hover:bg-gray-100 text-xs font-medium py-2 px-3 rounded-lg transition-colors"
            >
              🌐 Open
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Original install button (only shows when PWA is installable)
  if (!isInstallable) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={handleInstallClick}
        className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-5 py-3 rounded-full shadow-lg hover:shadow-xl transition-all duration-300 font-semibold flex items-center gap-2 animate-bounce"
        style={{ boxShadow: "0 4px 15px rgba(0,0,0,0.2)" }}
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
        </svg>
        Install App
      </button>
    </div>
  );
}

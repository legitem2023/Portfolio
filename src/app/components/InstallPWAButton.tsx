"use client";

import { useEffect, useState } from "react";
import { X, ExternalLink, Copy, Check, AlertCircle, Smartphone, Globe } from "lucide-react";

export default function InstallPWAButton() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const [browserType, setBrowserType] = useState<"ios" | "android" | "other">("other");

  useEffect(() => {
    // Detect browser type and in-app browser
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Check for in-app browsers
    const isInApp = /facebook|fbios|fban|messenger|telegram|instagram|line|kakaotalk|snapchat|twitter|weibo/.test(userAgent);
    setIsInAppBrowser(isInApp);
    
    // Detect browser type
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setBrowserType("ios");
    } else if (/android/.test(userAgent)) {
      setBrowserType("android");
    } else {
      setBrowserType("other");
    }

    // Check for install prompt availability
    const checkInstallPrompt = () => {
      if ((window as any).deferredPrompt) {
        setIsInstallable(true);
      }
    };

    // Listen for install prompt
    window.addEventListener("beforeinstallprompt", () => {
      setIsInstallable(true);
    });

    checkInstallPrompt();
    
    // Check every second for the first 10 seconds (for delayed prompts)
    const interval = setInterval(() => {
      checkInstallPrompt();
    }, 1000);
    
    setTimeout(() => clearInterval(interval), 10000);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeinstallprompt", () => {});
    };
  }, []);

  const handleInstall = async () => {
    const deferredPrompt = (window as any).deferredPrompt;
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      console.log("User accepted the install prompt");
      setIsInstallable(false);
    }
    (window as any).deferredPrompt = null;
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const handleOpenInBrowser = () => {
    const currentUrl = window.location.href;
    
    if (browserType === "ios") {
      // iOS: Show instructions
      alert("Tap the Share button → 'Open in Safari'");
    } else if (browserType === "android") {
      // Android: Try to open in Chrome
      const chromeIntent = `intent://${currentUrl.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
      window.location.href = chromeIntent;
      
      // Fallback
      setTimeout(() => {
        alert("Tap the 3 dots menu → 'Open in Chrome Browser'");
      }, 500);
    } else {
      alert("Copy the link and paste it into your browser");
    }
  };

  // Don't show if dismissed
  if (!isVisible) return null;

  // Normal install button (for supported browsers)
  if (isInstallable && !isInAppBrowser) {
    return (
      <div className="fixed bottom-4 sm:bottom-6 right-4 sm:right-6 z-50 animate-in slide-in-from-bottom-5 duration-300">
        <div className="bg-white rounded-xl shadow-2xl border border-gray-200 overflow-hidden max-w-sm">
          <div className="bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2 flex justify-between items-center">
            <div className="flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-white" />
              <span className="text-white text-xs font-medium">Install App</span>
            </div>
            <button
              onClick={() => setIsVisible(false)}
              className="text-white/70 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="p-4">
            <p className="text-sm text-gray-700 mb-3">
              Install our app for a better experience
            </p>
            <button
              onClick={handleInstall}
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 transform hover:scale-[1.02] flex items-center justify-center gap-2"
            >
              <Download className="w-4 h-4" />
              Install Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // In-app browser warning with instructions
  if (isInAppBrowser) {
    return (
      <div className="fixed inset-x-0 bottom-0 sm:bottom-4 sm:inset-x-auto sm:right-4 sm:left-auto z-50 animate-in slide-in-from-bottom-10 duration-300">
        <div className="bg-amber-50 border-l-4 border-amber-500 rounded-t-xl sm:rounded-xl shadow-2xl max-w-md mx-4 sm:mx-0">
          <div className="p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="bg-amber-100 rounded-full p-1.5">
                  <AlertCircle className="w-4 h-4 text-amber-600" />
                </div>
                <h3 className="font-semibold text-amber-800 text-sm">
                  In-App Browser Detected
                </h3>
              </div>
              <button
                onClick={() => setIsVisible(false)}
                className="text-amber-600 hover:text-amber-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <p className="text-sm text-amber-700 mb-3">
              For the best experience and to install our app, please open this in your browser.
            </p>
            
            <div className="space-y-2">
              <button
                onClick={handleCopyLink}
                className="w-full bg-white border border-amber-300 hover:bg-amber-50 text-amber-700 font-medium py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4" />
                    Copied!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </>
                )}
              </button>
              
              <button
                onClick={handleOpenInBrowser}
                className="w-full bg-amber-600 hover:bg-amber-700 text-white font-medium py-2.5 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Open in Browser
              </button>
            </div>
            
            <div className="mt-3 pt-2 border-t border-amber-200">
              <p className="text-xs text-amber-600 text-center">
                {browserType === "ios" && "💡 Tip: Tap Share → 'Open in Safari'"}
                {browserType === "android" && "💡 Tip: Tap ⋮ → 'Open in Chrome'"}
                {browserType === "other" && "💡 Tip: Copy link and paste in your browser"}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

// Download icon component
const Download = ({ className }: { className?: string }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
  </svg>
);

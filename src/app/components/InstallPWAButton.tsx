"use client";

import { useEffect, useState } from "react";

export default function InstallPWAButton() {
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const [browserType, setBrowserType] = useState<"ios" | "android" | "other">("other");

  useEffect(() => {
    // Force show on all in-app browsers
    const userAgent = navigator.userAgent.toLowerCase();
    console.log("User Agent:", userAgent); // Debug log
    
    // Detect Messenger, Telegram, Instagram, etc.
    const isMessenger = /fbios|fban|messenger/.test(userAgent);
    const isTelegram = /telegram/.test(userAgent);
    const isInstagram = /instagram/.test(userAgent);
    const isFacebook = /facebook/.test(userAgent);
    
    const isInApp = isMessenger || isTelegram || isInstagram || isFacebook;
    setIsInAppBrowser(isInApp);
    
    console.log("Is In-App Browser:", isInApp); // Debug log
    
    // Detect platform
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setBrowserType("ios");
    } else if (/android/.test(userAgent)) {
      setBrowserType("android");
    }
    
    // Auto-hide after 15 seconds (optional)
    const timer = setTimeout(() => {
      if (isInApp) {
        // Don't auto-hide, let user dismiss manually
      }
    }, 15000);
    
    return () => clearTimeout(timer);
  }, []);

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      
      // Also show an alert for Messenger users
      alert("Link copied! Open Chrome/Safari and paste to install the app.");
    } catch (err) {
      console.error("Failed to copy:", err);
      alert("Please manually copy this link: " + window.location.href);
    }
  };

  const handleOpenInBrowser = () => {
    const currentUrl = window.location.href;
    
    if (browserType === "ios") {
      alert("Tap the Share button (⬆️) → 'Open in Safari'");
    } else if (browserType === "android") {
      alert("Tap the 3 dots menu (⋮) → 'Open in Chrome Browser'");
    } else {
      alert("Copy the link and open it in your device's browser");
    }
  };

  // Don't show if dismissed OR not in an in-app browser
  if (!isVisible || !isInAppBrowser) return null;

  return (
    // Fixed to bottom with highest z-index
    <div style={{
      position: 'fixed',
      bottom: '20px',
      left: '20px',
      right: '20px',
      zIndex: 999999,
      pointerEvents: 'auto',
    }}>
      <div style={{
        backgroundColor: '#FF6B35',
        borderRadius: '16px',
        boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
        padding: '16px',
        border: '1px solid rgba(255,255,255,0.2)',
        animation: 'slideUp 0.3s ease-out',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}>
            <span style={{ fontSize: '24px' }}>📱</span>
            <h3 style={{
              color: 'white',
              fontSize: '16px',
              fontWeight: 'bold',
              margin: 0,
            }}>
              Open in Browser
            </h3>
          </div>
          <button
            onClick={() => setIsVisible(false)}
            style={{
              background: 'rgba(255,255,255,0.2)',
              border: 'none',
              borderRadius: '20px',
              width: '28px',
              height: '28px',
              cursor: 'pointer',
              color: 'white',
              fontSize: '18px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            ✕
          </button>
        </div>
        
        {/* Message */}
        <p style={{
          color: 'rgba(255,255,255,0.95)',
          fontSize: '14px',
          marginBottom: '16px',
          lineHeight: '1.4',
        }}>
          {browserType === 'ios' 
            ? "You're viewing in Messenger. Tap Share → Open in Safari to install our app."
            : "You're viewing in Messenger. Open in Chrome for the best experience and to install our app."
          }
        </p>
        
        {/* Buttons */}
        <div style={{
          display: 'flex',
          gap: '10px',
        }}>
          <button
            onClick={handleCopyLink}
            style={{
              flex: 1,
              background: 'rgba(255,255,255,0.2)',
              border: '1px solid rgba(255,255,255,0.3)',
              borderRadius: '10px',
              padding: '10px',
              color: 'white',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            {copied ? '✓ Copied!' : '📋 Copy Link'}
          </button>
          
          <button
            onClick={handleOpenInBrowser}
            style={{
              flex: 1,
              background: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '10px',
              color: '#FF6B35',
              fontSize: '14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            🌐 Open in Browser
          </button>
        </div>
      </div>
      
      {/* Animation styles */}
      <style jsx>{`
        @keyframes slideUp {
          from {
            transform: translateY(100px);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}

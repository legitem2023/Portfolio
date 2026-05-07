"use client";

import { useEffect, useState } from "react";

export default function InstallPWAButton() {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [copied, setCopied] = useState(false);
  const [browserType, setBrowserType] = useState<"ios" | "android" | "other">("other");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    
    // Detect in-app browsers
    const isMessenger = /fbios|fban|messenger/.test(userAgent);
    const isTelegram = /telegram/.test(userAgent);
    const isInstagram = /instagram/.test(userAgent);
    const isFacebook = /facebook/.test(userAgent);
    const isInApp = isMessenger || isTelegram || isInstagram || isFacebook;
    setIsInAppBrowser(isInApp);
    
    // Detect platform
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setBrowserType("ios");
    } else if (/android/.test(userAgent)) {
      setBrowserType("android");
    }
    
    // Listen for PWA install prompt (only fires in regular browsers)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log("PWA installable detected"); // Debug
    };
    
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    
    // Check if already installable (for some browsers)
    if ((window as any).deferredPrompt) {
      setIsInstallable(true);
      setDeferredPrompt((window as any).deferredPrompt);
    }
    
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    
    if (outcome === "accepted") {
      console.log("User accepted install");
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
      alert("Link copied! Open Chrome/Safari to install the app.");
    } catch (err) {
      alert("Please manually copy: " + window.location.href);
    }
  };

  const handleOpenInBrowser = () => {
    if (browserType === "ios") {
      alert("Tap the Share button (⬆️) → 'Open in Safari'");
    } else if (browserType === "android") {
      alert("Tap the 3 dots menu (⋮) → 'Open in Chrome Browser'");
    } else {
      alert("Copy the link and open in your browser");
    }
  };

  // Don't show if dismissed
  if (!isVisible) return null;

  // SHOW IN REGULAR BROWSERS (Chrome/Safari) - Install button
  if (isInstallable && !isInAppBrowser) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        zIndex: 999999,
      }}>
        <button
          onClick={handleInstall}
          style={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '50px',
            padding: '12px 24px',
            fontSize: '16px',
            fontWeight: 'bold',
            cursor: 'pointer',
            boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            transition: 'transform 0.2s',
          }}
          onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
          onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
        >
          📲 Install App
        </button>
      </div>
    );
  }

  // SHOW IN MESSENGER/TELEGRAM/INSTAGRAM - Browser warning
  if (isInAppBrowser) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '20px',
        left: '20px',
        right: '20px',
        zIndex: 999999,
      }}>
        <div style={{
          backgroundColor: '#FF6B35',
          borderRadius: '16px',
          padding: '16px',
          boxShadow: '0 10px 40px rgba(0,0,0,0.25)',
          animation: 'slideUp 0.3s ease-out',
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>⚠️</span>
              <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
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
              }}
            >
              ✕
            </button>
          </div>
          
          <p style={{ color: 'white', fontSize: '14px', marginBottom: '16px' }}>
            {browserType === 'ios' 
              ? "You're in Messenger/Telegram. Tap Share → Open in Safari to install our app."
              : "You're in Messenger/Telegram. Open in Chrome for the best experience."
            }
          </p>
          
          <div style={{ display: 'flex', gap: '10px' }}>
            <button
              onClick={handleCopyLink}
              style={{
                flex: 1,
                background: 'rgba(255,255,255,0.2)',
                border: '1px solid rgba(255,255,255,0.3)',
                borderRadius: '10px',
                padding: '10px',
                color: 'white',
                cursor: 'pointer',
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
                fontWeight: 'bold',
                cursor: 'pointer',
              }}
            >
              🌐 Open
            </button>
          </div>
        </div>
        
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

  return null;
}

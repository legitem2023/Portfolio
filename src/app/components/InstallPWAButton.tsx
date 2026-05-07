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
    console.log("User Agent:", userAgent);
    
    // Method 1: Check for custom tabs or app wrappers
    const isAndroid = /android/.test(userAgent);
    const isChrome = /chrome/.test(userAgent) && !/edg|opr|samsungbrowser/.test(userAgent);
    
    // Method 2: Check if running in standalone mode (already installed)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                        (window.navigator as any).standalone === true;
    
    // Method 3: Check for Telegram/other apps via JavaScript features
    const isTelegramWebView = !!(window as any).TelegramWebView || 
                              !!(window as any).TelegramGameProxy;
    
    // Method 4: Check referrer or opening source
    const isCustomTab = document.referrer.includes('android-app://') ||
                        document.referrer.includes('tg://');
    
    // Method 5: Check if beforeinstallprompt is available (will be false in custom tabs)
    // We'll detect by trying to access it after a delay
    
    // Determine if in restrictive environment
    const isRestrictive = isTelegramWebView || isCustomTab || 
                          (isAndroid && isChrome && !window.matchMedia('(display-mode: browser)').matches);
    
    setIsInAppBrowser(isRestrictive || isTelegramWebView || isCustomTab);
    
    console.log("Is restrictive environment:", isRestrictive);
    console.log("IsTelegramWebView:", isTelegramWebView);
    console.log("IsCustomTab:", isCustomTab);
    
    // Detect platform
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setBrowserType("ios");
    } else if (isAndroid) {
      setBrowserType("android");
    }
    
    // Listen for PWA install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      console.log("PWA installable detected");
    };
    
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    
    // Check if already installable
    if ((window as any).deferredPrompt) {
      setIsInstallable(true);
      setDeferredPrompt((window as any).deferredPrompt);
    }
    
    // Fallback: If we're in Android Chrome but no prompt after 3 seconds,
    // assume we're in a custom tab and show browser warning
    const timeout = setTimeout(() => {
      if (isAndroid && isChrome && !isInstallable && !isStandalone) {
        console.log("No install prompt detected - likely in custom tab");
        setIsInAppBrowser(true);
      }
    }, 3000);
    
    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      clearTimeout(timeout);
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
    } catch (err) {
      alert("Please manually copy: " + window.location.href);
    }
  };

  const handleOpenInBrowser = () => {
    const currentUrl = window.location.href;
    
    if (browserType === "ios") {
      alert("Tap Share → Open in Safari");
    } else if (browserType === "android") {
      // Try to open with Chrome intent
      try {
        window.location.href = `googlechrome://navigate?url=${encodeURIComponent(currentUrl)}`;
        setTimeout(() => {
          alert("If Chrome didn't open, tap the 3 dots → Open in Chrome Browser");
        }, 500);
      } catch (e) {
        alert("Tap the 3 dots menu (⋮) → Open in Chrome Browser");
      }
    }
  };

  // Don't show if dismissed or already installed
  if (!isVisible) return null;
  
  // Check if app is already installed
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || 
                       (window.navigator as any).standalone === true;
  if (isStandalone) return null;

  // Show install button (works in regular Chrome)
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
          }}
        >
          📲 Install App
        </button>
      </div>
    );
  }

  // Show browser warning for Telegram Custom Tabs
  if (isInAppBrowser || (!isInstallable && !isStandalone && browserType === "android")) {
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
        }}>
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '12px',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '24px' }}>📱</span>
              <h3 style={{ color: 'white', fontSize: '16px', fontWeight: 'bold', margin: 0 }}>
                Open in Chrome Browser
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
            Tap the 3 dots menu (⋮) in the top right corner → Open in Chrome Browser to install our app
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
              🌐 Open in Chrome
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}

import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';
import SVGComponent from "./SVGComponent";
const InstallPWAButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isInAppBrowser, setIsInAppBrowser] = useState<boolean>(false);
  const [isTelegram, setIsTelegram] = useState<boolean>(false);
  const [showButton, setShowButton] = useState<boolean>(true);

  useEffect(() => {
    // Enhanced detection for Telegram and other in-app browsers
    const detectInAppBrowser = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      
      // Telegram specific detection
      const isTelegramWeb = userAgent.includes('telegram');
      const isTelegramDesktop = userAgent.includes('tdesktop');
      const isTelegramIOS = userAgent.includes('telegram') && /iphone|ipad|ipod/.test(userAgent);
      
      // Detect other in-app browsers
      const isMessenger = userAgent.includes('messenger');
      const isFB = userAgent.includes('fbav') || userAgent.includes('fban');
      const isInstagram = userAgent.includes('instagram');
      const isTwitter = userAgent.includes('twitter');
      const isWeChat = userAgent.includes('micromessenger');
      const isLine = userAgent.includes('line');
      
      const telegram = isTelegramWeb || isTelegramDesktop || isTelegramIOS;
      const inApp = isMessenger || telegram || isFB || isInstagram || isTwitter || isWeChat || isLine;
      
      if (telegram) {
        setIsTelegram(true);
        setIsInAppBrowser(true);
        setDebugInfo('Telegram browser detected - showing external link option');
        
        // Telegram specifically blocks certain button handlers
        // Force show the button using DOM manipulation if needed
        setTimeout(() => {
          setShowButton(true);
        }, 100);
      } else if (inApp) {
        setIsInAppBrowser(true);
        setDebugInfo(`Detected in-app browser (${isMessenger ? 'Messenger' : 'Social App'}) - showing open in browser button`);
      }
      
      return inApp;
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired');
      setDebugInfo('Install prompt available');
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const checkIfInstalled = () => {
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setDebugInfo('Already installed as PWA');
        setIsInstallable(false);
        return true;
      }

      const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
      const isSafari = window.navigator.userAgent.includes('Safari') && !window.navigator.userAgent.includes('Chrome');

      if (isIos || isSafari) {
        setDebugInfo('iOS/Safari detected - use share menu → Add to Home Screen');
        setIsInstallable(false);
      }

      return false;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    detectInAppBrowser();
    checkIfInstalled();

    if (!('BeforeInstallPromptEvent' in window)) {
      setDebugInfo('PWA installation not supported in this browser');
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      (deferredPrompt as any).prompt();
      (deferredPrompt as any).userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === 'accepted') {
          console.log('User accepted the PWA installation');
          setDebugInfo('Installation accepted');
        } else {
          console.log('User dismissed the PWA installation');
          setDebugInfo('Installation dismissed');
        }
        setDeferredPrompt(null);
        setIsInstallable(false);
      });
    }
  };

  const handleManualInstall = () => {
    setDebugInfo('Manual installation: Use browser menu → Install App');
    alert('To install this app:\n1. Click the three dots in your browser\n2. Select "Install App" or "Add to Home Screen"\n3. Follow the prompts');
  };

  // Special handler for Telegram
  const handleTelegramOpen = () => {
    const currentUrl = window.location.href;
    
    // For Telegram on Android
    if (/android/i.test(navigator.userAgent)) {
      // Try multiple methods for Telegram
      const chromeIntent = `intent://${window.location.host}${window.location.pathname}${window.location.search}#Intent;scheme=https;package=com.android.chrome;end`;
      const chromeUrl = `googlechrome://${window.location.host}${window.location.pathname}${window.location.search}`;
      
      // First try to show instructions
      const shouldOpen = confirm(
        'Telegram browser doesn\'t support app installation.\n\n' +
        'Would you like to open in Chrome browser to install the app?'
      );
      
      if (shouldOpen) {
        // Try Chrome intent first
        window.location.href = chromeIntent;
        
        // Fallback
        setTimeout(() => {
          window.location.href = chromeUrl;
        }, 100);
        
        // Final fallback - copy link
        setTimeout(() => {
          navigator.clipboard.writeText(currentUrl);
          alert('Link copied! Please paste into Chrome browser.');
        }, 500);
      }
    } 
    // For Telegram on iOS
    else if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
      navigator.clipboard.writeText(currentUrl);
      alert(
        '📱 Telegram on iOS doesn\'t support app installation.\n\n' +
        '✓ Link copied to clipboard!\n\n' +
        'Please:\n' +
        '1. Open Safari or Chrome browser\n' +
        '2. Paste the link\n' +
        '3. Tap Share button → "Add to Home Screen"'
      );
    }
    else {
      // Desktop Telegram
      navigator.clipboard.writeText(currentUrl);
      alert(
        'Please open this link in Chrome or Edge browser:\n\n' +
        `${currentUrl}\n\n` +
        'Link copied to clipboard!'
      );
    }
  };

  const handleOpenInBrowser = () => {
    const currentUrl = window.location.href;
    
    // For Android
    if (/android/i.test(navigator.userAgent)) {
      const chromeIntent = `intent://${window.location.host}${window.location.pathname}${window.location.search}#Intent;scheme=https;package=com.android.chrome;end`;
      window.location.href = chromeIntent;
      
      setTimeout(() => {
        const chromeUrl = `googlechrome://${window.location.host}${window.location.pathname}${window.location.search}`;
        window.location.href = chromeUrl;
      }, 100);
    } 
    // For iOS
    else if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
      navigator.clipboard.writeText(currentUrl);
      alert(`Please open this link in Safari:\n\n${currentUrl}\n\nLink copied to clipboard!`);
    }
    else {
      navigator.clipboard.writeText(currentUrl);
      alert(`Please open this link in Chrome:\n\n${currentUrl}\n\nLink copied to clipboard!`);
    }
  };

  const showDebugButton = process.env.NODE_ENV === 'development' && !deferredPrompt;

  // Force render for Telegram
  if (!showButton && !isTelegram) return null;

  return (
    <>
      {/* Special Telegram button */}
      {isTelegram && (
        <>
          <button 
            onClick={handleTelegramOpen} 
            className="install_button telegram"
            id="telegram-install-button"
          >
            <span className="icon">
              <Icon icon="logos:telegram"/>
            </span>
            <span className="text">Open in Chrome → Install</span> 
          </button>
          
          {/* Additional helpful info for Telegram users */}
          <div className="telegram-info">
            <span className="info-icon">ℹ️</span>
            <span className="info-text">
              Telegram browser doesn&apos;t support app installation. Open in Chrome to install!
            </span>
          </div>
        </>
      )}

      {/* Show for other in-app browsers (Messenger, etc.) */}
      {!isTelegram && isInAppBrowser && (
        <button onClick={handleOpenInBrowser} className="install_button chrome">
          {/* <span className="icon">
            <Icon icon="logos:google-chrome"/>
          </span> */}
          <span className="icon">
            <SVGComponent className="w-12 h-12 text-gray-500 hover:text-blue-500 transition" />
          </span>
          <span className="text">Open in Browser</span> 
        </button>
      )}

      {/* Show normal install button only when not in in-app browser */}
      {!isInAppBrowser && deferredPrompt && (
        <button onClick={handleInstallClick} className="install_button">
          <span className="icon">
            <SVGComponent className="w-12 h-12 text-gray-500 hover:text-blue-500 transition" />
          </span>
            <span className="text">Install App</span> 
        </button>
      )}

      {/* Show manual install as fallback */}
      {!isInAppBrowser && showDebugButton && (
        <button onClick={handleManualInstall} className="install_button debug">
          <span className="icon">
            <SVGComponent className="w-12 h-12 text-gray-500 hover:text-blue-500 transition" />
          </span>
          <span className="text">Install (Manual)</span> 
        </button>
      )}

      {process.env.NODE_ENV === 'development' && debugInfo && (
        <div style={{
          fontSize: '12px',
          color: '#666',
          margin: '5px',
          padding: '5px',
          background: '#f5f5f5',
          borderRadius: '3px'
        }}>
          Debug: {debugInfo}
        </div>
      )}

      <style jsx>{`
        .install_button {
          position: relative;
          display: inline-flex;
          gap: 8px;
          margin: 10px 5px;
          width: auto;
          min-width: 200px;
          padding: 0px;
          height: 45px;
          font-size: 16px;
          font-weight: bold;
          font-family: 'Segoe UI', sans-serif;
          color: #fff;
          background: linear-gradient(45deg, #b57edc, #d8b4fe);
          border: none;
          border-radius: 5px;
          cursor: pointer;
          box-shadow: inset 2px 2px 5px rgba(255, 255, 255, 0.2),
                      inset -2px -2px 5px rgba(0, 0, 0, 0.4),
                      0 4px 6px rgba(0, 0, 0, 0.2);
          text-shadow: 1px 1px 0 #4a004a;
          transition: transform 0.2s ease, background 0.3s ease;
          overflow: hidden;
        }

        .install_button:hover {
          background: linear-gradient(45deg, #c084fc, #e0b0ff);
          transform: translateY(-2px);
        }

        .install_button.telegram {
          background: linear-gradient(45deg, #2aabee, #229ed9);
          animation: pulse 2s infinite;
        }

        .install_button.telegram:hover {
          background: linear-gradient(45deg, #3bb3f0, #2aa3d9);
        }

        .install_button.chrome {
          background: linear-gradient(45deg, #4285f4, #34a853);
        }

        .install_button.chrome:hover {
          background: linear-gradient(45deg, #5a95f5, #4bc06a);
        }

        .install_button.debug {
          background: linear-gradient(45deg, #8b5cf6, #a78bfa);
        }

        .install_button:active {
          transform: scale(0.98);
          box-shadow: inset 1px 1px 3px rgba(255, 255, 255, 0.2),
                      inset -1px -1px 3px rgba(0, 0, 0, 0.4),
                      0 3px 4px rgba(0, 0, 0, 0.2);
        }

        .text {
          border-radius: 0px 8px 8px 0px;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          width: 100%;
          box-sizing: border-box;
          height: 45px;
          padding: 0 15px;
          white-space: nowrap;
        }

        .icon {
          color: #707070;
          height: 45px;
          background: linear-gradient(-45deg, #ffffff, #f1f1f1);
          padding: 5px;
          border-radius: 5px 0px 0px 5px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 24px;
          width: 45px;
          box-shadow: inset 2px 2px 5px rgba(255, 255, 255, 0.2),
                      inset -2px -2px 5px rgba(0, 0, 0, 0.4),
                      0 4px 6px rgba(0, 0, 0, 0.2);
        }

        .telegram-info {
          display: flex;
          align-items: center;
          gap: 10px;
          margin: 10px 5px;
          padding: 10px;
          background: #e8f4fd;
          border-left: 4px solid #2aabee;
          border-radius: 5px;
          font-size: 13px;
          color: #1a5d8f;
          max-width: 300px;
        }

        .info-icon {
          font-size: 18px;
        }

        .info-text {
          flex: 1;
          line-height: 1.4;
        }

        @keyframes pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(42, 171, 238, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(42, 171, 238, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(42, 171, 238, 0);
          }
        }

        @media (max-width: 480px) {
          .install_button {
            min-width: 180px;
            font-size: 14px;
          }
          
          .text {
            padding: 0 10px;
            white-space: normal;
          }
          
          .telegram-info {
            font-size: 11px;
          }
        }
      `}</style>
    </>
  );
};

export default InstallPWAButton;

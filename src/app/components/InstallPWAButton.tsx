import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';

const InstallPWAButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<string>('');
  const [isInAppBrowser, setIsInAppBrowser] = useState<boolean>(false);

  useEffect(() => {
    // Detect if in Messenger, Telegram, or other in-app browsers
    const detectInAppBrowser = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      
      // Detect common in-app browsers
      const isMessenger = userAgent.includes('messenger');
      const isTelegram = userAgent.includes('telegram');
      const isFB = userAgent.includes('fbav') || userAgent.includes('fban');
      const isInstagram = userAgent.includes('instagram');
      const isTwitter = userAgent.includes('twitter');
      const isWeChat = userAgent.includes('micromessenger');
      
      const inApp = isMessenger || isTelegram || isFB || isInstagram || isTwitter || isWeChat;
      
      if (inApp) {
        setIsInAppBrowser(true);
        setDebugInfo(`Detected in-app browser (${isMessenger ? 'Messenger' : isTelegram ? 'Telegram' : 'Social App'}) - showing open in Chrome button`);
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

  const handleOpenInChrome = () => {
    const currentUrl = window.location.href;
    
    // For Android
    if (/android/i.test(navigator.userAgent)) {
      // Try to open in Chrome
      const chromeUrl = `googlechrome://${window.location.host}${window.location.pathname}${window.location.search}`;
      window.location.href = chromeUrl;
      
      // Fallback to intent
      setTimeout(() => {
        window.location.href = `intent://${window.location.host}${window.location.pathname}${window.location.search}#Intent;scheme=https;package=com.android.chrome;end`;
      }, 100);
    } 
    // For iOS
    else if (/iphone|ipad|ipod/i.test(navigator.userAgent)) {
      alert(`Please open this link in Safari or Chrome:\n\n${currentUrl}\n\nTap and hold the link to copy, then paste in your browser.`);
    }
    else {
      alert(`Please open this link in Chrome or Safari:\n\n${currentUrl}`);
    }
  };

  const showDebugButton = process.env.NODE_ENV === 'development' && !deferredPrompt;

  return (
    <>
      {/* Show Chrome/External Browser button when in Messenger/Telegram */}
      {isInAppBrowser && (
        <button onClick={handleOpenInChrome} className="install_button chrome">
          <span className="icon">
            <Icon icon="logos:google-chrome"/>
          </span>
          <span className="text">Open in Chrome</span> 
        </button>
      )}

      {/* Show normal install button only when not in in-app browser */}
      {!isInAppBrowser && deferredPrompt && (
        <button onClick={handleInstallClick} className="install_button">
          <span className="icon">
            <Icon icon="material-symbols:download-sharp"/>
          </span>
          <span className="text">Install App</span> 
        </button>
      )}

      {/* Show manual install as fallback */}
      {!isInAppBrowser && showDebugButton && (
        <button onClick={handleManualInstall} className="install_button debug">
          <span className="icon">
            <Icon icon="material-symbols:download-sharp"/>
          </span>
          <span className="text">Install (Manual)</span> 
        </button>
      )}

      {/* Optional: Information banner for in-app browsers */}
      {isInAppBrowser && (
        <div style={{
          fontSize: '12px',
          color: '#666',
          margin: '5px',
          padding: '8px',
          background: '#fff3cd',
          borderRadius: '5px',
          border: '1px solid #ffc107',
          textAlign: 'center'
        }}>
          ℹ️ For the best experience, open this app in Chrome or Safari browser
        </div>
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
          margin: 5px;
          width: 180px;
          padding: 0px;
          height: 45px;
          font-size: 18px;
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
          font-size: 18px;
          width: 40px;
          box-shadow: inset 2px 2px 5px rgba(255, 255, 255, 0.2),
                      inset -2px -2px 5px rgba(0, 0, 0, 0.4),
                      0 4px 6px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </>
  );
};

export default InstallPWAButton;

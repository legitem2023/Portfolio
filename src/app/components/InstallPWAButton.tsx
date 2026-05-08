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
  const [installState, setInstallState] = useState<'idle' | 'installing'>('idle');
  const [isAppInstalled, setIsAppInstalled] = useState<boolean>(false);

  useEffect(() => {
    // Check if app is already installed
    const checkIfInstalled = () => {
      // Check for standalone mode (PWA installed)
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      
      // iOS specific check
      const isIosStandalone = (window.navigator as any).standalone === true;
      
      const installed = isStandalone || isIosStandalone;
      
      if (installed) {
        setIsAppInstalled(true);
        setShowButton(false);
        setDebugInfo('App is installed - button hidden');
      }
      
      return installed;
    };

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
        
        setTimeout(() => {
          setShowButton(true);
        }, 100);
      } else if (inApp) {
        setIsInAppBrowser(true);
        setDebugInfo(`Detected in-app browser - showing open in browser button`);
      }
      
      return inApp;
    };

    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired');
      
      // Don't show install prompt if app is already installed
      if (isAppInstalled) {
        e.preventDefault();
        return;
      }
      
      setDebugInfo('Install prompt available');
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      console.log('App installed successfully');
      setDebugInfo('App installed! Button will now be hidden');
      setIsAppInstalled(true);
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowButton(false); // Immediately hide the button
      
      // Store installation state in localStorage to persist across page reloads
      localStorage.setItem('pwa_installed', 'true');
    };

    // Check localStorage for previous installation
    const checkStoredInstallation = () => {
      const wasInstalled = localStorage.getItem('pwa_installed') === 'true';
      if (wasInstalled) {
        setIsAppInstalled(true);
        setShowButton(false);
        setDebugInfo('Previously installed - button hidden');
        return true;
      }
      return false;
    };

    // Check iOS standalone mode
    const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
    const isSafari = window.navigator.userAgent.includes('Safari') && !window.navigator.userAgent.includes('Chrome');

    if (isIos || isSafari) {
      setDebugInfo('iOS/Safari detected - use share menu → Add to Home Screen');
      setIsInstallable(false);
    }

    // Check if already installed
    const alreadyInstalled = checkIfInstalled();
    const storedInstalled = checkStoredInstallation();
    
    if (!alreadyInstalled && !storedInstalled) {
      // Only add event listeners if not installed
      window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.addEventListener('appinstalled', handleAppInstalled);
    }
    
    detectInAppBrowser();

    if (!('BeforeInstallPromptEvent' in window)) {
      setDebugInfo('PWA installation not supported in this browser');
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, [isAppInstalled]); // Add isAppInstalled to dependencies

  // Listen for display-mode changes (user might uninstall and come back)
  useEffect(() => {
    const displayModeHandler = (e: MediaQueryListEvent) => {
      if (!e.matches) {
        // User might have uninstalled the app
        const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
        if (!isStandalone) {
          // Check if we should show the button again
          const storedInstalled = localStorage.getItem('pwa_installed');
          if (storedInstalled === 'true') {
            // User uninstalled, clear the flag
            localStorage.removeItem('pwa_installed');
            setIsAppInstalled(false);
            setShowButton(true);
            setDebugInfo('App was uninstalled - button reappeared');
          }
        }
      }
    };

    const mediaQuery = window.matchMedia('(display-mode: standalone)');
    mediaQuery.addEventListener('change', displayModeHandler);

    return () => {
      mediaQuery.removeEventListener('change', displayModeHandler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt && !isAppInstalled) {
      setInstallState('installing');
      setDebugInfo('Showing install prompt...');
      
      (deferredPrompt as any).prompt();
      const { outcome } = await (deferredPrompt as any).userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the PWA installation');
        setDebugInfo('Installation accepted - look for app on home screen');
        // Don't hide immediately, wait for appinstalled event
      } else {
        console.log('User dismissed the PWA installation');
        setDebugInfo('Installation dismissed');
        setInstallState('idle');
      }
      setDeferredPrompt(null);
    }
  };

  const handleManualInstall = () => {
    setDebugInfo('Manual installation: Use browser menu → Install App');
    alert('To install this app:\n1. Click the three dots in your browser\n2. Select "Install App" or "Add to Home Screen"\n3. Follow the prompts\n\nIf you don\'t see "Install App", try:\n• Updating Chrome\n• Clearing Chrome cache\n• Checking if app meets PWA requirements');
  };

  // Special handler for Telegram
  const handleTelegramOpen = () => {
    const currentUrl = window.location.href;
    
    if (/android/i.test(navigator.userAgent)) {
      const chromeIntent = `intent://${window.location.host}${window.location.pathname}${window.location.search}#Intent;scheme=https;package=com.android.chrome;end`;
      const chromeUrl = `googlechrome://${window.location.host}${window.location.pathname}${window.location.search}`;
      
      const shouldOpen = confirm(
        'Telegram browser doesn\'t support app installation.\n\n' +
        'Would you like to open in Chrome browser to install the app?'
      );
      
      if (shouldOpen) {
        window.location.href = chromeIntent;
        setTimeout(() => {
          window.location.href = chromeUrl;
        }, 100);
        setTimeout(() => {
          navigator.clipboard.writeText(currentUrl);
          alert('Link copied! Please paste into Chrome browser.');
        }, 500);
      }
    } 
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
    
    if (/android/i.test(navigator.userAgent)) {
      const chromeIntent = `intent://${window.location.host}${window.location.pathname}${window.location.search}#Intent;scheme=https;package=com.android.chrome;end`;
      window.location.href = chromeIntent;
      
      setTimeout(() => {
        const chromeUrl = `googlechrome://${window.location.host}${window.location.pathname}${window.location.search}`;
        window.location.href = chromeUrl;
      }, 100);
    } 
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

  // Don't render anything if app is installed
  if (isAppInstalled) return null;
  
  // Don't render if button is explicitly hidden
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
          <span className="icon">
            <SVGComponent className="w-8 h-8 text-zinc-500 hover:text-blue-500 transition" />
          </span>
          <span className="text">Open in Browser</span> 
        </button>
      )}

      {/* Show normal install button - Only if app is not installed */}
      {!isInAppBrowser && !isAppInstalled && (deferredPrompt || installState === 'installing') && (
        <button 
          onClick={handleInstallClick} 
          className="install_button"
          disabled={installState === 'installing'}
          style={{ opacity: installState === 'installing' ? 0.7 : 1 }}
        >
          <span className="icon">
            <SVGComponent className="w-8 h-8 text-zinc-500 hover:text-blue-500 transition" />
          </span>
          <span className="text">
            {installState === 'installing' ? 'Installing...' : 'Install App'}
          </span> 
        </button>
      )}

      {/* Show manual install as fallback */}
      {!isInAppBrowser && !isAppInstalled && showDebugButton && (
        <button onClick={handleManualInstall} className="install_button debug">
          <span className="icon">
            <SVGComponent className="w-8 h-8 text-zinc-500 hover:text-blue-500 transition" />
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

        .install_button:disabled {
          cursor: not-allowed;
          transform: none;
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

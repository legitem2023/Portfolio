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
  const [installAttempted, setInstallAttempted] = useState<boolean>(false);
  const [showWhereToFind, setShowWhereToFind] = useState<boolean>(false);

  useEffect(() => {
    // Enhanced detection for Telegram and other in-app browsers
    const detectInAppBrowser = () => {
      const userAgent = navigator.userAgent.toLowerCase();
      
      const isTelegramWeb = userAgent.includes('telegram');
      const isTelegramDesktop = userAgent.includes('tdesktop');
      const isTelegramIOS = userAgent.includes('telegram') && /iphone|ipad|ipod/.test(userAgent);
      
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
      setDebugInfo('✓ Install prompt available - Click install button');
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
      setInstallAttempted(false);
      setShowWhereToFind(false);
    };

    // Listen for successful installation
    const handleAppInstalled = () => {
      console.log('✅ App installed successfully!');
      setDebugInfo('✅ Installation complete! The app is now on your device');
      setIsInstallable(false);
      setDeferredPrompt(null);
      setShowWhereToFind(true);
      
      // Show alert with location info
      setTimeout(() => {
        alert('✅ App Installed Successfully!\n\n📍 Where to find it:\n• On your HOME SCREEN (swipe left/right)\n• In your APP DRAWER\n• Search for the app name\n\nIf you still can\'t find it, Chrome may have installed it in a folder called "Apps" or "Web Apps"');
      }, 1000);
    };

    const checkIfInstalled = () => {
      // Check if already installed and running standalone
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setDebugInfo('✓ App is already installed and running');
        setIsInstallable(false);
        return true;
      }

      // Check if app is installed but opened in browser
      // Some browsers store this in localStorage
      const wasInstalled = localStorage.getItem('pwa_installed');
      if (wasInstalled === 'true') {
        setDebugInfo('✓ App appears to be installed (detected from previous session)');
        setShowWhereToFind(true);
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
    window.addEventListener('appinstalled', handleAppInstalled);
    detectInAppBrowser();
    checkIfInstalled();

    if (!('BeforeInstallPromptEvent' in window)) {
      setDebugInfo('PWA installation not supported in this browser');
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      setDebugInfo('📲 Opening Chrome install dialog...');
      
      (deferredPrompt as any).prompt();
      const { outcome } = await (deferredPrompt as any).userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the PWA installation');
        setDebugInfo('✓ Installation started! Look for Chrome confirmation dialog');
        setInstallAttempted(true);
        
        // Store that installation was attempted
        localStorage.setItem('pwa_install_attempted', 'true');
        
        // Add a reminder to check home screen after 5 seconds
        setTimeout(() => {
          if (!window.matchMedia('(display-mode: standalone)').matches) {
            setShowWhereToFind(true);
            setDebugInfo('⏳ Installation may be complete. Check your home screen and app drawer!');
          }
        }, 5000);
        
        // Show helpful message
        alert('📲 Installation Started!\n\nCheck for:\n1. Chrome\'s installation confirmation dialog\n2. Progress indicator in notification bar\n3. App icon appearing on your home screen\n\nIf nothing happens, the app may already be installed!');
        
      } else {
        console.log('User dismissed the PWA installation');
        setDebugInfo('Installation cancelled - click button again to retry');
      }
      setDeferredPrompt(null);
    }
  };

  const handleManualInstall = () => {
    setDebugInfo('Showing manual installation instructions');
    alert('📱 Manual Installation Steps:\n\nMETHOD 1 - Chrome Menu:\n• Tap the three dots (⋮) in Chrome\n• Select "Install App" or "Add to Home Screen"\n• Follow prompts\n\nMETHOD 2 - Check if already installed:\n• Look for app icon on home screen\n• Check app drawer\n• Search phone for app name\n\nMETHOD 3 - Force Chrome to show install:\n• Clear Chrome cache\n• Reload this page 3 times\n• Chrome menu → Install App');
  };

  const handleFindInstalledApp = () => {
    alert('🔍 Where to find your installed app:\n\n📱 ANDROID:\n• Home screen (swipe left/right - check all pages)\n• App drawer (swipe up from bottom)\n• Chrome menu → Apps\n• Settings → Apps → Look for your app\n• Search your phone for "' + window.location.hostname + '"\n\n📱 IPHONE:\n• Home screen (swipe to last page)\n• App Library (swipe left past all pages)\n• Search by swiping down on home screen\n\n💡 TIP: Sometimes Chrome installs the app in a folder called "Web Apps" or "Chrome Apps"');
  };

  const handleCheckIfInstalled = () => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      alert('✅ App IS installed and currently running in standalone mode!');
      setDebugInfo('✓ App is installed and running standalone');
    } else {
      alert('❌ App does not appear to be installed yet.\n\nTry:\n1. Click the Install button again\n2. Or use Chrome menu (⋮) → "Install App"\n3. Or check if Chrome completed the installation');
      setDebugInfo('❌ App not detected as installed');
    }
  };

  // Help users find the app after installation attempt
  if (showWhereToFind && !isInstallable) {
    return (
      <>
        <div className="find-app-panel">
          <div className="find-icon">🎉</div>
          <div className="find-content">
            <strong>App Installation Completed!</strong>
            <p>Your app has been installed. Here&apos;s where to find it:</p>
            <ul>
              <li>📱 <strong>Home Screen</strong> - Check all pages, especially the last page</li>
              <li>📂 <strong>App Drawer</strong> - Swipe up from bottom of screen</li>
              <li>🔍 <strong>Search</strong> - Use phone search for app name</li>
              <li>🌐 <strong>Chrome Apps</strong> - Chrome menu → Apps</li>
            </ul>
            <div className="find-buttons">
              <button onClick={handleFindInstalledApp} className="help-button">
                🔍 More Help Finding It
              </button>
              <button onClick={handleCheckIfInstalled} className="check-button">
                ✓ Verify Installation
              </button>
            </div>
          </div>
        </div>
        
        <style jsx>{`
          .find-app-panel {
            display: flex;
            gap: 12px;
            margin: 10px 5px;
            padding: 15px;
            background: linear-gradient(135deg, #e8f5e9, #c8e6c9);
            border-left: 4px solid #4caf50;
            border-radius: 8px;
            max-width: 350px;
            animation: slideIn 0.5s ease;
          }
          
          @keyframes slideIn {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }
          
          .find-icon {
            font-size: 32px;
          }
          
          .find-content {
            flex: 1;
            font-size: 13px;
            line-height: 1.5;
          }
          
          .find-content p {
            margin: 5px 0;
            color: #2e7d32;
          }
          
          .find-content ul {
            margin: 5px 0;
            padding-left: 20px;
          }
          
          .find-content li {
            margin: 3px 0;
            color: #1b5e20;
          }
          
          .find-buttons {
            display: flex;
            gap: 8px;
            margin-top: 10px;
          }
          
          .help-button, .check-button {
            padding: 5px 10px;
            border: none;
            border-radius: 4px;
            font-size: 12px;
            cursor: pointer;
            transition: all 0.2s;
          }
          
          .help-button {
            background: #ff9800;
            color: white;
          }
          
          .check-button {
            background: #2196f3;
            color: white;
          }
          
          .help-button:hover, .check-button:hover {
            transform: translateY(-1px);
          }
        `}</style>
      </>
    );
  }

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

  if (!showButton && !isTelegram) return null;

  return (
    <>
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

      {!isTelegram && isInAppBrowser && (
        <button onClick={handleOpenInBrowser} className="install_button chrome">
          <span className="icon">
            <SVGComponent className="w-8 h-8 text-zinc-500 hover:text-blue-500 transition" />
          </span>
          <span className="text">Open in Browser</span> 
        </button>
      )}

      {!isInAppBrowser && deferredPrompt && (
        <button onClick={handleInstallClick} className="install_button">
          <span className="icon">
            <SVGComponent className="w-8 h-8 text-zinc-500 hover:text-blue-500 transition" />
          </span>
          <span className="text">Install App</span> 
        </button>
      )}

      {!isInAppBrowser && showDebugButton && (
        <>
          <button onClick={handleManualInstall} className="install_button debug">
            <span className="icon">
              <SVGComponent className="w-8 h-8 text-zinc-500 hover:text-blue-500 transition" />
            </span>
            <span className="text">Install (Manual)</span> 
          </button>
          
          <button onClick={handleCheckIfInstalled} className="install_button debug" style={{background: 'linear-gradient(45deg, #4caf50, #8bc34a)'}}>
            <span className="text">Check if Installed</span> 
          </button>
        </>
      )}

      {installAttempted && !showWhereToFind && !isInAppBrowser && (
        <div className="reminder">
          <span>💡</span>
          <span>Installation started! Check your home screen and app drawer for the app icon.</span>
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
        
        .reminder {
          display: flex;
          align-items: center;
          gap: 8px;
          margin: 10px 5px;
          padding: 10px;
          background: #fff3cd;
          border-left: 4px solid #ffc107;
          border-radius: 5px;
          font-size: 12px;
          color: #856404;
          max-width: 350px;
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

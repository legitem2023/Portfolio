import { useEffect, useState } from 'react';
import { Icon } from '@iconify/react';

const InstallPWAButton: React.FC = () => {
  const [deferredPrompt, setDeferredPrompt] = useState<Event | null>(null);
  const [isInstallable, setIsInstallable] = useState<boolean>(false);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      console.log('beforeinstallprompt event fired');
      setDebugInfo('Install prompt available');
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    const checkIfInstalled = () => {
      // Check if already installed
      if (window.matchMedia('(display-mode: standalone)').matches) {
        setDebugInfo('Already installed as PWA');
        setIsInstallable(false);
        return true;
      }
      
      // Check for iOS (which uses different mechanism)
      const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
      const isSafari = window.navigator.userAgent.includes('Safari') && !window.navigator.userAgent.includes('Chrome');
      
      if (isIos || isSafari) {
        setDebugInfo('iOS/Safari detected - use share menu → Add to Home Screen');
        setIsInstallable(false);
      }
      
      return false;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check installation status on component mount
    checkIfInstalled();

    // Additional check for PWA capabilities
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
    // Provide instructions for manual installation
    setDebugInfo('Manual installation: Use browser menu → Install App');
    alert('To install this app:\n1. Click the three dots in your browser\n2. Select "Install App" or "Add to Home Screen"\n3. Follow the prompts');
  };

  // For debugging: show button in development even if prompt isn't available
  const showDebugButton = process.env.NODE_ENV === 'development' && !deferredPrompt;

  return (
    <>
      {deferredPrompt && (
        <button onClick={handleInstallClick} className="install_button">
          <span className="icon">
            <Icon icon="material-symbols:download-sharp"/>
          </span>
          <span className="text">Install App</span> 
        </button>
      )}
      
      {/* Fallback for browsers that don't trigger beforeinstallprompt immediately */}
      {showDebugButton && (
        <button onClick={handleManualInstall} className="install_button debug">
          <span className="icon">
            <Icon icon="material-symbols:download-sharp"/>
          </span>
          <span className="text">Install (Manual)</span> 
        </button>
      )}

      {/* Debug info display */}
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
          width: 150px;
          padding: 0px;
          height: 45px;
          font-size: 18px;
          font-weight: bold;
          font-family: 'Segoe UI', sans-serif;
          color: #fff;
          background: linear-gradient(45deg, rgb(23, 92, 40), rgb(29, 112, 57));
          border: none;
          border-radius: 5px;
          cursor: pointer;
          box-shadow: inset 2px 2px 5px rgba(255, 255, 255, 0.2),
                      inset -2px -2px 5px rgba(0, 0, 0, 0.4),
                      0 4px 6px rgba(0, 0, 0, 0.2);
          text-shadow: 1px 1px 0 #000;
          transition: transform 0.2s ease;
          overflow: hidden;
        }

        .install_button.debug {
          background: linear-gradient(45deg, rgb(92, 23, 23), rgb(112, 29, 29));
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
          box-shadow: inset 2px 2px 5px rgba(255, 255, 255, 0.2),
                      inset -2px -2px 5px rgba(0, 0, 0, 0.4),
                      0 4px 6px rgba(0, 0, 0, 0.2);
        }
      `}</style>
    </>
  );
};

export default InstallPWAButton;

'use client';

import { useEffect } from 'react';

export default function PWAInitializer() {
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      if (!(window as any).__deferredPrompt) {
        console.log('PWA: Storing install prompt globally');
        (window as any).__deferredPrompt = e;
        // Notify any late-loading PWA buttons
        window.dispatchEvent(new CustomEvent('pwa-ready'));
      }
    };
    
    window.addEventListener('beforeinstallprompt', handler);
    
    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
    };
  }, []);

  return null; // This component doesn't render anything
}

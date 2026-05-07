"use client";

import { useEffect, useState } from "react";

export default function PWAInitializer() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  useEffect(() => {
    // Listen for normal PWA install event
    window.addEventListener("beforeinstallprompt", (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      // Store the event globally so InstallPWAButton can access it
      (window as any).deferredPrompt = e;
    });

    // Cleanup
    return () => {
      window.removeEventListener("beforeinstallprompt", () => {});
    };
  }, []);

  return null;
}

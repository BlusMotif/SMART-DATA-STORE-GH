import { useState, useEffect } from "react";
import { X } from "lucide-react";
import logoLight from "@assets/logo_1765774201026.png";
import { Button } from "@/components/ui/button";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallButton, setShowInstallButton] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    const checkInstalled = () => {
      if (window.matchMedia("(display-mode: standalone)").matches) {
        setIsInstalled(true);
        return true;
      }
      if ((navigator as unknown as { standalone?: boolean }).standalone === true) {
        setIsInstalled(true);
        return true;
      }
      return false;
    };

    if (checkInstalled()) return;

    const dismissed = localStorage.getItem("pwa-install-dismissed");
    if (dismissed) {
      const dismissedTime = parseInt(dismissed, 10);
      // Show again after 1 hour for testing (was 7 days)
      if (Date.now() - dismissedTime < 1 * 60 * 60 * 1000) {
        setDismissed(true);
        return;
      }
    }

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowInstallButton(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setShowInstallButton(false);
      setDeferredPrompt(null);
    });

    // For development/testing: show install button after 3 seconds if not installed
    // and no beforeinstallprompt event has fired
    const devTimer = setTimeout(() => {
      if (!isInstalled && !dismissed && !showInstallButton) {
        console.log("PWA: Showing install prompt for development/testing");
        setShowInstallButton(true);
      }
    }, 3000);

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
      clearTimeout(devTimer);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      // Use the native install prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;

      if (outcome === "accepted") {
        setIsInstalled(true);
      }

      setDeferredPrompt(null);
      setShowInstallButton(false);
    } else {
      // Fallback for development/testing - try to trigger manual install
      console.log("PWA: No deferred prompt available, attempting manual install");
      // On some browsers, we can try to show instructions
      alert("To install this app:\n\n1. Click the menu button (⋮) in your browser\n2. Select 'Add to Home screen' or 'Install app'\n3. Follow the prompts to install");
      setShowInstallButton(false);
      setDismissed(true);
      localStorage.setItem("pwa-install-dismissed", Date.now().toString());
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShowInstallButton(false);
    localStorage.setItem("pwa-install-dismissed", Date.now().toString());
  };

  if (isInstalled || dismissed || !showInstallButton) {
    return null;
  }

  return (
    <div 
      className="fixed top-0 left-0 right-0 bg-white border-b shadow-md p-3 z-[60]"
      data-testid="pwa-install-prompt"
    >
      <div className="container mx-auto max-w-7xl flex items-center gap-3">
        <div className="flex-shrink-0 w-10 h-10 rounded-lg overflow-hidden">
          <img 
            src={logoLight} 
            alt="App Icon" 
            className="w-full h-full object-contain"
          />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm" data-testid="text-install-title">Install App</h3>
          <p className="text-xs text-muted-foreground">
            Install for quick access and offline use.
          </p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Button 
            size="sm" 
            onClick={handleInstallClick}
            data-testid="button-install-app"
          >
            Install
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleDismiss}
            data-testid="button-close-install"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}

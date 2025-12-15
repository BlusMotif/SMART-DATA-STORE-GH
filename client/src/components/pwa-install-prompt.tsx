import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, X } from "lucide-react";

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
      if (Date.now() - dismissedTime < 7 * 24 * 60 * 60 * 1000) {
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

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === "accepted") {
      setIsInstalled(true);
    }

    setDeferredPrompt(null);
    setShowInstallButton(false);
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
      className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-card border rounded-lg shadow-lg p-4 z-50"
      data-testid="pwa-install-prompt"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
          <Download className="w-5 h-5 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm" data-testid="text-install-title">Install App</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Install SMART DATA STORE GH for quick access and offline use.
          </p>
          <div className="flex items-center gap-2 mt-3">
            <Button 
              size="sm" 
              onClick={handleInstallClick}
              data-testid="button-install-app"
            >
              Install
            </Button>
            <Button 
              size="sm" 
              variant="ghost" 
              onClick={handleDismiss}
              data-testid="button-dismiss-install"
            >
              Not now
            </Button>
          </div>
        </div>
        <Button
          size="icon"
          variant="ghost"
          className="flex-shrink-0 h-6 w-6"
          onClick={handleDismiss}
          data-testid="button-close-install"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Don't show if already dismissed this session
    if (sessionStorage.getItem('fiestamatic-install-dismissed')) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      // Show banner after a short delay so it doesn't feel like a popup ambush
      setTimeout(() => setVisible(true), 2500);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setVisible(false);
    }
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    setDismissed(true);
    sessionStorage.setItem('fiestamatic-install-dismissed', '1');
  };

  if (!visible || dismissed) return null;

  return (
    <div
      className="fixed bottom-[88px] left-3 right-3 z-50 animate-in slide-in-from-bottom-4 duration-300"
      role="banner"
      aria-label="Install Fiestamatic"
    >
      <div className="bg-card border border-border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-4 flex items-center gap-3">
        <img
          src="/icon-192.png"
          alt="Fiestamatic"
          className="w-12 h-12 rounded-xl shrink-0 shadow-sm"
        />
        <div className="flex-1 min-w-0">
          <p className="font-display font-bold text-foreground text-sm leading-tight">Add to Home Screen</p>
          <p className="text-muted-foreground text-xs mt-0.5 leading-snug">Get quick access to Fiestamatic anytime</p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={handleInstall}
            data-testid="button-install-app"
            className="bg-primary text-primary-foreground rounded-xl px-4 py-2.5 text-sm font-bold flex items-center gap-1.5 shadow-sm active:scale-95 transition-transform"
          >
            <Download className="w-4 h-4" />
            Install
          </button>
          <button
            onClick={handleDismiss}
            data-testid="button-dismiss-install"
            className="text-muted-foreground hover:text-foreground p-2 rounded-xl hover:bg-muted transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}

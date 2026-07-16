import { useState, useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { BottomNav } from '@/components/Navigation';
import Home from '@/pages/Home';
import MapPage from '@/pages/Map';
import Community from '@/pages/Community';
import NotFound from '@/pages/not-found';
import { Download, X } from 'lucide-react';

const queryClient = new QueryClient();

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function InstallBanner() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem('fiestamatic-install-dismissed')) return;
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setTimeout(() => setVisible(true), 2500);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setVisible(false);
    setDeferredPrompt(null);
  };

  const handleDismiss = () => {
    setVisible(false);
    sessionStorage.setItem('fiestamatic-install-dismissed', '1');
  };

  if (!visible) return null;

  return (
    <div className="fixed bottom-[88px] left-3 right-3 z-50 animate-in slide-in-from-bottom-4 duration-300">
      <div className="bg-card border border-border rounded-2xl shadow-[0_8px_32px_rgba(0,0,0,0.15)] p-4 flex items-center gap-3">
        <img src="/icon-192.png" alt="Fiestamatic" className="w-12 h-12 rounded-xl shrink-0 shadow-sm" />
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

function Router() {
  return (
    <div className="flex flex-col min-h-[100dvh]">
      <div className="flex-1 w-full relative z-0">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/map" component={MapPage} />
          <Route path="/community" component={Community} />
          <Route component={NotFound} />
        </Switch>
      </div>
      <BottomNav />
      <InstallBanner />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, '')}>
        <Router />
      </WouterRouter>
    </QueryClientProvider>
  );
}

export default App;

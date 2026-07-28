import { useState, useEffect, useRef } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { BottomNav } from '@/components/Navigation';
import Home from '@/pages/Home';
import MapPage from '@/pages/Map';
import Community from '@/pages/Community';
import NotFound from '@/pages/not-found';
import { Download, RefreshCw, WifiOff, X } from 'lucide-react';

const queryClient = new QueryClient();

// ─── SW auto-update hook ──────────────────────────────────────────────────────
// Flow:
//   1. Register sw.js (no-cache fetch so the browser always gets the latest byte)
//   2. Listen for SW_ACTIVATED postMessage from the new SW after it claims clients
//   3. Also listen for controllerchange as a fallback trigger
//   4. On either signal → show "Updating…" banner → reload after 1.5 s
//   5. Periodic registration.update() every 60 min + on tab visibility change
//      ensures installed PWA users detect deploys without reopening the app

function useSWAutoUpdate(): boolean {
  const [updateReady, setUpdateReady] = useState(false);
  const registrationRef = useRef<ServiceWorkerRegistration | null>(null);
  const reloadScheduled = useRef(false);

  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    let cancelled = false;

    // Helper: schedule one reload, ignoring duplicate signals
    const scheduleReload = () => {
      if (reloadScheduled.current || cancelled) return;
      reloadScheduled.current = true;
      setUpdateReady(true);
      setTimeout(() => {
        if (!cancelled) window.location.reload();
      }, 1500);
    };

    // Listen for the SW_ACTIVATED postMessage broadcast from sw.js activate event
    const onMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SW_ACTIVATED') scheduleReload();
    };
    navigator.serviceWorker.addEventListener('message', onMessage);

    // controllerchange fires when a new SW takes control — belt-and-suspenders
    const onControllerChange = () => scheduleReload();
    navigator.serviceWorker.addEventListener('controllerchange', onControllerChange);

    // Register the SW, always fetching sw.js with no-cache so the browser
    // detects byte-level changes on every registration attempt
    navigator.serviceWorker
      .register('/sw.js', { updateViaCache: 'none' })
      .then((registration) => {
        if (cancelled) return;
        registrationRef.current = registration;

        // Periodic update check every 60 minutes
        const interval = setInterval(() => {
          registration.update().catch(() => {});
        }, 60 * 60 * 1000);

        // Check for updates whenever the tab comes back into focus
        const onVisibility = () => {
          if (document.visibilityState === 'visible') {
            registration.update().catch(() => {});
          }
        };
        document.addEventListener('visibilitychange', onVisibility);

        // Also do one immediate update check in case there's already a waiting SW
        registration.update().catch(() => {});

        return () => {
          clearInterval(interval);
          document.removeEventListener('visibilitychange', onVisibility);
        };
      })
      .catch(() => {
        // SW registration failed (dev HTTP, blocked origin, etc.) — silently ignore
      });

    return () => {
      cancelled = true;
      navigator.serviceWorker.removeEventListener('message', onMessage);
      navigator.serviceWorker.removeEventListener('controllerchange', onControllerChange);
    };
  }, []);

  return updateReady;
}

// ─── Update banner ────────────────────────────────────────────────────────────

function UpdateBanner({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <div className="fixed top-0 inset-x-0 z-[9998] animate-in slide-in-from-top-2 duration-300 pointer-events-none">
      <div className="mx-3 mt-3 bg-foreground/95 backdrop-blur-md text-background rounded-2xl shadow-2xl px-4 py-3 flex items-center gap-3">
        <RefreshCw className="w-4 h-4 shrink-0 animate-spin" />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold leading-tight">New version available!</p>
          <p className="text-[11px] opacity-70 mt-0.5">Updating Fiestamatic…</p>
        </div>
      </div>
    </div>
  );
}

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

function OfflineBadge() {
  const [offline, setOffline] = useState(!navigator.onLine);

  useEffect(() => {
    const on = () => setOffline(false);
    const off = () => setOffline(true);
    window.addEventListener('online', on);
    window.addEventListener('offline', off);
    return () => {
      window.removeEventListener('online', on);
      window.removeEventListener('offline', off);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-3 left-1/2 -translate-x-1/2 z-[9999] pointer-events-none animate-in fade-in slide-in-from-top-2 duration-300">
      <div className="flex items-center gap-1.5 bg-foreground/90 backdrop-blur-md text-background text-[11px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-full shadow-lg whitespace-nowrap">
        <WifiOff className="w-3 h-3" />
        Offline — Cached data
      </div>
    </div>
  );
}

function Router() {
  const updateReady = useSWAutoUpdate();

  return (
    <div className="flex flex-col min-h-[100dvh]">
      <UpdateBanner visible={updateReady} />
      <OfflineBadge />
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

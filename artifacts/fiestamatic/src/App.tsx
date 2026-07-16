import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Route, Switch, Router as WouterRouter } from 'wouter';
import { BottomNav } from '@/components/Navigation';
import { InstallPrompt } from '@/components/InstallPrompt';
import Home from '@/pages/Home';
import MapPage from '@/pages/Map';
import Community from '@/pages/Community';
import NotFound from '@/pages/not-found';

const queryClient = new QueryClient();

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
      <InstallPrompt />
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

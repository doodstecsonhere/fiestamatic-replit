import { Link, useLocation } from "wouter";
import { Home, Map as MapIcon, Users } from "lucide-react";

export function BottomNav() {
  const [location] = useLocation();
  
  return (
    <nav className="fixed bottom-0 left-0 right-0 h-[72px] bg-background/95 backdrop-blur-lg border-t border-border flex items-center justify-around px-2 z-[90] pb-safe shadow-[0_-4px_20px_-10px_rgba(0,0,0,0.1)]">
      <Link href="/" className={`flex flex-col items-center justify-center w-full h-full transition-colors ${location === '/' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
        <div className={`p-1.5 rounded-xl transition-all ${location === '/' ? 'bg-primary/15 scale-110' : ''}`}>
          <Home className="h-[22px] w-[22px]" strokeWidth={location === '/' ? 2.5 : 2} />
        </div>
        <span className="text-[10px] font-bold mt-1">Fiestas</span>
      </Link>
      
      <Link href="/map" className={`flex flex-col items-center justify-center w-full h-full transition-colors ${location === '/map' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
        <div className={`p-1.5 rounded-xl transition-all ${location === '/map' ? 'bg-primary/15 scale-110' : ''}`}>
          <MapIcon className="h-[22px] w-[22px]" strokeWidth={location === '/map' ? 2.5 : 2} />
        </div>
        <span className="text-[10px] font-bold mt-1">Map</span>
      </Link>
      
      <Link href="/community" className={`flex flex-col items-center justify-center w-full h-full transition-colors ${location === '/community' ? 'text-primary' : 'text-muted-foreground hover:text-foreground'}`}>
        <div className={`p-1.5 rounded-xl transition-all ${location === '/community' ? 'bg-primary/15 scale-110' : ''}`}>
          <Users className="h-[22px] w-[22px]" strokeWidth={location === '/community' ? 2.5 : 2} />
        </div>
        <span className="text-[10px] font-bold mt-1">Bayanihan</span>
      </Link>
    </nav>
  );
}
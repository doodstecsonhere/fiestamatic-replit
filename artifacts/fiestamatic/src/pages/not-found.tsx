import { Link } from "wouter";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex flex-col items-center justify-center text-center p-4 bg-background">
      <h1 className="text-7xl font-display font-extrabold text-primary mb-4 tracking-tighter">404</h1>
      <p className="text-muted-foreground font-medium mb-8 text-lg">Wala diri ang fiesta!</p>
      <Link href="/" className="bg-primary text-primary-foreground px-6 py-3 rounded-xl font-bold shadow-md hover-elevate transition-transform active:scale-95">
        Balik sa Home
      </Link>
    </div>
  );
}
import { useState, useMemo } from "react";
import { BARANGAYS, BarangayData } from "@/data/barangays";
import { getOrCreateFiestaDate, getDaysUntil, getCountdownLabel } from "@/lib/fiesta-date";
import { Search, MapPin, CalendarDays, Sparkles } from "lucide-react";
import { BarangayDrawer } from "@/components/BarangayDrawer";
import { format } from "date-fns";
import { motion } from "framer-motion";

export default function Home() {
  const [search, setSearch] = useState("");
  const [selectedBarangay, setSelectedBarangay] = useState<BarangayData | null>(null);

  const currentYear = new Date().getFullYear();

  const sortedBarangays = useMemo(() => {
    return BARANGAYS.map(b => {
      const date = getOrCreateFiestaDate(b.fiesta, currentYear);
      return { ...b, date, daysUntil: getDaysUntil(date) };
    }).sort((a, b) => {
      const aIsPassed = a.daysUntil < 0;
      const bIsPassed = b.daysUntil < 0;

      if (aIsPassed !== bIsPassed) {
        return aIsPassed ? 1 : -1;
      }

      return a.date.getTime() - b.date.getTime();
    });
  }, [currentYear]);

  const filteredBarangays = useMemo(() => {
    if (!search) return sortedBarangays;
    return sortedBarangays.filter(b =>
      b.barangay.toLowerCase().includes(search.toLowerCase())
    );
  }, [sortedBarangays, search]);

  return (
    <div className="pb-32 min-h-[100dvh] bg-background relative overflow-hidden">
      {/* Decorative background elements */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[30%] bg-primary/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-[20%] right-[-10%] w-[40%] h-[40%] bg-secondary/10 rounded-full blur-[80px] pointer-events-none" />

      <div className="px-4 pt-12 pb-4 sticky top-0 z-10 bg-background/80 backdrop-blur-xl border-b border-border shadow-sm">
        <h1 className="text-4xl font-display font-extrabold text-primary mb-1 flex items-center gap-2 tracking-tight">
          FIESTAMATIC <Sparkles className="text-secondary w-7 h-7" />
        </h1>
        <p className="text-muted-foreground mb-4 font-bold text-sm tracking-wide uppercase">Basta fiesta, 'matic na!</p>

        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search barangay..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            data-testid="input-search-barangay"
            className="w-full bg-card border border-border rounded-full py-3.5 pl-11 pr-4 outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 transition-all shadow-sm font-medium"
          />
        </div>
      </div>

      <div className="px-4 mt-6 space-y-4">
        {filteredBarangays.length === 0 && (
          <div className="text-center py-16 bg-card border border-border rounded-3xl">
            <CalendarDays className="w-12 h-12 text-muted-foreground opacity-50 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No barangays match your search.</p>
          </div>
        )}

        {filteredBarangays.map((b, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: Math.min(i * 0.05, 0.5), ease: "easeOut" }}
            key={b.barangay}
            onClick={() => setSelectedBarangay(b)}
            data-testid={`card-barangay-${b.barangay.toLowerCase().replace(/\s+/g, '-')}`}
            className="bg-card border border-card-border p-4.5 rounded-2xl shadow-[0_4px_12px_-4px_rgba(0,0,0,0.05)] hover:shadow-md transition-all active:scale-[0.98] cursor-pointer relative overflow-hidden"
          >
            {b.daysUntil >= 0 && b.daysUntil <= 7 && (
              <div className="absolute top-0 right-0 bg-secondary text-secondary-foreground text-xs font-black px-3 py-1.5 rounded-bl-xl z-10 flex items-center gap-1 shadow-sm">
                <Sparkles className="w-3 h-3" /> SOON
              </div>
            )}

            <div className="flex items-start justify-between">
              <div className="flex-1 pr-12">
                <h3 className="font-display font-bold text-xl text-card-foreground mb-1.5 leading-tight">{b.barangay}</h3>
                <div className="flex items-start gap-1.5 text-sm text-muted-foreground mb-4">
                  <MapPin className="w-3.5 h-3.5 text-accent shrink-0 mt-0.5" />
                  <span className="font-medium leading-snug">{b.address}</span>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-bold">
                    <CalendarDays className="w-4 h-4" />
                    {format(b.date, 'MMM d')}
                  </span>
                  <span className={`text-sm ${b.daysUntil === 0 ? 'text-secondary font-black bg-secondary/10 px-2 py-1 rounded-md' : 'text-muted-foreground font-semibold'}`}>
                    {getCountdownLabel(b.date)}
                  </span>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <BarangayDrawer
        barangay={selectedBarangay}
        open={!!selectedBarangay}
        onOpenChange={(o) => !o && setSelectedBarangay(null)}
      />
    </div>
  );
}

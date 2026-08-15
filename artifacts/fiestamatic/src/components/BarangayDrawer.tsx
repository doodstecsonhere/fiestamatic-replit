import { Drawer } from "vaul";
import { MapPin, Calendar, Info, Navigation2 } from "lucide-react";
import type { BarangayData } from "@/data/barangays";
import { getOrCreateFiestaDate, getCountdownLabel } from "@/lib/fiesta-date";
import { format } from "date-fns";
import { useState } from "react";

export function BarangayDrawer({
  barangay,
  open,
  onOpenChange
}: {
  barangay: BarangayData | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [snap, setSnap] = useState<number | string | null>(0.9);
  if (!barangay) return null;

  const fiestaDate = getOrCreateFiestaDate(barangay.fiesta, new Date().getFullYear());
  const countdown = getCountdownLabel(fiestaDate);
  const formattedDate = format(fiestaDate, 'MMMM d, yyyy');
  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${barangay.latitude},${barangay.longitude}`;

  return (
    <Drawer.Root open={open} onOpenChange={onOpenChange} snapPoints={[0.6, 0.9]} activeSnapPoint={snap} setActiveSnapPoint={setSnap}>
      <Drawer.Portal>
        <Drawer.Overlay className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[90]" />
        <Drawer.Content className="bg-background flex flex-col rounded-t-[24px] h-[90%] fixed bottom-0 left-0 right-0 z-[100] shadow-2xl outline-none border-t border-border">
          <div
            className="p-4 flex-1 min-h-0 overflow-y-auto scrollbar-none"
            style={{
              paddingBottom: "calc(176px + env(safe-area-inset-bottom, 0px))",
              scrollPaddingBottom: "calc(176px + env(safe-area-inset-bottom, 0px))",
            }}
          >
            <div className="mx-auto w-12 h-1.5 flex-shrink-0 rounded-full bg-muted mb-6" />
            <div className="max-w-md mx-auto space-y-6">
              <div>
                <Drawer.Title className="text-3xl font-bold font-display text-primary mb-1">
                  {barangay.barangay}
                </Drawer.Title>
                <Drawer.Description className="text-muted-foreground flex items-center gap-1.5 font-medium">
                  <MapPin className="w-4 h-4 flex-shrink-0 text-accent" />
                  <span className="text-sm leading-tight">{barangay.address}</span>
                </Drawer.Description>
              </div>

              <div className="bg-card border border-border rounded-2xl p-4 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl -mr-10 -mt-10 pointer-events-none" />
                <div className="flex items-start gap-4 relative">
                  <div className="bg-primary/10 p-3 rounded-xl text-primary">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-primary uppercase tracking-wider mb-0.5">{countdown}</div>
                    <div className="text-xl font-bold text-card-foreground mb-0.5">{formattedDate}</div>
                    <div className="text-sm text-muted-foreground font-medium">Official Schedule: {barangay.fiesta}</div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-2 font-display text-foreground">
                    <Info className="w-5 h-5 text-secondary" />
                    Name Origin
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed bg-muted/50 p-3.5 rounded-xl border border-border/50">
                    {barangay.nameOrigin}
                  </p>
                </div>
                
                <div>
                  <h3 className="text-lg font-bold flex items-center gap-2 mb-2 font-display text-foreground">
                    <Info className="w-5 h-5 text-accent" />
                    Patron Saint & Traditions
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed bg-muted/50 p-3.5 rounded-xl border border-border/50">
                    {barangay.patronSaintTraditions}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Drawer.Content>
        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-[110] border-t border-border/60 bg-background/95 px-4 pt-3 backdrop-blur-md">
          <div
            className="pointer-events-auto max-w-md mx-auto"
            style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 1rem)" }}
          >
            <a
              href={googleMapsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full flex items-center justify-center gap-2 bg-primary text-primary-foreground py-4 px-4 rounded-xl font-bold text-base hover-elevate transition-transform active:scale-[0.98] shadow-md"
            >
              <Navigation2 className="w-5 h-5" />
              Get Directions
            </a>
          </div>
        </div>
      </Drawer.Portal>
    </Drawer.Root>
  );
}
import { useState, useMemo, useEffect } from 'react';
import { BARANGAYS, BarangayData } from '@/data/barangays';
import { getOrCreateFiestaDate, getDaysUntil } from '@/lib/fiesta-date';
import { BarangayDrawer } from '@/components/BarangayDrawer';

import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const createPinIcon = (color: string) => L.divIcon({
  className: 'custom-pin',
  html: `<svg width="32" height="48" viewBox="0 0 24 36" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0px 6px 6px rgba(0,0,0,0.3)); transform: translate(-8px, -18px)">
    <path d="M12 0C5.37258 0 0 5.37258 0 12C0 21 12 36 12 36C12 36 24 21 24 12C24 5.37258 18.6274 0 12 0Z" fill="${color}"/>
    <circle cx="12" cy="12" r="5" fill="white"/>
  </svg>`,
  iconSize: [32, 48],
  iconAnchor: [16, 48],
  popupAnchor: [0, -48]
});

// Distinctly different colors with strong contrast between them
const RED_ICON    = createPinIcon('#c41a1a'); // Deep crimson red — clearly red
const ORANGE_ICON = createPinIcon('#e87c1e'); // Warm amber-orange — clearly orange
const YELLOW_ICON = createPinIcon('#f5c518'); // Bright golden yellow — clearly distinct

export default function MapPage() {
  const [selectedBarangay, setSelectedBarangay] = useState<BarangayData | null>(null);
  const [isClient, setIsClient] = useState(false);
  const currentYear = new Date().getFullYear();

  useEffect(() => {
    setIsClient(true);
  }, []);

  const markers = useMemo(() => {
    return BARANGAYS.map(b => {
      const date = getOrCreateFiestaDate(b.fiesta, currentYear);
      const daysUntil = getDaysUntil(date);
      let icon = YELLOW_ICON;
      if (daysUntil >= 0 && daysUntil <= 30) {
        icon = RED_ICON;
      } else if (daysUntil > 30 && daysUntil <= 90) {
        icon = ORANGE_ICON;
      }
      return { ...b, icon };
    });
  }, [currentYear]);

  return (
    <div className="h-[100dvh] w-full relative bg-background flex flex-col">
      <div className="absolute top-0 left-0 right-0 z-[400] p-4 pointer-events-none mt-2">
        <div className="bg-background/95 backdrop-blur-xl border border-border shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl p-3.5 max-w-sm pointer-events-auto transition-transform">
          <h2 className="font-display font-extrabold text-primary mb-2 tracking-tight text-lg leading-none">Dumaguete Fiestas</h2>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              {/* Deep red swatch */}
              <span className="w-3 h-3 rounded-full inline-block shadow-sm" style={{ backgroundColor: '#c41a1a' }}></span>
              <span style={{ color: '#c41a1a' }}>30 days</span>
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              {/* Orange swatch */}
              <span className="w-3 h-3 rounded-full inline-block shadow-sm" style={{ backgroundColor: '#e87c1e' }}></span>
              <span style={{ color: '#e87c1e' }}>90 days</span>
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-bold text-muted-foreground uppercase tracking-wider">
              {/* Gold swatch */}
              <span className="w-3 h-3 rounded-full inline-block shadow-sm" style={{ backgroundColor: '#f5c518' }}></span>
              <span style={{ color: '#b08800' }}>Later</span>
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 w-full z-0 relative pb-[72px]">
        {isClient && (
          <MapContainer
            center={[9.3068, 123.3054]}
            zoom={13}
            style={{ height: '100%', width: '100%', backgroundColor: 'hsl(36 50% 95%)' }}
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            />
            {markers.map(m => (
              <Marker
                key={m.barangay}
                position={[m.latitude, m.longitude]}
                icon={m.icon}
              >
                <Popup className="fiesta-popup border-none">
                  <div className="p-0.5">
                    <h3 className="font-display font-bold text-lg mb-1 leading-tight text-foreground">{m.barangay}</h3>
                    <p className="text-sm font-medium text-muted-foreground mb-3">{m.fiesta}</p>
                    <button
                      onClick={() => setSelectedBarangay(m)}
                      data-testid={`button-view-details-${m.barangay}`}
                      className="w-full bg-primary text-primary-foreground px-3 py-2.5 rounded-xl text-sm font-bold shadow-md hover-elevate transition-transform active:scale-95"
                    >
                      View Details
                    </button>
                  </div>
                </Popup>
              </Marker>
            ))}
          </MapContainer>
        )}
      </div>

      <BarangayDrawer
        barangay={selectedBarangay}
        open={!!selectedBarangay}
        onOpenChange={(o) => !o && setSelectedBarangay(null)}
      />
    </div>
  );
}

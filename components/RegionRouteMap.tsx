import { ArrowRight, MapPin } from 'lucide-react';

interface RegionRouteMapProps {
  locations: string[];
  accent: string;
}

export default function RegionRouteMap({
  locations,
  accent,
}: RegionRouteMapProps) {
  const uniqueLocations = Array.from(new Set(locations.filter(Boolean)));
  if (uniqueLocations.length === 0) return null;

  return (
    <section
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${accent} p-5 text-white shadow-lg`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '20px 20px',
        }}
      />
      <div className="relative">
        <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/75">
          <MapPin className="h-4 w-4" />
          Mapa de la aventura
        </div>
        <h2 className="mt-1 text-2xl font-black">Ruta visual de la región</h2>
        <p className="mt-1 text-sm text-white/75">
          Orden recomendado de las paradas principales de esta guía.
        </p>

        <div className="relative mt-5">
          <div className="absolute left-0 right-0 top-4 border-t-2 border-dashed border-white/25" />
          <div className="relative flex flex-wrap items-center gap-2">
            {uniqueLocations.map((location, index) => (
              <div key={`${location}-${index}`} className="flex items-center gap-2">
                <div className="flex items-center gap-2 rounded-full border border-white/20 bg-white/15 px-2 py-1 backdrop-blur">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-white text-[10px] font-black text-gray-900">
                    {index + 1}
                  </span>
                  <span className="text-xs font-bold">{location}</span>
                </div>
                {index < uniqueLocations.length - 1 && (
                  <ArrowRight className="h-3 w-3 text-white/40" />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

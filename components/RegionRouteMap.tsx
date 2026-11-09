import { Compass, MapPin } from 'lucide-react';
import { getRegionMap } from '@/lib/region-maps';

interface RegionRouteMapProps {
  locations: string[];
  accent: string;
  region: string;
}

const MAP_POSITIONS = [
  { x: 16, y: 70 },
  { x: 30, y: 54 },
  { x: 44, y: 66 },
  { x: 57, y: 46 },
  { x: 71, y: 58 },
  { x: 84, y: 36 },
  { x: 68, y: 22 },
  { x: 52, y: 30 },
  { x: 36, y: 22 },
  { x: 20, y: 36 },
];

export default function RegionRouteMap({
  locations,
  accent,
  region,
}: RegionRouteMapProps) {
  const uniqueLocations = Array.from(new Set(locations.filter(Boolean)));
  if (uniqueLocations.length === 0) return null;

  const regionMap = getRegionMap(region);
  const mapLocations = uniqueLocations.slice(0, MAP_POSITIONS.length);
  const points = mapLocations.map((_, index) => MAP_POSITIONS[index]);
  const polyline = points.map((point) => `${point.x},${point.y}`).join(' ');

  return (
    <section
      className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${accent} p-5 text-white shadow-lg`}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-15"
        style={{
          backgroundImage:
            'radial-gradient(circle at 1px 1px, white 1px, transparent 0)',
          backgroundSize: '18px 18px',
        }}
      />

      <div className="relative">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-white/75">
              <MapPin className="h-4 w-4" />
              Mapa de la aventura
            </div>
            <h2 className="mt-1 text-2xl font-black">
              Mapa de {regionMap.label}
            </h2>
            <p className="mt-1 text-sm text-white/75">
              Mapa ilustrativo con las paradas principales en orden recomendado.
            </p>
          </div>
          <Compass className="h-8 w-8 text-white/40" aria-hidden="true" />
        </div>

        <div className="relative mt-4 h-72 overflow-hidden rounded-xl border border-white/15 bg-white/5 sm:h-80">
          <svg
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
            aria-hidden="true"
          >
            {regionMap.paths.map((path, index) => (
              <path
                key={`region-path-${index}`}
                d={path}
                fill="rgba(255,255,255,0.13)"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="0.5"
              />
            ))}

            {regionMap.circles?.map((circle, index) => (
              <circle
                key={`region-island-${index}`}
                cx={circle.cx}
                cy={circle.cy}
                r={circle.r}
                fill="rgba(255,255,255,0.13)"
                stroke="rgba(255,255,255,0.35)"
                strokeWidth="0.5"
              />
            ))}

            {regionMap.lines?.map((line, index) => (
              <path
                key={`region-line-${index}`}
                d={line}
                fill="none"
                stroke="rgba(255,255,255,0.2)"
                strokeWidth="0.4"
                strokeDasharray="1 1"
              />
            ))}

            <polyline
              points={polyline}
              fill="none"
              stroke="rgba(255,255,255,0.75)"
              strokeWidth="0.6"
              strokeDasharray="2 1.5"
              strokeLinecap="round"
            />
          </svg>

          <span className="absolute left-2 top-2 rounded-full bg-black/30 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white/80">
            Región de {regionMap.label}
          </span>

          {points.map((point, index) => (
            <div
              key={`${mapLocations[index]}-${index}`}
              className="absolute -translate-x-1/2 -translate-y-1/2"
              style={{ left: `${point.x}%`, top: `${point.y}%` }}
            >
              <div className="flex flex-col items-center">
                <span className="flex h-7 w-7 items-center justify-center rounded-full border-2 border-white/70 bg-white text-[10px] font-black text-gray-900 shadow-lg">
                  {index + 1}
                </span>
                <span className="mt-1 hidden max-w-[88px] truncate rounded bg-black/35 px-1.5 py-0.5 text-[9px] font-bold text-white sm:block">
                  {mapLocations[index]}
                </span>
              </div>
            </div>
          ))}

          <span className="absolute bottom-2 left-2 rounded-full bg-black/25 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white/70">
            Mapa ilustrativo
          </span>
        </div>

        <ol className="mt-3 grid gap-1.5 text-xs sm:grid-cols-2">
          {uniqueLocations.map((location, index) => (
            <li
              key={`${location}-legend-${index}`}
              className="flex items-center gap-2 rounded-lg bg-white/10 px-2 py-1"
            >
              <span className="flex h-5 w-5 flex-none items-center justify-center rounded-full bg-white text-[9px] font-black text-gray-900">
                {index + 1}
              </span>
              <span className="truncate font-semibold text-white/90">
                {location}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

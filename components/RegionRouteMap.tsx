'use client';

import {
  useEffect,
  useRef,
  useState,
  type PointerEvent,
} from 'react';
import {
  Check,
  Compass,
  Layers,
  MapPin,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  RotateCcw,
  Swords,
  Target,
} from 'lucide-react';
import { getGymTypeVisual } from '@/lib/gym-visuals';
import { getRegionMap } from '@/lib/region-maps';
import type { GameGym } from '@/types/game';

interface RegionRouteMapProps {
  gyms: GameGym[];
  completed: number[];
  accent: string;
  region: string;
  canEdit?: boolean;
  nextStepIndex?: number;
  nextStepTitle?: string | null;
  onGoToGym?: (index: number) => void;
  onGoToStep?: (index: number) => void;
  onToggleGym?: (index: number) => void;
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

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export default function RegionRouteMap({
  gyms,
  completed,
  accent,
  region,
  canEdit = true,
  nextStepIndex,
  nextStepTitle,
  onGoToGym,
  onGoToStep,
  onToggleGym,
}: RegionRouteMapProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [is3D, setIs3D] = useState(false);
  const mapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  if (gyms.length === 0) return null;

  const regionMap = getRegionMap(region);
  const completedSet = new Set(completed);
  const nextIndex = gyms.findIndex((_, index) => !completedSet.has(index));
  const lastCompletedIndex = gyms.reduce(
    (last, _, index) => (completedSet.has(index) ? index : last),
    -1
  );
  const activeIndex =
    selectedIndex !== null && gyms[selectedIndex]
      ? selectedIndex
      : nextIndex >= 0
        ? nextIndex
        : lastCompletedIndex;
  const activeGym = gyms[activeIndex];
  const activeVisual = activeGym
    ? getGymTypeVisual(activeGym.type)
    : null;
  const positions = gyms.map(
    (_, index) => MAP_POSITIONS[index % MAP_POSITIONS.length]
  );
  const polyline = positions.map((point) => `${point.x},${point.y}`).join(' ');

  const zoomIn = () => setScale((current) => clamp(current + 0.25, 1, 2.5));
  const zoomOut = () =>
    setScale((current) => clamp(Number((current - 0.25).toFixed(2)), 1, 2.5));

  const resetView = () => {
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const toggle3D = () => {
    setIs3D((current) => !current);
    setScale(1);
    setOffset({ x: 0, y: 0 });
  };

  const toggleFullscreen = async () => {
    const element = mapRef.current;
    if (!element) return;

    try {
      if (document.fullscreenElement) {
        await document.exitFullscreen();
      } else {
        await element.requestFullscreen();
      }
    } catch {
      // El navegador puede bloquear pantalla completa.
    }
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;

    dragRef.current = {
      startX: event.clientX,
      startY: event.clientY,
      originX: offset.x,
      originY: offset.y,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
    setIsDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = dragRef.current;
    if (!drag) return;

    setOffset({
      x: drag.originX + event.clientX - drag.startX,
      y: drag.originY + event.clientY - drag.startY,
    });
  };

  const endDrag = () => {
    dragRef.current = null;
    setIsDragging(false);
  };

  const statusFor = (index: number) => {
    if (completedSet.has(index)) return 'Conseguida';
    if (index === nextIndex) return 'Siguiente parada';
    return 'Pendiente';
  };

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
              Mapa interactivo
            </div>
            <h2 className="mt-1 text-2xl font-black">
              Mapa de {regionMap.label}
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-white/75">
              Arrastra para mover, usa los controles para acercar y toca una
              parada para ver el líder, la insignia y tu próximo objetivo. El
              botón de capas cambia entre vista 2D y diorama 3D.
            </p>
          </div>
          <Compass className="h-8 w-8 text-white/40" aria-hidden="true" />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
          {lastCompletedIndex >= 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-green-500/20 px-3 py-1 font-bold text-green-100 ring-1 ring-green-300/30">
              <Check className="h-3.5 w-3.5" />
              Última parada: {gyms[lastCompletedIndex].leader}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-bold text-white/90">
              <MapPin className="h-3.5 w-3.5" />
              Inicio de la aventura
            </span>
          )}

          {nextIndex >= 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-300 px-3 py-1 font-black text-amber-950 shadow-sm">
              <Target className="h-3.5 w-3.5" />
              Siguiente: {gyms[nextIndex].leader} ·{' '}
              {gyms[nextIndex].location}
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/15 px-3 py-1 font-bold text-white/90">
              <Check className="h-3.5 w-3.5" />
              Ruta completada
            </span>
          )}

          {nextStepTitle &&
            nextStepIndex !== undefined &&
            nextStepIndex >= 0 &&
            onGoToStep && (
              <button
                type="button"
                onClick={() => onGoToStep(nextStepIndex)}
                className="inline-flex items-center gap-1.5 rounded-full border border-white/25 bg-white/10 px-3 py-1 font-bold text-white/90 transition hover:bg-white/20"
              >
                Ir al paso {nextStepIndex + 1}: {nextStepTitle}
              </button>
            )}
        </div>

        <div
          ref={mapRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className={`relative mt-4 touch-none overflow-hidden rounded-xl border border-white/20 bg-gradient-to-br from-slate-950 via-cyan-950 to-blue-950 ${
            isFullscreen
              ? 'h-[calc(100vh-2rem)]'
              : 'h-80 sm:h-96'
          } ${isDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
          style={{ perspective: is3D ? '1100px' : undefined }}
        >
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.35) 1px, transparent 0)',
              backgroundSize: '22px 22px',
            }}
          />
          <div className="pointer-events-none absolute -left-10 top-8 h-24 w-40 rounded-full bg-white/10 blur-2xl" />
          <div className="pointer-events-none absolute -right-8 bottom-10 h-28 w-44 rounded-full bg-cyan-300/10 blur-2xl" />

          <div
            className="absolute inset-0 origin-center"
            style={{
              transform: is3D
                ? `translate(${offset.x}px, ${offset.y}px) scale(${scale}) rotateX(46deg) rotateZ(-10deg) scale(0.8)`
                : `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transformStyle: is3D ? 'preserve-3d' : undefined,
            }}
          >
            {is3D && (
              <>
                <div
                  className="absolute inset-x-[12%] top-[55%] h-12 rounded-full bg-black/60 blur-2xl"
                  style={{ transform: 'translateZ(-28px)' }}
                />
                {[10, 7, 4].map((depth) => (
                  <div
                    key={`map-depth-${depth}`}
                    className="absolute inset-0"
                    style={{ transform: `translateZ(-${depth}px)` }}
                  >
                    <svg
                      viewBox="0 0 100 100"
                      preserveAspectRatio="none"
                      className="h-full w-full"
                      aria-hidden="true"
                    >
                      {regionMap.paths.map((path, index) => (
                        <path
                          key={`depth-path-${depth}-${index}`}
                          d={path}
                          fill="#064e3b"
                          stroke="#065f46"
                          strokeWidth="0.8"
                        />
                      ))}
                      {regionMap.circles?.map((circle, index) => (
                        <circle
                          key={`depth-island-${depth}-${index}`}
                          cx={circle.cx}
                          cy={circle.cy}
                          r={circle.r}
                          fill="#064e3b"
                          stroke="#065f46"
                          strokeWidth="0.8"
                        />
                      ))}
                    </svg>
                  </div>
                ))}
              </>
            )}

            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
              aria-hidden="true"
              style={{
                filter: is3D
                  ? 'drop-shadow(0 6px 6px rgba(0,0,0,0.45))'
                  : undefined,
              }}
            >
              <defs>
                <linearGradient id="map-land" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#34d399" stopOpacity="0.55" />
                  <stop offset="100%" stopColor="#0f766e" stopOpacity="0.32" />
                </linearGradient>
              </defs>
              {regionMap.paths.map((path, index) => (
                <path
                  key={`region-path-${index}`}
                  d={path}
                  fill="url(#map-land)"
                  stroke="rgba(167,243,208,0.7)"
                  strokeWidth="0.55"
                />
              ))}

              {regionMap.circles?.map((circle, index) => (
                <circle
                  key={`region-island-${index}`}
                  cx={circle.cx}
                  cy={circle.cy}
                  r={circle.r}
                  fill="url(#map-land)"
                  stroke="rgba(167,243,208,0.7)"
                  strokeWidth="0.55"
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
                stroke="rgba(255,255,255,0.28)"
                strokeWidth="0.5"
                strokeDasharray="2 1.5"
                strokeLinecap="round"
              />

              {positions.slice(0, -1).map((point, index) => {
                const target = positions[index + 1];
                const done =
                  completedSet.has(index) && completedSet.has(index + 1);
                const isNextSegment = nextIndex === index + 1;

                return (
                  <line
                    key={`route-segment-${index}`}
                    x1={point.x}
                    y1={point.y}
                    x2={target.x}
                    y2={target.y}
                    stroke={
                      done
                        ? 'rgba(134,239,172,0.85)'
                        : isNextSegment
                          ? 'rgba(251,191,36,0.95)'
                          : 'rgba(255,255,255,0.35)'
                    }
                    strokeWidth={isNextSegment ? 0.8 : 0.55}
                    strokeDasharray={done ? undefined : '2 1.5'}
                    strokeLinecap="round"
                  />
                );
              })}
            </svg>

            {gyms.map((gym, index) => {
              const point = positions[index];
              const done = completedSet.has(index);
              const isNext = index === nextIndex;
              const isActive = index === activeIndex;
              const isCurrent = index === lastCompletedIndex;

              return (
                <button
                  key={`${gym.leader}-${index}`}
                  type="button"
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={() => setSelectedIndex(index)}
                  aria-label={`${index + 1}. ${gym.leader}, ${gym.location}. ${statusFor(
                    index
                  )}`}
                  aria-pressed={isActive}
                  className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 focus:outline-none"
                  style={{ left: `${point.x}%`, top: `${point.y}%` }}
                >
                  <span className="flex flex-col items-center transition">
                    <span
                      className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-[11px] font-black shadow-lg group-focus-visible:ring-4 group-focus-visible:ring-white/60 ${
                        isActive ? 'ring-4 ring-white/55' : ''
                      } ${
                        isNext
                          ? 'shadow-[0_0_0_6px_rgba(251,191,36,0.28)]'
                          : ''
                      } ${
                        done
                          ? 'border-green-200 bg-green-500 text-white'
                          : isNext
                            ? 'border-white bg-amber-300 text-amber-950'
                            : isCurrent
                              ? 'border-blue-100 bg-blue-500 text-white'
                              : 'border-white/80 bg-white text-gray-900'
                      }`}
                    >
                      {done ? <Check className="h-4 w-4" /> : index + 1}
                    </span>
                    <span
                      className={`mt-1 max-w-[110px] truncate rounded px-1.5 py-0.5 text-[9px] font-bold shadow-sm ${
                        is3D ? 'hidden' : 'hidden sm:block'
                      } ${
                        isNext
                          ? 'bg-amber-300 text-amber-950'
                          : done
                            ? 'bg-green-500/90 text-white'
                            : 'bg-black/40 text-white'
                      }`}
                    >
                      {gym.location}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/35 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white/80">
            Región de {regionMap.label}
          </span>

          <div
            className="absolute right-2 top-2 z-20 flex flex-col gap-1 rounded-xl border border-white/20 bg-slate-950/60 p-1 backdrop-blur"
            onPointerDown={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              onClick={toggle3D}
              aria-label={
                is3D ? 'Ver mapa en 2D' : 'Ver mapa en 3D'
              }
              title={is3D ? 'Vista 2D' : 'Vista diorama 3D'}
              className={`rounded-lg p-2 transition ${
                is3D
                  ? 'bg-amber-300 text-amber-950 hover:bg-amber-200'
                  : 'text-white hover:bg-white/15'
              }`}
            >
              <Layers className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={zoomIn}
              disabled={scale >= 2.5}
              aria-label="Acercar mapa"
              className="rounded-lg p-2 text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={zoomOut}
              disabled={scale <= 1}
              aria-label="Alejar mapa"
              className="rounded-lg p-2 text-white transition hover:bg-white/15 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Minus className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={resetView}
              aria-label="Centrar mapa"
              className="rounded-lg p-2 text-white transition hover:bg-white/15"
            >
              <RotateCcw className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => void toggleFullscreen()}
              aria-label={
                isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'
              }
              className="rounded-lg p-2 text-white transition hover:bg-white/15"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </button>
          </div>

          <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-black/30 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white/70">
            {is3D ? 'Diorama 3D' : 'Vista 2D'} · Arrastra para mover ·{' '}
            {Math.round(scale * 100)}%
          </span>
        </div>

        {activeGym && (
          <div className="mt-3 rounded-xl border border-white/15 bg-black/20 p-3">
            <div className="flex flex-wrap items-center gap-3">
              {activeVisual && (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={activeVisual.artworkUrl}
                  alt={activeVisual.name}
                  loading="lazy"
                  className="h-14 w-14 flex-none object-contain"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/60">
                  {statusFor(activeIndex)}
                </p>
                <p className="truncate text-lg font-black">
                  {activeGym.leader}
                </p>
                <p className="truncate text-xs font-semibold text-white/75">
                  {activeGym.location} · {activeGym.type} · {activeGym.badge}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {onToggleGym && canEdit && (
                  <button
                    type="button"
                    onClick={() => onToggleGym(activeIndex)}
                    className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                      completedSet.has(activeIndex)
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-white text-gray-900 hover:bg-white/90'
                    }`}
                  >
                    {completedSet.has(activeIndex)
                      ? 'Desmarcar'
                      : 'Marcar insignia'}
                  </button>
                )}
                {onGoToGym && (
                  <button
                    type="button"
                    onClick={() => onGoToGym(activeIndex)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-black text-gray-900 transition hover:bg-white/90"
                  >
                    <Swords className="h-3.5 w-3.5" />
                    Ver combate
                  </button>
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-white/75">{activeGym.tip}</p>
          </div>
        )}

        <ol className="mt-3 grid gap-1.5 text-xs sm:grid-cols-2">
          {gyms.map((gym, index) => {
            const done = completedSet.has(index);
            const isNext = index === nextIndex;
            const isSelected = index === activeIndex;

            return (
              <li key={`${gym.leader}-legend-${index}`}>
                <button
                  type="button"
                  onClick={() => setSelectedIndex(index)}
                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left transition ${
                    isSelected
                      ? 'bg-white/20 ring-1 ring-white/30'
                      : 'bg-white/10 hover:bg-white/15'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-[9px] font-black ${
                      done
                        ? 'bg-green-500 text-white'
                        : isNext
                          ? 'bg-amber-300 text-amber-950'
                          : 'bg-white text-gray-900'
                    }`}
                  >
                    {done ? <Check className="h-3 w-3" /> : index + 1}
                  </span>
                  <span className="min-w-0 flex-1 truncate font-semibold text-white/90">
                    {gym.location}
                  </span>
                  <span
                    className={`flex-none text-[9px] font-bold ${
                      done
                        ? 'text-green-200'
                        : isNext
                          ? 'text-amber-200'
                          : 'text-white/55'
                    }`}
                  >
                    {done ? 'Conseguida' : isNext ? 'Siguiente' : gym.badge}
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </div>
    </section>
  );
}

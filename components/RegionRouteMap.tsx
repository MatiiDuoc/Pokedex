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

export interface MapStep {
  index: number;
  title: string;
  goal: string;
  done: boolean;
}

interface RegionRouteMapProps {
  gyms: GameGym[];
  steps?: MapStep[];
  completed: number[];
  accent: string;
  region: string;
  canEdit?: boolean;
  nextStepIndex?: number;
  nextStepTitle?: string | null;
  onGoToGym?: (index: number) => void;
  onGoToStep?: (index: number) => void;
  onToggleGym?: (index: number) => void;
  onToggleStep?: (index: number) => void;
}

type LevelId = 'superficie' | 'cuevas' | 'agua';
type SelectedItem =
  | { kind: 'gym'; index: number }
  | { kind: 'step'; index: number }
  | null;

interface LevelTone {
  fillStart: string;
  fillEnd: string;
  stroke: string;
  extrusion: string;
}

interface MapLevel {
  id: LevelId;
  label: string;
  steps: MapStep[];
  tone: LevelTone;
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

const TONES: Record<LevelId, LevelTone> = {
  superficie: {
    fillStart: '#34d399',
    fillEnd: '#0f766e',
    stroke: 'rgba(167,243,208,0.85)',
    extrusion: '#064e3b',
  },
  cuevas: {
    fillStart: '#c084fc',
    fillEnd: '#6b21a8',
    stroke: 'rgba(233,213,255,0.85)',
    extrusion: '#3b0764',
  },
  agua: {
    fillStart: '#38bdf8',
    fillEnd: '#1e3a8a',
    stroke: 'rgba(186,230,253,0.9)',
    extrusion: '#0c4a6e',
  },
};

const CAVE_KEYWORDS = [
  'cueva',
  'caverna',
  'tunel',
  'mina',
  'subterraneo',
  'gruta',
  'catacumba',
  'mazmorra',
  'cloaca',
  'sotano',
  'monte moon',
  'monte plateado',
  'cueva celeste',
];

const WATER_KEYWORDS = [
  'mar',
  'isla',
  'islas',
  'surf',
  'lago',
  'rio',
  'costa',
  'puerto',
  'naufragio',
  'submarino',
  'arrecife',
  'cascada',
  'playa',
  'oceano',
];

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function includesKeyword(text: string, keyword: string): boolean {
  if (keyword.includes(' ')) return text.includes(keyword);
  return new RegExp(`\\b${keyword}\\b`).test(text);
}

function classifyStep(step: MapStep): LevelId {
  const text = normalizeText(`${step.title} ${step.goal}`);

  if (CAVE_KEYWORDS.some((keyword) => includesKeyword(text, keyword))) {
    return 'cuevas';
  }

  if (WATER_KEYWORDS.some((keyword) => includesKeyword(text, keyword))) {
    return 'agua';
  }

  return 'superficie';
}

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function statusForGym(
  index: number,
  completed: Set<number>,
  nextIndex: number
): string {
  if (completed.has(index)) return 'Conseguida';
  if (index === nextIndex) return 'Siguiente parada';
  return 'Pendiente';
}

function statusForStep(step: MapStep, nextStepIndex?: number): string {
  if (step.done) return 'Completado';
  if (step.index === nextStepIndex) return 'Siguiente paso';
  return 'Pendiente';
}

export default function RegionRouteMap({
  gyms,
  steps = [],
  completed,
  accent,
  region,
  canEdit = true,
  nextStepIndex,
  nextStepTitle,
  onGoToGym,
  onGoToStep,
  onToggleGym,
  onToggleStep,
}: RegionRouteMapProps) {
  const [scale, setScale] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [selected, setSelected] = useState<SelectedItem>(null);
  const [activeLevelId, setActiveLevelId] =
    useState<LevelId>('superficie');
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

  if (gyms.length === 0 && steps.length === 0) return null;

  const regionMap = getRegionMap(region);
  const completedSet = new Set(completed);
  const nextGymIndex = gyms.findIndex((_, index) => !completedSet.has(index));
  const lastCompletedIndex = gyms.reduce(
    (last, _, index) => (completedSet.has(index) ? index : last),
    -1
  );

  const caveSteps = steps.filter(
    (step) => classifyStep(step) === 'cuevas'
  );
  const waterSteps = steps.filter((step) => classifyStep(step) === 'agua');

  const levels: MapLevel[] = [
    {
      id: 'superficie',
      label: 'Superficie',
      steps: [],
      tone: TONES.superficie,
    },
    ...(caveSteps.length > 0
      ? [
          {
            id: 'cuevas' as const,
            label: 'Cuevas y relieves',
            steps: caveSteps,
            tone: TONES.cuevas,
          },
        ]
      : []),
    ...(waterSteps.length > 0
      ? [
          {
            id: 'agua' as const,
            label: 'Rutas acuáticas',
            steps: waterSteps,
            tone: TONES.agua,
          },
        ]
      : []),
  ];

  const activeLevel =
    levels.find((level) => level.id === activeLevelId) ?? levels[0];

  const selectedGymIndex =
    selected?.kind === 'gym' ? selected.index : null;
  const activeGymIndex =
    activeLevel.id === 'superficie'
      ? selectedGymIndex !== null && gyms[selectedGymIndex]
        ? selectedGymIndex
        : nextGymIndex >= 0
          ? nextGymIndex
          : lastCompletedIndex >= 0
            ? lastCompletedIndex
            : 0
      : -1;
  const activeGym =
    activeGymIndex >= 0 ? gyms[activeGymIndex] : undefined;
  const activeVisual = activeGym
    ? getGymTypeVisual(activeGym.type)
    : null;

  const selectedStepIndex =
    selected?.kind === 'step' ? selected.index : null;
  const activeStep =
    activeLevel.id !== 'superficie'
      ? (activeLevel.steps.find((step) => step.index === selectedStepIndex) ??
        activeLevel.steps.find((step) => !step.done) ??
        activeLevel.steps[0])
      : undefined;

  const activeItemsCount =
    activeLevel.id === 'superficie' ? gyms.length : activeLevel.steps.length;

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

  const selectLevel = (levelId: LevelId) => {
    setActiveLevelId(levelId);
    setSelected(null);
    resetView();
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

  const renderLevelPlate = (
    level: MapLevel,
    depthIndex: number,
    isActive: boolean
  ) => {
    const isSurface = level.id === 'superficie';
    const points = isSurface
      ? gyms.map((_, index) => MAP_POSITIONS[index % MAP_POSITIONS.length])
      : level.steps.map(
          (step) => MAP_POSITIONS[step.index % MAP_POSITIONS.length]
        );
    const polyline = points
      .map((point) => `${point.x},${point.y}`)
      .join(' ');
    const gradientId = `map-land-${level.id}`;
    const depthOffset = is3D ? depthIndex * 30 : 0;
    const yOffset = is3D ? depthIndex * 12 : 0;
    const plateScale = is3D ? 1 - depthIndex * 0.045 : 1;

    return (
      <div
        key={level.id}
        className="absolute inset-0 origin-center"
        style={{
          transform: is3D
            ? `translateZ(-${depthOffset}px) translateY(${yOffset}px) scale(${plateScale})`
            : undefined,
          opacity: is3D && !isActive ? 0.3 : 1,
          pointerEvents: isActive ? 'auto' : 'none',
          transformStyle: is3D ? 'preserve-3d' : undefined,
        }}
      >
        {is3D && (
          <>
            <div
              className="absolute inset-x-[12%] top-[55%] h-10 rounded-full bg-black/60 blur-2xl"
              style={{ transform: 'translateZ(-22px)' }}
            />
            {[4, 2].map((depth) => (
              <div
                key={`${level.id}-depth-${depth}`}
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
                      key={`depth-path-${level.id}-${depth}-${index}`}
                      d={path}
                      fill={level.tone.extrusion}
                      stroke={level.tone.extrusion}
                      strokeWidth="0.8"
                    />
                  ))}
                  {regionMap.circles?.map((circle, index) => (
                    <circle
                      key={`depth-island-${level.id}-${depth}-${index}`}
                      cx={circle.cx}
                      cy={circle.cy}
                      r={circle.r}
                      fill={level.tone.extrusion}
                      stroke={level.tone.extrusion}
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
            <linearGradient
              id={gradientId}
              x1="0"
              y1="0"
              x2="1"
              y2="1"
            >
              <stop
                offset="0%"
                stopColor={level.tone.fillStart}
                stopOpacity="0.5"
              />
              <stop
                offset="100%"
                stopColor={level.tone.fillEnd}
                stopOpacity="0.3"
              />
            </linearGradient>
          </defs>

          {regionMap.paths.map((path, index) => (
            <path
              key={`region-path-${level.id}-${index}`}
              d={path}
              fill={`url(#${gradientId})`}
              stroke={level.tone.stroke}
              strokeWidth="0.55"
            />
          ))}

          {regionMap.circles?.map((circle, index) => (
            <circle
              key={`region-island-${level.id}-${index}`}
              cx={circle.cx}
              cy={circle.cy}
              r={circle.r}
              fill={`url(#${gradientId})`}
              stroke={level.tone.stroke}
              strokeWidth="0.55"
            />
          ))}

          {regionMap.lines?.map((line, index) => (
            <path
              key={`region-line-${level.id}-${index}`}
              d={line}
              fill="none"
              stroke="rgba(255,255,255,0.18)"
              strokeWidth="0.4"
              strokeDasharray="1 1"
            />
          ))}

          <polyline
            points={polyline}
            fill="none"
            stroke="rgba(255,255,255,0.25)"
            strokeWidth="0.5"
            strokeDasharray="2 1.5"
            strokeLinecap="round"
          />

          {points.slice(0, -1).map((point, index) => {
            const target = points[index + 1];
            const done = isSurface
              ? completedSet.has(index) && completedSet.has(index + 1)
              : level.steps[index]?.done && level.steps[index + 1]?.done;
            const isNextSegment = isSurface
              ? nextGymIndex === index + 1
              : level.steps[index + 1]?.index === nextStepIndex;

            return (
              <line
                key={`route-segment-${level.id}-${index}`}
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

        {isActive &&
          isSurface &&
          gyms.map((gym, index) => {
            const point = MAP_POSITIONS[index % MAP_POSITIONS.length];
            const done = completedSet.has(index);
            const isNext = index === nextGymIndex;
            const isSelected = index === activeGymIndex;

            return (
              <button
                key={`${gym.leader}-${index}`}
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() => setSelected({ kind: 'gym', index })}
                aria-label={`${index + 1}. ${gym.leader}, ${gym.location}. ${statusForGym(
                  index,
                  completedSet,
                  nextGymIndex
                )}`}
                aria-pressed={isSelected}
                className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 focus:outline-none"
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
              >
                <span className="flex flex-col items-center transition">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-[11px] font-black shadow-lg group-focus-visible:ring-4 group-focus-visible:ring-white/60 ${
                      isSelected ? 'ring-4 ring-white/55' : ''
                    } ${
                      isNext
                        ? 'shadow-[0_0_0_6px_rgba(251,191,36,0.28)]'
                        : ''
                    } ${
                      done
                        ? 'border-green-200 bg-green-500 text-white'
                        : isNext
                          ? 'border-white bg-amber-300 text-amber-950'
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

        {isActive &&
          !isSurface &&
          level.steps.map((step) => {
            const point = MAP_POSITIONS[step.index % MAP_POSITIONS.length];
            const isNext = step.index === nextStepIndex;
            const isSelected = step.index === activeStep?.index;

            return (
              <button
                key={`step-${level.id}-${step.index}`}
                type="button"
                onPointerDown={(event) => event.stopPropagation()}
                onClick={() =>
                  setSelected({ kind: 'step', index: step.index })
                }
                aria-label={`Paso ${step.index + 1}. ${step.title}. ${statusForStep(
                  step,
                  nextStepIndex
                )}`}
                aria-pressed={isSelected}
                className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 focus:outline-none"
                style={{ left: `${point.x}%`, top: `${point.y}%` }}
              >
                <span className="flex flex-col items-center transition">
                  <span
                    className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-[10px] font-black shadow-lg group-focus-visible:ring-4 group-focus-visible:ring-white/60 ${
                      isSelected ? 'ring-4 ring-white/55' : ''
                    } ${
                      isNext
                        ? 'shadow-[0_0_0_6px_rgba(251,191,36,0.28)]'
                        : ''
                    } ${
                      step.done
                        ? 'border-green-200 bg-green-500 text-white'
                        : isNext
                          ? 'border-white bg-amber-300 text-amber-950'
                          : 'border-white/80 bg-white text-gray-900'
                    }`}
                  >
                    {step.done ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      step.index + 1
                    )}
                  </span>
                  <span
                    className={`mt-1 max-w-[120px] truncate rounded px-1.5 py-0.5 text-[9px] font-bold shadow-sm ${
                      is3D ? 'hidden' : 'hidden sm:block'
                    } ${
                      isNext
                        ? 'bg-amber-300 text-amber-950'
                        : step.done
                          ? 'bg-green-500/90 text-white'
                          : 'bg-black/40 text-white'
                    }`}
                  >
                    Paso {step.index + 1}
                  </span>
                </span>
              </button>
            );
          })}
      </div>
    );
  };

  return (
    <section className="relative overflow-hidden rounded-2xl border border-cyan-200/20 bg-gradient-to-br from-slate-950 via-cyan-950 to-blue-950 p-5 text-white shadow-lg">
      <div
        className={`pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${accent}`}
      />
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
            <p className="mt-1 max-w-3xl text-sm text-white/75">
              Arrastra para mover, usa los controles para acercar y toca una
              parada para ver el líder, la insignia y tu próximo objetivo.
              {levels.length > 1
                ? ' Cambia de nivel para ver superficie, cuevas y rutas acuáticas.'
                : ' El botón de capas cambia entre vista 2D y diorama 3D.'}
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

          {nextGymIndex >= 0 ? (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-300 px-3 py-1 font-black text-amber-950 shadow-sm">
              <Target className="h-3.5 w-3.5" />
              Siguiente: {gyms[nextGymIndex].leader} ·{' '}
              {gyms[nextGymIndex].location}
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

          <button
            type="button"
            onClick={toggle3D}
            className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 font-bold transition ${
              is3D
                ? 'border-cyan-200/60 bg-cyan-300 text-cyan-950'
                : 'border-white/25 bg-white/10 text-white/90 hover:bg-white/20'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            {is3D ? 'Vista 2D' : 'Vista 3D'}
          </button>
        </div>

        {levels.length > 1 && (
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60">
              Niveles
            </span>
            {levels.map((level) => {
              const isActive = level.id === activeLevel.id;
              const count =
                level.id === 'superficie'
                  ? gyms.length
                  : level.steps.length;

              return (
                <button
                  key={level.id}
                  type="button"
                  onClick={() => selectLevel(level.id)}
                  className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold transition ${
                    isActive
                      ? 'bg-cyan-300 text-cyan-950 shadow-sm'
                      : 'border border-white/20 bg-white/10 text-white/80 hover:bg-white/20'
                  }`}
                >
                  {level.label}
                  <span
                    className={`rounded-full px-1.5 text-[9px] ${
                      isActive ? 'bg-cyan-950/15' : 'bg-black/25'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        )}

        <div
          ref={mapRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          className={`relative mt-4 touch-none overflow-hidden rounded-xl border border-cyan-200/20 bg-gradient-to-br from-slate-950 via-cyan-950 to-blue-950 ${
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
          <div className="pointer-events-none absolute -left-10 top-8 h-24 w-40 rounded-full bg-cyan-200/10 blur-2xl" />
          <div className="pointer-events-none absolute -right-8 bottom-10 h-28 w-44 rounded-full bg-blue-300/10 blur-2xl" />

          <div
            className="pointer-events-none absolute left-2 top-2 h-5 w-5 border-l border-t border-cyan-200/40"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute right-2 top-2 h-5 w-5 border-r border-t border-cyan-200/40"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute bottom-2 left-2 h-5 w-5 border-b border-l border-cyan-200/40"
            aria-hidden="true"
          />
          <div
            className="pointer-events-none absolute bottom-2 right-2 h-5 w-5 border-b border-r border-cyan-200/40"
            aria-hidden="true"
          />

          <div
            className="absolute inset-0 origin-center"
            style={{
              transform: is3D
                ? `translate(${offset.x}px, ${offset.y}px) scale(${scale}) rotateX(46deg) rotateZ(-10deg) scale(0.8)`
                : `translate(${offset.x}px, ${offset.y}px) scale(${scale})`,
              transformStyle: is3D ? 'preserve-3d' : undefined,
            }}
          >
            {is3D
              ? levels.map((level, index) =>
                  renderLevelPlate(level, index, level.id === activeLevel.id)
                )
              : renderLevelPlate(activeLevel, 0, true)}
          </div>

          <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-black/40 px-2 py-0.5 text-[9px] font-black uppercase tracking-widest text-white/80">
            Región de {regionMap.label} · {activeLevel.label}
          </span>

          <div
            className="absolute right-2 top-2 z-20 flex flex-col gap-1 rounded-xl border border-cyan-200/20 bg-slate-950/70 p-1 backdrop-blur"
            onPointerDown={(event) => event.stopPropagation()}
          >
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

          <span className="pointer-events-none absolute bottom-2 left-2 rounded-full bg-black/35 px-2 py-0.5 text-[9px] font-bold uppercase tracking-widest text-white/70">
            {is3D ? 'Diorama 3D' : 'Vista 2D'} · Arrastra para mover ·{' '}
            {Math.round(scale * 100)}%
          </span>
        </div>

        {activeLevel.id === 'superficie' && activeGym && (
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
                  {statusForGym(
                    activeGymIndex,
                    completedSet,
                    nextGymIndex
                  )}
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
                    onClick={() => onToggleGym(activeGymIndex)}
                    className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                      completedSet.has(activeGymIndex)
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-white text-gray-900 hover:bg-white/90'
                    }`}
                  >
                    {completedSet.has(activeGymIndex)
                      ? 'Desmarcar'
                      : 'Marcar insignia'}
                  </button>
                )}
                {onGoToGym && (
                  <button
                    type="button"
                    onClick={() => onGoToGym(activeGymIndex)}
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

        {activeLevel.id !== 'superficie' && activeStep && (
          <div className="mt-3 rounded-xl border border-white/15 bg-black/20 p-3">
            <div className="flex flex-wrap items-center gap-3">
              <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-cyan-300/15 text-cyan-100 ring-1 ring-cyan-200/25">
                <Target className="h-6 w-6" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-[10px] font-black uppercase tracking-widest text-white/60">
                  {statusForStep(activeStep, nextStepIndex)} ·{' '}
                  {activeLevel.label}
                </p>
                <p className="truncate text-lg font-black">
                  {activeStep.index + 1}. {activeStep.title}
                </p>
                <p className="truncate text-xs font-semibold text-white/75">
                  Paso de la ruta
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {onToggleStep && canEdit && (
                  <button
                    type="button"
                    onClick={() => onToggleStep(activeStep.index)}
                    className={`rounded-lg px-3 py-2 text-xs font-bold transition ${
                      activeStep.done
                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                        : 'bg-white text-gray-900 hover:bg-white/90'
                    }`}
                  >
                    {activeStep.done ? 'Desmarcar' : 'Marcar paso'}
                  </button>
                )}
                {onGoToStep && (
                  <button
                    type="button"
                    onClick={() => onGoToStep(activeStep.index)}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-xs font-black text-gray-900 transition hover:bg-white/90"
                  >
                    <MapPin className="h-3.5 w-3.5" />
                    Ir al paso
                  </button>
                )}
              </div>
            </div>
            <p className="mt-2 text-xs text-white/75">{activeStep.goal}</p>
          </div>
        )}

        <ol className="mt-3 grid gap-1.5 text-xs sm:grid-cols-2">
          {activeLevel.id === 'superficie'
            ? gyms.map((gym, index) => {
                const done = completedSet.has(index);
                const isNext = index === nextGymIndex;
                const isSelected = index === activeGymIndex;

                return (
                  <li key={`${gym.leader}-legend-${index}`}>
                    <button
                      type="button"
                      onClick={() =>
                        setSelected({ kind: 'gym', index })
                      }
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
                        {done ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          index + 1
                        )}
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
                        {done
                          ? 'Conseguida'
                          : isNext
                            ? 'Siguiente'
                            : gym.badge}
                      </span>
                    </button>
                  </li>
                );
              })
            : activeLevel.steps.map((step) => {
                const isNext = step.index === nextStepIndex;
                const isSelected = step.index === activeStep?.index;

                return (
                  <li key={`step-legend-${activeLevel.id}-${step.index}`}>
                    <button
                      type="button"
                      onClick={() =>
                        setSelected({ kind: 'step', index: step.index })
                      }
                      className={`flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left transition ${
                        isSelected
                          ? 'bg-white/20 ring-1 ring-white/30'
                          : 'bg-white/10 hover:bg-white/15'
                      }`}
                    >
                      <span
                        className={`flex h-5 w-5 flex-none items-center justify-center rounded-full text-[9px] font-black ${
                          step.done
                            ? 'bg-green-500 text-white'
                            : isNext
                              ? 'bg-amber-300 text-amber-950'
                              : 'bg-white text-gray-900'
                        }`}
                      >
                        {step.done ? (
                          <Check className="h-3 w-3" />
                        ) : (
                          step.index + 1
                        )}
                      </span>
                      <span className="min-w-0 flex-1 truncate font-semibold text-white/90">
                        {step.title}
                      </span>
                      <span
                        className={`flex-none text-[9px] font-bold ${
                          step.done
                            ? 'text-green-200'
                            : isNext
                              ? 'text-amber-200'
                              : 'text-white/55'
                        }`}
                      >
                        {step.done
                          ? 'Completado'
                          : isNext
                            ? 'Siguiente'
                            : `Paso ${step.index + 1}`}
                      </span>
                    </button>
                  </li>
                );
              })}
        </ol>

        {activeItemsCount === 0 && (
          <p className="mt-3 text-xs text-white/60">
            Este nivel no tiene paradas registradas.
          </p>
        )}
      </div>
    </section>
  );
}

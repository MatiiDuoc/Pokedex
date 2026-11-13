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
  LocateFixed,
  MapPin,
  Maximize2,
  Minimize2,
  Minus,
  Plus,
  RotateCcw,
  Swords,
  Target,
  X,
} from 'lucide-react';
import TrainerAvatar from './TrainerAvatar';
import { getGymTypeVisual } from '@/lib/gym-visuals';
import { getRegionMap } from '@/lib/region-maps';
import {
  getRegionGymPositions,
  type MapPoint,
} from '@/lib/region-map-coords';
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

function spreadPositions(input: MapPoint[]): MapPoint[] {
  const points = input.map((point) => ({ ...point }));
  if (points.length < 2) return points;

  const aspect = 2.4;
  const minDistance = 8.5;

  for (let iteration = 0; iteration < 60; iteration += 1) {
    let moved = false;

    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        const a = points[i];
        const b = points[j];
        let dx = (b.x - a.x) * aspect;
        let dy = b.y - a.y;
        let distance = Math.hypot(dx, dy);

        if (distance >= minDistance) continue;

        if (distance < 0.001) {
          dx = (i - j) * 0.1;
          dy = (i - j) * 0.1;
          distance = Math.hypot(dx, dy);
        }

        const push = (minDistance - distance) / 2;
        const nx = dx / distance;
        const ny = dy / distance;

        a.x = clamp(a.x - (nx * push) / aspect, 6, 94);
        a.y = clamp(a.y - ny * push, 8, 92);
        b.x = clamp(b.x + (nx * push) / aspect, 6, 94);
        b.y = clamp(b.y + ny * push, 8, 92);
        moved = true;
      }
    }

    if (!moved) break;
  }

  return points;
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
  const [separation, setSeparation] = useState(1);
  const [isolateLevel, setIsolateLevel] = useState(false);
  const [layoutMode, setLayoutMode] = useState<'ruta' | 'geografico'>(
    'ruta'
  );
  const mapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    startX: number;
    startY: number;
    originX: number;
    originY: number;
  } | null>(null);
  const pointersRef = useRef(
    new Map<number, { x: number; y: number }>()
  );
  const pinchRef = useRef<{
    distance: number;
    scale: number;
  } | null>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };

    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    const element = mapRef.current;
    if (!element) return;

    const handleWheel = (event: WheelEvent) => {
      event.preventDefault();
      setScale((current) =>
        clamp(current - event.deltaY * 0.0015, 1, 2.5)
      );
    };

    element.addEventListener('wheel', handleWheel, { passive: false });
    return () => element.removeEventListener('wheel', handleWheel);
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

  const curatedGymPositions = getRegionGymPositions(region);
  const routeGymPositions = gyms.map(
    (_, index) => MAP_POSITIONS[index % MAP_POSITIONS.length]
  );
  const geographicGymPositions = spreadPositions(
    gyms.map(
      (_, index) =>
        curatedGymPositions[index] ??
        MAP_POSITIONS[index % MAP_POSITIONS.length]
    )
  );
  const gymPositions =
    layoutMode === 'geografico'
      ? geographicGymPositions
      : routeGymPositions;

  const lastCompletedStepIndex = steps.reduce(
    (last, step) => (step.done ? Math.max(last, step.index) : last),
    -1
  );
  const currentStep =
    lastCompletedStepIndex >= 0
      ? steps.find((step) => step.index === lastCompletedStepIndex)
      : undefined;
  const nextStep =
    nextStepIndex !== undefined
      ? steps.find((step) => step.index === nextStepIndex)
      : undefined;

  const getStepPoint = (step: MapStep): MapPoint => {
    if (layoutMode === 'ruta') {
      const point = MAP_POSITIONS[step.index % MAP_POSITIONS.length];
      return {
        x: clamp(point.x - 5, 6, 94),
        y: clamp(point.y + 10, 8, 92),
      };
    }

    const title = normalizeText(step.title);
    const matchIndex = gyms.findIndex(
      (gym) =>
        title.includes(normalizeText(gym.location)) ||
        title.includes(normalizeText(gym.leader))
    );

    if (matchIndex >= 0) {
      const base = gymPositions[matchIndex];
      return {
        x: clamp(base.x + 4, 4, 96),
        y: clamp(base.y + 4, 4, 96),
      };
    }

    return MAP_POSITIONS[step.index % MAP_POSITIONS.length];
  };

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
  const selectedStep =
    selectedStepIndex !== null
      ? steps.find((step) => step.index === selectedStepIndex)
      : undefined;
  const activeStep =
    selectedStep ??
    (activeLevel.id !== 'superficie'
      ? (activeLevel.steps.find((step) => !step.done) ??
        activeLevel.steps[0])
      : undefined);

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

  const focusPoint = (point: MapPoint) => {
    const element = mapRef.current;
    if (!element) return;

    const rect = element.getBoundingClientRect();
    const targetScale = Math.max(1.35, scale);
    const nextOffset = {
      x: -((point.x / 100) - 0.5) * rect.width * targetScale,
      y: -((point.y / 100) - 0.5) * rect.height * targetScale,
    };

    setIs3D(false);
    setScale(targetScale);
    setOffset(nextOffset);
  };

  const focusOnGym = (index: number) => {
    const point = gymPositions[index];
    if (!point) return;

    setActiveLevelId('superficie');
    setSelected({ kind: 'gym', index });
    focusPoint(point);
  };

  const focusOnStep = (step: MapStep) => {
    setActiveLevelId(classifyStep(step));
    setSelected({ kind: 'step', index: step.index });
    focusPoint(getStepPoint(step));
  };

  const focusCurrent = () => {
    const step = currentStep ?? nextStep ?? steps[0];

    if (step) {
      focusOnStep(step);
      return;
    }

    if (nextGymIndex >= 0) focusOnGym(nextGymIndex);
    else if (lastCompletedIndex >= 0) focusOnGym(lastCompletedIndex);
  };

  const pinchDistance = (): number | null => {
    const points = Array.from(pointersRef.current.values());
    if (points.length < 2) return null;
    return Math.hypot(
      points[0].x - points[1].x,
      points[0].y - points[1].y
    );
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;

    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });
    event.currentTarget.setPointerCapture(event.pointerId);

    if (pointersRef.current.size === 2) {
      const distance = pinchDistance();
      dragRef.current = null;
      setIsDragging(false);
      if (distance) {
        pinchRef.current = { distance, scale };
      }
      return;
    }

    if (pointersRef.current.size === 1) {
      dragRef.current = {
        startX: event.clientX,
        startY: event.clientY,
        originX: offset.x,
        originY: offset.y,
      };
      setIsDragging(true);
    }
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointersRef.current.has(event.pointerId)) return;

    pointersRef.current.set(event.pointerId, {
      x: event.clientX,
      y: event.clientY,
    });

    if (pointersRef.current.size >= 2 && pinchRef.current) {
      const distance = pinchDistance();
      if (distance) {
        setScale(
          clamp(
            pinchRef.current.scale * (distance / pinchRef.current.distance),
            1,
            2.5
          )
        );
      }
      return;
    }

    const drag = dragRef.current;
    if (!drag) return;

    setOffset({
      x: drag.originX + event.clientX - drag.startX,
      y: drag.originY + event.clientY - drag.startY,
    });
  };

  const endDrag = (event: PointerEvent<HTMLDivElement>) => {
    pointersRef.current.delete(event.pointerId);

    if (pointersRef.current.size < 2) {
      pinchRef.current = null;
    }

    if (pointersRef.current.size === 1) {
      const [[, point]] = Array.from(pointersRef.current.entries());
      dragRef.current = {
        startX: point.x,
        startY: point.y,
        originX: offset.x,
        originY: offset.y,
      };
      setIsDragging(true);
      return;
    }

    dragRef.current = null;
    setIsDragging(false);
  };

  const renderStepMarker = (
    step: MapStep,
    point: MapPoint,
    keyPrefix: string
  ) => {
    const isCurrent = currentStep?.index === step.index;
    const isNext = step.index === nextStepIndex;
    const isSelected = step.index === activeStep?.index;

    return (
      <button
        key={`${keyPrefix}-${step.index}`}
        type="button"
        onPointerDown={(event) => event.stopPropagation()}
        onClick={() => setSelected({ kind: 'step', index: step.index })}
        aria-label={`Paso ${step.index + 1}. ${step.title}. ${
          isCurrent ? 'Estás aquí' : statusForStep(step, nextStepIndex)
        }`}
        aria-pressed={isSelected}
        className="group absolute z-10 -translate-x-1/2 -translate-y-1/2 focus:outline-none"
        style={{ left: `${point.x}%`, top: `${point.y}%` }}
      >
        <span className="flex flex-col items-center transition">
          <span
            className={`flex h-8 w-8 items-center justify-center rounded-full border-2 text-[10px] font-black shadow-lg group-focus-visible:ring-4 group-focus-visible:ring-white/60 ${
              isSelected ? 'ring-4 ring-white/55' : ''
            } ${
              isNext && !isCurrent
                ? 'shadow-[0_0_0_6px_rgba(251,191,36,0.28)]'
                : ''
            } ${
              isCurrent
                ? 'border-blue-100 bg-blue-500 text-white'
                : step.done
                  ? 'border-green-200 bg-green-500 text-white'
                  : isNext
                    ? 'border-white bg-amber-300 text-amber-950'
                    : 'border-white/80 bg-white text-gray-900'
            }`}
          >
            {isCurrent ? (
              <MapPin className="h-4 w-4" />
            ) : step.done ? (
              <Check className="h-4 w-4" />
            ) : (
              step.index + 1
            )}
          </span>
          <span
            className={`mt-1 max-w-[120px] truncate rounded px-1.5 py-0.5 text-[9px] font-bold shadow-sm ${
              is3D
                ? 'hidden'
                : isCurrent || isNext || isSelected
                  ? 'block'
                  : 'hidden sm:group-hover:block sm:group-focus-visible:block'
            } ${
              isCurrent
                ? 'bg-blue-500 text-white'
                : isNext
                  ? 'bg-amber-300 text-amber-950'
                  : step.done
                    ? 'bg-green-500/90 text-white'
                    : 'bg-black/40 text-white'
            }`}
          >
            {isCurrent ? 'Estás aquí' : `Paso ${step.index + 1}`}
          </span>
        </span>
      </button>
    );
  };

  const renderLevelPlate = (
    level: MapLevel,
    depthIndex: number,
    isActive: boolean
  ) => {
    const isSurface = level.id === 'superficie';
    const rawPoints = isSurface
      ? gymPositions
      : level.steps.map((step) => getStepPoint(step));
    const points =
      !isSurface && layoutMode === 'geografico'
        ? spreadPositions(rawPoints)
        : rawPoints;
    const stepPoints = new Map(
      level.steps.map((step, index) => [step.index, points[index]])
    );
    const pointForStep = (step: MapStep): MapPoint | undefined =>
      isSurface ? getStepPoint(step) : stepPoints.get(step.index);
    const polyline = points
      .map((point) => `${point.x},${point.y}`)
      .join(' ');
    const gradientId = `map-land-${level.id}`;
    const depthOffset = is3D ? depthIndex * 30 * separation : 0;
    const yOffset = is3D ? depthIndex * 12 * separation : 0;
    const xOffset = is3D ? depthIndex * 7 : 0;
    const levelScale =
      is3D && level.id === 'cuevas'
        ? 0.9
        : is3D && level.id === 'agua'
          ? 0.8
          : 1;
    const plateScale = is3D ? (1 - depthIndex * 0.035) * levelScale : 1;
    const surfaceStepHighlights = isSurface
      ? [currentStep, selectedStep].filter(
          (step, index, array): step is MapStep =>
            step !== undefined &&
            classifyStep(step) === 'superficie' &&
            array.findIndex(
              (candidate) => candidate?.index === step.index
            ) === index
        )
      : [];
    const currentLevelPoint =
      currentStep && classifyStep(currentStep) === level.id
        ? pointForStep(currentStep)
        : null;
    const nextLevelPoint =
      nextStep && classifyStep(nextStep) === level.id
        ? pointForStep(nextStep)
        : null;

    return (
      <div
        key={level.id}
        className="absolute inset-0 origin-center transition-[transform,opacity] duration-300"
        style={{
          transform: is3D
            ? `translateZ(-${depthOffset}px) translateY(${yOffset}px) translateX(${xOffset}px) scale(${plateScale})`
            : undefined,
          opacity:
            is3D && !isActive ? (isolateLevel ? 0.08 : 0.3) : 1,
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

          {[0.84, 0.7].map((contourScale, contourIndex) => (
            <g
              key={`contour-${level.id}-${contourIndex}`}
              transform={`translate(50 50) scale(${contourScale}) translate(-50 -50)`}
              fill="none"
              stroke="rgba(255,255,255,0.16)"
              strokeWidth="0.3"
            >
              {regionMap.paths.map((path, index) => (
                <path
                  key={`contour-path-${level.id}-${contourIndex}-${index}`}
                  d={path}
                />
              ))}
              {regionMap.circles?.map((circle, index) => (
                <circle
                  key={`contour-island-${level.id}-${contourIndex}-${index}`}
                  cx={circle.cx}
                  cy={circle.cy}
                  r={circle.r}
                />
              ))}
            </g>
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

          {!isSurface &&
            currentLevelPoint &&
            nextLevelPoint &&
            currentStep?.index !== nextStep?.index && (
              <line
                x1={currentLevelPoint.x}
                y1={currentLevelPoint.y}
                x2={nextLevelPoint.x}
                y2={nextLevelPoint.y}
                stroke="rgba(96,165,250,0.8)"
                strokeWidth="0.7"
                strokeDasharray="2 1.2"
                strokeLinecap="round"
              />
            )}
        </svg>

        {isActive &&
          isSurface &&
          gyms.map((gym, index) => {
            const point = gymPositions[index];
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
                      is3D
                        ? 'hidden'
                        : isSelected || isNext
                          ? 'block'
                          : 'hidden sm:group-hover:block sm:group-focus-visible:block'
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
          isSurface &&
          surfaceStepHighlights.map((step) =>
            renderStepMarker(
              step,
              getStepPoint(step),
              `surface-step-${level.id}`
            )
          )}

        {isActive &&
          !isSurface &&
          level.steps.map((step, index) =>
            renderStepMarker(
              step,
              points[index],
              `step-${level.id}`
            )
          )}
      </div>
    );
  };

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-cyan-200/20 bg-gradient-to-br from-slate-950 via-cyan-950 to-blue-950 p-5 text-white shadow-lg"
      aria-label={`Mapa interactivo de ${regionMap.label}`}
    >
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
        <p className="sr-only" aria-live="polite">
          {activeLevel.label}. {activeItemsCount}{' '}
          {activeItemsCount === 1 ? 'parada' : 'paradas'}. Nivel{' '}
          {levels.findIndex((level) => level.id === activeLevel.id) + 1} de{' '}
          {levels.length}.
        </p>
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

          {currentStep && (
            <span className="inline-flex min-w-0 items-center gap-1.5 rounded-full bg-blue-500/20 px-3 py-1 font-bold text-blue-100 ring-1 ring-blue-300/30">
              <MapPin className="h-3.5 w-3.5" />
              <span className="max-w-[220px] truncate">
                Estás aquí: {currentStep.title}
              </span>
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
            onClick={focusCurrent}
            className="inline-flex items-center gap-1.5 rounded-full border border-cyan-200/35 bg-cyan-300/10 px-3 py-1 font-bold text-cyan-100 transition hover:bg-cyan-300/20"
          >
            <LocateFixed className="h-3.5 w-3.5" />
            ¿Dónde estoy?
          </button>

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

        <div className="mt-2 flex flex-wrap items-center gap-3 text-[10px] text-white/70">
          <div className="inline-flex items-center gap-1 rounded-lg border border-cyan-200/20 bg-slate-950/60 p-0.5">
            <span className="px-2 font-black uppercase tracking-widest text-white/45">
              Trazado
            </span>
            <button
              type="button"
              onClick={() => {
                setLayoutMode('ruta');
                resetView();
              }}
              aria-pressed={layoutMode === 'ruta'}
              className={`rounded-md px-2 py-1 text-[10px] font-bold transition ${
                layoutMode === 'ruta'
                  ? 'bg-cyan-300 text-cyan-950'
                  : 'text-white/70 hover:bg-white/10'
              }`}
            >
              Ruta
            </button>
            <button
              type="button"
              onClick={() => {
                setLayoutMode('geografico');
                resetView();
              }}
              aria-pressed={layoutMode === 'geografico'}
              className={`rounded-md px-2 py-1 text-[10px] font-bold transition ${
                layoutMode === 'geografico'
                  ? 'bg-cyan-300 text-cyan-950'
                  : 'text-white/70 hover:bg-white/10'
              }`}
            >
              Geográfico
            </button>
          </div>

          <label className="inline-flex items-center gap-1.5">
            <span className="sr-only">Ir a una parada del mapa</span>
            <select
              value=""
              onChange={(event) => {
                const [kind, rawIndex] = event.target.value.split(':');
                const index = Number.parseInt(rawIndex, 10);

                if (kind === 'gym') {
                  focusOnGym(index);
                } else if (kind === 'step') {
                  const step = steps.find(
                    (candidate) => candidate.index === index
                  );
                  if (step) focusOnStep(step);
                }
              }}
              className="rounded-lg border border-cyan-200/20 bg-slate-950/60 px-2.5 py-1.5 text-xs font-bold text-white focus:border-cyan-200 focus:outline-none focus:ring-2 focus:ring-cyan-300/30"
            >
              <option value="" disabled>
                Ir a una parada…
              </option>
              {gyms.length > 0 && (
                <optgroup label="Gimnasios">
                  {gyms.map((gym, index) => (
                    <option key={`jump-gym-${index}`} value={`gym:${index}`}>
                      {gym.location} · {gym.leader}
                    </option>
                  ))}
                </optgroup>
              )}
              {steps.length > 0 && (
                <optgroup label="Pasos de la ruta">
                  {steps.map((step) => (
                    <option
                      key={`jump-step-${step.index}`}
                      value={`step:${step.index}`}
                    >
                      Paso {step.index + 1} · {step.title}
                    </option>
                  ))}
                </optgroup>
              )}
            </select>
          </label>

          {is3D && levels.length > 1 && (
            <>
              <label className="inline-flex items-center gap-2">
                Separación
                <input
                  type="range"
                  min="0.6"
                  max="1.6"
                  step="0.1"
                  value={separation}
                  onChange={(event) =>
                    setSeparation(Number(event.target.value))
                  }
                  className="h-1 w-24 accent-cyan-300"
                />
              </label>
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={isolateLevel}
                  onChange={(event) =>
                    setIsolateLevel(event.target.checked)
                  }
                  className="h-3.5 w-3.5 accent-cyan-300"
                />
                Aislar nivel activo
              </label>
            </>
          )}
        </div>

        <div
          ref={mapRef}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onDoubleClick={zoomIn}
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
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                'repeating-linear-gradient(0deg, rgba(125,211,252,0.12) 0 1px, transparent 1px 4px)',
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

        {activeLevel.id === 'superficie' &&
          activeGym &&
          selected?.kind !== 'step' && (
          <div
            className={`relative mt-3 rounded-xl border border-white/15 bg-black/20 p-3 ${
              selected
                ? 'max-sm:fixed max-sm:inset-x-2 max-sm:bottom-20 max-sm:z-40 max-sm:max-h-[60vh] max-sm:overflow-y-auto max-sm:bg-slate-950/95 max-sm:shadow-2xl'
                : ''
            }`}
          >
            {selected && (
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Cerrar ficha"
                className="absolute right-2 top-2 rounded-full bg-white/10 p-1 text-white/80 transition hover:bg-white/20 sm:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <div className="flex flex-none items-center gap-2">
                <TrainerAvatar
                  name={activeGym.leader}
                  size="md"
                  className="rounded-xl bg-white/10 px-1 py-0.5 ring-1 ring-white/15"
                />
                {activeVisual && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={activeVisual.artworkUrl}
                    alt={activeVisual.name}
                    loading="lazy"
                    className="h-12 w-12 flex-none object-contain"
                  />
                )}
              </div>
              <div className="min-w-0 w-full flex-1">
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

        {activeStep &&
          (activeLevel.id !== 'superficie' || selected?.kind === 'step') && (
          <div
            className={`relative mt-3 rounded-xl border border-white/15 bg-black/20 p-3 ${
              selected
                ? 'max-sm:fixed max-sm:inset-x-2 max-sm:bottom-20 max-sm:z-40 max-sm:max-h-[60vh] max-sm:overflow-y-auto max-sm:bg-slate-950/95 max-sm:shadow-2xl'
                : ''
            }`}
          >
            {selected && (
              <button
                type="button"
                onClick={() => setSelected(null)}
                aria-label="Cerrar ficha"
                className="absolute right-2 top-2 rounded-full bg-white/10 p-1 text-white/80 transition hover:bg-white/20 sm:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            )}
            <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center">
              <div className="flex h-12 w-12 flex-none items-center justify-center rounded-xl bg-cyan-300/15 text-cyan-100 ring-1 ring-cyan-200/25">
                <Target className="h-6 w-6" />
              </div>
              <div className="min-w-0 w-full flex-1">
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
                const isCurrent = currentStep?.index === step.index;
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
                          isCurrent
                            ? 'bg-blue-500 text-white'
                            : step.done
                              ? 'bg-green-500 text-white'
                              : isNext
                                ? 'bg-amber-300 text-amber-950'
                                : 'bg-white text-gray-900'
                        }`}
                      >
                        {isCurrent ? (
                          <MapPin className="h-3 w-3" />
                        ) : step.done ? (
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
                          isCurrent
                            ? 'text-blue-200'
                            : step.done
                              ? 'text-green-200'
                              : isNext
                                ? 'text-amber-200'
                                : 'text-white/55'
                        }`}
                      >
                        {isCurrent
                          ? 'Estás aquí'
                          : step.done
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

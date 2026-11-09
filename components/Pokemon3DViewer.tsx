'use client';

import {
  Component,
  Suspense,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { Canvas } from '@react-three/fiber';
import {
  ContactShadows,
  Html,
  OrbitControls,
  useAnimations,
  useGLTF,
  useProgress,
} from '@react-three/drei';
import * as THREE from 'three';

const MODEL_BASE =
  'https://raw.githubusercontent.com/Pokemon-3D-api/assets/main/models/opt';

const MODEL_BASES = {
  regular: `${MODEL_BASE}/regular`,
  shiny: `${MODEL_BASE}/shiny`,
};

const availabilityCache = new Map<number, { regular: boolean; shiny: boolean }>();
const preloadedIds = new Set<number>();

export function preloadPokemonModel(pokemonId: number) {
  if (preloadedIds.has(pokemonId)) return;
  preloadedIds.add(pokemonId);

  try {
    useGLTF.preload(`${MODEL_BASES.regular}/${pokemonId}.glb`);
  } catch {
    preloadedIds.delete(pokemonId);
  }
}

interface ViewerProps {
  pokemonId: number;
  name: string;
  spriteUrl: string;
  autoRotate?: boolean;
  shiny?: boolean;
}

interface ModelProps {
  modelUrl: string;
  selectedAnimation: string;
  onAnimations: (names: string[]) => void;
}

function Model({ modelUrl, selectedAnimation, onAnimations }: ModelProps) {
  const { scene, animations } = useGLTF(modelUrl);
  const { actions, names } = useAnimations(animations, scene);

  useEffect(() => {
    onAnimations(names);
  }, [names, onAnimations]);

  useEffect(() => {
    scene.updateMatrixWorld(true);

    const box = new THREE.Box3().setFromObject(scene);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const maxDimension = Math.max(size.x, size.y, size.z) || 1;
    const scale = 2.6 / maxDimension;

    scene.scale.setScalar(scale);
    scene.position.set(
      -center.x * scale,
      -center.y * scale,
      -center.z * scale
    );

    scene.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.frustumCulled = false;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    scene.updateMatrixWorld(true);
  }, [scene]);

  useEffect(() => {
    const fallbackName =
      names.find((name) => /idle/i.test(name)) ?? names[0] ?? '';
    const animationName = selectedAnimation || fallbackName;
    const action = actions[animationName];

    Object.values(actions).forEach((entry) => entry?.stop());
    if (!action) return;

    action.reset().fadeIn(0.2).play();
    return () => {
      action.fadeOut(0.2);
    };
  }, [actions, names, selectedAnimation]);

  return <primitive object={scene} />;
}

class ModelErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) return this.props.fallback;
    return this.props.children;
  }
}

export default function Pokemon3DViewer({
  pokemonId,
  name,
  spriteUrl,
  autoRotate = true,
  shiny = false,
}: ViewerProps) {
  const [availability, setAvailability] = useState<{
    regular: boolean | null;
    shiny: boolean | null;
  }>({ regular: null, shiny: null });
  const [animations, setAnimations] = useState<string[]>([]);
  const [selectedAnimation, setSelectedAnimation] = useState('');
  const [slow, setSlow] = useState(false);
  const { progress, active } = useProgress();

  const isMobile =
    typeof window !== 'undefined' &&
    window.matchMedia('(max-width: 768px)').matches;

  useEffect(() => {
    const timeout = window.setTimeout(() => setSlow(true), 15_000);
    return () => window.clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const cached = availabilityCache.get(pokemonId);
    if (cached) {
      // Lectura de caché síncrona: no provoca una cascada real.
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setAvailability(cached);
      return;
    }

    let cancelled = false;

    Promise.all([
      fetch(`${MODEL_BASES.regular}/${pokemonId}.glb`, { method: 'HEAD' })
        .then((response) => response.ok)
        .catch(() => false),
      fetch(`${MODEL_BASES.shiny}/${pokemonId}.glb`, { method: 'HEAD' })
        .then((response) => response.ok)
        .catch(() => false),
    ]).then(([regular, shinyAvailable]) => {
      if (!cancelled) {
        const next = { regular, shiny: shinyAvailable };
        availabilityCache.set(pokemonId, next);
        setAvailability(next);
        setAnimations([]);
        setSelectedAnimation('');
      }
    });

    return () => {
      cancelled = true;
    };
  }, [pokemonId]);

  const handleAnimations = useCallback((names: string[]) => {
    setAnimations(names);
    setSelectedAnimation((current) => {
      if (current && names.includes(current)) return current;
      return names.find((name) => /idle/i.test(name)) ?? names[0] ?? '';
    });
  }, []);

  const fallback = (
    <div className="flex h-full w-full flex-col items-center justify-center p-6 text-center">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={spriteUrl}
        alt={name}
        className="h-48 w-48 object-contain drop-shadow-xl"
      />
      <p className="mt-3 text-sm font-semibold text-gray-600">
        Este Pokémon aún no tiene modelo 3D disponible. Mostrando imagen.
      </p>
    </div>
  );

  if (availability.regular === null || availability.shiny === null) {
    return (
      <div className="flex h-full w-full items-center justify-center bg-indigo-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  const useShiny = shiny && availability.shiny;
  const modelBase = useShiny
    ? MODEL_BASES.shiny
    : availability.regular
      ? MODEL_BASES.regular
      : availability.shiny
        ? MODEL_BASES.shiny
        : null;

  if (!modelBase) return fallback;

  return (
    <ModelErrorBoundary fallback={fallback}>
      <Canvas
        camera={{ position: [0, 0.2, 4.2], fov: 42 }}
        dpr={isMobile ? [1, 1.5] : [1, 2]}
        shadows={!isMobile}
        gl={{ alpha: true, antialias: true }}
        className="h-full w-full"
      >
        <ambientLight intensity={1.1} />
        <directionalLight
          position={[3, 5, 4]}
          intensity={2.2}
          castShadow
          shadow-mapSize={[1024, 1024]}
        />
        <pointLight position={[-4, 2, -3]} intensity={1.2} color="#fca5a5" />
        <Suspense
          fallback={
            <Html center>
              <span className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-bold text-gray-700 shadow">
                Cargando modelo 3D...
              </span>
            </Html>
          }
        >
          <Model
            modelUrl={`${modelBase}/${pokemonId}.glb`}
            selectedAnimation={selectedAnimation}
            onAnimations={handleAnimations}
          />
          {!isMobile && (
            <ContactShadows
              position={[0, -1.45, 0]}
              opacity={0.35}
              scale={6}
              blur={2.5}
              far={4}
            />
          )}
        </Suspense>
        <OrbitControls
          enablePan={false}
          minDistance={2.2}
          maxDistance={7}
          autoRotate={autoRotate}
          autoRotateSpeed={1.2}
        />
      </Canvas>

      {animations.length > 0 && (
        <div className="absolute left-3 top-3 z-10">
          <label htmlFor={`animation-${pokemonId}`} className="sr-only">
            Animación del modelo
          </label>
          <select
            id={`animation-${pokemonId}`}
            value={selectedAnimation}
            onChange={(event) => setSelectedAnimation(event.target.value)}
            className="max-w-[11rem] rounded-lg border border-gray-200 bg-white/90 px-2.5 py-1.5 text-xs font-bold text-gray-700 shadow-sm backdrop-blur"
          >
            <option value="">Sin animación</option>
            {animations.map((animation) => (
              <option key={animation} value={animation}>
                {animation}
              </option>
            ))}
          </select>
        </div>
      )}

      {shiny && !availability.shiny && (
        <div className="absolute right-3 top-3 z-10 rounded-full bg-amber-100 px-3 py-1.5 text-xs font-bold text-amber-800 shadow-sm">
          Shiny 3D no disponible
        </div>
      )}

      {slow && active && (
        <div className="pointer-events-none absolute bottom-12 left-3 rounded-full bg-amber-100/95 px-3 py-1.5 text-xs font-bold text-amber-900 shadow-lg">
          La carga está tardando. Puedes usar la vista Imagen.
        </div>
      )}

      {active && (
        <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-slate-900/80 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
          Cargando modelo {Math.round(progress)}%
        </div>
      )}
    </ModelErrorBoundary>
  );
}

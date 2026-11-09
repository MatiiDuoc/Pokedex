'use client';

import {
  Component,
  Suspense,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { Canvas } from '@react-three/fiber';
import {
  ContactShadows,
  Html,
  OrbitControls,
  useGLTF,
  useProgress,
} from '@react-three/drei';
import * as THREE from 'three';

const MODEL_BASE =
  'https://raw.githubusercontent.com/Pokemon-3D-api/assets/main/models/opt/regular';

interface ViewerProps {
  pokemonId: number;
  name: string;
  spriteUrl: string;
  autoRotate?: boolean;
}

function Model({ pokemonId }: { pokemonId: number }) {
  const { scene } = useGLTF(`${MODEL_BASE}/${pokemonId}.glb`);

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
        // Evita que una bounding sphere desactualizada oculte modelos riggeados.
        child.frustumCulled = false;
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    scene.updateMatrixWorld(true);
  }, [scene]);

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
}: ViewerProps) {
  const [availability, setAvailability] = useState<'loading' | 'yes' | 'no'>(
    'loading'
  );
  const { progress, active } = useProgress();

  useEffect(() => {
    let cancelled = false;
    const url = `${MODEL_BASE}/${pokemonId}.glb`;

    fetch(url, { method: 'HEAD' })
      .then((response) => {
        if (!cancelled) setAvailability(response.ok ? 'yes' : 'no');
      })
      .catch(() => {
        if (!cancelled) setAvailability('no');
      });

    return () => {
      cancelled = true;
    };
  }, [pokemonId]);

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

  if (availability === 'loading') {
    return (
      <div className="flex h-full w-full items-center justify-center bg-indigo-50">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
      </div>
    );
  }

  if (availability === 'no') return fallback;

  return (
    <ModelErrorBoundary fallback={fallback}>
      <Canvas
        camera={{ position: [0, 0.2, 4.2], fov: 42 }}
        dpr={[1, 2]}
        shadows
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
          <Model pokemonId={pokemonId} />
          <ContactShadows
            position={[0, -1.45, 0]}
            opacity={0.35}
            scale={6}
            blur={2.5}
            far={4}
          />
        </Suspense>
        <OrbitControls
          enablePan={false}
          minDistance={2.2}
          maxDistance={7}
          autoRotate={autoRotate}
          autoRotateSpeed={1.2}
        />
      </Canvas>

      {active && (
        <div className="pointer-events-none absolute bottom-3 right-3 rounded-full bg-slate-900/80 px-3 py-1.5 text-xs font-bold text-white shadow-lg">
          Cargando modelo {Math.round(progress)}%
        </div>
      )}
    </ModelErrorBoundary>
  );
}

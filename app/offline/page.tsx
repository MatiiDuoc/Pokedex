import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Sin conexión',
  description: 'Estás sin conexión. Puedes seguir consultando las páginas ya visitadas.',
};

export default function OfflinePage() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="max-w-lg text-center">
        <p className="text-5xl" aria-hidden="true">
          📡
        </p>
        <h1 className="mt-3 text-3xl font-black text-gray-900">Sin conexión</h1>
        <p className="mt-2 text-gray-600">
          No podemos conectar con el servidor. Puedes seguir consultando las guías
          y páginas que ya hayas visitado.
        </p>
        <p className="mt-2 rounded-xl bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Guardar cambios de progreso y equipo requiere conexión. Se sincronizarán
          cuando vuelvas a estar en línea.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/guias"
            className="rounded-lg bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
          >
            Ver guías
          </Link>
          <Link
            href="/"
            className="rounded-lg bg-gray-100 px-5 py-3 text-sm font-bold text-gray-800 transition hover:bg-gray-200"
          >
            Volver al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

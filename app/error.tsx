'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function ErrorPage({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Error de aplicación:', error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="max-w-lg text-center">
        <p className="text-5xl" aria-hidden="true">
          ⚠️
        </p>
        <h1 className="mt-3 text-3xl font-black text-gray-900">
          Algo ha salido mal
        </h1>
        <p className="mt-2 text-gray-600">
          Ha ocurrido un error inesperado. Puedes reintentar o volver al inicio.
        </p>
        {error.digest && (
          <p className="mt-2 text-xs font-semibold text-gray-400">
            Referencia: {error.digest}
          </p>
        )}
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={reset}
            className="rounded-lg bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
          >
            Reintentar
          </button>
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

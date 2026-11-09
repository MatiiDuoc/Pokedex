'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="es">
      <body>
        <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 text-center">
          <div>
            <h1 className="text-3xl font-black text-gray-900">
              Error crítico
            </h1>
            <p className="mt-2 text-gray-600">
              La aplicación no ha podido cargarse. Prueba a recargar la página.
            </p>
            {error.digest && (
              <p className="mt-2 text-xs text-gray-400">
                Referencia: {error.digest}
              </p>
            )}
            <button
              type="button"
              onClick={reset}
              className="mt-6 rounded-lg bg-red-600 px-5 py-3 text-sm font-bold text-white"
            >
              Recargar
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

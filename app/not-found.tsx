import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] items-center justify-center px-4 py-16">
      <div className="max-w-lg text-center">
        <p className="text-6xl font-black text-red-600">404</p>
        <h1 className="mt-2 text-2xl font-black text-gray-900">
          No encontramos esa página
        </h1>
        <p className="mt-2 text-gray-600">
          Puede que la guía todavía no exista o que el enlace esté mal escrito.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <Link
            href="/guias"
            className="rounded-lg bg-red-600 px-5 py-3 text-sm font-bold text-white transition hover:bg-red-700"
          >
            Ver todas las guías
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

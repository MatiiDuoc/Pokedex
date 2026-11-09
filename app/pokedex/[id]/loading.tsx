export default function PokemonDetailLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="h-4 w-56 animate-pulse rounded bg-gray-200" />
      <div className="mt-4 h-96 animate-pulse rounded-3xl bg-gray-200" />
      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          <div className="h-40 animate-pulse rounded-2xl bg-gray-200" />
          <div className="h-64 animate-pulse rounded-2xl bg-gray-200" />
        </div>
        <div className="h-80 animate-pulse rounded-2xl bg-gray-200" />
      </div>
    </div>
  );
}

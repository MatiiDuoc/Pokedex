import { PokemonGridSkeleton, Skeleton } from '@/components/Skeleton';

export default function PokedexLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="text-center">
        <Skeleton className="mx-auto h-10 w-72" />
        <Skeleton className="mx-auto mt-3 h-4 w-96" />
      </div>
      <Skeleton className="mt-8 h-40 w-full rounded-2xl" />
      <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-12" />
        ))}
      </div>
      <div className="mt-6">
        <PokemonGridSkeleton />
      </div>
    </div>
  );
}

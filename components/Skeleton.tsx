export function Skeleton({ className = '' }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={`animate-pulse rounded-xl bg-gray-200 ${className}`}
    />
  );
}

export function PokemonGridSkeleton({ count = 12 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="rounded-xl bg-white p-3 shadow-sm"
        >
          <Skeleton className="mx-auto h-20 w-20 rounded-full" />
          <Skeleton className="mx-auto mt-2 h-3 w-12" />
          <Skeleton className="mx-auto mt-1 h-3 w-20" />
        </div>
      ))}
    </div>
  );
}

export function GuideGridSkeleton({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, index) => (
        <div key={index} className="rounded-2xl bg-white p-5 shadow-sm">
          <Skeleton className="h-3 w-24" />
          <Skeleton className="mt-3 h-5 w-3/4" />
          <Skeleton className="mt-2 h-3 w-1/2" />
          <Skeleton className="mt-4 h-16 w-full" />
        </div>
      ))}
    </div>
  );
}

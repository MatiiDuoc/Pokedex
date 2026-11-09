import { Skeleton } from '@/components/Skeleton';

export default function Pokemon3DGalleryLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Skeleton className="h-52 w-full rounded-3xl" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {Array.from({ length: 8 }).map((_, index) => (
          <div key={index} className="rounded-2xl bg-white p-4 shadow-sm">
            <Skeleton className="h-36 w-full rounded-xl" />
            <Skeleton className="mt-3 h-5 w-2/3" />
            <Skeleton className="mt-2 h-3 w-1/3" />
            <Skeleton className="mt-3 h-10 w-full" />
          </div>
        ))}
      </div>
    </div>
  );
}

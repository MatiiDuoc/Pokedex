import { GuideGridSkeleton, Skeleton } from '@/components/Skeleton';

export default function GuidesLoading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <div className="text-center">
        <Skeleton className="mx-auto h-4 w-40" />
        <Skeleton className="mx-auto mt-3 h-10 w-96" />
        <Skeleton className="mx-auto mt-3 h-4 w-2/3" />
      </div>
      <div className="mt-8 grid gap-4 md:grid-cols-2 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, index) => (
          <Skeleton key={index} className="h-12" />
        ))}
      </div>
      <div className="mt-6">
        <GuideGridSkeleton />
      </div>
    </div>
  );
}

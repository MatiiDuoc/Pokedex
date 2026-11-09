import { Skeleton } from '@/components/Skeleton';

export default function GuideLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <Skeleton className="h-4 w-48" />
      <Skeleton className="mt-4 h-56 w-full rounded-3xl" />
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="mt-6 h-12 w-full" />
      <div className="mt-6 space-y-4">
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-40 w-full" />
      </div>
    </div>
  );
}

import { Skeleton } from '@/components/Skeleton';

export default function CompareLoading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <Skeleton className="mx-auto h-10 w-80" />
      <Skeleton className="mx-auto mt-6 h-12 w-full max-w-3xl" />
      <div className="mt-8 grid gap-5 md:grid-cols-2">
        <Skeleton className="h-80 rounded-2xl" />
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    </div>
  );
}

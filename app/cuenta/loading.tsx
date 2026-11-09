import { Skeleton } from '@/components/Skeleton';

export default function AccountLoading() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <Skeleton className="h-40 w-full rounded-2xl" />
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
      <Skeleton className="mt-5 h-40 w-full" />
    </div>
  );
}

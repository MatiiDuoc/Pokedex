export default function TeamLoading() {
  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="h-10 w-48 animate-pulse rounded bg-gray-200" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-2xl bg-gray-200"
          />
        ))}
      </div>
    </div>
  );
}

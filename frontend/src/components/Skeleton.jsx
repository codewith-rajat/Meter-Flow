export default function Skeleton({ className = '', count = 1 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className={`bg-gray-200 animate-pulse rounded ${className}`} />
      ))}
    </>
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-lg shadow p-6 space-y-4">
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-8 w-1/2" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-10 w-1/4" />
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="grid grid-cols-4 gap-4">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </div>
      ))}
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-4 gap-6">
        {[1, 2, 3, 4].map((i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6 h-96">
          <Skeleton className="h-4 w-1/4 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="bg-white rounded-lg shadow p-6 h-96">
          <Skeleton className="h-4 w-1/4 mb-4" />
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  );
}

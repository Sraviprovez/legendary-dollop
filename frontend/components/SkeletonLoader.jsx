'use client';

/**
 * Skeleton loader components for different content types
 */

export const SkeletonLoader = ({ className = 'h-12 w-full rounded-md bg-muted' }) => (
  <div className={`animate-pulse ${className}`} />
);

export const SkeletonText = ({ lines = 1, className = '' }) => (
  <div className={`space-y-2 ${className}`}>
    {Array.from({ length: lines }).map((_, i) => (
      <SkeletonLoader
        key={i}
        className={`h-4 w-full rounded ${i === lines - 1 ? 'w-3/4' : ''} bg-muted`}
      />
    ))}
  </div>
);

export const SkeletonCard = ({ count = 3 }) => (
  <div className="space-y-4">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="rounded-lg border border-border p-4 space-y-3">
        <SkeletonLoader className="h-6 w-1/3 rounded" />
        <SkeletonText lines={2} />
        <div className="flex gap-2">
          <SkeletonLoader className="h-8 w-20 rounded" />
          <SkeletonLoader className="h-8 w-20 rounded" />
        </div>
      </div>
    ))}
  </div>
);

export const SkeletonTable = ({ rows = 5, columns = 4 }) => (
  <div className="space-y-3">
    {/* Header */}
    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
      {Array.from({ length: columns }).map((_, i) => (
        <SkeletonLoader key={`header-${i}`} className="h-10 rounded" />
      ))}
    </div>
    {/* Rows */}
    {Array.from({ length: rows }).map((_, row) => (
      <div
        key={`row-${row}`}
        className="grid gap-4"
        style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
      >
        {Array.from({ length: columns }).map((_, col) => (
          <SkeletonLoader key={`cell-${row}-${col}`} className="h-8 rounded" />
        ))}
      </div>
    ))}
  </div>
);

export const SkeletonList = ({ count = 5 }) => (
  <div className="space-y-2">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonLoader
        key={i}
        className="h-12 w-full rounded"
      />
    ))}
  </div>
);

export const SkeletonAvatar = () => (
  <SkeletonLoader className="h-10 w-10 rounded-full" />
);

export const SkeletonBanner = () => (
  <SkeletonLoader className="h-64 w-full rounded-lg" />
);

export default {
  SkeletonLoader,
  SkeletonText,
  SkeletonCard,
  SkeletonTable,
  SkeletonList,
  SkeletonAvatar,
  SkeletonBanner,
};

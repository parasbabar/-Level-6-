interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
}

export function Skeleton({ className = '', width, height, circle = false }: SkeletonProps) {
  return (
    <div
      className={`animate-pulse bg-white/5 ${circle ? 'rounded-full' : 'rounded-lg'} ${className}`}
      style={{
        width: width || '100%',
        height: height || '1rem',
      }}
    >
      {/* Shimmer effect */}
      <div className="h-full w-full bg-gradient-to-r from-transparent via-white/5 to-transparent animate-shimmer" />
    </div>
  );
}

// Add shimmer animation to index.css:
// @keyframes shimmer {
//   0% { transform: translateX(-100%); }
//   100% { transform: translateX(100%); }
// }

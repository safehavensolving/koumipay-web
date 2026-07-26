export function AppSkeleton({ width = '100%', height = 16, borderRadius = 8, circle = false, size, className = '' }) {
  const style = circle
    ? { width: size ?? height, height: size ?? height, borderRadius: '50%' }
    : { width, height, borderRadius };
  return <div style={style} className={`bg-neutral-bg animate-pulse ${className}`} />;
}

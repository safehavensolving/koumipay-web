export function AppCard({ children, className = '', padding = 16, shadow = true, onPress }) {
  const Tag = onPress ? 'button' : 'div';
  return (
    <Tag
      type={onPress ? 'button' : undefined}
      onClick={onPress}
      style={{ padding }}
      className={`bg-white rounded-2xl border border-border text-left w-full ${
        shadow ? 'shadow-sm' : ''
      } ${onPress ? 'cursor-pointer hover:shadow-md transition' : ''} ${className}`}
    >
      {children}
    </Tag>
  );
}

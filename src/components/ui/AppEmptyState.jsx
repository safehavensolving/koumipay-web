import { AppButton } from './AppButton';

export function AppEmptyState({
  title = 'Aucun résultat',
  subtitle,
  actionLabel,
  onAction,
  className = '',
}) {
  return (
    <div className={`flex flex-col items-center text-center py-10 px-4 ${className}`}>
      <div className="size-18 rounded-full bg-light-gray flex items-center justify-center mb-4 text-3xl">
        📭
      </div>
      <p className="text-base font-semibold text-navy">{title}</p>
      {subtitle && <p className="text-sm text-muted mt-1 max-w-xs">{subtitle}</p>}
      {actionLabel && onAction && (
        <AppButton label={actionLabel} onPress={onAction} variant="secondary" size="sm" className="mt-4" />
      )}
    </div>
  );
}

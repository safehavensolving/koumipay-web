import { AppCard, AppEmptyState } from '../../ui';

const DOT_CLASSES = {
  success: 'bg-success-bright',
  warning: 'bg-warning-bright',
  danger: 'bg-danger',
  critical: 'bg-danger',
  info: 'bg-info-bright',
  paid: 'bg-success-bright',
  partial: 'bg-warning-bright',
  unpaid: 'bg-danger',
};

export function NotificationBell({ notifications }) {
  const results = notifications?.results || [];
  return (
    <AppCard className="p-4">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-navy">Notifications</h3>
        {notifications?.unread_count > 0 && (
          <span className="text-xs font-semibold text-emerald">{notifications.unread_count} non lues</span>
        )}
      </div>
      {results.length === 0 ? (
        <AppEmptyState title="Aucune notification" />
      ) : (
        <ul className="flex flex-col gap-3">
          {results.map((n) => (
            <li key={n.id} className="flex gap-3">
              <span className={`size-2 rounded-full mt-1.5 ${DOT_CLASSES[n.severity] || 'bg-muted'}`} />
              <div>
                <p className="text-sm font-medium text-navy">{n.title}</p>
                <p className="text-xs text-muted mt-0.5">{n.message}</p>
                <p className="text-[11px] text-muted mt-1">{new Date(n.created_at).toLocaleString('fr-FR')}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </AppCard>
  );
}

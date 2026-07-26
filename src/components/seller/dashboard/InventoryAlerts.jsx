import { AppBadge, AppCard, AppEmptyState } from '../../ui';

export function InventoryAlerts({ alerts, onPressItem }) {
  return (
    <AppCard className="p-4">
      <h3 className="text-sm font-semibold text-navy mb-3">Alertes de stock</h3>
      {alerts.length === 0 ? (
        <AppEmptyState title="Aucune alerte de stock" />
      ) : (
        <ul className="divide-y divide-border">
          {alerts.map((alert) => (
            <li key={alert.id}>
              <button
                type="button"
                onClick={() => onPressItem?.(alert)}
                className="w-full flex items-center justify-between py-3 text-left cursor-pointer hover:bg-light-gray rounded-lg px-1"
              >
                <div>
                  <p className="text-sm font-medium text-navy">{alert.name}</p>
                  <p className="text-xs text-muted mt-0.5">
                    Stock : {alert.current_stock} / seuil {alert.low_stock_threshold}
                  </p>
                </div>
                <AppBadge
                  label={alert.severity === 'critical' ? 'Urgent' : 'Faible'}
                  variant={alert.severity === 'critical' ? 'danger' : 'warning'}
                />
              </button>
            </li>
          ))}
        </ul>
      )}
    </AppCard>
  );
}

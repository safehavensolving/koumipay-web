import { AppCard, AppEmptyState } from '../../ui';
import { formatGnf } from '../../../utils/money';

const PAYMENT_ICON = {
  cash: '💵',
  mobile_money: '📱',
  bank: '🏦',
  card: '💳',
};

export function RecentSalesList({ sales, onPressItem, title = 'Ventes récentes', amountsVisible }) {
  return (
    <AppCard className="p-4">
      <h3 className="text-sm font-semibold text-navy mb-3">{title}</h3>
      {sales.length === 0 ? (
        <AppEmptyState title="Aucune vente récente" />
      ) : (
        <ul className="divide-y divide-border">
          {sales.map((sale) => (
            <li key={sale.id}>
              <button
                type="button"
                onClick={() => onPressItem?.(sale)}
                className="w-full flex items-center justify-between py-3 text-left cursor-pointer hover:bg-light-gray rounded-lg px-1"
              >
                <div>
                  <p className="text-sm font-medium text-navy">{sale.customer_name}</p>
                  <p className="text-xs text-muted mt-0.5">
                    {new Date(sale.created_at).toLocaleString('fr-FR')} · {sale.payment_status}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm">{PAYMENT_ICON[sale.latest_payment_method] || ''}</p>
                  <p className="text-sm font-semibold text-navy">
                    {amountsVisible ? formatGnf(sale.total_amount) : '•••••• GNF'}
                  </p>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </AppCard>
  );
}

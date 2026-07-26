import { AppCard, AppEmptyState } from '../../ui';
import { formatGnf } from '../../../utils/money';

export function RecentExpensesList({ expenses, amountsVisible, title = 'Dépenses récentes' }) {
  return (
    <AppCard className="p-4">
      <h3 className="text-sm font-semibold text-navy mb-3">{title}</h3>
      {expenses.length === 0 ? (
        <AppEmptyState title="Aucune dépense récente" />
      ) : (
        <ul className="divide-y divide-border">
          {expenses.map((expense) => (
            <li key={expense.id} className="flex items-center justify-between py-3">
              <div>
                <p className="text-sm font-medium text-navy">
                  {expense.primary_designation || expense.supplier_name}
                </p>
                <p className="text-xs text-muted mt-0.5">
                  {new Date(expense.created_at).toLocaleString('fr-FR')} · {expense.expense_type}
                </p>
              </div>
              <p className="text-sm font-semibold text-navy">
                {amountsVisible ? formatGnf(expense.total_amount) : '•••••• GNF'}
              </p>
            </li>
          ))}
        </ul>
      )}
    </AppCard>
  );
}

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { AppCard } from '../../ui';
import { formatGnf } from '../../../utils/money';

export function SalesChart({ analytics, amountsVisible }) {
  if (!analytics) return null;
  const labels = analytics.sales_chart?.labels || [];
  const salesValues = analytics.sales_chart?.values || [];
  const expensesValues = analytics.expenses_chart?.values || [];
  const chartData = labels.map((label, i) => ({
    label,
    ventes: salesValues[i] || 0,
    depenses: expensesValues[i] || 0,
  }));

  const daySummary = analytics.day_summary || {};
  const growth = Number(analytics.growth_percent || 0);
  const collectionRate = Number(analytics.collection_rate_percent || 0);

  return (
    <AppCard className="p-4">
      <h3 className="text-sm font-semibold text-navy mb-3">Activité sur 7 jours</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
            <XAxis dataKey="label" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip formatter={(value) => formatGnf(value)} />
            <Bar dataKey="ventes" fill="#16A34A" radius={[4, 4, 0, 0]} />
            <Bar dataKey="depenses" fill="#DC2626" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid grid-cols-3 gap-3 mt-4">
        <div>
          <p className="text-xs text-muted">Ventes du jour</p>
          <p className="text-sm font-semibold text-navy">
            {amountsVisible ? formatGnf(daySummary.sales) : '••••• GNF'}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">Profit du jour</p>
          <p className="text-sm font-semibold text-navy">
            {amountsVisible ? formatGnf(daySummary.profit) : '••••• GNF'}
          </p>
        </div>
        <div>
          <p className="text-xs text-muted">Croissance</p>
          <p className={`text-sm font-semibold ${growth >= 0 ? 'text-success-text' : 'text-danger-text'}`}>
            {growth >= 0 ? '+' : ''}
            {growth.toFixed(1)}%
          </p>
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-xs text-muted mb-1">
          <span>Taux de recouvrement</span>
          <span>{collectionRate.toFixed(0)}%</span>
        </div>
        <div className="h-2 rounded-full bg-neutral-bg overflow-hidden">
          <div
            className="h-full bg-emerald"
            style={{ width: `${Math.min(100, Math.max(0, collectionRate))}%` }}
          />
        </div>
      </div>
    </AppCard>
  );
}

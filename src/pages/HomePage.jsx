import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { AppCard } from '../components/ui';
import { KPIGrid } from '../components/seller/dashboard/KPIGrid';
import { QuickActions } from '../components/seller/dashboard/QuickActions';
import { SalesChart } from '../components/seller/dashboard/SalesChart';
import { InventoryAlerts } from '../components/seller/dashboard/InventoryAlerts';
import { RecentSalesList } from '../components/seller/dashboard/RecentSalesList';
import { RecentExpensesList } from '../components/seller/dashboard/RecentExpensesList';
import { NotificationBell } from '../components/seller/dashboard/NotificationBell';
import { useSellerDashboardData } from '../hooks/useSellerDashboardData';
import { useAuth } from '../contexts/AuthContext';
import { formatGnf } from '../utils/money';
import { PinModal } from '../components/security/PinModal';
import { hasSecurityPin } from '../utils/securityPin';

export function HomePage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { loading, error, kpis, analytics, recentSales, recentExpenses, stockAlerts, notifications } =
    useSellerDashboardData();
  const [amountsVisible, setAmountsVisible] = useState(false);
  const [pinModalVisible, setPinModalVisible] = useState(false);

  function onToggleAmounts() {
    if (amountsVisible) {
      // Cacher les montants → pas besoin de PIN
      setAmountsVisible(false);
      return;
    }
    // Révéler les montants → vérifier si un PIN est configuré
    if (hasSecurityPin()) {
      setPinModalVisible(true);
    } else {
      setAmountsVisible(true);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <p className="text-muted">Chargement du tableau de bord…</p>
      </AppShell>
    );
  }

  if (error) {
    return (
      <AppShell>
        <AppCard className="p-6 text-danger">{error}</AppCard>
      </AppShell>
    );
  }

  const kpiItems = [
    { key: 'balance', label: 'Solde', value: kpis?.cash_balance, hideable: true, onPress: () => navigate('/finance') },
    {
      key: 'profit',
      label: 'Bénéfice',
      value: kpis?.total_profit,
      hideable: true,
      tone: 'success',
      onPress: () => navigate('/finance'),
    },
    {
      key: 'revenue',
      label: "Chiffre d'affaires",
      value: kpis?.total_sales,
      hideable: true,
      onPress: () => navigate('/historique'),
    },
    {
      key: 'expenses',
      label: 'Dépenses',
      value: kpis?.total_expenses,
      hideable: true,
      onPress: () => navigate('/expenses'),
    },
    { key: 'sales_count', label: 'Ventes', value: kpis?.sales_count, formatter: (v) => String(v ?? 0) },
    {
      key: 'low_stock',
      label: 'Alertes stock',
      value: kpis?.low_stock_products,
      formatter: (v) => String(v ?? 0),
      tone: 'warning',
      onPress: () => navigate('/stock'),
    },
  ];

  const quickActions = [
    { key: 'sale', label: 'Nouvelle vente', icon: '🧾', highlight: true, onPress: () => navigate('/venterapide') },
    { key: 'product', label: 'Ajouter produit', icon: '➕', onPress: () => navigate('/boutique') },
    { key: 'expense', label: 'Ajouter dépense', icon: '💸', onPress: () => navigate('/expenses') },
    { key: 'stock', label: 'Voir le stock', icon: '📦', onPress: () => navigate('/stock') },
    { key: 'invoice', label: 'Facturation', icon: '📄', onPress: () => navigate('/facturation') },
    { key: 'customers', label: 'Clients', icon: '👥', onPress: () => navigate('/customers') },
  ];

  return (
    <AppShell>
      <PinModal
        visible={pinModalVisible}
        title="Afficher les montants"
        subtitle="Saisissez votre code PIN pour révéler les soldes et montants sensibles."
        onSuccess={() => {
          setPinModalVisible(false);
          setAmountsVisible(true);
        }}
        onDismiss={() => setPinModalVisible(false)}
      />

      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-sm text-muted">Bonjour,</p>
          <h1 className="text-xl font-bold text-navy">{user?.first_name || 'Vendeur'}</h1>
        </div>
        <button type="button" onClick={onToggleAmounts} className="text-sm text-emerald font-medium cursor-pointer">
          {amountsVisible ? 'Masquer les montants' : 'Afficher les montants'}
        </button>
      </div>

      <div className="rounded-3xl bg-navy text-white p-6 mb-6">
        <p className="text-sm text-white/70">Solde disponible</p>
        <p className="text-3xl font-bold mt-1">
          {amountsVisible ? formatGnf(kpis?.cash_balance) : '•••••• GNF'}
        </p>
        <div className="flex gap-6 mt-4">
          <div>
            <p className="text-xs text-white/60">Ventes du jour</p>
            <p className="text-sm font-semibold">
              {amountsVisible ? formatGnf(analytics?.day_summary?.sales) : '•••• GNF'}
            </p>
          </div>
          <div>
            <p className="text-xs text-white/60">Profit du jour</p>
            <p className="text-sm font-semibold">
              {amountsVisible ? formatGnf(analytics?.day_summary?.profit) : '•••• GNF'}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-6">
        <QuickActions items={quickActions} />
        <KPIGrid items={kpiItems} amountsVisible={amountsVisible} />
        <SalesChart analytics={analytics} amountsVisible={amountsVisible} />
        <div className="grid sm:grid-cols-2 gap-6">
          <InventoryAlerts alerts={stockAlerts} onPressItem={() => navigate('/stock')} />
          <NotificationBell notifications={notifications} />
        </div>
        <div className="grid sm:grid-cols-2 gap-6">
          <RecentSalesList sales={recentSales} amountsVisible={amountsVisible} onPressItem={() => navigate('/historique')} />
          <RecentExpensesList expenses={recentExpenses} amountsVisible={amountsVisible} />
        </div>
      </div>
    </AppShell>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  getDashboardAnalytics,
  getDashboardKpis,
  listInventoryAlerts,
  listNotifications,
  listRecentExpenses,
  listRecentSales,
} from '../api/partnerDomain';
import { ApiError } from '../api/client';

export function useSellerDashboardData(activeShopId) {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [data, setData] = useState({
    kpis: null,
    analytics: null,
    recentSales: [],
    recentExpenses: [],
    stockAlerts: [],
    notifications: { unread_count: 0, results: [] },
  });

  const baseParams = useMemo(
    () => ({
      ...(activeShopId ? { shop_id: activeShopId } : {}),
    }),
    [activeShopId]
  );

  const load = useCallback(
    async (isRefresh = false) => {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);
      try {
        const [kpisJson, analyticsJson, salesJson, expensesJson, alertsJson, notificationsJson] = await Promise.all([
          getDashboardKpis({ period: 'month', ...baseParams }),
          getDashboardAnalytics({ period: 'week', ...baseParams }),
          listRecentSales({ limit: 5, ...baseParams }),
          listRecentExpenses({ limit: 5, ...baseParams }),
          listInventoryAlerts({ limit: 6, ...baseParams }),
          listNotifications({ limit: 6, ...baseParams }),
        ]);

        setData({
          kpis: kpisJson.data,
          analytics: analyticsJson.data,
          recentSales: salesJson.data || [],
          recentExpenses: expensesJson.data || [],
          stockAlerts: alertsJson.data || [],
          notifications: notificationsJson.data || { unread_count: 0, results: [] },
        });
      } catch (e) {
        setData({
          kpis: null,
          analytics: null,
          recentSales: [],
          recentExpenses: [],
          stockAlerts: [],
          notifications: { unread_count: 0, results: [] },
        });
        setError(e instanceof ApiError ? e.message : 'Impossible de charger le tableau de bord.');
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [baseParams]
  );

  useEffect(() => {
    load(false);
  }, [load]);

  return {
    loading,
    refreshing,
    error,
    ...data,
    load,
  };
}

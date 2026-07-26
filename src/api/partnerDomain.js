import { apiRequestWithAuth } from './client';

function withQuery(path, params) {
  const q = new URLSearchParams();
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        q.append(k, String(v));
      }
    });
  }
  const s = q.toString();
  return s ? `${path}?${s}` : path;
}

export function getSellerOnboardingStatus() {
  return apiRequestWithAuth('/seller/onboarding/status/', { method: 'GET' });
}

export function postSellerOnboardingComplete(body = {}) {
  return apiRequestWithAuth('/seller/onboarding/complete/', { method: 'POST', body });
}

/** @param {Record<string, string | number | undefined>} [params] */
export function getDashboardKpis(params) {
  return apiRequestWithAuth(withQuery('/dashboard/kpis/', params));
}

/** @param {Record<string, string | number | undefined>} [params] */
export function getDashboardAnalytics(params) {
  return apiRequestWithAuth(withQuery('/dashboard/analytics/', params));
}

/** @param {Record<string, string | number | undefined>} [params] */
export function listRecentSales(params) {
  return apiRequestWithAuth(withQuery('/sales/recent/', params));
}

/** @param {Record<string, string | number | undefined>} [params] */
export function listRecentExpenses(params) {
  return apiRequestWithAuth(withQuery('/expenses/recent/', params));
}

/** @param {Record<string, string | number | undefined>} [params] */
export function listInventoryAlerts(params) {
  return apiRequestWithAuth(withQuery('/inventory/alerts/', params));
}

/** @param {Record<string, string | number | undefined>} [params] */
export function listNotifications(params) {
  return apiRequestWithAuth(withQuery('/notifications/', params));
}

/** @param {Record<string, string | number | undefined>} [params] */
export function listShops(params) {
  return apiRequestWithAuth(withQuery('/shops/', params));
}

export function getShop(id) {
  return apiRequestWithAuth(`/shops/${id}/`);
}

export function patchShop(id, body) {
  return apiRequestWithAuth(`/shops/${id}/`, { method: 'PATCH', body });
}

export function getSellerProfile() {
  return apiRequestWithAuth('/seller/profile/');
}

export function patchSellerProfile(body) {
  return apiRequestWithAuth('/seller/profile/', { method: 'PATCH', body });
}

export function deactivateSellerAccount(reason) {
  return apiRequestWithAuth('/seller/deactivate-account/', {
    method: 'POST',
    body: { reason: reason || 'user_request' },
  });
}

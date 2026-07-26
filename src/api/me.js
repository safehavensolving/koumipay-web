import { apiRequest } from './client';

export function getMe(accessToken) {
  return apiRequest('/me/', { method: 'GET', token: accessToken });
}

/**
 * @param {string} accessToken
 * @param {{ password: string, first_name: string, last_name?: string, activity_sector: string, email?: string }} body
 */
export function postPartnerOnboarding(accessToken, body) {
  return apiRequest('/me/partner/onboarding/', { method: 'POST', body, token: accessToken });
}

export function patchMe(accessToken, body) {
  return apiRequest('/me/', { method: 'PATCH', body, token: accessToken });
}

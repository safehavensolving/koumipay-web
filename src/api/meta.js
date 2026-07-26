import { apiRequest } from './client';

/** @returns {Promise<{ data: { choices: { value: string, label: string }[] } }>} */
export function getPartnerActivitySectors() {
  return apiRequest('/meta/partner-activity-sectors/', { method: 'GET' });
}

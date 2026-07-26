import { apiRequest } from './client';

export function postOtpRequest(phone) {
  return apiRequest('/auth/otp/request/', { method: 'POST', body: { phone } });
}

/**
 * Vérifie le code OTP — ne connecte plus directement : renvoie un jeton de
 * courte durée prouvant la possession du numéro (`verified_token`), à
 * échanger contre une session via `postPhoneSetPassword` (inscription ou
 * mot de passe oublié, même mécanisme).
 */
export function postOtpVerify(phone, code) {
  return apiRequest('/auth/otp/verify/', { method: 'POST', body: { phone, code } });
}

export function postPhoneLogin(body) {
  return apiRequest('/auth/phone/login/', { method: 'POST', body });
}

export function postPhoneSetPassword(body) {
  return apiRequest('/auth/phone/password/set/', { method: 'POST', body });
}

export function postEmailRegister(body) {
  return apiRequest('/auth/email/register/', { method: 'POST', body });
}

export function postEmailVerify(body) {
  return apiRequest('/auth/email/verify/', { method: 'POST', body });
}

export function postEmailResendCode(body) {
  return apiRequest('/auth/email/resend-code/', { method: 'POST', body });
}

export function postEmailLogin(body) {
  return apiRequest('/auth/email/login/', { method: 'POST', body });
}

export function postPasswordResetRequest(body) {
  return apiRequest('/auth/password/reset/request/', { method: 'POST', body });
}

export function postPasswordResetConfirm(body) {
  return apiRequest('/auth/password/reset/confirm/', { method: 'POST', body });
}

export function postGoogleAuth(body) {
  return apiRequest('/auth/google/', { method: 'POST', body });
}

/** SimpleJWT renvoie { access } sans enveloppe Koumi ; on normalise. */
export async function postJwtRefresh(refresh) {
  const json = await apiRequest('/auth/jwt/refresh/', { method: 'POST', body: { refresh } });
  const access = json.data?.access ?? json.access;
  const newRefresh = json.data?.refresh ?? json.refresh ?? refresh;
  if (!access) {
    throw new Error('Réponse refresh invalide.');
  }
  return { access, refresh: newRefresh };
}

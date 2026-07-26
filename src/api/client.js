import * as tokenStorage from '../auth/tokenStorage';

export class ApiError extends Error {
  /** @param {number} status @param {object} payload enveloppe erreur Koumi */
  constructor(status, payload) {
    const first = payload?.errors?.[0];
    super(first?.message || first?.detail || payload?.detail || `Erreur HTTP ${status}`);
    this.name = 'ApiError';
    this.status = status;
    this.errors = payload?.errors || [];
    this.payload = payload;
  }

  get firstCode() {
    return this.errors[0]?.code || null;
  }
}

/**
 * @type {{
 *   getAccessToken: () => string | null,
 *   getRefreshToken: () => string | null,
 *   applyTokens: (a: string, r: string) => Promise<void>,
 *   onAuthExpired: () => void,
 * }}
 */
let partnerAuth = {
  getAccessToken: () => null,
  getRefreshToken: () => null,
  applyTokens: async () => {},
  onAuthExpired: () => {},
};

/**
 * Enregistre les callbacks pour `apiRequestWithAuth` (Bearer + refresh 401).
 * Appelé depuis `AuthContext` quand les jetons changent.
 */
export function configurePartnerApiAuth(cfg) {
  partnerAuth = { ...partnerAuth, ...cfg };
}

/**
 * Un seul refresh HTTP à la fois, partagé entre tous les appels concurrents.
 * Sans ça, plusieurs requêtes authentifiées lancées en parallèle (ex. Promise.all
 * d'un écran) déclenchent chacune leur propre refresh dès que l'access token a
 * expiré — source d'échecs incohérents qui forçaient l'utilisateur à se
 * déconnecter/reconnecter pour rien.
 */
let inFlightRefresh = null;

async function refreshTokensOnce(refreshToken) {
  if (!inFlightRefresh) {
    inFlightRefresh = postJwtRefreshLocal(refreshToken)
      .then(async (refreshed) => {
        await partnerAuth.applyTokens(refreshed.access, refreshed.refresh);
        return refreshed;
      })
      .finally(() => {
        inFlightRefresh = null;
      });
  }
  return inFlightRefresh;
}

export function clearPartnerApiAuth() {
  partnerAuth = {
    getAccessToken: () => null,
    getRefreshToken: () => null,
    applyTokens: async () => {},
    onAuthExpired: () => {},
  };
}

/**
 * Base API sans slash final.
 * Priorité : `VITE_API_BASE_URL` → défaut local.
 */
export function getApiBaseUrl() {
  const fromEnv = import.meta.env?.VITE_API_BASE_URL
    ? String(import.meta.env.VITE_API_BASE_URL).trim()
    : '';
  const appEnv = import.meta.env?.VITE_APP_ENV
    ? String(import.meta.env.VITE_APP_ENV).trim().toLowerCase()
    : '';
  const isProdLike = import.meta.env?.PROD || appEnv === 'staging' || appEnv === 'production';
  const isLocalEnvTarget =
    fromEnv.includes('127.0.0.1') ||
    fromEnv.includes('localhost') ||
    fromEnv.includes('host.docker.internal');

  if (fromEnv) {
    if (isProdLike && isLocalEnvTarget) {
      return 'https://app.koumipay.com';
    }
    return fromEnv.replace(/\/$/, '').replace(/\/api\/v1$/, '');
  }
  if (isProdLike) {
    return 'https://app.koumipay.com';
  }
  return 'http://127.0.0.1:8002';
}

/** Base WebSocket (ws/wss) dérivée de getApiBaseUrl() — utilisée pour le suivi temps réel. */
export function getWsBaseUrl() {
  return getApiBaseUrl().replace(/^http/, 'ws');
}

function buildUrl(path) {
  const base = getApiBaseUrl();
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${base}/api/v1${p}`;
}

export function resolveApiAssetUrl(assetUrl) {
  if (!assetUrl) {
    return '';
  }
  const raw = String(assetUrl).trim();
  if (!raw) {
    return '';
  }
  if (/^https?:\/\//i.test(raw)) {
    return raw;
  }
  if (raw.startsWith('//')) {
    return `https:${raw}`;
  }
  const base = getApiBaseUrl();
  const normalized = raw.startsWith('/') ? raw : `/${raw}`;
  return `${base}${normalized}`;
}

function isFormDataBody(body) {
  return typeof FormData !== 'undefined' && body instanceof FormData;
}

function buildRequestInit(method, body, token = null) {
  const headers = {
    Accept: 'application/json',
  };

  if (!isFormDataBody(body)) {
    headers['Content-Type'] = 'application/json';
  }
  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  return {
    method,
    headers,
    body:
      body === undefined
        ? undefined
        : isFormDataBody(body)
          ? body
          : JSON.stringify(body),
  };
}

/**
 * Appel REST JSON public (sans Bearer), ex. OTP.
 * @param {string} path ex. `/me/` ou `me/`
 * @param {{ method?: string, body?: object, token?: string | null }} opts
 */
export async function apiRequest(path, opts = {}) {
  const { method = 'GET', body, token } = opts;
  const url = buildUrl(path);
  const res = await fetch(url, buildRequestInit(method, body, token));

  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new ApiError(res.status, json);
  }
  return json;
}

async function postJwtRefreshLocal(refresh) {
  const json = await apiRequest('/auth/jwt/refresh/', { method: 'POST', body: { refresh } });
  const access = json.data?.access ?? json.access;
  const newRefresh = json.data?.refresh ?? json.refresh ?? refresh;
  if (!access) {
    throw new Error('Réponse refresh invalide.');
  }
  return { access, refresh: newRefresh };
}

/**
 * Appel authentifié : `Authorization: Bearer <access>` + retry après refresh si 401.
 * @param {string} path
 * @param {{ method?: string, body?: object }} [opts]
 */
export async function apiRequestWithAuth(path, opts = {}) {
  const { method = 'GET', body } = opts;
  const url = buildUrl(path);

  const run = (tok) =>
    fetch(url, buildRequestInit(method, body, tok)).then(async (res) => ({
      res,
      json: await res.json().catch(() => ({})),
    }));

  let token = partnerAuth.getAccessToken();
  if (!token) {
    try {
      const stored = await tokenStorage.loadTokens();
      if (stored.access) {
        await partnerAuth.applyTokens(stored.access, stored.refresh);
        token = partnerAuth.getAccessToken() || stored.access;
      }
    } catch {
      // stockage indisponible, on continue vers le refresh / l'échec ci-dessous
    }
  }
  if (!token) {
    const rt = partnerAuth.getRefreshToken();
    if (rt) {
      try {
        await refreshTokensOnce(rt);
        token = partnerAuth.getAccessToken();
      } catch {
        // refresh échoué, on lève 401 ci-dessous
      }
    }
    if (!token) {
      partnerAuth.onAuthExpired();
      throw new ApiError(401, {
        errors: [{ code: 'not_authenticated', detail: 'Non authentifié.' }],
      });
    }
  }

  let { res, json } = await run(token);

  if (res.status === 401 && partnerAuth.getRefreshToken()) {
    try {
      const rt = partnerAuth.getRefreshToken();
      await refreshTokensOnce(rt);
      token = partnerAuth.getAccessToken();
      if (!token) {
        throw new ApiError(401, json);
      }
      ({ res, json } = await run(token));
    } catch (e) {
      // Le refresh lui-même a échoué (refresh token expiré/invalide) — pas de
      // retry possible, une vraie reconnexion est nécessaire.
      partnerAuth.onAuthExpired();
      if (e instanceof ApiError) {
        throw e;
      }
      throw new ApiError(401, json);
    }
  }

  if (!res.ok) {
    throw new ApiError(res.status, json);
  }
  return json;
}

/**
 * Normalise la réponse liste paginée backend (`data.results`, `data.count`, …).
 * @param {object} json
 */
export function extractPagedResults(json) {
  const d = json?.data;
  if (d && Array.isArray(d.results)) {
    return {
      results: d.results,
      count: d.count ?? d.results.length,
      next: d.next ?? null,
      previous: d.previous ?? null,
    };
  }
  if (Array.isArray(d)) {
    return { results: d, count: d.length, next: null, previous: null };
  }
  return { results: [], count: 0, next: null, previous: null };
}

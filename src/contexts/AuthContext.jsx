import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  postEmailLogin,
  postEmailRegister,
  postEmailVerify,
  postEmailResendCode,
  postGoogleAuth,
  postJwtRefresh,
  postOtpRequest,
  postOtpVerify,
  postPasswordResetConfirm,
  postPasswordResetRequest,
  postPhoneLogin,
  postPhoneSetPassword,
} from '../api/auth';
import { ApiError, clearPartnerApiAuth, configurePartnerApiAuth } from '../api/client';
import {
  getSellerOnboardingStatus,
  postSellerOnboardingComplete,
} from '../api/partnerDomain';
import { getMe, postPartnerOnboarding } from '../api/me';
import * as tokenStorage from '../auth/tokenStorage';
import { authDevLog } from '../utils/authDevLog';
import { setPinUserId } from '../utils/securityPin';

const AuthContext = createContext(null);

const OTP_STATUS = {
  IDLE: 'idle',
  SENDING: 'sending',
  CODE_SENT: 'code_sent',
  VERIFYING: 'verifying',
  VERIFIED: 'verified',
  EXPIRED: 'expired',
  ERROR: 'error',
};

const initialOtpState = {
  status: OTP_STATUS.IDLE,
  phone: '',
  expiresAt: null,
  resendAvailableAt: null,
  error: '',
};

/** Une seule restauration session au démarrage (évite boucles si l'effet bootstrap est re-déclenché). */
let bootstrapFinished = false;

function computeOtpMeta(json, phone) {
  const now = Date.now();
  const expiresInSeconds = Number(json?.data?.expires_in_seconds || 0);
  const resendInSeconds = Number(json?.data?.resend_available_in_seconds || 0);
  return {
    phone,
    expiresAt: expiresInSeconds > 0 ? now + expiresInSeconds * 1000 : null,
    resendAvailableAt: resendInSeconds > 0 ? now + resendInSeconds * 1000 : now,
  };
}

function normalizeAuthPayload(raw) {
  if (!raw || typeof raw !== 'object') {
    return null;
  }
  const access = typeof raw.access === 'string' ? raw.access.trim() : '';
  const refresh = typeof raw.refresh === 'string' ? raw.refresh.trim() : '';
  if (!access || !refresh) {
    authDevLog('session.normalize.fail', {
      hasAccess: Boolean(access),
      hasRefresh: Boolean(refresh),
      keys: Object.keys(raw),
    });
    return null;
  }
  let nextStep =
    typeof raw.next_step === 'string' ? raw.next_step.trim() : undefined;
  if (!nextStep && raw.requires_shop) {
    nextStep = 'shop';
  } else if (!nextStep && raw.requires_onboarding === false) {
    nextStep = 'dashboard';
  }
  return {
    access,
    refresh,
    user: raw.user || null,
    seller_profile: raw.seller_profile ?? null,
    next_step: nextStep,
    requires_onboarding: raw.requires_onboarding,
    requires_shop: raw.requires_shop,
  };
}

export function AuthProvider({ children }) {
  const [bootstrapping, setBootstrapping] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [accessToken, setAccessToken] = useState(null);
  const [refreshToken, setRefreshToken] = useState(null);
  const [user, setUser] = useState(null);
  const [sellerProfile, setSellerProfile] = useState(null);
  const [onboardingNextStep, setOnboardingNextStep] = useState(null);
  const [otpState, setOtpState] = useState(initialOtpState);

  const accessRef = useRef(null);
  const refreshRef = useRef(null);
  const sessionEpochRef = useRef(0);
  const profileFetchInFlightRef = useRef(false);
  const logoutRef = useRef(async () => {});

  const ensureAccessRef = useCallback(() => {
    if (!accessRef.current && accessToken) {
      accessRef.current = accessToken;
      authDevLog('session.sync_ref_from_state', { accessPresent: true });
    }
    return Boolean(accessRef.current);
  }, [accessToken]);

  const refreshOnboardingStatus = useCallback(async () => {
    if (!ensureAccessRef()) {
      setOnboardingNextStep('auth');
      return null;
    }
    try {
      const json = await getSellerOnboardingStatus();
      const data = json.data || {};
      const step = data.next_step || 'auth';
      setOnboardingNextStep(step);
      if (data.user) {
        setUser(data.user);
        setPinUserId(data.user?.phone || data.user?.id || null);
      }
      if (data.seller_profile !== undefined) {
        setSellerProfile(data.seller_profile);
      }
      authDevLog('onboarding.status', { nextStep: step, hasShop: data.has_shop });
      return data;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        authDevLog('onboarding.status', { reason: '401_keep_session' });
        return null;
      }
      throw e;
    }
  }, [ensureAccessRef]);

  const applyAuthenticatedSession = useCallback(async (rawPayload, { source = 'unknown' } = {}) => {
    const payload = normalizeAuthPayload(rawPayload);
    if (!payload) {
      authDevLog('session.reject', { source, reason: 'missing_tokens' });
      throw new Error('Réponse authentification incomplète (jetons manquants).');
    }

    sessionEpochRef.current += 1;

    accessRef.current = payload.access;
    refreshRef.current = payload.refresh;
    setAccessToken(payload.access);
    setRefreshToken(payload.refresh);
    setUser(payload.user);
    setPinUserId(payload.user?.phone || payload.user?.id || null);
    setSellerProfile(payload.seller_profile);
    setSessionReady(true);

    const knownNextStep =
      typeof payload.next_step === 'string'
        ? payload.next_step
        : payload.requires_shop
          ? 'shop'
          : null;
    if (knownNextStep) {
      setOnboardingNextStep(knownNextStep);
    }

    await tokenStorage.saveTokens(payload.access, payload.refresh);

    authDevLog('session.ready', {
      source,
      accessPresent: Boolean(accessRef.current),
      refreshPresent: Boolean(refreshRef.current),
      role: payload.user?.role || null,
      emailVerified: Boolean(payload.user?.email_verified_at),
    });

    if (!knownNextStep) {
      try {
        await refreshOnboardingStatus();
      } catch {
        setOnboardingNextStep(payload.requires_onboarding === false ? 'dashboard' : 'shop');
      }
    }

    authDevLog('session.next_step', {
      source,
      nextStep: knownNextStep || 'unknown',
    });

    return true;
  }, [refreshOnboardingStatus]);

  useEffect(() => {
    configurePartnerApiAuth({
      getAccessToken: () => accessRef.current,
      getRefreshToken: () => refreshRef.current,
      applyTokens: async (access, refresh) => {
        const epoch = sessionEpochRef.current;
        accessRef.current = access;
        refreshRef.current = refresh;
        await tokenStorage.saveTokens(access, refresh);
        if (epoch === sessionEpochRef.current) {
          setAccessToken(access);
          setRefreshToken(refresh);
          setSessionReady(true);
          authDevLog('session.refresh_tokens', { accessPresent: true });
        }
      },
      onAuthExpired: () => {
        authDevLog('session.auth_expired', {});
        logoutRef.current();
      },
    });
    return () => {
      clearPartnerApiAuth();
    };
  }, []);

  const loadProfile = useCallback(async (access) => {
    if (profileFetchInFlightRef.current) {
      return null;
    }
    profileFetchInFlightRef.current = true;
    try {
      const json = await getMe(access);
      setUser(json.data);
      setPinUserId(json.data?.phone || json.data?.id || null);
      setSellerProfile(json.data?.seller_profile || null);
      return json.data;
    } finally {
      profileFetchInFlightRef.current = false;
    }
  }, []);

  const refreshTokensFromStorage = useCallback(async (rt) => {
    const { access: newAccess, refresh: newRefresh } = await postJwtRefresh(rt);
    accessRef.current = newAccess;
    refreshRef.current = newRefresh;
    await tokenStorage.saveTokens(newAccess, newRefresh);
    setAccessToken(newAccess);
    setRefreshToken(newRefresh);
    setSessionReady(true);
    return newAccess;
  }, []);

  const tryRefresh = useCallback(
    async (rt) => {
      const newAccess = await refreshTokensFromStorage(rt);
      await loadProfile(newAccess);
      return newAccess;
    },
    [loadProfile, refreshTokensFromStorage]
  );

  useEffect(() => {
    if (bootstrapFinished) {
      setBootstrapping(false);
      return undefined;
    }
    bootstrapFinished = true;

    let cancelled = false;
    const restoreEpoch = sessionEpochRef.current;

    (async () => {
      authDevLog('bootstrap.start', { restoreEpoch });
      try {
        const { access, refresh } = await tokenStorage.loadTokens();
        if (cancelled || restoreEpoch !== sessionEpochRef.current) {
          authDevLog('bootstrap.skipped', { reason: 'epoch_changed_or_cancelled' });
          return;
        }
        if (!access || !refresh) {
          authDevLog('bootstrap.empty', {});
          return;
        }

        if (cancelled || restoreEpoch !== sessionEpochRef.current) {
          authDevLog('bootstrap.skipped', { reason: 'epoch_changed_before_ref_write' });
          return;
        }
        accessRef.current = access;
        refreshRef.current = refresh;

        try {
          const json = await getMe(access);
          if (cancelled || restoreEpoch !== sessionEpochRef.current) {
            return;
          }
          const profile = json.data;
          setAccessToken(access);
          setRefreshToken(refresh);
          setUser(profile);
          setPinUserId(profile?.phone || profile?.id || null);
          setSellerProfile(profile?.seller_profile || null);
          setSessionReady(true);
          authDevLog('bootstrap.restored', {
            accessPresent: true,
            role: profile?.role || null,
          });
          if (!cancelled && restoreEpoch === sessionEpochRef.current) {
            try {
              const jsonStatus = await getSellerOnboardingStatus();
              if (!cancelled && restoreEpoch === sessionEpochRef.current) {
                setOnboardingNextStep(jsonStatus.data?.next_step || null);
              }
            } catch {
              /* statut onboarding optionnel au boot */
            }
          }
        } catch (e) {
          if (cancelled || restoreEpoch !== sessionEpochRef.current) {
            return;
          }
          if (e instanceof ApiError && e.status === 401) {
            try {
              const newAccess = await refreshTokensFromStorage(refresh);
              if (cancelled || restoreEpoch !== sessionEpochRef.current) {
                return;
              }
              const json = await getMe(newAccess);
              if (cancelled || restoreEpoch !== sessionEpochRef.current) {
                return;
              }
              setUser(json.data);
              setPinUserId(json.data?.phone || json.data?.id || null);
              setSellerProfile(json.data?.seller_profile || null);
              if (!cancelled && restoreEpoch === sessionEpochRef.current) {
                try {
                  const jsonStatus = await getSellerOnboardingStatus();
                  if (!cancelled && restoreEpoch === sessionEpochRef.current) {
                    setOnboardingNextStep(jsonStatus.data?.next_step || null);
                  }
                } catch {
                  /* ignore */
                }
              }
            } catch {
              if (restoreEpoch !== sessionEpochRef.current) {
                return;
              }
              await tokenStorage.clearTokens();
              accessRef.current = null;
              refreshRef.current = null;
              setSessionReady(false);
            }
          } else if (restoreEpoch === sessionEpochRef.current) {
            await tokenStorage.clearTokens();
            accessRef.current = null;
            refreshRef.current = null;
            setSessionReady(false);
          }
        }
      } finally {
        if (!cancelled) {
          setBootstrapping(false);
          authDevLog('bootstrap.done', {
            sessionReady: Boolean(accessRef.current),
            bootstrapping: false,
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const resetOtpFlow = useCallback(() => {
    setOtpState(initialOtpState);
  }, []);

  const requestOtp = useCallback(async (phone) => {
    setOtpState((prev) => {
      if (prev.status === OTP_STATUS.SENDING || prev.status === OTP_STATUS.VERIFYING) {
        return prev;
      }
      return { ...prev, status: OTP_STATUS.SENDING, phone, error: '' };
    });
    try {
      const json = await postOtpRequest(phone);
      const nextMeta = computeOtpMeta(json, phone);
      setOtpState({
        status: OTP_STATUS.CODE_SENT,
        phone,
        expiresAt: nextMeta.expiresAt,
        resendAvailableAt: nextMeta.resendAvailableAt,
        error: '',
      });
      return json;
    } catch (e) {
      setOtpState((prev) => ({
        ...prev,
        status: e instanceof ApiError && e.firstCode === 'otp_expired' ? OTP_STATUS.EXPIRED : OTP_STATUS.ERROR,
        error: e.message || "Impossible d'envoyer le code.",
      }));
      throw e;
    }
  }, []);

  /**
   * Vérifie le code OTP — ne connecte plus directement. Le numéro est
   * désormais vérifié pour deux raisons seulement : inscription (premier
   * mot de passe) ou mot de passe oublié (nouveau mot de passe). Renvoie
   * `{ verified_token, has_password }` pour enchaîner sur `setPhonePassword`.
   */
  const verifyOtp = useCallback(async (phone, code) => {
    setOtpState((prev) => {
      if (prev.status === OTP_STATUS.VERIFYING) {
        return prev;
      }
      return { ...prev, status: OTP_STATUS.VERIFYING, error: '' };
    });
    try {
      const json = await postOtpVerify(phone, code);
      setOtpState((prev) => ({ ...prev, status: OTP_STATUS.VERIFIED, error: '' }));
      return json;
    } catch (e) {
      setOtpState((prev) => ({
        ...prev,
        status: e instanceof ApiError && e.firstCode === 'otp_expired' ? OTP_STATUS.EXPIRED : OTP_STATUS.ERROR,
        error: e.message || 'Impossible de vérifier le code.',
      }));
      throw e;
    }
  }, []);

  /** Connexion vendeur : numéro + mot de passe (remplace l'OTP au login). */
  const loginWithPhone = useCallback(
    async ({ phone, password }) => {
      const json = await postPhoneLogin({ phone, password });
      await applyAuthenticatedSession(json.data, { source: 'phone_login' });
      return json;
    },
    [applyAuthenticatedSession]
  );

  /**
   * Définit le mot de passe juste après vérification OTP — sert à
   * l'inscription (premier mot de passe) comme au mot de passe oublié
   * (nouveau mot de passe), même endpoint dans les deux cas. Connecte
   * l'utilisateur une fois le mot de passe posé.
   */
  const setPhonePassword = useCallback(
    async ({ verifiedToken, password, passwordConfirm }) => {
      const json = await postPhoneSetPassword({
        verified_token: verifiedToken,
        password,
        password_confirm: passwordConfirm,
      });
      await applyAuthenticatedSession(json.data, { source: 'phone_set_password' });
      return json;
    },
    [applyAuthenticatedSession]
  );

  const loginWithEmail = useCallback(
    async (payload) => {
      const json = await postEmailLogin(payload);
      await applyAuthenticatedSession(json.data, { source: 'email_login' });
      return json;
    },
    [applyAuthenticatedSession]
  );

  const registerWithEmail = useCallback(async (payload) => {
    return postEmailRegister(payload);
  }, []);

  const verifyEmailCode = useCallback(
    async ({ email, code }) => {
      authDevLog('email.verify.request', { email });
      const json = await postEmailVerify({ email, code });
      await applyAuthenticatedSession(json.data, { source: 'email_verify' });
      authDevLog('email.verify.done', {
        route: 'shop_setup',
        requiresShop: json.data?.requires_shop,
      });
      return json;
    },
    [applyAuthenticatedSession]
  );

  const resendEmailVerificationCode = useCallback(async (email) => {
    return postEmailResendCode({ email });
  }, []);

  const completeSellerOnboarding = useCallback(
    async (body) => {
      if (!ensureAccessRef()) {
        authDevLog('onboarding.blocked', { reason: 'no_access_ref' });
        throw new ApiError(401, {
          errors: [{ code: 'not_authenticated', detail: 'Session expirée.' }],
        });
      }
      authDevLog('onboarding.request', {
        endpoint: '/seller/onboarding/complete/',
        accessPresent: true,
      });
      const json = await postSellerOnboardingComplete(body);
      const data = json.data || {};
      if (data.access && data.refresh) {
        await applyAuthenticatedSession(
          {
            access: data.access,
            refresh: data.refresh,
            user: data.user,
            seller_profile: data.seller_profile,
          },
          { source: 'onboarding_complete' }
        );
      } else if (data.user) {
        setUser(data.user);
        setPinUserId(data.user?.phone || data.user?.id || null);
        setSellerProfile(data.seller_profile || null);
      }
      setOnboardingNextStep(data.next_step || 'dashboard');
      return json;
    },
    [applyAuthenticatedSession, ensureAccessRef]
  );

  const loginWithGoogle = useCallback(
    async (payload) => {
      authDevLog('google.backend.start', { hasIdToken: Boolean(payload?.id_token) });
      const json = await postGoogleAuth(payload);
      const data = json.data || {};
      authDevLog('google.backend.ok', {
        hasAccess: Boolean(data.access),
        hasRefresh: Boolean(data.refresh),
        nextStep: data.next_step,
        requiresShop: data.requires_shop,
      });
      await applyAuthenticatedSession(data, { source: 'google' });
      if (typeof data.next_step !== 'string') {
        try {
          await refreshOnboardingStatus();
        } catch (e) {
          authDevLog('google.onboarding.status.fail', {
            message: e instanceof Error ? e.message : 'unknown',
          });
        }
      }
      return json;
    },
    [applyAuthenticatedSession, refreshOnboardingStatus]
  );

  const requestPasswordReset = useCallback(async (email) => {
    return postPasswordResetRequest({ email });
  }, []);

  const confirmPasswordReset = useCallback(async (payload) => {
    return postPasswordResetConfirm(payload);
  }, []);

  const completePartnerOnboarding = useCallback(
    async (payload) => {
      if (!accessRef.current) {
        throw new ApiError(401, {
          errors: [{ code: 'not_authenticated', detail: 'Session expirée.' }],
        });
      }
      const json = await postPartnerOnboarding(accessRef.current, payload);
      setUser(json.data);
      setPinUserId(json.data?.phone || json.data?.id || null);
      return json;
    },
    []
  );

  const logout = useCallback(async () => {
    sessionEpochRef.current += 1;
    await tokenStorage.clearTokens();
    clearPartnerApiAuth();
    accessRef.current = null;
    refreshRef.current = null;
    setSessionReady(false);
    setAccessToken(null);
    setRefreshToken(null);
    setUser(null);
    setPinUserId(null);
    setSellerProfile(null);
    setOnboardingNextStep(null);
    setOtpState(initialOtpState);
    authDevLog('logout', {});
  }, []);

  logoutRef.current = logout;

  const refreshProfile = useCallback(async () => {
    if (!accessRef.current) {
      return;
    }
    await loadProfile(accessRef.current);
  }, [loadProfile]);

  const needsPartnerOnboarding = Boolean(
    accessToken &&
      (onboardingNextStep === 'profile_shop' ||
        (user &&
          user.role === 'buyer' &&
          (user.partner_onboarding_completed_at == null ||
            user.partner_onboarding_completed_at === '')))
  );

  const authReady = Boolean(sessionReady && accessToken && accessRef.current) && !bootstrapping;

  const value = useMemo(
    () => ({
      bootstrapping,
      sessionReady,
      authReady,
      accessToken,
      refreshToken,
      user,
      sellerProfile,
      onboardingNextStep,
      refreshOnboardingStatus,
      ensureAccessRef,
      otpState,
      otpStatus: OTP_STATUS,
      needsPartnerOnboarding,
      requestOtp,
      verifyOtp,
      resetOtpFlow,
      loginWithPhone,
      setPhonePassword,
      loginWithEmail,
      registerWithEmail,
      verifyEmailCode,
      resendEmailVerificationCode,
      completeSellerOnboarding,
      loginWithGoogle,
      requestPasswordReset,
      confirmPasswordReset,
      completePartnerOnboarding,
      logout,
      refreshProfile,
      tryRefresh,
      loadProfile,
    }),
    [
      bootstrapping,
      sessionReady,
      authReady,
      accessToken,
      refreshToken,
      user,
      sellerProfile,
      onboardingNextStep,
      refreshOnboardingStatus,
      ensureAccessRef,
      otpState,
      needsPartnerOnboarding,
      requestOtp,
      verifyOtp,
      resetOtpFlow,
      loginWithPhone,
      setPhonePassword,
      loginWithEmail,
      registerWithEmail,
      verifyEmailCode,
      resendEmailVerificationCode,
      completeSellerOnboarding,
      loginWithGoogle,
      requestPasswordReset,
      confirmPasswordReset,
      completePartnerOnboarding,
      logout,
      refreshProfile,
      tryRefresh,
      loadProfile,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth doit être utilisé dans AuthProvider.');
  }
  return ctx;
}

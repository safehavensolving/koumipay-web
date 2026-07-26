import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export function resolveNavKey({ accessToken, onboardingNextStep, needsPartnerOnboarding }) {
  if (!accessToken) return 'auth';
  if (onboardingNextStep === 'dashboard') return 'app';
  if (onboardingNextStep === 'shop') return 'shopsetup';
  if (onboardingNextStep === 'profile_shop' || needsPartnerOnboarding) return 'onboard';
  if (onboardingNextStep === 'verify_email' || onboardingNextStep === 'verify_phone') return 'onboard';
  return 'app';
}

/** Garde minimale : exige un token, sans imposer l'étape d'onboarding (utilisée pour les écrans seller-setup/onboarding eux-mêmes). */
export function RequireToken() {
  const { bootstrapping, accessToken } = useAuth();
  if (bootstrapping) {
    return <div className="flex items-center justify-center min-h-screen text-muted">Chargement…</div>;
  }
  if (!accessToken) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}

/** Garde stricte : exige le token ET que l'onboarding soit terminé (next_step === 'dashboard'). */
export function RequireAuth() {
  const { bootstrapping, accessToken, onboardingNextStep, needsPartnerOnboarding } = useAuth();

  if (bootstrapping) {
    return (
      <div className="flex items-center justify-center min-h-screen text-muted">Chargement…</div>
    );
  }

  const navKey = resolveNavKey({ accessToken, onboardingNextStep, needsPartnerOnboarding });

  if (navKey === 'auth') {
    return <Navigate to="/login" replace />;
  }
  if (navKey === 'shopsetup') {
    return <Navigate to="/seller-setup" replace />;
  }
  if (navKey === 'onboard') {
    return <Navigate to="/onboarding/partner" replace />;
  }

  return <Outlet />;
}

export function RedirectIfAuthed({ children }) {
  const { bootstrapping, accessToken, onboardingNextStep, needsPartnerOnboarding } = useAuth();
  if (bootstrapping) return null;
  const navKey = resolveNavKey({ accessToken, onboardingNextStep, needsPartnerOnboarding });
  if (navKey === 'app') {
    return <Navigate to="/" replace />;
  }
  if (navKey === 'shopsetup') {
    return <Navigate to="/seller-setup" replace />;
  }
  if (navKey === 'onboard') {
    return <Navigate to="/onboarding/partner" replace />;
  }
  return children;
}

import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { AppButton, AppInput } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { ApiError } from '../../api/client';

/**
 * Définit le mot de passe juste après vérification OTP — sert à la fois à
 * l'inscription (premier mot de passe) et au mot de passe oublié (nouveau
 * mot de passe). `hasPassword` (renvoyé par /auth/otp/verify/) détermine le
 * texte affiché ; le mécanisme côté backend est identique.
 */
export function SetPasswordPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { setPhonePassword } = useAuth();

  const verifiedToken = location.state?.verifiedToken || '';
  const isReset = Boolean(location.state?.hasPassword);

  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!verifiedToken) {
      navigate('/login', { replace: true });
    }
  }, [verifiedToken, navigate]);

  const isReady = password.length >= 8 && password === passwordConfirm;

  async function onSubmit(e) {
    e.preventDefault();
    if (!isReady || loading) return;
    setLoading(true);
    setError('');
    try {
      await setPhonePassword({ verifiedToken, password, passwordConfirm });
      navigate('/', { replace: true });
    } catch (e2) {
      setError(e2 instanceof ApiError ? e2.message : 'Impossible de définir le mot de passe.');
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      heroTag="Numéro vérifié"
      heroTitle={isReset ? 'Nouveau mot de passe' : 'Définir un mot de passe'}
      heroSubtitle={
        isReset
          ? 'Ce mot de passe remplacera le précédent et vous reconnectera immédiatement.'
          : 'Ce mot de passe vous servira ensuite à vous connecter avec votre numéro.'
      }
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <p className="text-base font-semibold text-navy -mt-1">
          {isReset ? 'Choisissez un nouveau mot de passe' : 'Sécurisez votre compte'}
        </p>
        <AppInput
          label="Mot de passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          hint="8 caractères minimum"
        />
        <AppInput
          label="Confirmer le mot de passe"
          type="password"
          value={passwordConfirm}
          onChange={(e) => setPasswordConfirm(e.target.value)}
          placeholder="••••••••"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <AppButton
          label={isReset ? 'Réinitialiser et continuer' : 'Continuer'}
          onPress={onSubmit}
          loading={loading}
          disabled={!isReady}
        />
      </form>
    </AuthLayout>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { AppButton, AppInput } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { ApiError } from '../../api/client';
import { formatGuineaPhoneInput, isValidGuineaE164, normalizeGuineaPhone } from '../../utils/phone';

/** Connexion vendeur par défaut : numéro + mot de passe. */
export function LoginPage() {
  const { loginWithPhone } = useAuth();
  const [phoneRaw, setPhoneRaw] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const phone = normalizeGuineaPhone(phoneRaw);
  const isReady = isValidGuineaE164(phone) && password.length >= 8;

  async function onSubmit(e) {
    e.preventDefault();
    if (loading) return;
    if (!isValidGuineaE164(phone)) {
      setError('Numéro invalide. Ex. 621234567, 0621234567 ou +224621234567');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await loginWithPhone({ phone, password });
    } catch (e2) {
      setError(e2 instanceof ApiError ? e2.message : 'Impossible de se connecter pour le moment.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      heroTag="Espace vendeur"
      heroTitle="Connectez-vous pour accéder à votre tableau de bord."
      heroSubtitle="Gérez vos ventes, votre stock et vos finances depuis Koumi Pay."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <AppInput
          label="Numéro de téléphone"
          value={phoneRaw}
          onChange={(e) => setPhoneRaw(formatGuineaPhoneInput(e.target.value))}
          placeholder="620 00 00 00"
          maxLength={12}
          leftIcon={<span className="text-sm text-muted">🇬🇳 +224</span>}
        />
        <AppInput
          label="Mot de passe"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          autoComplete="current-password"
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <AppButton label="Se connecter" onPress={onSubmit} loading={loading} disabled={!isReady} />
        <div className="flex flex-col items-center gap-2 mt-2 text-sm">
          <Link to="/forgot-password" className="text-emerald font-medium">
            Mot de passe oublié
          </Link>
          <p className="text-muted">
            Pas encore de compte ?{' '}
            <Link to="/register" className="text-emerald font-medium">
              Créer un compte
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
}

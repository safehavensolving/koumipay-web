import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { AppButton, AppInput } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { ApiError } from '../../api/client';
import { formatGuineaPhoneInput, isValidGuineaE164, normalizeGuineaPhone } from '../../utils/phone';

/** Inscription : numéro de téléphone → code SMS → définition du mot de passe. */
export function RegisterPage() {
  const navigate = useNavigate();
  const { requestOtp } = useAuth();
  const [phoneRaw, setPhoneRaw] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const phone = normalizeGuineaPhone(phoneRaw);
  const isReady = isValidGuineaE164(phone);

  async function onSubmit(e) {
    e.preventDefault();
    setError('');
    if (!isReady) {
      setError('Numéro invalide. Ex. 621234567, 0621234567 ou +224621234567');
      return;
    }
    setLoading(true);
    try {
      await requestOtp(phone);
      navigate('/otp', { state: { phone, mode: 'register' } });
    } catch (e2) {
      setError(e2 instanceof ApiError ? e2.message : 'Impossible de joindre le serveur.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      backTo="/login"
      heroTag="Inscription sécurisée"
      heroTitle="Créer votre compte"
      heroSubtitle="Rejoignez Koumi Pay et lancez votre espace vendeur."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <p className="text-sm text-muted -mt-1 mb-1">
          Saisissez votre numéro pour recevoir instantanément un code SMS et créer votre espace vendeur.
        </p>
        <AppInput
          label="Numéro de téléphone"
          value={phoneRaw}
          onChange={(e) => setPhoneRaw(formatGuineaPhoneInput(e.target.value))}
          placeholder="620 00 00 00"
          maxLength={12}
          leftIcon={<span className="text-sm text-muted">🇬🇳 +224</span>}
        />
        {error && <p className="text-sm text-danger">{error}</p>}
        <AppButton label="Recevoir le code par SMS" onPress={onSubmit} loading={loading} disabled={!isReady} />
        <p className="text-sm text-muted text-center mt-2">
          Vous avez déjà un compte ?{' '}
          <Link to="/login" className="text-emerald font-medium">
            Se connecter
          </Link>
        </p>
      </form>
    </AuthLayout>
  );
}

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { AppButton, AppInput } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { ApiError } from '../../api/client';
import { formatGuineaPhoneInput, isValidGuineaE164, normalizeGuineaPhone } from '../../utils/phone';

/**
 * Mot de passe oublié par numéro — envoie un OTP puis réutilise l'écran
 * de vérification (/otp) et de définition de mot de passe (/set-password),
 * exactement comme à l'inscription.
 */
export function ForgotPasswordPage() {
  const navigate = useNavigate();
  const { requestOtp } = useAuth();
  const [phoneRaw, setPhoneRaw] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const phone = normalizeGuineaPhone(phoneRaw);
  const isReady = isValidGuineaE164(phone);

  async function onSubmit(e) {
    e.preventDefault();
    if (!isReady || loading) return;
    setLoading(true);
    setError('');
    try {
      await requestOtp(phone);
      navigate('/otp', { state: { phone, mode: 'reset' } });
    } catch (e2) {
      setError(e2 instanceof ApiError ? e2.message : "Impossible d'envoyer le code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout
      backTo="/login"
      heroTag="Réinitialisation"
      heroTitle="Mot de passe oublié"
      heroSubtitle="Saisissez votre numéro. Un code SMS vous permettra de définir un nouveau mot de passe."
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
        {error && <p className="text-sm text-danger">{error}</p>}
        <AppButton label="Recevoir le code par SMS" onPress={onSubmit} loading={loading} disabled={!isReady} />
      </form>
    </AuthLayout>
  );
}

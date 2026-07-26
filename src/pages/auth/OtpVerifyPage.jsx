import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { OtpSixBoxes } from '../../components/auth/OtpSixBoxes';
import { AppButton } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { ApiError } from '../../api/client';

export function OtpVerifyPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { verifyOtp, requestOtp } = useAuth();
  const phone = location.state?.phone || '';
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendIn, setResendIn] = useState(60);

  useEffect(() => {
    if (!phone) {
      navigate('/login', { replace: true });
    }
  }, [phone, navigate]);

  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  async function onSubmit(e) {
    e.preventDefault();
    if (code.length !== 6) {
      setError('Saisissez les 6 chiffres reçus par SMS.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      const json = await verifyOtp(phone, code);
      navigate('/set-password', {
        state: {
          phone,
          verifiedToken: json.data?.verified_token,
          hasPassword: json.data?.has_password,
        },
      });
    } catch (e2) {
      setError(e2 instanceof ApiError ? e2.message : 'Impossible de vérifier le code.');
    } finally {
      setLoading(false);
    }
  }

  async function onResend() {
    try {
      await requestOtp(phone);
      setResendIn(60);
    } catch {
      // erreur affichée au prochain submit
    }
  }

  return (
    <AuthLayout
      backTo="/login"
      heroTag="Vérification"
      heroTitle="Entrez le code reçu par SMS"
      heroSubtitle={`Un code à 6 chiffres a été envoyé au ${phone}.`}
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-5">
        <OtpSixBoxes value={code} onChange={setCode} />
        {error && <p className="text-sm text-danger text-center">{error}</p>}
        <AppButton label="Vérifier et continuer" onPress={onSubmit} loading={loading} disabled={code.length !== 6} />
        <button
          type="button"
          onClick={onResend}
          disabled={resendIn > 0}
          className="text-sm text-emerald font-medium disabled:text-muted disabled:cursor-not-allowed cursor-pointer"
        >
          {resendIn > 0 ? `Renvoyer le code (${resendIn}s)` : 'Renvoyer le code'}
        </button>
      </form>
    </AuthLayout>
  );
}

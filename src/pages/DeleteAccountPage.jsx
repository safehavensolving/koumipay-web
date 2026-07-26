import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { AppButton, AppCard } from '../components/ui';
import { OtpSixBoxes } from '../components/auth/OtpSixBoxes';
import { postOtpRequest, postOtpVerify } from '../api/auth';
import { deactivateSellerAccount } from '../api/partnerDomain';
import { ApiError } from '../api/client';
import { useAuth } from '../contexts/AuthContext';
import { lockAll } from '../utils/pinSession';

const STEP_CONFIRM = 'confirm';
const STEP_OTP = 'otp';
const STEP_DONE = 'done';

export function DeleteAccountPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [step, setStep] = useState(STEP_CONFIRM);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [otpValue, setOtpValue] = useState('');
  const [resendIn, setResendIn] = useState(0);
  const timerRef = useRef(null);

  const userPhone = user?.phone || '';

  function startCountdown(seconds = 60) {
    setResendIn(seconds);
    clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setResendIn((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  useEffect(() => () => clearInterval(timerRef.current), []);

  async function sendOtp() {
    try {
      await postOtpRequest(userPhone);
      startCountdown(60);
    } catch {
      setError("Impossible d'envoyer le code OTP. Vérifiez votre connexion.");
    }
  }

  async function handleConfirm() {
    if (!userPhone) {
      setError('Aucun numéro de téléphone associé à ce compte. Contactez le support.');
      return;
    }
    setError('');
    setLoading(true);
    try {
      await sendOtp();
      setStep(STEP_OTP);
    } finally {
      setLoading(false);
    }
  }

  async function handleResend() {
    if (resendIn > 0) return;
    setError('');
    setLoading(true);
    try {
      await sendOtp();
    } finally {
      setLoading(false);
    }
  }

  async function handleOtpSubmit(e) {
    e.preventDefault();
    if (loading) return;
    if (otpValue.length !== 6) {
      setError('Saisissez le code reçu par SMS.');
      return;
    }
    setLoading(true);
    setError('');
    try {
      await postOtpVerify(userPhone, otpValue);
      await deactivateSellerAccount('user_request');
      lockAll();
      setStep(STEP_DONE);
    } catch (e2) {
      setError(e2 instanceof ApiError ? e2.message : 'Code OTP invalide ou expiré, ou erreur de suppression.');
      setOtpValue('');
    } finally {
      setLoading(false);
    }
  }

  return (
    <AppShell>
      <button type="button" onClick={() => navigate('/account')} className="text-sm text-muted mb-4 cursor-pointer">
        ← Retour au compte
      </button>
      <h1 className="text-xl font-bold text-navy mb-4">Supprimer le compte</h1>

      <AppCard className="p-6 max-w-lg">
        {step === STEP_CONFIRM && (
          <div className="flex flex-col gap-4">
            <p className="text-sm text-navy leading-relaxed">
              Cette action désactive définitivement votre espace vendeur Koumi Pay. Vos données de boutique, ventes
              et finances ne seront plus accessibles. Cette opération est <strong>irréversible</strong>.
            </p>
            <p className="text-sm text-muted">
              Pour confirmer, nous allons vous envoyer un code de vérification par SMS au {userPhone || 'numéro associé à votre compte'}.
            </p>
            {error && <p className="text-sm text-danger">{error}</p>}
            <AppButton label="Continuer et recevoir le code" variant="danger" onPress={handleConfirm} loading={loading} />
          </div>
        )}

        {step === STEP_OTP && (
          <form onSubmit={handleOtpSubmit} className="flex flex-col gap-5">
            <p className="text-sm text-navy">
              Entrez le code à 6 chiffres envoyé par SMS au {userPhone} pour confirmer la suppression.
            </p>
            <OtpSixBoxes value={otpValue} onChange={setOtpValue} />
            {error && <p className="text-sm text-danger text-center">{error}</p>}
            <AppButton
              label="Confirmer la suppression"
              variant="danger"
              onPress={handleOtpSubmit}
              loading={loading}
              disabled={otpValue.length !== 6}
            />
            <button
              type="button"
              onClick={handleResend}
              disabled={resendIn > 0}
              className="text-sm text-emerald font-medium disabled:text-muted disabled:cursor-not-allowed cursor-pointer"
            >
              {resendIn > 0 ? `Renvoyer le code (${resendIn}s)` : 'Renvoyer le code'}
            </button>
          </form>
        )}

        {step === STEP_DONE && (
          <div className="flex flex-col gap-4">
            <p className="text-base font-semibold text-navy">Compte supprimé</p>
            <p className="text-sm text-muted">
              Votre espace vendeur a été désactivé. Vous allez être déconnecté de Koumi Pay.
            </p>
            <AppButton label="Terminer" onPress={logout} />
          </div>
        )}
      </AppCard>
    </AppShell>
  );
}

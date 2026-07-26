import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { OtpSixBoxes } from '../auth/OtpSixBoxes';
import { AppButton, AppCard } from '../ui';
import { SECURITY_PIN_LENGTH, hasSecurityPin, verifySecurityPin } from '../../utils/securityPin';
import { isModuleUnlocked, lockModule, unlockModule } from '../../utils/pinSession';

/**
 * Enveloppe une page derrière un code PIN.
 *
 * @param {string} moduleKey  Clé unique du module (ex. 'stock', 'expenses', 'finance').
 *                            Le déverrouillage persiste tant que l'utilisateur reste sur
 *                            cette page ; dès qu'il navigue ailleurs, le module se reverrouille.
 */
export function PinProtectedScreen({ title, subtitle, moduleKey, children }) {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [requiresPin, setRequiresPin] = useState(false);
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [unlocked, setUnlocked] = useState(false);
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (moduleKey && isModuleUnlocked(moduleKey)) {
      setRequiresPin(true);
      setUnlocked(true);
      setChecking(false);
      return undefined;
    }

    setChecking(true);
    setPin('');
    setError('');
    const configured = hasSecurityPin();
    setRequiresPin(configured);
    setUnlocked(!configured);
    setChecking(false);

    return () => {
      if (moduleKey) {
        lockModule(moduleKey);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [moduleKey]);

  async function submitPin(e) {
    e?.preventDefault();
    if (verifying) return;
    if (pin.length !== SECURITY_PIN_LENGTH) {
      setError(`Saisissez votre code PIN à ${SECURITY_PIN_LENGTH} chiffres.`);
      return;
    }
    setVerifying(true);
    setError('');
    try {
      const ok = await verifySecurityPin(pin);
      if (!ok) {
        setError('Code PIN incorrect. Réessayez.');
        setPin('');
        return;
      }
      if (moduleKey) {
        unlockModule(moduleKey);
      }
      setUnlocked(true);
    } finally {
      setVerifying(false);
    }
  }

  if (checking) {
    return <p className="text-muted">Chargement…</p>;
  }

  if (!requiresPin || unlocked) {
    return children;
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <AppCard className="w-full max-w-sm p-6">
        <span className="size-14 rounded-full bg-success-bg flex items-center justify-center text-2xl mx-auto block">
          🔒
        </span>
        <h2 className="text-lg font-bold text-navy text-center mt-4">{title || 'Accès protégé'}</h2>
        <p className="text-sm text-muted text-center mt-2 leading-relaxed">
          {subtitle || 'Saisissez votre code PIN pour ouvrir cet écran sensible.'}
        </p>
        <form onSubmit={submitPin} className="mt-5">
          <OtpSixBoxes value={pin} onChange={setPin} length={SECURITY_PIN_LENGTH} disabled={verifying} />
          {error && <p className="text-sm text-danger text-center mt-3.5">{error}</p>}
          <div className="flex gap-3 mt-4.5">
            <AppButton label="Retour" variant="ghost" onPress={() => navigate(-1)} className="flex-1" />
            <AppButton label="Déverrouiller" onPress={submitPin} loading={verifying} className="flex-[1.2]" />
          </div>
        </form>
      </AppCard>
    </div>
  );
}

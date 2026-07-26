import { useEffect, useState } from 'react';
import { OtpSixBoxes } from '../auth/OtpSixBoxes';
import { AppButton } from '../ui';
import { SECURITY_PIN_LENGTH, verifySecurityPin } from '../../utils/securityPin';

/**
 * Modal de saisie de code PIN.
 *
 * Usage :
 *   <PinModal
 *     visible={pinModalVisible}
 *     title="Afficher les montants"
 *     subtitle="Saisissez votre code PIN pour révéler les soldes et montants."
 *     onSuccess={() => { setPinModalVisible(false); setAmountsVisible(true); }}
 *     onDismiss={() => setPinModalVisible(false)}
 *   />
 */
export function PinModal({ visible, title, subtitle, onSuccess, onDismiss }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(false);

  useEffect(() => {
    if (visible) {
      setPin('');
      setError('');
    }
  }, [visible]);

  async function handleSubmit() {
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
      onSuccess?.();
    } finally {
      setVerifying(false);
    }
  }

  useEffect(() => {
    if (pin.length === SECURITY_PIN_LENGTH) {
      handleSubmit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pin]);

  if (!visible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[rgba(10,20,48,0.55)] px-6" onClick={onDismiss}>
      <div
        className="w-full max-w-sm bg-white rounded-3xl p-6 flex flex-col items-center shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <span className="size-16 rounded-full bg-success-bg flex items-center justify-center text-2xl mb-3.5">
          🔒
        </span>
        <h2 className="text-lg font-semibold text-navy text-center">{title || 'Accès protégé'}</h2>
        <p className="text-sm text-muted text-center mt-2 leading-relaxed">
          {subtitle || 'Saisissez votre code PIN pour accéder aux informations sensibles.'}
        </p>

        <div className="mt-5 mb-1.5">
          <OtpSixBoxes value={pin} onChange={setPin} length={SECURITY_PIN_LENGTH} disabled={verifying} />
        </div>

        {error && <p className="text-sm text-danger text-center mt-2.5">{error}</p>}

        <div className="flex gap-3 mt-5 w-full">
          <AppButton label="Annuler" variant="ghost" onPress={onDismiss} className="flex-1" />
          <AppButton
            label="Confirmer"
            onPress={handleSubmit}
            loading={verifying}
            disabled={verifying || pin.length !== SECURITY_PIN_LENGTH}
            className="flex-[1.2]"
          />
        </div>
      </div>
    </div>
  );
}

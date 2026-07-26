import { useCallback, useEffect, useMemo, useState } from 'react';
import { AppShell } from '../components/layout/AppShell';
import { AppButton, AppCard, AppToast, useToast } from '../components/ui';
import { OtpSixBoxes } from '../components/auth/OtpSixBoxes';
import { useAuth } from '../contexts/AuthContext';
import {
  SECURITY_PIN_LENGTH,
  hasSecurityPin,
  loadSecurityPinMeta,
  saveSecurityPin,
  verifySecurityPin,
} from '../utils/securityPin';

function maskPhone(phone) {
  if (!phone || phone.length < 6) return phone || '—';
  return `${phone.slice(0, 4)} ··· ${phone.slice(-4)}`;
}

function InfoPill({ icon, label, tone = 'default' }) {
  const success = tone === 'success';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium ${
        success ? 'bg-success-bg border-success-bright text-emerald' : 'bg-neutral-bg-soft border-border text-navy'
      }`}
    >
      {icon} {label}
    </span>
  );
}

function FieldLabel({ children }) {
  return <p className="text-xs font-medium text-muted mt-3 mb-1.5">{children}</p>;
}

function Accordion({ title, subtitle, icon, open, onToggle, children, tone = 'default' }) {
  const danger = tone === 'danger';
  return (
    <AppCard className="p-5 mb-4">
      <button type="button" onClick={onToggle} className="w-full flex items-center gap-3 cursor-pointer">
        <span className={`size-9 rounded-xl flex items-center justify-center text-base ${danger ? 'bg-danger-bg' : 'bg-success-bg'}`}>
          {icon}
        </span>
        <div className="flex-1 text-left min-w-0">
          <p className="text-sm font-semibold text-navy">{title}</p>
          {subtitle && !open && <p className="text-xs text-muted mt-0.5 truncate">{subtitle}</p>}
        </div>
        <span className="text-muted">{open ? '⌃' : '⌄'}</span>
      </button>
      {open && (
        <div className="mt-3.5 pt-3.5 border-t border-border">
          {subtitle && <p className="text-sm text-muted mb-2">{subtitle}</p>}
          {children}
        </div>
      )}
    </AppCard>
  );
}

export function SecurityPage() {
  const { user, sellerProfile, requestOtp, verifyOtp, otpState, otpStatus, resetOtpFlow } = useAuth();
  const { toast, showToast } = useToast();

  const [pinConfigured, setPinConfigured] = useState(false);
  const [pinMeta, setPinMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [openSection, setOpenSection] = useState(null);

  const [setupPin, setSetupPin] = useState('');
  const [setupConfirm, setSetupConfirm] = useState('');
  const [currentPin, setCurrentPin] = useState('');
  const [changePin, setChangePin] = useState('');
  const [changeConfirm, setChangeConfirm] = useState('');
  const [resetPin, setResetPin] = useState('');
  const [resetConfirm, setResetConfirm] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);

  const accountPhone = useMemo(
    () => user?.phone || sellerProfile?.phone || sellerProfile?.contact_phone || '',
    [user?.phone, sellerProfile?.phone, sellerProfile?.contact_phone]
  );

  const hydrate = useCallback(() => {
    setLoading(true);
    try {
      setPinConfigured(hasSecurityPin());
      setPinMeta(loadSecurityPinMeta());
    } catch {
      setPinConfigured(false);
      setPinMeta(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    hydrate();
    return () => resetOtpFlow();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrate]);

  function toggleSection(key) {
    setOpenSection((prev) => (prev === key ? null : key));
  }

  function validatePinPair(pin, confirmation) {
    if (pin.length !== SECURITY_PIN_LENGTH || confirmation.length !== SECURITY_PIN_LENGTH) {
      showToast({ message: `Le code PIN doit contenir exactement ${SECURITY_PIN_LENGTH} chiffres.`, type: 'error' });
      return false;
    }
    if (pin !== confirmation) {
      showToast({ message: 'Les deux codes PIN saisis doivent être identiques.', type: 'error' });
      return false;
    }
    return true;
  }

  async function saveNewPin() {
    if (!validatePinPair(setupPin, setupConfirm)) return;
    setSaving(true);
    try {
      const meta = await saveSecurityPin(setupPin);
      setPinMeta(meta);
      setPinConfigured(true);
      setSetupPin('');
      setSetupConfirm('');
      showToast({ message: 'Le code PIN protège maintenant Finances, Dépenses et Stock.', type: 'success' });
    } finally {
      setSaving(false);
    }
  }

  async function updatePinWithCurrentPin() {
    if (currentPin.length !== SECURITY_PIN_LENGTH) {
      showToast({ message: `Saisissez votre ancien code PIN à ${SECURITY_PIN_LENGTH} chiffres.`, type: 'error' });
      return;
    }
    if (!validatePinPair(changePin, changeConfirm)) return;
    setSaving(true);
    try {
      const validCurrentPin = await verifySecurityPin(currentPin);
      if (!validCurrentPin) {
        showToast({ message: "L'ancien code PIN saisi ne correspond pas au code actif.", type: 'error' });
        setCurrentPin('');
        return;
      }
      const meta = await saveSecurityPin(changePin);
      setPinMeta(meta);
      setCurrentPin('');
      setChangePin('');
      setChangeConfirm('');
      showToast({ message: 'Votre code PIN a été modifié avec succès.', type: 'success' });
    } finally {
      setSaving(false);
    }
  }

  async function sendOtp() {
    if (!accountPhone) {
      showToast({ message: "Aucun numéro de compte disponible pour envoyer le code OTP.", type: 'error' });
      return;
    }
    try {
      await requestOtp(accountPhone);
      setOtpCode('');
      setOtpVerified(false);
      setResetPin('');
      setResetConfirm('');
      showToast({ message: 'Un code a été envoyé sur le numéro lié à votre compte.', type: 'success' });
    } catch (error) {
      showToast({ message: error instanceof Error ? error.message : "Impossible d'envoyer le code OTP.", type: 'error' });
    }
  }

  async function confirmOtp() {
    if (otpCode.length !== 6) {
      showToast({ message: 'Saisissez les 6 chiffres reçus par SMS.', type: 'error' });
      return;
    }
    try {
      await verifyOtp(accountPhone, otpCode);
      setOtpVerified(true);
      showToast({ message: 'OTP validé, vous pouvez définir un nouveau code PIN.', type: 'success' });
    } catch (error) {
      showToast({ message: error instanceof Error ? error.message : 'Impossible de vérifier le code OTP.', type: 'error' });
    }
  }

  async function updatePinAfterOtp() {
    if (!otpVerified) {
      showToast({ message: "Validez d'abord le code OTP reçu sur votre numéro.", type: 'error' });
      return;
    }
    if (!validatePinPair(resetPin, resetConfirm)) return;
    setSaving(true);
    try {
      const meta = await saveSecurityPin(resetPin);
      setPinMeta(meta);
      setPinConfigured(true);
      setResetPin('');
      setResetConfirm('');
      setOtpCode('');
      setOtpVerified(false);
      resetOtpFlow();
      showToast({ message: 'Le nouveau code PIN est désormais actif.', type: 'success' });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <AppShell>
        <p className="text-muted">Chargement…</p>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="rounded-3xl bg-navy text-white p-5 mb-4">
        <div className="flex items-start gap-3.5">
          <span className="size-10 rounded-full bg-emerald flex items-center justify-center text-base flex-shrink-0">
            {pinConfigured ? '🛡️' : '🔒'}
          </span>
          <div>
            <p className="text-lg font-bold">{pinConfigured ? 'Code PIN actif' : 'Protégez vos écrans sensibles'}</p>
            <p className="text-sm text-white/80 mt-1.5 leading-relaxed">
              {pinConfigured
                ? 'Stock, Dépenses et Finances sont verrouillés par votre code PIN.'
                : `Définissez un code PIN à ${SECURITY_PIN_LENGTH} chiffres pour protéger l'accès aux modules sensibles.`}
            </p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2.5 mt-4">
          <InfoPill
            icon={pinConfigured ? '🔐' : '🔓'}
            label={pinConfigured ? 'Protection active' : 'Protection non activée'}
            tone={pinConfigured ? 'success' : 'default'}
          />
          <InfoPill icon="🔢" label={`${SECURITY_PIN_LENGTH} chiffres`} />
        </div>
      </div>

      <AppCard className="p-5 mb-4">
        <h2 className="text-lg font-bold text-navy">État actuel</h2>
        <p className="text-sm text-muted mt-1.5 leading-relaxed">
          Le code PIN verrouille l'accès aux écrans Finances, Dépenses et Stock.
        </p>
        <div className="flex items-center gap-3.5 mt-4">
          <span className="size-13 rounded-full bg-success-bg flex items-center justify-center text-xl">
            {pinConfigured ? '🛡️' : '🔒'}
          </span>
          <div>
            <p className="text-sm font-semibold text-navy">{pinConfigured ? 'Code PIN actif' : 'Code PIN non défini'}</p>
            <p className="text-xs text-muted mt-0.5">
              {pinConfigured
                ? `Dernière mise à jour : ${pinMeta?.lastUpdatedAt ? new Date(pinMeta.lastUpdatedAt).toLocaleString('fr-FR') : '—'}`
                : `Définissez un code PIN à ${SECURITY_PIN_LENGTH} chiffres pour protéger les zones sensibles.`}
            </p>
          </div>
        </div>
      </AppCard>

      {!pinConfigured ? (
        <AppCard className="p-5 mb-4">
          <h2 className="text-lg font-bold text-navy">Créer un code PIN</h2>
          <p className="text-sm text-muted mt-1.5 leading-relaxed">
            Commencez par créer votre code PIN pour sécuriser immédiatement l'accès aux modules sensibles.
          </p>
          <FieldLabel>Nouveau code PIN</FieldLabel>
          <OtpSixBoxes value={setupPin} onChange={setSetupPin} length={SECURITY_PIN_LENGTH} disabled={saving} />
          <FieldLabel>Confirmer le code PIN</FieldLabel>
          <OtpSixBoxes value={setupConfirm} onChange={setSetupConfirm} length={SECURITY_PIN_LENGTH} disabled={saving} />
          <AppButton label="Activer le code PIN" onPress={saveNewPin} loading={saving} className="mt-5 w-full" />
        </AppCard>
      ) : (
        <>
          <Accordion
            title="Modifier avec l'ancien code"
            subtitle="Si vous connaissez votre code PIN actuel, vous pouvez le remplacer immédiatement."
            icon="✏️"
            open={openSection === 'change'}
            onToggle={() => toggleSection('change')}
          >
            <FieldLabel>Code PIN actuel</FieldLabel>
            <OtpSixBoxes value={currentPin} onChange={setCurrentPin} length={SECURITY_PIN_LENGTH} disabled={saving} />
            <FieldLabel>Nouveau code PIN</FieldLabel>
            <OtpSixBoxes value={changePin} onChange={setChangePin} length={SECURITY_PIN_LENGTH} disabled={saving} />
            <FieldLabel>Confirmer le nouveau code</FieldLabel>
            <OtpSixBoxes value={changeConfirm} onChange={setChangeConfirm} length={SECURITY_PIN_LENGTH} disabled={saving} />
            <AppButton label="Modifier le code PIN" onPress={updatePinWithCurrentPin} loading={saving} className="mt-5 w-full" />
          </Accordion>

          <Accordion
            title="Code oublié"
            subtitle="Réinitialisez votre PIN via un OTP envoyé sur votre numéro de compte."
            icon="❓"
            tone="danger"
            open={openSection === 'forgot'}
            onToggle={() => toggleSection('forgot')}
          >
            <div className="flex items-start gap-2.5 bg-success-bg rounded-2xl px-3.5 py-2.5">
              <span>📱</span>
              <div>
                <p className="text-sm font-medium text-navy">{maskPhone(accountPhone)}</p>
                <p className="text-xs text-muted mt-1">Numéro du compte utilisé pour la récupération OTP</p>
              </div>
            </div>
            <AppButton label="Envoyer le code OTP" variant="ghost" onPress={sendOtp} className="mt-3.5 w-full" />

            <FieldLabel>Code OTP reçu</FieldLabel>
            <OtpSixBoxes
              value={otpCode}
              onChange={setOtpCode}
              disabled={otpState.status === otpStatus.SENDING || otpState.status === otpStatus.VERIFYING}
            />
            <AppButton
              label="Valider le code OTP"
              variant="ghost"
              onPress={confirmOtp}
              loading={otpState.status === otpStatus.VERIFYING}
              className="mt-3.5 w-full"
            />
            {otpState.error && <p className="text-sm text-danger mt-3">{otpState.error}</p>}
          </Accordion>

          <Accordion
            title="Nouveau code PIN"
            subtitle="Définissez un nouveau code PIN après validation de votre OTP."
            icon="🔑"
            open={openSection === 'reset'}
            onToggle={() => toggleSection('reset')}
          >
            <div className="flex items-center gap-2.5 bg-neutral-bg-soft border border-border rounded-2xl px-3.5 py-2.5">
              <span>{otpVerified ? '🔓' : '🔒'}</span>
              <p className={`text-xs ${otpVerified ? 'text-emerald font-medium' : 'text-muted'}`}>
                {otpVerified
                  ? 'OTP validé, vous pouvez définir un nouveau code PIN.'
                  : "Validez l'OTP pour débloquer la modification."}
              </p>
            </div>
            <FieldLabel>Nouveau code PIN</FieldLabel>
            <OtpSixBoxes value={resetPin} onChange={setResetPin} length={SECURITY_PIN_LENGTH} disabled={!otpVerified || saving} />
            <FieldLabel>Confirmer le nouveau code</FieldLabel>
            <OtpSixBoxes value={resetConfirm} onChange={setResetConfirm} length={SECURITY_PIN_LENGTH} disabled={!otpVerified || saving} />
            <AppButton
              label="Enregistrer le nouveau PIN"
              onPress={updatePinAfterOtp}
              loading={saving}
              disabled={!otpVerified}
              className="mt-5 w-full"
            />
          </Accordion>
        </>
      )}

      <AppToast message={toast.message} type={toast.type} visible={toast.visible} />
    </AppShell>
  );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthLayout } from '../../components/auth/AuthLayout';
import { AppButton, AppInput } from '../../components/ui';
import { useAuth } from '../../contexts/AuthContext';
import { getPartnerActivitySectors } from '../../api/meta';
import { ApiError } from '../../api/client';
import { formatGuineaPhoneInput, normalizeGuineaPhone, validatePhone } from '../../utils/phone';
import {
  BOUTIQUE_SUBSECTION_CHOICES,
  GUINEA_CITY_CHOICES,
  saveSellerProfileExtras,
} from '../../utils/sellerProfileExtras';

export function PartnerOnboardingPage() {
  const navigate = useNavigate();
  const { completeSellerOnboarding } = useAuth();
  const [choices, setChoices] = useState([]);
  const [loadingChoices, setLoadingChoices] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    shop_name: '',
    contact_phone: '',
    sector: '',
    boutique_subsection: '',
    activity_city: GUINEA_CITY_CHOICES[3],
    shop_address: '',
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const json = await getPartnerActivitySectors();
        if (!cancelled) {
          const list = json.data?.choices || [];
          setChoices(list);
          if (list.length) {
            setForm((prev) => ({ ...prev, sector: prev.sector || list[0].value }));
          }
        }
      } catch {
        if (!cancelled) setError('Impossible de charger les catégories vendeur.');
      } finally {
        if (!cancelled) setLoadingChoices(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (form.sector !== 'boutique' && form.boutique_subsection) {
      setForm((prev) => ({ ...prev, boutique_subsection: '' }));
    }
  }, [form.sector, form.boutique_subsection]);

  function set(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  const phoneError = form.contact_phone ? validatePhone(form.contact_phone) : '';
  const isReady =
    form.first_name.trim() &&
    form.last_name.trim() &&
    form.shop_name.trim() &&
    form.contact_phone.trim() &&
    !phoneError &&
    form.sector &&
    form.activity_city &&
    (form.sector !== 'boutique' || form.boutique_subsection);

  async function onSubmit(e) {
    e.preventDefault();
    if (!isReady || submitting) return;
    setSubmitting(true);
    setError('');
    try {
      await completeSellerOnboarding({
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        shop_name: form.shop_name.trim(),
        sector: form.sector,
        contact_phone: normalizeGuineaPhone(form.contact_phone),
        address: form.shop_address.trim() || undefined,
        activity_city: form.activity_city,
        city: form.activity_city,
        business_city: form.activity_city,
        activity_subsector: form.sector === 'boutique' ? form.boutique_subsection : '',
        subcategory: form.sector === 'boutique' ? form.boutique_subsection : '',
      });
      saveSellerProfileExtras({
        activityCity: form.activity_city,
        boutiqueSubsection: form.sector === 'boutique' ? form.boutique_subsection : '',
      });
      navigate('/', { replace: true });
    } catch (e2) {
      setError(e2 instanceof ApiError ? e2.message : "Impossible de finaliser l'inscription.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <AuthLayout
      heroTag="Dernière étape"
      heroTitle="Configurez votre boutique"
      heroSubtitle="Ces informations nous aident à personnaliser votre espace vendeur."
    >
      <form onSubmit={onSubmit} className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <AppInput label="Prénom" value={form.first_name} onChange={set('first_name')} />
          <AppInput label="Nom" value={form.last_name} onChange={set('last_name')} />
        </div>
        <AppInput label="Nom de la boutique" value={form.shop_name} onChange={set('shop_name')} />
        <AppInput
          label="Téléphone de contact"
          value={form.contact_phone}
          onChange={(e) => setForm((prev) => ({ ...prev, contact_phone: formatGuineaPhoneInput(e.target.value) }))}
          placeholder="620 00 00 00"
          error={phoneError}
        />
        <div>
          <label className="block text-sm font-medium text-navy mb-1.5">Secteur d'activité</label>
          <select
            value={form.sector}
            onChange={set('sector')}
            disabled={loadingChoices}
            className="w-full rounded-xl border border-border px-3.5 py-3 bg-white text-[15px] text-navy"
          >
            {choices.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
        {form.sector === 'boutique' && (
          <div>
            <label className="block text-sm font-medium text-navy mb-1.5">Sous-section boutique</label>
            <select
              value={form.boutique_subsection}
              onChange={set('boutique_subsection')}
              className="w-full rounded-xl border border-border px-3.5 py-3 bg-white text-[15px] text-navy"
            >
              <option value="">Sélectionnez une sous-section</option>
              {BOUTIQUE_SUBSECTION_CHOICES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}
        <div>
          <label className="block text-sm font-medium text-navy mb-1.5">Ville</label>
          <select
            value={form.activity_city}
            onChange={set('activity_city')}
            className="w-full rounded-xl border border-border px-3.5 py-3 bg-white text-[15px] text-navy"
          >
            {GUINEA_CITY_CHOICES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <AppInput label="Adresse de la boutique (optionnel)" value={form.shop_address} onChange={set('shop_address')} />
        {error && <p className="text-sm text-danger">{error}</p>}
        <AppButton label="Terminer" onPress={onSubmit} loading={submitting} disabled={!isReady} />
      </form>
    </AuthLayout>
  );
}

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { AppButton, AppCard, AppToast, useToast } from '../components/ui';
import { MapLocationPicker } from '../components/MapLocationPicker';
import { getSellerProfile } from '../api/partnerDomain';
import { extractPagedResults } from '../api/client';
import { listShops } from '../api/partnerDomain';
import {
  DEFAULT_SHOP_GEOLOCATION,
  SHOP_SCHEDULE_DAYS,
  loadSellerProfileExtras,
  loadShopGeolocation,
  normalizeShopGeolocation,
  saveShopGeolocation,
} from '../utils/sellerProfileExtras';

const TIME_OPTIONS = Array.from({ length: 48 }, (_, index) => {
  const hours = String(Math.floor(index / 2)).padStart(2, '0');
  const minutes = index % 2 === 0 ? '00' : '30';
  return `${hours}:${minutes}`;
});

function sanitizeCoordinate(value) {
  return String(value || '').replace(',', '.').replace(/[^0-9.-]/g, '');
}

function getEnabledDays(businessHours = {}) {
  return SHOP_SCHEDULE_DAYS.filter((day) => businessHours?.[day]?.enabled);
}

function formatBusinessHoursSummary(businessHours = {}) {
  const enabledDays = getEnabledDays(businessHours);
  if (!enabledDays.length) return ['Aucun horaire défini'];
  return enabledDays.map((day) => {
    const slot = businessHours[day] || {};
    return `${day} • ${slot.openingTime || '—'} à ${slot.closingTime || '—'}`;
  });
}

function isValidLatitude(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= -90 && parsed <= 90;
}

function isValidLongitude(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= -180 && parsed <= 180;
}

function isSuspiciousNullIsland(latitude, longitude) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return false;
  return Math.abs(lat) < 0.5 && Math.abs(lng) < 0.5;
}

function resolveCityCoordinates(city) {
  const normalized = String(city || '').trim().toLowerCase();
  if (normalized.includes('dakar')) return { latitude: '14.716677', longitude: '-17.467686' };
  if (normalized.includes('conakry')) return { latitude: '9.641185', longitude: '-13.578401' };
  if (normalized.includes('abidjan')) return { latitude: '5.359952', longitude: '-4.008256' };
  if (normalized.includes('bamako')) return { latitude: '12.639232', longitude: '-8.002889' };
  if (normalized.includes('lomé') || normalized.includes('lome')) return { latitude: '6.131944', longitude: '1.222778' };
  if (normalized.includes('cotonou')) return { latitude: '6.370293', longitude: '2.391236' };
  return { latitude: '14.716677', longitude: '-17.467686' };
}

function SectionCard({ title, subtitle, children }) {
  return (
    <AppCard className="p-5 mb-4">
      <h2 className="text-lg font-bold text-navy">{title}</h2>
      {subtitle && <p className="text-sm text-muted mt-1.5 leading-relaxed">{subtitle}</p>}
      <div className="mt-4">{children}</div>
    </AppCard>
  );
}

function InfoPill({ icon, label, tone = 'default' }) {
  const success = tone === 'success';
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-2 text-xs font-medium ${
        success ? 'bg-success-bg border-success-bright text-emerald' : 'bg-neutral-bg-soft border-border text-muted'
      }`}
    >
      {icon} {label}
    </span>
  );
}

function FieldLabel({ children }) {
  return <p className="text-xs font-medium text-muted mt-3 mb-1.5">{children}</p>;
}

const inputClass = 'w-full bg-neutral-bg-soft border border-border rounded-2xl px-3.5 py-3 text-sm text-navy outline-none focus:border-emerald';

export function GeolocationPage() {
  const navigate = useNavigate();
  const { toast, showToast } = useToast();
  const [activeShop, setActiveShop] = useState(null);
  const [draft, setDraft] = useState(DEFAULT_SHOP_GEOLOCATION);
  const [savedSnapshot, setSavedSnapshot] = useState(DEFAULT_SHOP_GEOLOCATION);
  const [loading, setLoading] = useState(true);

  const hydrate = useCallback(async () => {
    setLoading(true);
    let accountCity = '';
    try {
      const extras = loadSellerProfileExtras();
      accountCity = extras.activityCity || '';
      if (!accountCity) {
        const json = await getSellerProfile();
        const profile = json?.data ?? json;
        accountCity = profile?.activity_city || profile?.city || profile?.business_city || '';
      }
    } catch {
      // fallback to empty city
    }

    let shop = null;
    try {
      const shopsJson = await listShops();
      shop = extractPagedResults(shopsJson).results[0] || null;
    } catch {
      // ignore
    }
    setActiveShop(shop);

    if (!shop?.id) {
      setDraft({ ...DEFAULT_SHOP_GEOLOCATION, city: accountCity });
      setSavedSnapshot({ ...DEFAULT_SHOP_GEOLOCATION, city: accountCity });
      setLoading(false);
      return;
    }

    const saved = loadShopGeolocation(shop.id);
    const withCity = { ...saved, city: accountCity || saved.city };
    const fallbackCoordinates = resolveCityCoordinates(withCity.city);
    const needsCoordinateFallback =
      !isValidLatitude(withCity.latitude) ||
      !isValidLongitude(withCity.longitude) ||
      isSuspiciousNullIsland(withCity.latitude, withCity.longitude);
    const nextState = needsCoordinateFallback ? { ...withCity, ...fallbackCoordinates } : withCity;
    setDraft(nextState);
    setSavedSnapshot(nextState);
    setLoading(false);
  }, []);

  useEffect(() => {
    hydrate();
  }, [hydrate]);

  const coordinatesReady = useMemo(
    () => isValidLatitude(draft.latitude) && isValidLongitude(draft.longitude),
    [draft.latitude, draft.longitude]
  );
  const addressReady = Boolean(draft.address.trim() && draft.city.trim());
  const isReady = coordinatesReady && addressReady;

  function saveDraft() {
    if (!activeShop?.id) {
      showToast({ message: "Sélectionnez d'abord une boutique active dans Compte.", type: 'error' });
      return;
    }
    if (!draft.address.trim()) {
      showToast({ message: "Renseignez au minimum l'adresse principale de la boutique.", type: 'error' });
      return;
    }
    if (!draft.city.trim()) {
      showToast({ message: 'Sélectionnez la ville de la boutique.', type: 'error' });
      return;
    }
    if (!isValidLatitude(draft.latitude)) {
      showToast({ message: 'Latitude invalide : doit être comprise entre -90 et 90.', type: 'error' });
      return;
    }
    if (!isValidLongitude(draft.longitude)) {
      showToast({ message: 'Longitude invalide : doit être comprise entre -180 et 180.', type: 'error' });
      return;
    }
    const enabledDays = getEnabledDays(draft.businessHours);
    for (const day of enabledDays) {
      const slot = draft.businessHours?.[day] || {};
      if (!slot.openingTime || !slot.closingTime) {
        showToast({ message: `Définissez l'ouverture et la fermeture pour ${day}.`, type: 'error' });
        return;
      }
    }

    const payload = normalizeShopGeolocation(draft);
    saveShopGeolocation(activeShop.id, payload);
    setSavedSnapshot(payload);
    showToast({ message: 'Géolocalisation enregistrée — prête pour les futures livraisons.', type: 'success' });
  }

  function resetDraft() {
    setDraft(savedSnapshot);
  }

  function clearDraft() {
    setDraft((prev) => ({
      ...DEFAULT_SHOP_GEOLOCATION,
      city: prev.city,
      ...resolveCityCoordinates(prev.city),
    }));
  }

  function setDay(day, patch) {
    setDraft((prev) => ({
      ...prev,
      businessHours: {
        ...prev.businessHours,
        [day]: { ...prev.businessHours?.[day], ...patch },
      },
    }));
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
      <SectionCard
        title={activeShop?.name || 'Aucune boutique active'}
        subtitle={
          activeShop
            ? "Enregistrez l'adresse précise, les coordonnées GPS et les indications utiles."
            : 'Revenez dans Compte pour sélectionner la boutique à géolocaliser.'
        }
      >
        <div className="flex flex-wrap gap-2.5">
          <InfoPill
            icon={isReady ? '✅' : '📍'}
            label={isReady ? 'Localisation complète' : 'Localisation à compléter'}
            tone={isReady ? 'success' : 'default'}
          />
          <InfoPill icon="🚚" label="Prêt pour Livraison" tone={isReady ? 'success' : 'default'} />
        </div>
        {activeShop?.address && (
          <div className="mt-4 bg-neutral-bg-soft rounded-2xl p-3.5">
            <p className="text-xs text-muted">Adresse actuelle boutique</p>
            <p className="text-sm font-semibold text-navy mt-1.5">{activeShop.address}</p>
          </div>
        )}
      </SectionCard>

      <SectionCard
        title="Adresse de référence"
        subtitle="Ces informations aideront le futur livreur à trouver facilement la boutique."
      >
        <FieldLabel>Adresse exacte</FieldLabel>
        <input
          className={inputClass}
          value={draft.address}
          onChange={(e) => setDraft((prev) => ({ ...prev, address: e.target.value }))}
          placeholder="Ex: Kipé, rond-point Pharmacie..."
        />

        <FieldLabel>Repère / point notable</FieldLabel>
        <input
          className={inputClass}
          value={draft.landmark}
          onChange={(e) => setDraft((prev) => ({ ...prev, landmark: e.target.value }))}
          placeholder="Ex: en face de l'école, 2e étage..."
        />

        <FieldLabel>Ville</FieldLabel>
        <div className="w-full bg-neutral-bg border border-border rounded-2xl px-3.5 py-3 text-sm font-medium text-navy">
          {draft.city || 'Non définie dans le compte'}
        </div>
        <p className="text-xs text-muted mt-1.5">
          La ville est définie depuis votre compte (Compte → Informations boutique).
        </p>
      </SectionCard>

      <SectionCard
        title="Coordonnées GPS"
        subtitle="Saisissez les coordonnées exactes de la boutique pour une localisation fiable."
      >
        <FieldLabel>Carte</FieldLabel>
        <p className="text-xs text-muted mb-2.5">
          Cliquez ou faites glisser le repère pour ajuster la position exacte de la boutique.
        </p>
        <MapLocationPicker
          latitude={draft.latitude}
          longitude={draft.longitude}
          onChangeCoordinates={(lat, lng) =>
            setDraft((prev) => ({
              ...prev,
              latitude: String(lat.toFixed(6)),
              longitude: String(lng.toFixed(6)),
            }))
          }
        />

        <div className="grid grid-cols-2 gap-3 mt-4">
          <div>
            <FieldLabel>Latitude</FieldLabel>
            <input
              className={inputClass}
              value={draft.latitude}
              onChange={(e) => setDraft((prev) => ({ ...prev, latitude: sanitizeCoordinate(e.target.value) }))}
              placeholder="Ex: 9.6412"
            />
          </div>
          <div>
            <FieldLabel>Longitude</FieldLabel>
            <input
              className={inputClass}
              value={draft.longitude}
              onChange={(e) => setDraft((prev) => ({ ...prev, longitude: sanitizeCoordinate(e.target.value) }))}
              placeholder="Ex: -13.5784"
            />
          </div>
        </div>

        <div className="mt-4 bg-neutral-bg-soft rounded-2xl p-3.5">
          <p className="text-xs text-muted">Lecture rapide</p>
          <p className="text-sm font-semibold text-navy mt-1.5">
            {draft.latitude || '—'}, {draft.longitude || '—'}
          </p>
        </div>
      </SectionCard>

      <SectionCard
        title="Horaires de la boutique"
        subtitle="Ces heures d'ouverture et de fermeture seront affichées au futur utilisateur."
      >
        <p className="text-xs text-muted mb-2">
          Activez chaque jour concerné, puis choisissez les heures d'ouverture et de fermeture pour ce jour.
        </p>

        {SHOP_SCHEDULE_DAYS.map((day) => {
          const slot = draft.businessHours?.[day] || {};
          const enabled = Boolean(slot.enabled);
          return (
            <div key={day} className="mt-3 rounded-2xl border border-border bg-neutral-bg-soft p-3.5">
              <button
                type="button"
                onClick={() => setDay(day, { enabled: !enabled })}
                className="w-full flex items-center justify-between cursor-pointer"
              >
                <div className="text-left">
                  <p className="text-sm font-semibold text-navy">{day}</p>
                  <p className="text-xs text-muted mt-0.5">{enabled ? 'Ouvert' : 'Fermé'}</p>
                </div>
                <span className={enabled ? 'text-emerald' : 'text-muted'}>{enabled ? '✅' : '⬜'}</span>
              </button>

              {enabled && (
                <div className="grid grid-cols-2 gap-3 mt-3">
                  <div>
                    <FieldLabel>Ouverture</FieldLabel>
                    <select
                      className={inputClass}
                      value={slot.openingTime || ''}
                      onChange={(e) => setDay(day, { enabled: true, openingTime: e.target.value })}
                    >
                      <option value="">Choisir</option>
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <FieldLabel>Fermeture</FieldLabel>
                    <select
                      className={inputClass}
                      value={slot.closingTime || ''}
                      onChange={(e) => setDay(day, { enabled: true, closingTime: e.target.value })}
                    >
                      <option value="">Choisir</option>
                      {TIME_OPTIONS.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          );
        })}

        <div className="mt-4 bg-neutral-bg-soft rounded-2xl p-3.5">
          <p className="text-xs text-muted">Affichage futur utilisateur</p>
          {formatBusinessHoursSummary(draft.businessHours).map((line) => (
            <p key={line} className="text-sm font-medium text-muted mt-1">
              {line}
            </p>
          ))}
        </div>
      </SectionCard>

      <div className="flex gap-2.5">
        <AppButton label="Vider" variant="ghost" onPress={clearDraft} className="flex-1" />
        <AppButton label="Restaurer" variant="ghost" onPress={resetDraft} className="flex-1" />
        <AppButton label="Enregistrer" onPress={saveDraft} className="flex-[1.2]" />
      </div>

      <button
        type="button"
        onClick={() => navigate('/account')}
        className="flex items-center gap-1.5 mx-auto mt-4 text-sm text-muted cursor-pointer"
      >
        ← Retour au compte
      </button>

      <AppToast message={toast.message} type={toast.type} visible={toast.visible} />
    </AppShell>
  );
}

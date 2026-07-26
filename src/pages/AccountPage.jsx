import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AppShell } from '../components/layout/AppShell';
import { AppButton, AppCard, AppInput } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { ApiError, extractPagedResults } from '../api/client';
import { getSellerProfile, listNotifications, listShops, patchSellerProfile, patchShop } from '../api/partnerDomain';
import { formatGuineaPhoneInput } from '../utils/phone';
import {
  BOUTIQUE_SUBSECTION_CHOICES,
  GUINEA_CITY_CHOICES,
  loadSellerProfileExtras,
  saveSellerProfileExtras,
} from '../utils/sellerProfileExtras';

const PROFILE_CATEGORY_CHOICES = [
  { value: 'boutique', label: 'Boutique' },
  { value: 'restaurant', label: 'Restaurant' },
  { value: 'immobilier', label: 'Bien et immobilier' },
  { value: 'hotel', label: 'Hôtel' },
  { value: 'services', label: 'Prestation de service' },
];

function toTitleCase(value) {
  if (!value) return '—';
  return String(value)
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function roleLabel(role) {
  const normalized = String(role || '').trim().toLowerCase();
  if (normalized === 'seller' || normalized === 'partner') return 'Vendeur';
  if (normalized === 'buyer') return 'Acheteur';
  if (normalized === 'admin') return 'Administrateur';
  return toTitleCase(role);
}

function sellerStatusLabel({ sellerProfile, shops, user }) {
  const hasApprovedShop = shops.some((shop) => shop?.is_approved && shop?.is_active !== false);
  const isInactive = sellerProfile?.is_active === false || user?.is_active === false;
  if (isInactive) return 'Suspendu';
  if (sellerProfile?.is_verified || hasApprovedShop) return 'Vérifié';
  return 'À vérifier';
}

function profileDisplayName(user, sellerProfile) {
  const fullName = [user?.first_name, user?.last_name].filter(Boolean).join(' ').trim();
  return fullName || sellerProfile?.business_name || 'Profil vendeur';
}

function emptyProfileDraft(profile, shopAddress) {
  return {
    business_name: profile?.business_name || '',
    contact_phone: profile?.contact_phone || profile?.phone || '',
    activity_sector: profile?.activity_sector || 'boutique',
    activity_city: profile?.activity_city || profile?.city || profile?.business_city || '',
    activity_subsector: profile?.activity_subsector || profile?.subcategory || '',
    address: shopAddress ?? profile?.address ?? '',
  };
}

function SectionHeader({ title, subtitle }) {
  return (
    <div className="mt-8 mb-3">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted">{title}</p>
      {subtitle && <p className="text-sm text-muted mt-1.5 leading-relaxed">{subtitle}</p>}
    </div>
  );
}

function MetaBlock({ label, value }) {
  return (
    <div className="bg-neutral-bg-soft rounded-2xl p-3.5">
      <p className="text-xs text-muted">{label}</p>
      <p className="text-sm font-semibold text-navy mt-2">{value || '—'}</p>
    </div>
  );
}

function ActionRow({ icon, title, subtitle, onPress, tone = 'default' }) {
  const danger = tone === 'danger';
  return (
    <button
      type="button"
      onClick={onPress}
      className="w-full bg-white rounded-2xl border border-border p-4 flex items-center gap-3 mb-2.5 text-left cursor-pointer hover:shadow-sm transition"
    >
      <span className={`size-9 rounded-xl flex items-center justify-center text-base ${danger ? 'bg-danger-bg' : 'bg-success-bg'}`}>
        {icon}
      </span>
      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold ${danger ? 'text-danger' : 'text-navy'}`}>{title}</p>
        {subtitle && <p className="text-xs text-muted mt-1 leading-relaxed">{subtitle}</p>}
      </div>
      <span className="text-muted">›</span>
    </button>
  );
}

export function AccountPage() {
  const navigate = useNavigate();
  const { user, logout, refreshProfile, sellerProfile: sessionSellerProfile } = useAuth();
  const [sellerProfile, setSellerProfile] = useState(sessionSellerProfile);
  const [shops, setShops] = useState([]);
  const [profileDraft, setProfileDraft] = useState(emptyProfileDraft(sessionSellerProfile, ''));
  const [editingProfile, setEditingProfile] = useState(false);
  const [savingProfile, setSavingProfile] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [notifications, setNotifications] = useState([]);

  const activeShop = shops[0] || null;

  const displayName = useMemo(() => profileDisplayName(user, sellerProfile), [user, sellerProfile]);
  const accountSector = sellerProfile?.activity_sector || user?.activity_sector_label || user?.activity_sector;
  const accountStatusLabel = useMemo(
    () => sellerStatusLabel({ sellerProfile, shops, user }),
    [sellerProfile, shops, user]
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [sellerJson, notificationsJson, shopsJson] = await Promise.all([
        getSellerProfile(),
        listNotifications({ limit: 8 }),
        listShops(),
        refreshProfile(),
      ]);
      const profile = sellerJson.data || null;
      const shopList = extractPagedResults(shopsJson).results;
      const extras = loadSellerProfileExtras();
      const mergedProfile = profile && {
        ...profile,
        activity_city: profile.activity_city || profile.city || profile.business_city || extras.activityCity,
        activity_subsector: profile.activity_subsector || profile.subcategory || extras.boutiqueSubsection,
      };
      setSellerProfile(mergedProfile);
      setShops(shopList);
      if (!editingProfile) {
        setProfileDraft(emptyProfileDraft(mergedProfile, shopList[0]?.address));
      }
      setNotifications(extractPagedResults(notificationsJson).results);
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Impossible de rafraîchir le compte.');
    } finally {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  function set(field) {
    return (e) => setProfileDraft((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function saveProfile(e) {
    e.preventDefault();
    if (savingProfile) return;
    if (!profileDraft.business_name.trim()) {
      setError('Le nom du profil vendeur est obligatoire.');
      return;
    }
    setSavingProfile(true);
    setError(null);
    try {
      await patchSellerProfile({
        business_name: profileDraft.business_name.trim(),
        contact_phone: profileDraft.contact_phone.trim(),
        activity_sector: profileDraft.activity_sector,
        activity_city: profileDraft.activity_city,
        city: profileDraft.activity_city,
        business_city: profileDraft.activity_city,
        activity_subsector: profileDraft.activity_sector === 'boutique' ? profileDraft.activity_subsector : '',
        subcategory: profileDraft.activity_sector === 'boutique' ? profileDraft.activity_subsector : '',
      });
      if (activeShop?.id) {
        await patchShop(activeShop.id, { address: profileDraft.address.trim() });
      }
      saveSellerProfileExtras({
        activityCity: profileDraft.activity_city,
        boutiqueSubsection: profileDraft.activity_sector === 'boutique' ? profileDraft.activity_subsector : '',
      });
      await load();
      setEditingProfile(false);
    } catch (e2) {
      setError(e2 instanceof ApiError ? e2.message : 'Impossible de mettre à jour le profil.');
    } finally {
      setSavingProfile(false);
    }
  }

  function cancelProfileEdition() {
    setEditingProfile(false);
    setProfileDraft(emptyProfileDraft(sellerProfile, activeShop?.address));
  }

  return (
    <AppShell>
      <h1 className="text-xl font-bold text-navy mb-1">Compte</h1>
      <p className="text-sm text-muted mb-2">Profil, paramètres et documents</p>

      <SectionHeader
        title="Gestion profil"
        subtitle="Identité vendeur, catégorie officielle et état de vérification."
      />
      <AppCard className="p-5">
        <div className="flex items-center gap-3.5">
          <div className="size-13 rounded-full bg-success-bg flex items-center justify-center text-xl">👤</div>
          <div className="flex-1 min-w-0">
            <p className="text-lg font-bold text-navy truncate">{sellerProfile?.business_name || displayName}</p>
            <p className="text-xs text-muted mt-1">{user?.email || sellerProfile?.phone || user?.phone || '—'}</p>
          </div>
          {!editingProfile && (
            <button
              type="button"
              onClick={() => setEditingProfile(true)}
              className="flex items-center gap-1.5 bg-success-bg text-emerald rounded-full px-3 py-2 text-xs font-semibold cursor-pointer"
            >
              ✏️ Modifier
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-5">
          <MetaBlock label="Rôle" value={roleLabel(user?.role)} />
          <MetaBlock label="Catégorie" value={toTitleCase(accountSector)} />
          <MetaBlock label="Ville" value={sellerProfile?.activity_city || sellerProfile?.city || '—'} />
          <MetaBlock label="Statut" value={accountStatusLabel} />
          <MetaBlock
            label="Sous-section"
            value={accountSector === 'boutique' ? sellerProfile?.activity_subsector || '—' : '—'}
          />
          <MetaBlock label="Adresse" value={activeShop?.address || '—'} />
        </div>

        {editingProfile && (
          <form onSubmit={saveProfile} className="mt-5 pt-5 border-t border-border flex flex-col gap-4">
            <p className="text-base font-semibold text-navy">Mettre à jour le profil</p>
            <AppInput label="Nom du profil / enseigne" value={profileDraft.business_name} onChange={set('business_name')} />
            <AppInput
              label="Téléphone de contact"
              value={profileDraft.contact_phone}
              onChange={(e) => setProfileDraft((prev) => ({ ...prev, contact_phone: formatGuineaPhoneInput(e.target.value) }))}
              placeholder="+224..."
            />

            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">Catégorie officielle</label>
              <div className="flex flex-wrap gap-2">
                {PROFILE_CATEGORY_CHOICES.map((choice) => {
                  const active = profileDraft.activity_sector === choice.value;
                  return (
                    <button
                      key={choice.value}
                      type="button"
                      onClick={() =>
                        setProfileDraft((prev) => ({
                          ...prev,
                          activity_sector: choice.value,
                          activity_subsector: choice.value === 'boutique' ? prev.activity_subsector : '',
                        }))
                      }
                      className={`rounded-full px-3.5 py-2 text-xs font-medium border cursor-pointer ${
                        active ? 'bg-navy text-white border-navy' : 'bg-neutral-bg-soft text-navy border-border'
                      }`}
                    >
                      {choice.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {profileDraft.activity_sector === 'boutique' && (
              <div>
                <label className="block text-sm font-medium text-navy mb-1.5">Sous-section boutique</label>
                <div className="flex flex-wrap gap-2">
                  {BOUTIQUE_SUBSECTION_CHOICES.map((subsection) => {
                    const active = profileDraft.activity_subsector === subsection;
                    return (
                      <button
                        key={subsection}
                        type="button"
                        onClick={() => setProfileDraft((prev) => ({ ...prev, activity_subsector: subsection }))}
                        className={`rounded-full px-3.5 py-2 text-xs font-medium border cursor-pointer ${
                          active ? 'bg-navy text-white border-navy' : 'bg-neutral-bg-soft text-navy border-border'
                        }`}
                      >
                        {subsection}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-navy mb-1.5">Ville d'activité</label>
              <select
                value={profileDraft.activity_city}
                onChange={set('activity_city')}
                className="w-full rounded-xl border border-border px-3.5 py-3 bg-white text-[15px] text-navy"
              >
                <option value="">Sélectionnez une ville</option>
                {GUINEA_CITY_CHOICES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <AppInput label="Adresse de la boutique" value={profileDraft.address} onChange={set('address')} />

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="flex gap-3">
              <AppButton label="Annuler" variant="ghost" onPress={cancelProfileEdition} className="flex-1" />
              <AppButton label="Enregistrer" onPress={saveProfile} loading={savingProfile} className="flex-1" />
            </div>
          </form>
        )}

        {!editingProfile && error && <p className="text-sm text-danger mt-4">{error}</p>}
      </AppCard>

      <SectionHeader title="Paramètres" subtitle="Préférences d'utilisation de l'espace vendeur dans Koumi Pay." />
      <ActionRow
        icon="📍"
        title="Géolocalisation"
        subtitle="Définissez l'adresse exacte et les coordonnées GPS de la boutique active."
        onPress={() => navigate('/account/geolocation')}
      />
      <ActionRow
        icon="🔒"
        title="Sécurité"
        subtitle="Code PIN pour Finances, Dépenses et Stock — disponible prochainement sur le web."
        onPress={() => navigate('/account/security')}
      />

      <SectionHeader title="Documents" subtitle="Personnalisez vos factures, reçus et proformas." />
      <ActionRow
        icon="📄"
        title="Personnaliser les documents"
        subtitle="Logo, modèles, téléphone, pied de page et aperçu de configuration."
        onPress={() => navigate('/account/documents')}
      />

      <ActionRow icon="↪️" title="Déconnexion" subtitle="Quitter cette session Koumi Pay." onPress={logout} tone="danger" />

      <SectionHeader title="Zone dangereuse" subtitle="Actions irréversibles sur votre compte." />
      <ActionRow
        icon="🗑️"
        title="Supprimer le compte"
        subtitle="Désactiver définitivement votre espace vendeur Koumi Pay."
        onPress={() => navigate('/account/delete')}
        tone="danger"
      />

      <SectionHeader title="Notifications récentes" />
      <AppCard className="p-4">
        {loading ? (
          <p className="text-sm text-muted">Chargement…</p>
        ) : notifications.length === 0 ? (
          <p className="text-sm text-muted">Aucune notification récente.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {notifications.map((n) => (
              <li key={n.id} className="flex gap-3">
                <span
                  className={`size-2 rounded-full mt-1.5 ${
                    n.severity === 'success'
                      ? 'bg-success-bright'
                      : n.severity === 'warning'
                        ? 'bg-warning-bright'
                        : n.severity === 'danger' || n.severity === 'critical'
                          ? 'bg-danger'
                          : 'bg-info-bright'
                  }`}
                />
                <div>
                  <p className="text-sm font-medium text-navy">{n.title || 'Notification'}</p>
                  <p className="text-xs text-muted mt-0.5">{n.message || '—'}</p>
                  <p className="text-[11px] text-muted mt-1">
                    {n.created_at ? new Date(n.created_at).toLocaleString('fr-FR') : '—'}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </AppCard>
    </AppShell>
  );
}

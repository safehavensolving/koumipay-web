export const GUINEA_CITY_CHOICES = [
  'Beyla',
  'Boffa',
  'Boké',
  'Conakry',
  'Coyah',
  'Dabola',
  'Dalaba',
  'Dinguiraye',
  'Dubréka',
  'Faranah',
  'Forécariah',
  'Fria',
  'Gaoual',
  'Guéckédou',
  'Kankan',
  'Kérouané',
  'Kindia',
  'Kissidougou',
  'Koubia',
  'Koundara',
  'Kouroussa',
  'Labé',
  'Lélouma',
  'Lola',
  'Macenta',
  'Mali',
  'Mamou',
  'Mandiana',
  'Nzérékoré',
  'Pita',
  'Siguiri',
  'Télimélé',
  'Tougué',
  'Yomou',
];

export const BOUTIQUE_SUBSECTION_CHOICES = [
  'Vêtements',
  'Chaussures',
  'Alimentation',
  'Cosmétiques',
  'Électronique',
  'Accessoires',
  'Divers',
];

export const SHOP_SCHEDULE_DAYS = [
  'Lundi',
  'Mardi',
  'Mercredi',
  'Jeudi',
  'Vendredi',
  'Samedi',
  'Dimanche',
];

const SELLER_PROFILE_EXTRAS_KEY = 'koumi_seller_profile_extras_v1';

const DEFAULT_SELLER_PROFILE_EXTRAS = {
  activityCity: '',
  boutiqueSubsection: '',
  geolocationByShop: {},
};

export const DEFAULT_SHOP_GEOLOCATION = {
  address: '',
  landmark: '',
  city: '',
  latitude: '',
  longitude: '',
  businessHours: {},
};

function safeString(value) {
  return String(value ?? '').trim();
}

function createDefaultBusinessHours() {
  return SHOP_SCHEDULE_DAYS.reduce((acc, day) => {
    acc[day] = { enabled: false, openingTime: '', closingTime: '' };
    return acc;
  }, {});
}

function normalizeSellerProfileExtras(raw = {}) {
  return {
    ...DEFAULT_SELLER_PROFILE_EXTRAS,
    activityCity: safeString(raw?.activityCity || raw?.activity_city || raw?.city || raw?.business_city),
    boutiqueSubsection: safeString(
      raw?.boutiqueSubsection || raw?.boutique_subsection || raw?.activity_subsector || raw?.subcategory
    ),
    geolocationByShop:
      raw?.geolocationByShop && typeof raw.geolocationByShop === 'object' ? raw.geolocationByShop : {},
  };
}

export function normalizeShopGeolocation(raw = {}) {
  const rawBusinessHours = raw?.businessHours || raw?.business_hours;
  const businessHours = createDefaultBusinessHours();

  if (rawBusinessHours && typeof rawBusinessHours === 'object') {
    SHOP_SCHEDULE_DAYS.forEach((day) => {
      const source = rawBusinessHours[day] || {};
      businessHours[day] = {
        enabled: Boolean(source.enabled),
        openingTime: safeString(source.openingTime || source.opening_time),
        closingTime: safeString(source.closingTime || source.closing_time),
      };
    });
  }

  return {
    ...DEFAULT_SHOP_GEOLOCATION,
    address: safeString(raw?.address),
    landmark: safeString(raw?.landmark),
    city: safeString(raw?.city),
    latitude: safeString(raw?.latitude),
    longitude: safeString(raw?.longitude),
    businessHours,
  };
}

/**
 * `activity_city` / `activity_subsector` et la géolocalisation des boutiques ne sont
 * pas persistés par l'API backend — on les garde localement, comme côté mobile
 * (AsyncStorage), pour pouvoir les ré-afficher après coup.
 */
export function loadSellerProfileExtras() {
  try {
    const raw = localStorage.getItem(SELLER_PROFILE_EXTRAS_KEY);
    return normalizeSellerProfileExtras(raw ? JSON.parse(raw) : {});
  } catch {
    return normalizeSellerProfileExtras();
  }
}

export function saveSellerProfileExtras(extras) {
  const normalized = normalizeSellerProfileExtras(extras);
  localStorage.setItem(SELLER_PROFILE_EXTRAS_KEY, JSON.stringify(normalized));
  return normalized;
}

export function loadShopGeolocation(shopId) {
  const extras = loadSellerProfileExtras();
  return normalizeShopGeolocation(extras.geolocationByShop?.[String(shopId || '')] || {});
}

export function saveShopGeolocation(shopId, geolocation) {
  const extras = loadSellerProfileExtras();
  const key = safeString(shopId);
  if (!key) {
    return normalizeShopGeolocation(geolocation);
  }
  const nextExtras = {
    ...extras,
    geolocationByShop: {
      ...extras.geolocationByShop,
      [key]: normalizeShopGeolocation(geolocation),
    },
  };
  localStorage.setItem(SELLER_PROFILE_EXTRAS_KEY, JSON.stringify(nextExtras));
  return nextExtras.geolocationByShop[key];
}

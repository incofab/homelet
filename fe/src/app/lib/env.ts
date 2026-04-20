const getEnvValue = (value: string | undefined, fallback: string) => {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : fallback;
};

export const env = {
  apiBaseUrl: getEnvValue(
    import.meta.env.VITE_API_BASE_URL,
    'http://localhost',
  ),
  apiPrefix: getEnvValue(import.meta.env.VITE_API_PREFIX, '/api'),
  appName: getEnvValue(import.meta.env.VITE_APP_NAME, 'Tenanta'),
  appTagline: getEnvValue(
    import.meta.env.VITE_APP_TAGLINE,
    'Find your perfect home',
  ),
  defaultCurrency: getEnvValue(import.meta.env.VITE_DEFAULT_CURRENCY, 'NGN'),
  defaultLocale: getEnvValue(import.meta.env.VITE_DEFAULT_LOCALE, 'en-NG'),
  defaultCountry: getEnvValue(import.meta.env.VITE_DEFAULT_COUNTRY, 'Nigeria'),
  moneyInKobo:
    getEnvValue(import.meta.env.VITE_MONEY_IN_KOBO, 'false') === 'true',
  placeholderImage: getEnvValue(
    import.meta.env.VITE_PLACEHOLDER_IMAGE,
    'https://images.unsplash.com/photo-1560185007-5f0bb1866cab?auto=format&fit=crop&w=1200&q=80',
  ),
  buildingPlaceholderImage: getEnvValue(
    import.meta.env.VITE_BUILDING_PLACEHOLDER_IMAGE,
    'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80',
  ),
  apartmentPlaceholderImage: getEnvValue(
    import.meta.env.VITE_APARTMENT_PLACEHOLDER_IMAGE,
    'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=80',
  ),
  authTokenKey: getEnvValue(
    import.meta.env.VITE_AUTH_TOKEN_KEY,
    'tenanta_token',
  ),
};

export const apiRoot = (() => {
  const base = env.apiBaseUrl.replace(/\/$/, '');
  const prefix = env.apiPrefix.startsWith('/')
    ? env.apiPrefix
    : `/${env.apiPrefix}`;
  return `${base}${prefix}`;
})();

export type AppStage = 'dev' | 'prod';

const LOCAL_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '::1',
  '[::1]',
]);

const STAGE_HOSTNAMES: Record<Exclude<AppStage, 'dev'>, string> = {
  prod: 'world.mira.ml',
};

const STAGE_ORIGINS: Record<AppStage, string> = {
  dev: 'http://localhost:3013',
  prod: 'https://world.mira.ml',
};

const API_URLS: Record<AppStage, string> = {
  dev: process.env.REACT_APP_API_BASE_URL || 'https://api.mira.ml',
  prod: 'https://api.mira.ml',
};

export const resolveStageFromHostname = (hostname?: string): AppStage => {
  const h = hostname?.toLowerCase().trim();
  if (!h) return 'prod';
  if (LOCAL_HOSTNAMES.has(h)) return 'dev';
  if (h === STAGE_HOSTNAMES.prod) return 'prod';
  return 'prod';
};

const getWindowHostname = (): string | undefined => {
  if (typeof window !== 'undefined' && window.location?.hostname) {
    return window.location.hostname;
  }
  return undefined;
};

export const getCurrentStage = (): AppStage =>
  resolveStageFromHostname(getWindowHostname());

export const getStageOrigin = (stage: AppStage): string => STAGE_ORIGINS[stage];

export const getApiBaseUrl = (): string => API_URLS[getCurrentStage()];

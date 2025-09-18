// Google Maps API Key - using directly
export const GOOGLE_MAPS_API_KEY: string = 'AIzaSyBbYp58aw_mEJuQzEvG-YMAUBvzf8l7kY0';

export const isEnvConfigured = (): boolean => {
  return Boolean(GOOGLE_MAPS_API_KEY);
};

export const requireEnv = (name: string, value: string | undefined): string => {
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
};



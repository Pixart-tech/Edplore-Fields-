// Configuration file for environment variables and API keys
import Constants from 'expo-constants';

// Google Maps API Key - fallback to hardcoded key if not in environment
export const GOOGLE_MAPS_API_KEY = 
  Constants.expoConfig?.extra?.googleMapsApiKey ||
  process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY ||
  'AIzaSyBbYp58aw_mEJuQzEvG-YMAUBvzf8l7kY0';

// Check if API key is valid
export const isGoogleMapsApiKeyValid = (): boolean => {
  return GOOGLE_MAPS_API_KEY && GOOGLE_MAPS_API_KEY.length > 0 && !GOOGLE_MAPS_API_KEY.includes('your-api-key');
};

// Log API key status (without exposing the actual key)
export const logApiKeyStatus = (): void => {
  if (isGoogleMapsApiKeyValid()) {
    console.log('Google Maps API key is configured');
  } else {
    console.error('Google Maps API key is missing or invalid. Please check your environment configuration.');
  }
};

export default {
  GOOGLE_MAPS_API_KEY,
  isGoogleMapsApiKeyValid,
  logApiKeyStatus,
};

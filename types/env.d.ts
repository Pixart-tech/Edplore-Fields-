declare module '@env' {
  export const EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: string;
}

declare namespace NodeJS {
  interface ProcessEnv {
    EXPO_PUBLIC_GOOGLE_MAPS_API_KEY: string;
  }
}

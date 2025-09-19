export interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  border: string;
  success: string;
  warning: string;
  error: string;
}

export interface AssignedAreaData {
  cities: string[];
  areas: string[];
}

export interface LiveTrackingUser {
  userId?: string;
  name?: string;
  location: {
    latitude: number;
    longitude: number;
  };
  lastUpdate: number;
}

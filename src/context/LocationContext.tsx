import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import {
  addDoc,
  collection,
  doc as fsDoc,
  getDocs,
  query,
  serverTimestamp,
  setDoc,
  Timestamp,
  where,
  updateDoc,
} from 'firebase/firestore';
import { GOOGLE_MAPS_API_KEY as DEFAULT_GOOGLE_MAPS_API_KEY } from '../config/env';

const LOCATION_TASK_NAME = 'background-location-task';

// Helper function to calculate straight-line distance between two points (Haversine formula)
const calculateStraightLineDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return distance;
};

const resolveGoogleApiKey = (): string | undefined => {
  const envKey = (process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY as string | undefined)?.trim();
  if (envKey) {
    return envKey;
  }

  const fallbackKey = DEFAULT_GOOGLE_MAPS_API_KEY?.trim();
  return fallbackKey || undefined;
};

// Google Distance Matrix API based distance calculation
const GOOGLE_API_KEY = resolveGoogleApiKey();

if (!GOOGLE_API_KEY) {
  console.warn('Google Maps API key is not configured; distance tracking will be disabled.');
}

const DEFAULT_HISTORY_KEY = 'locationHistory';
const DEFAULT_TOTAL_KEY = 'totalDistance';
const HISTORY_LIMIT = 1000;

interface StoredUser {
  id?: string;
  name?: string;
}

const getStoredUser = async (): Promise<StoredUser | null> => {
  try {
    const userStr = await AsyncStorage.getItem('user');
    return userStr ? (JSON.parse(userStr) as StoredUser) : null;
  } catch (error) {
    console.warn('Unable to read stored user for distance tracking:', error);
    return null;
  }
};

const getStorageKeysForUser = (userId: string | null) => ({
  history: userId ? `${DEFAULT_HISTORY_KEY}_${userId}` : DEFAULT_HISTORY_KEY,
  total: userId ? `${DEFAULT_TOTAL_KEY}_${userId}` : DEFAULT_TOTAL_KEY,
});

const getDrivingDistanceKm = async (
  originLat: number,
  originLng: number,
  destLat: number,
  destLng: number
): Promise<number | null> => {
  if (!GOOGLE_API_KEY) {
    console.warn('Google Distance API is not configured; skipping distance calculation.');
    return null;
  }

  const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${encodeURIComponent(
    `${originLat},${originLng}`
  )}&destinations=${encodeURIComponent(`${destLat},${destLng}`)}&mode=driving&key=${GOOGLE_API_KEY}`;

  try {
    const res = await fetch(url);
    if (!res.ok) {
      console.warn(`Google Distance API request failed: ${res.status} ${res.statusText}`);
      return null;
    }

    const data = await res.json();
    const el = data?.rows?.[0]?.elements?.[0];

    if (el?.status === 'OK' && el?.distance?.value != null) {
      const distanceKm = el.distance.value / 1000; // meters to km
      console.log(`Distance calculated: ${distanceKm.toFixed(3)} km (Google API)`);
      return distanceKm;
    } else {
      console.warn(`Google Distance API error: ${el?.status || 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    console.warn('Google Distance API request failed:', error);
    return null;
  }
};

// Helper function to get current date string (YYYY-MM-DD)
const getCurrentDateString = (): string => {
  const now = new Date();
  return now.toISOString().split('T')[0];
};

// Helper function to store travelled distance in Firebase
const storeTravelledDistance = async (userId: string, distanceKm: number) => {
  const currentDate = getCurrentDateString();
  const docId = `${currentDate}_${userId}`;
  
  try {
    const travelledRef = fsDoc(db, 'travelled', docId);
    
    // Try to get the existing document first
    try {
      const existingSnapshot = await getDocs(query(
        collection(db, 'travelled'), 
        where('current_date', '==', currentDate), 
        where('user_id', '==', userId)
      ));
      
      if (!existingSnapshot.empty) {
        // Update existing document
        const existingData = existingSnapshot.docs[0].data();
        const newTotalDistance = (existingData.travelled_distance_kms || 0) + distanceKm;
        
        await updateDoc(existingSnapshot.docs[0].ref, {
          travelled_distance_kms: newTotalDistance,
          updated_at: serverTimestamp(),
        });
        
        console.log(`Updated daily distance for ${userId}: ${newTotalDistance.toFixed(2)} km`);
      } else {
        // Create new document
        await setDoc(travelledRef, {
          current_date: currentDate,
          user_id: userId,
          travelled_distance_kms: distanceKm,
          created_at: serverTimestamp(),
          updated_at: serverTimestamp(),
        });
        
        console.log(`Created new daily distance record for ${userId}: ${distanceKm.toFixed(2)} km`);
      }
    } catch (queryError) {
      console.log('Query failed, trying direct document creation:', queryError);
      // Fallback: try to create/update the document directly
      await setDoc(travelledRef, {
        current_date: currentDate,
        user_id: userId,
        travelled_distance_kms: distanceKm,
        created_at: serverTimestamp(),
        updated_at: serverTimestamp(),
      }, { merge: true });
      
      console.log(`Created/merged daily distance record for ${userId}: ${distanceKm.toFixed(2)} km`);
    }
  } catch (error) {
    console.error('Error storing travelled distance:', error);
  }
};

// Helper function to store live tracking data
const storeLiveTrackingData = async (userId: string, locationData: LocationData) => {
  const currentDate = getCurrentDateString();
  const docId = `${currentDate}_${userId}`;
  
  try {
    const liveTrackingRef = fsDoc(db, 'live_tracking_daily', docId);
    const timestamp = Date.now();
    
    const locationPoint = {
      lat: locationData.latitude,
      lng: locationData.longitude,
      timestamp: timestamp,
      accuracy: locationData.accuracy || null,
    };
    
    // Try to get the existing document first
    try {
      const existingSnapshot = await getDocs(query(
        collection(db, 'live_tracking_daily'), 
        where('current_date', '==', currentDate), 
        where('user_id', '==', userId)
      ));
      
      if (!existingSnapshot.empty) {
        // Update existing document - append to locations array
        const existingData = existingSnapshot.docs[0].data();
        const existingLocations = existingData.locations || [];
        
        await updateDoc(existingSnapshot.docs[0].ref, {
          locations: [...existingLocations, locationPoint],
          last_updated: serverTimestamp(),
        });
        
        console.log(`Updated live tracking data for ${userId} on ${currentDate} (${existingLocations.length + 1} points)`);
      } else {
        // Create new document
        await setDoc(liveTrackingRef, {
          current_date: currentDate,
          user_id: userId,
          locations: [locationPoint],
          created_at: serverTimestamp(),
          last_updated: serverTimestamp(),
        });
        
        console.log(`Created new live tracking record for ${userId} on ${currentDate}`);
      }
    } catch (queryError) {
      console.log('Query failed, trying direct document creation:', queryError);
      // Fallback: try to create/update the document directly using merge
      await setDoc(liveTrackingRef, {
        current_date: currentDate,
        user_id: userId,
        locations: [locationPoint],
        created_at: serverTimestamp(),
        last_updated: serverTimestamp(),
      }, { merge: true });
      
      console.log(`Created/merged live tracking data for ${userId} on ${currentDate}`);
    }
  } catch (error) {
    console.error('Error storing live tracking data:', error);
  }
};

interface LocationData {
  latitude: number;
  longitude: number;
  timestamp: number;
  accuracy?: number;
}

type DistanceUpdateListener = (newTotal: number) => void;

let distanceUpdateListener: DistanceUpdateListener | null = null;

const setDistanceUpdateListener = (listener: DistanceUpdateListener | null) => {
  distanceUpdateListener = listener;
};

const notifyDistanceUpdate = (newTotal: number) => {
  try {
    distanceUpdateListener?.(newTotal);
  } catch (listenerError) {
    console.error('Failed to notify distance update listener:', listenerError);
  }
};

const processLocationForDistance = async (
  locationData: LocationData,
  userIdHint?: string | null
): Promise<void> => {
  try {
    const storedUserId = userIdHint ?? (await (async () => {
      const storedUser = await getStoredUser();
      return storedUser?.id ?? null;
    })());

    const { history: historyKey, total: totalKey } = getStorageKeysForUser(storedUserId);

    const existingData = await AsyncStorage.getItem(historyKey);
    let locationHistory: LocationData[] = [];

    if (existingData) {
      try {
        locationHistory = JSON.parse(existingData) as LocationData[];
      } catch (parseError) {
        console.warn('Stored location history was corrupted; resetting history.', parseError);
        locationHistory = [];
      }
    }

    if (locationHistory.length > 0) {
      const prevLocation = locationHistory[locationHistory.length - 1];
      const hasMeaningfulMovement =
        Math.abs(prevLocation.latitude - locationData.latitude) > 1e-5 ||
        Math.abs(prevLocation.longitude - locationData.longitude) > 1e-5;

      if (hasMeaningfulMovement) {
        const distanceKm = await getDrivingDistanceKm(
          prevLocation.latitude,
          prevLocation.longitude,
          locationData.latitude,
          locationData.longitude
        );

        if (distanceKm != null && Number.isFinite(distanceKm)) {
          const currentTotalStr = await AsyncStorage.getItem(totalKey);
          const currentTotal = currentTotalStr ? parseFloat(currentTotalStr) : 0;
          const newTotal = currentTotal + distanceKm;
          await AsyncStorage.setItem(totalKey, newTotal.toString());
          notifyDistanceUpdate(newTotal);
        } else {
          console.warn('Google Distance API failed or returned invalid data; distance not accumulated');
        }
      }
    }

    locationHistory.push(locationData);

    if (locationHistory.length > HISTORY_LIMIT) {
      locationHistory.splice(0, locationHistory.length - HISTORY_LIMIT);
    }

    await AsyncStorage.setItem(historyKey, JSON.stringify(locationHistory));
  } catch (error) {
    console.error('Error processing location for distance:', error);
  }
};

interface LocationContextType {
  currentLocation: LocationData | null;
  isTracking: boolean;
  totalDistance: number;
  startTracking: () => Promise<void>;
  stopTracking: () => Promise<void>;
  getLocationHistory: () => Promise<LocationData[]>;
  // Unified tracking (combines regular and live tracking)
  startUnifiedTracking: () => Promise<void>;
  stopUnifiedTracking: () => Promise<void>;
  // Live tracking features (legacy)
  startLiveTracking: () => Promise<void>;
  stopLiveTracking: () => Promise<void>;
  isLiveTracking: boolean;
  liveUsers: Array<{
    userId: string;
    name: string;
    location: LocationData;
    lastUpdate: number;
  }>;
  // Admin functions
  getLiveTrackingUsers: () => Promise<void>;
  // Function to refresh total distance
  refreshTotalDistance: () => Promise<void>;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) {
    console.error('Background location task error:', error);
    return;
  }

  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    console.log('Received new locations', locations);

    for (const location of locations) {
      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
        accuracy: location.coords.accuracy || undefined,
      };

      try {
        const storedUser = await getStoredUser();
        await processLocationForDistance(locationData, storedUser?.id ?? null);

        if (!storedUser?.id) {
          continue;
        }

        // Persist to Firestore (locations history and optional live tracking doc)
        try {
          const historyDoc = {
            user_id: storedUser.id,
            latitude: locationData.latitude,
            longitude: locationData.longitude,
            timestamp: locationData.timestamp,
            accuracy: locationData.accuracy ?? null,
            created_at: serverTimestamp(),
            is_live_tracking: true,
          };

          await addDoc(collection(db, 'locations'), historyDoc);

          // Update live tracking document if active
          const liveStatus = await AsyncStorage.getItem(`liveTracking_${storedUser.id}`);
          if (liveStatus === 'true') {
            await setDoc(
              fsDoc(db, 'live_tracking', storedUser.id),
              {
                user_id: storedUser.id,
                name: storedUser.name,
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                accuracy: locationData.accuracy ?? null,
                last_update: serverTimestamp(),
                timestamp: locationData.timestamp,
              },
              { merge: true }
            );
          }
        } catch (persistErr) {
          console.error('Failed to persist location to Firestore:', persistErr);
        }
      } catch (err) {
        console.error('Error processing location:', err);
      }
    }
  }
});


interface LocationProviderProps {
  children: ReactNode;
}

export const LocationProvider: React.FC<LocationProviderProps> = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState<LocationData | null>(null);
  const [isTracking, setIsTracking] = useState(false);
  const [totalDistance, setTotalDistance] = useState(0);
  // Live tracking states
  const [isLiveTracking, setIsLiveTracking] = useState(false);
  const [liveUsers, setLiveUsers] = useState<Array<{
    userId: string;
    name: string;
    location: LocationData;
    lastUpdate: number;
  }>>([]);
  const [liveTrackingInterval, setLiveTrackingInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  
  const { user } = useAuth();

  useEffect(() => {
    const listener: DistanceUpdateListener = (newTotal: number) => {
      setTotalDistance(newTotal);
    };
    setDistanceUpdateListener(listener);
    return () => setDistanceUpdateListener(null);
  }, []);

  useEffect(() => {
    checkTrackingStatus();
    getCurrentLocation();
    calculateTotalDistance();
  }, [user]);

  const checkTrackingStatus = async () => {
    if (!user) return;
    
    try {
      const trackingStatus = await AsyncStorage.getItem(`tracking_${user.id}`);
      if (trackingStatus === 'true') {
        const isTaskRunning = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
        setIsTracking(isTaskRunning);
        
        // Also check live tracking status
        const liveStatus = await AsyncStorage.getItem(`liveTracking_${user.id}`);
        setIsLiveTracking(liveStatus === 'true' && isTaskRunning);
      }
    } catch (error) {
      console.error('Error checking tracking status:', error);
    }
  };

  const getCurrentLocation = async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        console.log('Location permission not granted');
        return;
      }

      const location = await Location.getCurrentPositionAsync({});
      const locationData: LocationData = {
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        timestamp: location.timestamp,
        accuracy: location.coords.accuracy || undefined,
      };
      
      setCurrentLocation(locationData);
    } catch (error) {
      console.error('Error getting current location:', error);
    }
  };

  const refreshTotalDistanceFromFirebase = async () => {
    if (!user?.id) return;
    
    try {
      const currentDate = getCurrentDateString();
      const docId = `${currentDate}_${user.id}`;
      
      // Use doc() to get a specific document by ID instead of query with where
      const travelledDocRef = fsDoc(db, 'travelled', docId);
      const travelledSnapshot = await getDocs(query(collection(db, 'travelled'), where('current_date', '==', currentDate), where('user_id', '==', user.id)));
      
      if (!travelledSnapshot.empty) {
        const data = travelledSnapshot.docs[0].data();
        const firebaseDistance = data.travelled_distance_kms || 0;
        
        // Update local storage and state
        await AsyncStorage.setItem('totalDistance', firebaseDistance.toString());
        setTotalDistance(firebaseDistance);
        
        console.log(`Synced total distance from Firebase: ${firebaseDistance.toFixed(2)} km`);
      } else {
        // If no document exists for today, set distance to 0
        await AsyncStorage.setItem('totalDistance', '0');
        setTotalDistance(0);
        console.log('No distance data found for today, reset to 0');
      }
    } catch (error) {
      console.error('Error refreshing distance from Firebase:', error);
      // Don't change the current value on error, just log it
    }
  };

  const calculateTotalDistance = async () => {
    if (!user?.id) {
      setTotalDistance(0);
      return;
    }

    try {
      // Prefer per-user stored total, then app-wide default, then legacy key
      const { total: totalKey } = getStorageKeysForUser(user.id);
      const totalDistanceStr =
        (await AsyncStorage.getItem(totalKey)) ??
        (await AsyncStorage.getItem(DEFAULT_TOTAL_KEY)) ??
        (await AsyncStorage.getItem('totalDistance'));

      if (totalDistanceStr) {
        const parsed = parseFloat(totalDistanceStr);
        setTotalDistance(Number.isFinite(parsed) ? parsed : 0);

        // Also try to sync with Firebase travelled data for today (best-effort)
        await refreshTotalDistanceFromFirebase();
        return;
      }

      // If no local data, try to get from Firebase
      await refreshTotalDistanceFromFirebase();
    } catch (error) {
      console.error('Error calculating total distance:', error);
      setTotalDistance(0);
    }
  };

  const refreshTotalDistance = async (): Promise<void> => {
    await refreshTotalDistanceFromFirebase();
  };

  const startTracking = async (): Promise<void> => {
    if (!user) return;

    try {
      const { status: foregroundStatus } = await Location.requestForegroundPermissionsAsync();
      if (foregroundStatus !== 'granted') {
        throw new Error('Foreground location permission not granted');
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.warn('Background location permission not granted, tracking may be limited');
      }

      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High,
        timeInterval: 15000, // 15 seconds (more frequent)
        distanceInterval: 10, // 10 meters (more sensitive)
        foregroundService: {
          notificationTitle: 'Location Tracking Active',
          notificationBody: 'Tracking your location for distance calculation',
          notificationColor: '#4CAF50',
        },
      });

      await AsyncStorage.setItem(`tracking_${user.id}`, 'true');
      setIsTracking(true);
    } catch (error) {
      console.error('Error starting location tracking:', error);
      throw error;
    }
  };

  const stopTracking = async (): Promise<void> => {
    if (!user) return;

    try {
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }
      
      await AsyncStorage.setItem(`tracking_${user.id}`, 'false');
      setIsTracking(false);
    } catch (error) {
      console.error('Error stopping location tracking:', error);
      throw error;
    }
  };

  const getLocationHistory = async (): Promise<LocationData[]> => {
    if (!user?.id) {
      return [];
    }

    try {
      const { history: historyKey } = getStorageKeysForUser(user.id);
      const historyData =
        (await AsyncStorage.getItem(historyKey)) ??
        (await AsyncStorage.getItem(DEFAULT_HISTORY_KEY));
      return historyData ? (JSON.parse(historyData) as LocationData[]) : [];
    } catch (error) {
      console.error('Error getting location history:', error);
      return [];
    }
  };

  // Unified tracking function that combines both regular and live tracking
  const startUnifiedTracking = async (): Promise<void> => {
    if (!user) return;

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        throw new Error('Location permission not granted');
      }

      const { status: backgroundStatus } = await Location.requestBackgroundPermissionsAsync();
      if (backgroundStatus !== 'granted') {
        console.warn('Background location permission not granted, tracking may be limited');
      }

      // Start background location tracking for distance calculation
      await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
        accuracy: Location.Accuracy.High, // Use high accuracy for better distance calculation
        timeInterval: 15000, // 15 seconds (more frequent updates)
        distanceInterval: 10, // 10 meters (capture smaller movements)
        foregroundService: {
          notificationTitle: 'Location Tracking Active',
          notificationBody: 'Your location is being tracked for distance calculation',
          notificationColor: '#4CAF50',
        },
      });

      // Mark live tracking active in Firestore for admin visibility
      await setDoc(
        fsDoc(db, 'live_tracking', user.id!),
        {
          user_id: user.id,
          name: user.name,
          is_active: true,
          started_at: serverTimestamp(),
          last_update: serverTimestamp(),
          latitude: null,
          longitude: null,
          accuracy: null,
        },
        { merge: true }
      );

      // Start sending location updates every 60 seconds for live tracking
      const interval = setInterval(async () => {
        try {
          const location = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.High,
          });

          const locationData: LocationData = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
            timestamp: location.timestamp,
            accuracy: location.coords.accuracy || undefined,
          };

          await processLocationForDistance(locationData, user?.id ?? null);

          setCurrentLocation(locationData);

          // Update live tracking doc and save to locations collection
          try {
            
            await setDoc(
              fsDoc(db, 'live_tracking', user.id!),
              {
                latitude: locationData.latitude,
                longitude: locationData.longitude,
                accuracy: locationData.accuracy ?? null,
                last_update: serverTimestamp(),
                timestamp: locationData.timestamp,
              },
              { merge: true }
            );
            
            // Store in new Firebase structure
            if (user.id) {
              await storeLiveTrackingData(user.id, locationData);
            }
            
            // Keep legacy collection for backward compatibility
            await addDoc(collection(db, 'locations'), {
              user_id: user.id,
              latitude: locationData.latitude,
              longitude: locationData.longitude,
              timestamp: locationData.timestamp,
              accuracy: locationData.accuracy ?? null,
              created_at: serverTimestamp(),
              is_live_tracking: true,
            });
          } catch (err) {
            console.error('Failed to update Firestore live location:', err);
          }

        } catch (error) {
          console.error('Error getting live location:', error);
        }
      }, 60000); // Update every 60 seconds (1 minute)

      setLiveTrackingInterval(interval);
      setIsTracking(true);
      setIsLiveTracking(true);
      await AsyncStorage.setItem(`tracking_${user.id}`, 'true');
      await AsyncStorage.setItem(`liveTracking_${user.id}`, 'true');

    } catch (error) {
      console.error('Error starting unified tracking:', error);
      throw error;
    }
  };

  const stopUnifiedTracking = async (): Promise<void> => {
    if (!user) return;

    try {
      // Stop background location tracking
      const hasStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
      if (hasStarted) {
        await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
      }

      // Mark live tracking inactive in Firestore
      await setDoc(
        fsDoc(db, 'live_tracking', user.id!),
        { is_active: false, stopped_at: serverTimestamp() },
        { merge: true }
      );

      // Clear interval
      if (liveTrackingInterval) {
        clearInterval(liveTrackingInterval);
        setLiveTrackingInterval(null);
      }

      setIsTracking(false);
      setIsLiveTracking(false);
      await AsyncStorage.setItem(`tracking_${user.id}`, 'false');
      await AsyncStorage.setItem(`liveTracking_${user.id}`, 'false');

    } catch (error) {
      console.error('Error stopping unified tracking:', error);
      throw error;
    }
  };

  // Legacy functions for backward compatibility
  const startLiveTracking = async (): Promise<void> => {
    return startUnifiedTracking();
  };

  const stopLiveTracking = async (): Promise<void> => {
    return stopUnifiedTracking();
  };

  const getLiveTrackingUsers = useCallback(async (): Promise<void> => {
    if (!user || user.role !== 'admin') return;

    try {
      // Try to get all live tracking documents without complex queries first
      const snap = await getDocs(collection(db, 'live_tracking'));
      const allUsers = snap.docs.map(d => d.data() as any);
      
      // Filter for active users with recent updates
      const twoMinutesAgo = Date.now() - 2 * 60 * 1000;
      const activeUsers = allUsers.filter(u => {
        if (!u.is_active || !u.latitude || !u.longitude) return false;
        
        const lastUpdate = u.last_update instanceof Timestamp 
          ? u.last_update.toMillis() 
          : (u.last_update ? new Date(u.last_update).getTime() : 0);
        
        return lastUpdate > twoMinutesAgo;
      });

      const users = activeUsers.map(u => ({
        userId: u.user_id,
        name: u.name,
        location: {
          latitude: u.latitude,
          longitude: u.longitude,
          timestamp: u.timestamp,
          accuracy: u.accuracy ?? undefined,
        },
        lastUpdate: u.last_update instanceof Timestamp
          ? u.last_update.toMillis()
          : (u.last_update ? new Date(u.last_update).getTime() : Date.now()),
      }));
      
      setLiveUsers(users);
    } catch (error) {
      console.error('Error getting live tracking users:', error);
      // Set empty array on error to prevent UI issues
      setLiveUsers([]);
    }
  }, [user]);

  // Check live tracking status on app start
  useEffect(() => {
    const checkLiveTrackingStatus = async () => {
      if (!user) return;
      
      try {
        const liveTrackingStatus = await AsyncStorage.getItem(`liveTracking_${user.id}`);
        if (liveTrackingStatus === 'true') {
          // Restart unified tracking if it was active
          await startUnifiedTracking();
        }
      } catch (error) {
        console.error('Error checking live tracking status:', error);
      }
    };

    checkLiveTrackingStatus();

    // For admin, start polling for live users
    if (user?.role === 'admin') {
      getLiveTrackingUsers();
      const adminInterval = setInterval(getLiveTrackingUsers, 15000); // Poll every 15 seconds
      return () => clearInterval(adminInterval);
    }
  }, [user, getLiveTrackingUsers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (liveTrackingInterval) {
        clearInterval(liveTrackingInterval);
      }
    };
  }, [liveTrackingInterval]);

  // Refresh total distance periodically
  useEffect(() => {
    if (!user) return;
    
    const distanceRefreshInterval = setInterval(() => {
      refreshTotalDistanceFromFirebase();
    }, 60000); // Refresh every minute
    
    return () => clearInterval(distanceRefreshInterval);
  }, [user]);

  return (
    <LocationContext.Provider
      value={{
        currentLocation,
        isTracking,
        totalDistance,
        startTracking,
        stopTracking,
        getLocationHistory,
        // Unified tracking (replaces both regular and live tracking)
        startUnifiedTracking,
        stopUnifiedTracking,
        // Legacy live tracking (for backward compatibility)
        startLiveTracking,
        stopLiveTracking,
        isLiveTracking,
        liveUsers,
        getLiveTrackingUsers,
        refreshTotalDistance,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
};
export default LocationProvider;
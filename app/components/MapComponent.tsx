import React, { useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Platform, Text } from 'react-native';

// Define the Google Maps API key directly here
const GOOGLE_MAPS_API_KEY = "AIzaSyBbYp58aw_mEJuQzEvG-YMAUBvzf8l7kY0";

interface MapComponentProps {
  style?: any;
  provider?: any;
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  children?: React.ReactNode;
}

interface MarkerProps {
  coordinate: {
    latitude: number;
    longitude: number;
  };
  title?: string;
  description?: string;
  pinColor?: string;
  onPress?: () => void;
}

// Declare global window.google interface for TypeScript
declare global {
  interface Window {
    google: any;
    initMap?: () => void;
  }
}

// Web Google Maps implementation
const WebMapView: React.FC<MapComponentProps> = ({ style, initialRegion, children }) => {
  const [markers, setMarkers] = useState<any[]>([]);
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const markersRef = useRef<any[]>([]);

  // Extract markers from children
  useEffect(() => {
    if (children) {
      const markerData = React.Children.map(children, (child: any) => {
        if (child?.type?.displayName === 'Marker' || child?.type?.name === 'Marker') {
          return {
            coordinate: child.props.coordinate,
            title: child.props.title,
            description: child.props.description,
            pinColor: child.props.pinColor,
            onPress: child.props.onPress,
          };
        }
        return null;
      }).filter(Boolean) || [];
      setMarkers(markerData);
    }
  }, [children]);

  // Initialize Google Maps
  useEffect(() => {
    if (!GOOGLE_MAPS_API_KEY) {
      setError('Google Maps API key is missing');
      setIsLoading(false);
      return;
    }

    loadGoogleMapsScript();
  }, []);

  const loadGoogleMapsScript = () => {
    // Check if Google Maps is already loaded
    if (typeof window !== 'undefined' && window.google && window.google.maps) {
      initializeMap();
      return;
    }

    // Check if script is already being loaded
    if (typeof document !== 'undefined') {
      const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
      if (existingScript) {
        existingScript.addEventListener('load', initializeMap);
        existingScript.addEventListener('error', () => {
          setError('Failed to load Google Maps');
          setIsLoading(false);
        });
        return;
      }

      // Load Google Maps script
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${GOOGLE_MAPS_API_KEY}&libraries=geometry`;
      script.async = true;
      script.defer = true;
      
      script.onload = initializeMap;
      script.onerror = () => {
        setError('Failed to load Google Maps');
        setIsLoading(false);
      };

      document.head.appendChild(script);
    }
  };

  const initializeMap = () => {
    if (typeof window !== 'undefined' && mapRef.current && window.google && window.google.maps) {
      try {
        const center = initialRegion || {
          latitude: 12.9716,
          longitude: 77.5946,
          latitudeDelta: 0.1,
          longitudeDelta: 0.1,
        };

        const mapInstance = new window.google.maps.Map(mapRef.current, {
          zoom: 13,
          center: { lat: center.latitude, lng: center.longitude },
          mapTypeControl: false,
          streetViewControl: false,
          fullscreenControl: false,
          zoomControl: true,
          gestureHandling: 'greedy',
          styles: [] // You can add custom map styles here if needed
        });

        setMap(mapInstance);
        setIsLoading(false);
        setError(null);
      } catch (err) {
        console.error('Map initialization error:', err);
        setError('Failed to initialize map');
        setIsLoading(false);
      }
    }
  };

  // Clear existing markers
  const clearMarkers = () => {
    markersRef.current.forEach(marker => {
      if (marker.setMap) {
        marker.setMap(null);
      }
    });
    markersRef.current = [];
  };

  // Add markers when map is ready
  useEffect(() => {
    if (map && typeof window !== 'undefined' && window.google && window.google.maps && markers.length > 0) {
      // Clear existing markers first
      clearMarkers();

      markers.forEach((marker, index) => {
        try {
          const mapMarker = new window.google.maps.Marker({
            position: {
              lat: marker.coordinate.latitude,
              lng: marker.coordinate.longitude
            },
            map: map,
            title: marker.title || '',
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: marker.pinColor || '#FF6B6B',
              fillOpacity: 1,
              strokeColor: '#fff',
              strokeWeight: 2,
              scale: 8
            }
          });

          // Store marker reference
          markersRef.current.push(mapMarker);

          // Add click listener
          if (marker.onPress) {
            mapMarker.addListener('click', marker.onPress);
          }

          // Add info window if there's a description
          if (marker.description) {
            const infoWindow = new window.google.maps.InfoWindow({
              content: `<div><strong>${marker.title || 'Location'}</strong><br/>${marker.description}</div>`
            });

            mapMarker.addListener('click', () => {
              infoWindow.open(map, mapMarker);
              if (marker.onPress) {
                marker.onPress();
              }
            });
          }
        } catch (err) {
          console.error('Error creating marker:', err);
        }
      });
    }
  }, [map, markers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      clearMarkers();
    };
  }, []);

  if (isLoading) {
    return (
      <View style={[style, styles.mapContainer, styles.centerContent]}>
        <Text style={styles.loadingText}>Loading Google Maps...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={[style, styles.mapContainer, styles.centerContent]}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Text style={styles.errorSubtext}>Please check your Google Maps API key and internet connection.</Text>
      </View>
    );
  }

  return (
    <View style={[style, styles.mapContainer]}>
      <div
        ref={mapRef}
        style={{
          width: '100%',
          height: '100%',
          minHeight: '400px',
          borderRadius: '8px'
        }}
      />
    </View>
  );
};

// Native MapView implementation
const NativeMapView: React.FC<MapComponentProps> = ({ style, initialRegion, children, provider }) => {
  try {
    const MapViewNative = require('react-native-maps').default;
    const { PROVIDER_GOOGLE } = require('react-native-maps');
    
    const defaultRegion = {
      latitude: 12.9716,
      longitude: 77.5946,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };

    return (
      <View style={[style, styles.mapContainer]}>
        <MapViewNative
          style={styles.map}
          provider={provider || PROVIDER_GOOGLE}
          initialRegion={initialRegion || defaultRegion}
          showsUserLocation={true}
          showsMyLocationButton={true}
          showsCompass={true}
          showsScale={true}
        >
          {children}
        </MapViewNative>
      </View>
    );
  } catch (error) {
    return (
      <View style={[style, styles.mapContainer, styles.centerContent]}>
        <Text style={styles.errorText}>React Native Maps not available</Text>
        <Text style={styles.errorSubtext}>Please install react-native-maps for native platforms</Text>
      </View>
    );
  }
};

// Main MapView component with platform detection
export const MapView: React.FC<MapComponentProps> = (props) => {
  if (Platform.OS === 'web') {
    return <WebMapView {...props} />;
  } else {
    return <NativeMapView {...props} />;
  }
};

// Marker component
export const Marker: React.FC<MarkerProps> = ({ coordinate, title, description, pinColor, onPress }) => {
  if (Platform.OS === 'web') {
    // For web, this component just passes data to the MapView
    return null;
  } else {
    // For native platforms, use react-native-maps Marker
    try {
      const { Marker: NativeMarker } = require('react-native-maps');
      return (
        <NativeMarker
          coordinate={coordinate}
          title={title}
          description={description}
          pinColor={pinColor}
          onPress={onPress}
        />
      );
    } catch (error) {
      return null;
    }
  }
};

// Add display name for better debugging
Marker.displayName = 'Marker';

export const PROVIDER_GOOGLE = 'google';

const styles = StyleSheet.create({
  mapContainer: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 20,
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#d32f2f',
    textAlign: 'center',
    fontWeight: '600',
  },
  errorSubtext: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
});
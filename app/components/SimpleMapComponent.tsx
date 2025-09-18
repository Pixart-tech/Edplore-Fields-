import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import RNMapView, { Marker as RNMarker, PROVIDER_GOOGLE } from 'react-native-maps';

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

// Simple MapView using react-native-maps
export const MapView: React.FC<MapComponentProps> = ({ style, initialRegion, children }) => {

  const defaultRegion = {
    latitude: 12.9716,
    longitude: 77.5946,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  return (
    <RNMapView
      style={[styles.map, style]}
      provider={PROVIDER_GOOGLE}
      initialRegion={initialRegion || defaultRegion}
      showsUserLocation={true}
      showsMyLocationButton={true}
    >
      {children}
    </RNMapView>
  );
};

export const Marker: React.FC<MarkerProps> = ({ coordinate, title, description, pinColor, onPress }) => {  
  return (
    <RNMarker
      coordinate={coordinate}
      title={title}
      description={description}
      pinColor={pinColor || 'red'}
      onPress={onPress}
    />
  );
};

export { PROVIDER_GOOGLE };

const styles = StyleSheet.create({
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
});

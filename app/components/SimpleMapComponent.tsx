import React from 'react';
import { StyleSheet } from 'react-native';
import RNMapView, {
  Marker as RNMarker,
  PROVIDER_GOOGLE,
  type MapViewProps as RNMapViewProps,
  type MarkerProps as RNMarkerProps,
} from 'react-native-maps';

type MapComponentProps = RNMapViewProps;
type SimpleMarkerProps = RNMarkerProps;

// Simple MapView using react-native-maps
export const MapView: React.FC<MapComponentProps> = ({
  style,
  provider = PROVIDER_GOOGLE,
  initialRegion,
  showsUserLocation = true,
  showsMyLocationButton = true,
  children,
  ...rest
}) => {
  const defaultRegion = {
    latitude: 12.9716,
    longitude: 77.5946,
    latitudeDelta: 0.1,
    longitudeDelta: 0.1,
  };

  return (
    <RNMapView
      style={[styles.map, style]}
      provider={provider}
      initialRegion={initialRegion || defaultRegion}
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={showsMyLocationButton}
      {...rest}
    >
      {children}
    </RNMapView>
  );
};

export const Marker: React.FC<SimpleMarkerProps> = ({ children, ...markerProps }) => {
  return (
    <RNMarker {...markerProps}>
      {children}
    </RNMarker>
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

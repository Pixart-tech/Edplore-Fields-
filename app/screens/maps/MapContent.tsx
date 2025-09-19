import React from 'react';
import { Text, View } from 'react-native';
import { Marker, Region } from 'react-native-maps';

import ClusteredMarkers from '../../components/ClusteredMarkers';
import { MapView, PROVIDER_GOOGLE } from '../../components/SimpleMapComponent';
import type { Organization } from '../../types/organization';
import styles from './styles';
import type { LiveTrackingUser, ThemeColors } from './types';

interface MapContentProps {
  organizations: Organization[];
  computedMapRegion: Region;
  visibleRegion: Region;
  onRegionChange: (region: Region) => void;
  onOrganizationPress: (organization: Organization) => void;
  colors: ThemeColors;
  liveUsers: LiveTrackingUser[];
  liveUserColors: Record<string, string>;
  showLiveTracking: boolean;
}

const MapContent: React.FC<MapContentProps> = ({
  organizations,
  computedMapRegion,
  visibleRegion,
  onRegionChange,
  onOrganizationPress,
  colors,
  liveUsers,
  liveUserColors,
  showLiveTracking,
}) => (
  <View style={styles.mapContainer}>
    {organizations.length === 0 ? (
      <View style={styles.mapFallback}>
        <Text style={[styles.mapFallbackText, { color: colors.text }]}>No organizations found for your assigned areas.</Text>
        <Text style={[styles.mapFallbackSubtext, { color: colors.secondary }]}>
          Contact admin if you think this is an error.
        </Text>
      </View>
    ) : (
      <MapView
        key={`map-${organizations.length}`}
        style={styles.map}
        provider={PROVIDER_GOOGLE}
        initialRegion={computedMapRegion}
        region={visibleRegion}
        onRegionChangeComplete={onRegionChange}
      >
        <ClusteredMarkers
          organizations={organizations}
          region={visibleRegion}
          onMarkerPress={onOrganizationPress}
        />

        {showLiveTracking &&
          liveUsers.map((liveUser, index) => {
            const colorKey = liveUser.userId || liveUser.name || `user-${index}`;
            const markerColor = liveUserColors[colorKey] || colors.primary;
            const lastUpdatedSeconds = Math.round((Date.now() - liveUser.lastUpdate) / 1000);
            const minutes = Math.floor(lastUpdatedSeconds / 60);
            const seconds = lastUpdatedSeconds % 60;
            const timeLabel = minutes > 0 ? `${minutes}m ${seconds}s ago` : `${seconds}s ago`;
            const markerKey = liveUser.userId || `${colorKey}-${index}`;

            return (
              <Marker
                key={`live-${markerKey}`}
                coordinate={{
                  latitude: liveUser.location.latitude,
                  longitude: liveUser.location.longitude,
                }}
                title={liveUser.name || 'Live User'}
                description={`Last updated ${timeLabel}`}
                pinColor={markerColor}
              />
            );
          })}
      </MapView>
    )}
  </View>
);

export default MapContent;

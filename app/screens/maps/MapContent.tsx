import React, { useCallback, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Marker, Region } from 'react-native-maps';

import ClusteredMarkers from '../../components/ClusteredMarkers';
import { MapView, PROVIDER_GOOGLE } from '../../components/SimpleMapComponent';
import type { Organization } from '../../types/organization';
import styles from './styles';
import type { LiveTrackingUser, ThemeColors } from './types';
import { getMarkerColor, getMarkerLabel } from '../../components/category';

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
  clusterEnabled: boolean;
}

type StandaloneMarkerProps = {
  organization: Organization;
  onPress: (organization: Organization) => void;
};

const StandaloneMarker = React.memo(({ organization, onPress }: StandaloneMarkerProps) => {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  const markerColor = getMarkerColor(organization.status, organization.category);
  const { label, shapeStyle } = getMarkerLabel(organization.category);

  const handleLayout = useCallback(() => {
    if (tracksViewChanges) {
      setTracksViewChanges(false);
    }
  }, [tracksViewChanges]);

  const handlePress = useCallback(() => {
    onPress(organization);
  }, [onPress, organization]);

  return (
    <Marker
      coordinate={{
        latitude: organization.latitude,
        longitude: organization.longitude,
      }}
      onPress={handlePress}
      title={organization.name}
      description={organization.category}
      tracksViewChanges={tracksViewChanges}
    >
      <View
        style={[
          markerStyles.markerContainer,
          { backgroundColor: markerColor },
          shapeStyle,
        ]}
        onLayout={handleLayout}
      >
        <Text style={markerStyles.markerLabel}>{label}</Text>
      </View>
    </Marker>
  );
});

StandaloneMarker.displayName = 'StandaloneMarker';

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
  clusterEnabled,
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
        {clusterEnabled ? (
          <ClusteredMarkers
            organizations={organizations}
            region={visibleRegion}
            onMarkerPress={onOrganizationPress}
          />
        ) : (
          organizations.map((organization) => {
            const organizationKey =
              organization.mapsUrl ??
              `${organization.name}-${organization.latitude}-${organization.longitude}`;

            return (
              <StandaloneMarker
                key={`org-${organizationKey}`}
                organization={organization}
                onPress={onOrganizationPress}
              />
            );
          })
        )}

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

const markerStyles = StyleSheet.create({
  markerContainer: {
    minWidth: 30,
    minHeight: 30,
    paddingHorizontal: 6,
    paddingVertical: 4,
    borderWidth: 2,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  markerLabel: {
    color: '#fff',
    fontWeight: '700',
  },
});

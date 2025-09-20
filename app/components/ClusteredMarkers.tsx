import React, { useMemo, useCallback, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Marker, Region } from 'react-native-maps';
import Supercluster from 'supercluster';

import { getMarkerColor, getMarkerLabel } from './category';
import type { Organization } from '../types/organization';

type ClusterProperties = {
  cluster?: boolean;
  cluster_id?: number;
  point_count?: number;
  point_count_abbreviated?: number;
  organization?: Organization;
};

type ClusterFeature = {
  id?: number | string;
  geometry: {
    coordinates: [number, number];
  };
  properties: ClusterProperties;
};

interface ClusteredMarkersProps {
  organizations: Organization[];
  region: Region | null;
  onMarkerPress: (organization: Organization) => void;
}

interface OrganizationMarkerProps {
  org: Organization;
  onPress: (organization: Organization) => void;
}

const OrganizationMarker = React.memo(({ org, onPress }: OrganizationMarkerProps) => {
  const [tracksViewChanges, setTracksViewChanges] = useState(true);

  const markerColor = getMarkerColor(org.status, org.category);
  const { label, shapeStyle } = getMarkerLabel(org.category);

  const handleLayout = useCallback(() => {
    if (tracksViewChanges) {
      setTracksViewChanges(false);
    }
  }, [tracksViewChanges]);

  const handlePress = useCallback(() => {
    onPress(org);
  }, [onPress, org]);

  return (
    <Marker
      coordinate={{
        latitude: org.latitude,
        longitude: org.longitude,
      }}
      onPress={handlePress}
      title={org.name}
      description={org.category}
      tracksViewChanges={tracksViewChanges}
    >
      <View
        style={[styles.markerContainer, { backgroundColor: markerColor }, shapeStyle]}
        onLayout={handleLayout}
      >
        <Text style={styles.markerLabel}>{label}</Text>
      </View>
    </Marker>
  );
});

OrganizationMarker.displayName = 'OrganizationMarker';

const ClusteredMarkersComponent: React.FC<ClusteredMarkersProps> = ({ organizations, region, onMarkerPress }) => {
  const points = useMemo(() => {
    return organizations.map((org) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [org.longitude, org.latitude] as [number, number],
      },
      properties: {
        cluster: false,
        organization: org,
      },
    }));
  }, [organizations]);

  const clusterIndex = useMemo(() => {
    const index = new Supercluster<ClusterProperties, ClusterProperties>({
      radius: 60,
      maxZoom: 20,
      minPoints: 3,
    });

    index.load(points as any);
    return index;
  }, [points]);

  const clusters = useMemo(() => {
    if (!region) {
      return clusterIndex.getClusters([-180, -85, 180, 85], 0) as ClusterFeature[];
    }

    const latitudeDelta = Math.max(region.latitudeDelta, 0.01);
    const longitudeDelta = Math.max(region.longitudeDelta, 0.01);

    const halfLatDelta = latitudeDelta / 2;
    const halfLngDelta = longitudeDelta / 2;

    const bounds: [number, number, number, number] = [
      Math.max(-180, Math.min(180, region.longitude - halfLngDelta)),
      Math.max(-85, Math.min(85, region.latitude - halfLatDelta)),
      Math.max(-180, Math.min(180, region.longitude + halfLngDelta)),
      Math.max(-85, Math.min(85, region.latitude + halfLatDelta)),
    ];

    const zoom = Math.max(
      0,
      Math.min(20, Math.round(Math.log2(360 / longitudeDelta)))
    );

    return clusterIndex.getClusters(bounds, zoom) as ClusterFeature[];
  }, [clusterIndex, region]);

  const handleClusterPress = useCallback((clusterId: number | undefined) => {
    if (clusterId == null) {
      return;
    }

    const leaves = clusterIndex.getLeaves(clusterId, 1) as ClusterFeature[];
    const firstLeaf = leaves[0];

    if (firstLeaf?.properties?.organization) {
      onMarkerPress(firstLeaf.properties.organization);
    }
  }, [clusterIndex, onMarkerPress]);

  return (
    <>
      {clusters.map((feature) => {
        const { geometry, properties, id } = feature;
        const [longitude, latitude] = geometry.coordinates;

        if (properties.cluster) {
          const count = properties.point_count_abbreviated ?? properties.point_count ?? 0;

          return (
            <Marker
              key={`cluster-${properties.cluster_id}-${id ?? 'feature'}`}
              coordinate={{ latitude, longitude }}
              onPress={() => handleClusterPress(properties.cluster_id)}
              tracksViewChanges={false}
            >
              <View style={styles.clusterWrapper}>
                <View style={styles.clusterContainer}>
                  <Text style={styles.clusterText}>{count}</Text>
                </View>
              </View>
            </Marker>
          );
        }

        if (properties.organization) {
          const organizationKey =
            properties.organization.mapsUrl ??
            `${properties.organization.name}-${latitude}-${longitude}`;

          return (
            <OrganizationMarker
              key={`org-${organizationKey}`}
              org={properties.organization}
              onPress={onMarkerPress}
            />
          );
        }

        return null;
      })}
    </>
  );
};

const styles = StyleSheet.create({
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
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  clusterWrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 6,
  },
  clusterContainer: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#2F80ED',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clusterText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default React.memo(ClusteredMarkersComponent);

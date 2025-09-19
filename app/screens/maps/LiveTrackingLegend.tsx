import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import styles from './styles';
import type { LiveTrackingUser, ThemeColors } from './types';

interface LiveTrackingLegendProps {
  liveUsers: LiveTrackingUser[];
  colors: ThemeColors;
  colorMap: Record<string, string>;
}

const LiveTrackingLegend: React.FC<LiveTrackingLegendProps> = ({ liveUsers, colors, colorMap }) => {
  if (liveUsers.length === 0) {
    return null;
  }

  return (
    <View style={[styles.legendContainer, { backgroundColor: colors.surface }]}> 
      <Text style={[styles.legendText, { fontWeight: 'bold', marginBottom: 8, color: colors.text }]}>Live Tracking Users:</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.legendScroll}>
        {liveUsers.map((liveUser, index) => {
          const colorKey = liveUser.userId || liveUser.name || `user-${index}`;
          const indicatorColor = colorMap[colorKey] || colors.primary;
          const label = liveUser.name || liveUser.userId || `User ${index + 1}`;
          const itemKey = liveUser.userId || `${colorKey}-${index}`;

          return (
            <View key={itemKey} style={styles.legendItem}>
              <View style={[styles.legendColor, { backgroundColor: indicatorColor }]} />
              <Text style={[styles.legendText, { color: colors.text }]}>{label}</Text>
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default LiveTrackingLegend;

import React from 'react';
import { ScrollView, Text, View } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';

import styles from './styles';
import type { AssignedAreaData, ThemeColors } from './types';

interface AssignedAreasSectionProps extends AssignedAreaData {
  colors: ThemeColors;
}

const AssignedAreasSection: React.FC<AssignedAreasSectionProps> = ({ cities, areas, colors }) => {
  if (cities.length === 0 && areas.length === 0) {
    return (
      <View style={styles.noticeContainer}>
        <View style={styles.noticeContent}>
          <Icon name="info" size={20} color={colors.warning} />
          <Text style={[styles.noticeText, { color: colors.warning }]}>
            No cities or areas assigned. Contact admin for assignment.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.assignedSection, { backgroundColor: colors.surface }]}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.assignedScroll}>
        {cities.map((city, index) => (
          <View key={`city_${index}`} style={[styles.chip, styles.cityChip]}>
            <Icon name="location-city" size={14} color="#1976D2" />
            <Text style={[styles.chipText, styles.cityChipText]}>{city}</Text>
          </View>
        ))}
        {areas.map((area, index) => (
          <View key={`area_${index}`} style={[styles.chip, styles.areaChip]}>
            <Icon name="business" size={14} color="#2E7D32" />
            <Text style={[styles.chipText, styles.areaChipText]}>{area}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default AssignedAreasSection;

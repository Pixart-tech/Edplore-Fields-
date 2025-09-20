import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import { getMarkerColor } from '../../components/category';
import styles from './styles';
import type { ThemeColors } from './types';

interface CategoryLegendProps {
  categories: string[];
  colors: ThemeColors;
  variant?: 'default' | 'overlay';
}

const CategoryLegend: React.FC<CategoryLegendProps> = ({ categories, colors, variant = 'default' }) => {
  if (categories.length === 0) {
    return null;
  }

  const containerStyles = [
    styles.legendContainer,
    { backgroundColor: colors.surface },
  ];

  if (variant === 'overlay') {
    containerStyles.push(styles.legendOverlayContainer, { backgroundColor: 'transparent' });
  }

  return (
    <View style={containerStyles}>
      <Text
        style={[
          styles.legendText,
          styles.legendTitle,
          { color: colors.text },
          variant === 'overlay' && styles.legendOverlayTitle,
        ]}
      >
        Categories
      </Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.legendScroll}>
        {categories.map((category) => (
          <View key={category} style={styles.legendItem}>
            <View style={[styles.legendColor, { backgroundColor: getMarkerColor(undefined, category) }]} />
            <Text style={[styles.legendText, { color: colors.text }]}>{category}</Text>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

export default CategoryLegend;

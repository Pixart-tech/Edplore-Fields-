import React from 'react';
import { ScrollView, Text, View } from 'react-native';

import { getMarkerColor } from '../../components/category';
import styles from './styles';
import type { ThemeColors } from './types';

interface CategoryLegendProps {
  categories: string[];
  colors: ThemeColors;
}

const CategoryLegend: React.FC<CategoryLegendProps> = ({ categories, colors }) => {
  if (categories.length === 0) {
    return null;
  }

  return (
    <View style={[styles.legendContainer, { backgroundColor: colors.surface }]}>
      <Text style={[styles.legendText, { fontWeight: 'bold', marginBottom: 8, color: colors.text }]}>Categories:</Text>
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

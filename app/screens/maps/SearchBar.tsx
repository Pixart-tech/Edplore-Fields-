import React from 'react';
import { TextInput, TouchableOpacity, View } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';

import styles from './styles';
import type { ThemeColors } from './types';

interface SearchBarProps {
  value: string;
  onChange: (text: string) => void;
  onClear: () => void;
  colors: ThemeColors;
}

const SearchBar: React.FC<SearchBarProps> = ({ value, onChange, onClear, colors }) => (
  <View style={styles.searchContainer}>
    <View style={[styles.searchBar, { backgroundColor: colors.surface }]}>
      <Icon name="search" size={20} color={colors.secondary} />
      <TextInput
        style={[styles.searchInput, { color: colors.text }]}
        placeholder="Search organizations, cities, categories..."
        placeholderTextColor={colors.secondary}
        value={value}
        onChangeText={onChange}
      />
      {value.length > 0 && (
        <TouchableOpacity onPress={onClear}>
          <Icon name="clear" size={20} color={colors.secondary} />
        </TouchableOpacity>
      )}
    </View>
  </View>
);

export default SearchBar;

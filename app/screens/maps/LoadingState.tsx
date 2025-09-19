import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';

import styles from './styles';
import type { ThemeColors } from './types';

interface LoadingStateProps {
  colors: ThemeColors;
  message?: string;
}

const LoadingState: React.FC<LoadingStateProps> = ({ colors, message = 'Loading organization data...' }) => (
  <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
    <ActivityIndicator size="large" color={colors.primary} />
    <Text style={[styles.loadingText, { color: colors.text }]}>{message}</Text>
  </View>
);

export default LoadingState;

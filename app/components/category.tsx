import { useCallback } from 'react';
import { StyleSheet } from 'react-native';

export const getMarkerColor = (status: string | undefined, category: string | undefined): string => {
  const trimmedStatus = status?.trim().toLowerCase();
  const trimmedCategory = category?.trim().toLowerCase();
  switch (trimmedStatus) {
    case 'verified': return '#28A745';
    case 'interested': return '#05faa0';
    case 'not interested': return '#fab005';
    case 'demo rejected': return '#FFC107';
    case 'wo demo rejected': return '#DC3545';
    case 'demo scheduled': return '#17A2B8';
    case 'waiting for approval': return '#007BFF';
    case 'sla done': return '#6C757D';
    default:
      if (trimmedCategory === 'standalone school' || 
          trimmedCategory === 'multibranch school' || 
          trimmedCategory === 'small franchise school' || 
          trimmedCategory === 'large franchise school') {
        return '#964B00';  
      }
      else {
        return '#343A40';  
      }
  }
};

export const getMarkerLabel = (category: string | undefined) => {
  const categoryShapes: { [key: string]: { label: string; shapeStyle: any } } = {
    'standalone preschool': { label: 'S', shapeStyle: styles.squareShape },
    'standalone school': { label: 'S', shapeStyle: styles.circleShape },
    'multibranch preschool': { label: 'MS', shapeStyle: styles.squareShape },
    'multibranch school': { label: 'MS', shapeStyle: styles.circleShape },
    'small franchise preschool': { label: 'SF', shapeStyle: styles.squareShape },
    'small franchise school': { label: 'SF', shapeStyle: styles.circleShape },
    'large franchise preschool': { label: 'LF', shapeStyle: styles.squareShape },
    'large franchise school': { label: 'LF', shapeStyle: styles.circleShape },
    'delete': { label: 'D', shapeStyle: styles.Shape },
    'none': { label: 'N', shapeStyle: styles.Shape },
    'no details': { label: 'Z', shapeStyle: styles.Shape },
  };
  
  const validCategory = category?.trim().toLowerCase();  // Ensure lowercase category comparison
  if (!validCategory) {
    return { label: 'E', shapeStyle: styles.Shape };
  }

  return categoryShapes[validCategory] || { label: 'E', shapeStyle: styles.Shape };
};

const styles = StyleSheet.create({
  squareShape: {
    width: 30,
    height: 30,
    borderRadius: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleShape: {
    width: 30,
    height: 30,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  Shape: {
    width: 50,
    height: 30,
    borderRadius: 12.5
  },
});

import { StyleSheet } from 'react-native';

const statusColors: Record<string, string> = {
  verified: '#28A745',
  interested: '#05FAA0',
  'not interested': '#FAB005',
  'demo rejected': '#FFC107',
  'wo demo rejected': '#DC3545',
  'demo scheduled': '#17A2B8',
  'waiting for approval': '#007BFF',
  'sla done': '#6C757D',
};

const categoryColors: Record<string, string> = {
  'standalone preschool': '#FF7043',
  'standalone school': '#42A5F5',
  'multibranch preschool': '#AB47BC',
  'multibranch school': '#1E88E5',
  'small franchise preschool': '#26A69A',
  'small franchise school': '#00897B',
  'large franchise preschool': '#FFCA28',
  'large franchise school': '#F57C00',
  delete: '#B0BEC5',
  none: '#9E9E9E',
  'no details': '#BDBDBD',
};

export const getMarkerColor = (status: string | undefined, category: string | undefined): string => {
  const trimmedStatus = status?.trim().toLowerCase();
  if (trimmedStatus && statusColors[trimmedStatus]) {
    return statusColors[trimmedStatus];
  }

  const trimmedCategory = category?.trim().toLowerCase();
  if (trimmedCategory && categoryColors[trimmedCategory]) {
    return categoryColors[trimmedCategory];
  }

  return '#343A40';
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
    delete: { label: 'D', shapeStyle: styles.Shape },
    none: { label: 'N', shapeStyle: styles.Shape },
    'no details': { label: 'Z', shapeStyle: styles.Shape },
  };

  const validCategory = category?.trim().toLowerCase();
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
    borderRadius: 12.5,
  },
});

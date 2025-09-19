import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions, Text } from 'react-native';
import FontAwesome from 'react-native-vector-icons/FontAwesome';
import { Picker } from '@react-native-picker/picker';
import { moderateScale } from 'react-native-size-matters';

interface org {
  id: string;
  name: string;
  category: string;
  status?: string;
  city: string;
  state: string;
}

type FilterProps = {
  allMarkers: org[];
  setFilteredMarkers: (markers: org[]) => void;
};

const Filter: React.FC<FilterProps> = ({ allMarkers, setFilteredMarkers }) => {
  const [filtersVisible, setFiltersVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  const windowWidth = Dimensions.get('window').width;
  const windowHeight = Dimensions.get('window').height;

  const categories = useMemo(() => {
    const unique = Array.from(
      new Set(
        allMarkers
          .map((marker) => marker.category?.trim())
          .filter((value): value is string => Boolean(value && value.length))
      )
    );
    return unique.sort((a, b) => a.localeCompare(b));
  }, [allMarkers]);

  const statuses = useMemo(() => {
    const unique = Array.from(
      new Set(
        allMarkers
          .map((marker) => marker.status?.trim())
          .filter((value): value is string => Boolean(value && value.length))
      )
    );
    return unique.sort((a, b) => a.localeCompare(b));
  }, [allMarkers]);

  const filterMarkers = useCallback(() => {
    let updatedMarkers = [...allMarkers];

    if (selectedCategory !== 'all') {
      updatedMarkers = updatedMarkers.filter((marker) =>
        marker.category?.trim().toLowerCase() === selectedCategory.trim().toLowerCase()
      );
    }

    if (selectedStatus !== 'all') {
      updatedMarkers = updatedMarkers.filter((marker) =>
        marker.status?.trim().toLowerCase() === selectedStatus.trim().toLowerCase()
      );
    }

    setFilteredMarkers(updatedMarkers);
  }, [allMarkers, selectedCategory, selectedStatus, setFilteredMarkers]);

  useEffect(() => {
    filterMarkers();
  }, [filterMarkers]);

  const handleApply = useCallback(() => {
    filterMarkers();
    setFiltersVisible(false);
  }, [filterMarkers]);

  const handleReset = useCallback(() => {
    setSelectedCategory('all');
    setSelectedStatus('all');
    setFilteredMarkers(allMarkers);
    setFiltersVisible(false);
  }, [allMarkers, setFilteredMarkers]);

  const activeFiltersCount = useMemo(() => {
    let count = 0;
    if (selectedCategory !== 'all') count += 1;
    if (selectedStatus !== 'all') count += 1;
    return count;
  }, [selectedCategory, selectedStatus]);

  const filtersActive = activeFiltersCount > 0;

  return (
    <View>
      <TouchableOpacity
        style={styles.filterButton}
        onPress={() => setFiltersVisible((visible) => !visible)}
        activeOpacity={0.8}
      >
        <View style={styles.filterButtonContent}>
          <FontAwesome name="filter" style={styles.filterIcon} />
          <Text style={styles.filterButtonText}>Filter</Text>
        </View>
      </TouchableOpacity>

      {filtersVisible && (
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Category</Text>
          <Picker
            selectedValue={selectedCategory}
            onValueChange={(value: string) => setSelectedCategory(value)}
            style={{
              height: windowHeight / 14,
              width: Math.min(windowWidth * 0.7, moderateScale(280)),
            }}
            mode="dropdown"
          >
            <Picker.Item label="All Categories" value="all" />
            {categories.map((category) => (
              <Picker.Item key={category} label={category} value={category} />
            ))}
          </Picker>

          <Text style={[styles.filterLabel, styles.filterLabelSpacing]}>Status</Text>
          <Picker
            selectedValue={selectedStatus}
            onValueChange={(value: string) => setSelectedStatus(value)}
            style={{
              height: windowHeight / 14,
              width: Math.min(windowWidth * 0.7, moderateScale(280)),
            }}
            mode="dropdown"
          >
            <Picker.Item label="All Status" value="all" />
            {statuses.map((status) => (
              <Picker.Item key={status} label={status} value={status} />
            ))}
          </Picker>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply} activeOpacity={0.85}>
              <FontAwesome name="check-circle" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Apply</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset} activeOpacity={0.85}>
              <FontAwesome name="refresh" style={styles.buttonIcon} />
              <Text style={styles.buttonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {filtersActive && (
        <TouchableOpacity style={styles.statusIndicator} onPress={handleReset} activeOpacity={0.85}>
          <FontAwesome name="times-circle" style={styles.statusIcon} />
          <Text style={styles.statusText}>
            {activeFiltersCount} filter{activeFiltersCount > 1 ? 's' : ''} active • Tap to clear
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  filterButton: {
    position: 'absolute',
    top: moderateScale(20),
    left: moderateScale(20),
    zIndex: 1000,
    backgroundColor: '#007BFF',
    paddingHorizontal: moderateScale(16),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(24),
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  filterButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  filterIcon: {
    color: '#fff',
    fontSize: moderateScale(16),
    marginRight: moderateScale(8),
  },
  filterButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  filterContainer: {
    position: 'absolute',
    top: moderateScale(70),
    left: moderateScale(20),
    backgroundColor: '#fff',
    padding: moderateScale(16),
    borderRadius: moderateScale(16),
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    minWidth: moderateScale(260),
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: moderateScale(6),
  },
  filterLabelSpacing: {
    marginTop: moderateScale(12),
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: moderateScale(16),
    gap: moderateScale(10),
  },
  applyButton: {
    flex: 1,
    backgroundColor: '#007BFF',
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#6C757D',
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(20),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonIcon: {
    color: '#fff',
    fontSize: moderateScale(16),
    marginRight: moderateScale(6),
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  statusIndicator: {
    position: 'absolute',
    top: moderateScale(20),
    right: moderateScale(20),
    backgroundColor: '#DC3545',
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(20),
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 999,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  statusIcon: {
    color: '#fff',
    fontSize: moderateScale(16),
    marginRight: moderateScale(6),
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default Filter;

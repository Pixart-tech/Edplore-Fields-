import { useCallback, useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Dimensions, Text } from "react-native";
import FontAwesome from "react-native-vector-icons/FontAwesome";
import { Picker } from "@react-native-picker/picker";
import { moderateScale } from 'react-native-size-matters';

// Define MarkerData interface to match Organization structure
interface MarkerData {
  id: string;
  name: string;
  category: string;
  status?: string;
  city: string;
  state: string;
}

type FilterOptionProps = {
  allMarkers: MarkerData[];
  setFilteredMarkers: (markers: MarkerData[]) => void;
};

const Filter: React.FC<FilterOptionProps> = ({ allMarkers, setFilteredMarkers }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [filtersVisible, setFiltersVisible] = useState(false);

type FilterOptionProps = {
  allMarkers: Orginatio[];
  setFilteredMarkers: (markers: Orgination[]) => void;
};

const Filter: React.FC<FilterOptionProps> = ({ allMarkers, participant, setFilteredMarkers }) => {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);
  const [filtersVisible, setFiltersVisible] = useState(false);
  

  const windowW = Dimensions.get("window").width;
  const windowH = Dimensions.get("window").height;

  function isFutureOrToday(NEWDATE: string) {
    const givenDate = new Date(NEWDATE);
    const today = new Date();

    today.setHours(0, 0, 0, 0);
    givenDate.setHours(0, 0, 0, 0);

    return givenDate >= today;
  }


  const moderateScale = (size: number, factor = 0.5): number => size + size * factor;

  const filterMarkers = useCallback(() => {
    let updatedMarkers = [...allMarkers];

    // Apply category filter
    if (selectedCategory && selectedCategory !== "All Categories") {
      updatedMarkers = updatedMarkers.filter((marker: MarkerData) => 
        marker.category?.toLowerCase() === selectedCategory.toLowerCase()
      );
    }

    // Apply status filter
    if (selectedStatus && selectedStatus !== "All Status") {
      updatedMarkers = updatedMarkers.filter((marker: MarkerData) => 
        marker.status?.toLowerCase() === selectedStatus.toLowerCase()
      );
    if (selectedCategory && selectedCategory !== "None") {
      updatedMarkers = updatedMarkers.filter((marker: MarkerData) => marker.category === selectedCategory);
    }

    if (selectedStatus && selectedStatus !== "None") {
      updatedMarkers = updatedMarkers.filter((marker: MarkerData) => marker.category === selectedStatus);
    }

    setFilteredMarkers(updatedMarkers);
  }, [allMarkers, selectedCategory, selectedStatus, setFilteredMarkers]);

  // Automatically filter markers when criteria change
  useEffect(() => {
    filterMarkers();
  }, [selectedCategory, selectedStatus, allMarkers]);

  const handleApply = () => {
    filterMarkers();
    setFiltersVisible(false);
  };

  const resetFilters = () => {
    setSelectedCategory(null);
    setSelectedStatus(null);
    setFilteredMarkers(allMarkers);
    setFiltersVisible(false);
  };

  return (
    <View>
      {/* Main Filter Button */}
      <TouchableOpacity style={styles.filterButton} onPress={() => setFiltersVisible(!filtersVisible)}>
        <View style={styles.filterButtonContent}>
          <FontAwesome name="filter" style={styles.filtericon} />
          <Text style={styles.filterButtonText}>Filter</Text>
        </View>
      </TouchableOpacity>

      {/* Category and Status Filter */}
      {filtersVisible && (
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Category</Text>
          <Picker
            selectedValue={selectedCategory}
            onValueChange={(value) => setSelectedCategory(value)}
            style={{ height: windowH / 12, width: windowW / 2.2 }}
            mode="dropdown"
          >
            <Picker.Item label="All Categories" value={null} />
  }, [filterMarkers]);

  const handleApply = useCallback(() => {
    filterMarkers();
    setFiltersVisible(false);
  }, [filterMarkers]);



  return (
    <View>
      <TouchableOpacity style={styles.filterButton} onPress={() => setFiltersVisible(!filtersVisible)}>
        <View style={styles.filterButtonContent}>
          <FontAwesome name="filter" style={styles.filtericon} />
          <CustomText style={styles.filterButtonText}>Filter</CustomText>
        </View>
      </TouchableOpacity>

      {filtersVisible && (
        <View style={styles.filterContainer}>
          <Picker
            selectedValue={selectedCategory}
            onValueChange={(value) => setSelectedCategory(value)}
            style={{ height: windowH / 10, width: windowW / 2, justifyContent: "space-evenly" }}
            mode="dropdown"
          >
            <Picker.Item label="Select Category" value={null} />
            <Picker.Item label="Standalone Preschool" value="Standalone Preschool" />
            <Picker.Item label="Standalone School" value="Standalone School" />
            <Picker.Item label="Multibranch Preschool" value="Multibranch Preschool" />
            <Picker.Item label="Multibranch School" value="Multibranch School" />
            <Picker.Item label="Small Franchise Preschool" value="Small Franchise Preschool" />
            <Picker.Item label="Small Franchise School" value="Small Franchise School" />
            <Picker.Item label="Large Franchise Preschool" value="Large Franchise Preschool" />
            <Picker.Item label="Large Franchise School" value="Large Franchise School" />
            <Picker.Item label="Delete" value="Delete" />
            <Picker.Item label="None" value="None" />
            <Picker.Item label="No details" value="No details" />
          </Picker>

          <Text style={styles.filterLabel}>Status</Text>
          <Picker
            selectedValue={selectedStatus}
            onValueChange={(value) => setSelectedStatus(value)}
            style={{ height: windowH / 12, width: windowW / 2.2 }}
            mode="dropdown"
          >
            <Picker.Item label="All Status" value={null} />
          <Picker
            selectedValue={selectedStatus}
            onValueChange={(value) => setSelectedStatus(value)}
            style={{ height: windowH / 20, width: windowW / 2, justifyContent: "space-evenly" }}
            mode="dropdown"
          >
            <Picker.Item label="Select Status" value={null} />
            <Picker.Item label="Verified" value="Verified" />
            <Picker.Item label="Interested" value="Interested" />
            <Picker.Item label="Not Interested" value="Not Interested" />
            <Picker.Item label="Demo Rejected" value="Demo Rejected" />
            <Picker.Item label="WO Demo Rejected" value="WO Demo Rejected" />
            <Picker.Item label="Demo Scheduled" value="Demo Scheduled" />
            <Picker.Item label="Waiting for approval" value="Waiting for approval" />
            <Picker.Item label="SLA Done" value="SLA Done" />
          </Picker>

          <View style={styles.buttonRow}>
            <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
              <FontAwesome name="check-circle" style={styles.filtericon} />
              <Text style={styles.applyButtonText}>Apply</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.resetButton} onPress={resetFilters}>
              <FontAwesome name="refresh" style={styles.filtericon} />
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Filter Status Indicator */}
      {(selectedCategory || selectedStatus) && (
        <TouchableOpacity style={styles.statusIndicator} onPress={resetFilters}>
          <FontAwesome name="times-circle" style={styles.statusIcon} />
          <Text style={styles.statusText}>
            {[selectedCategory, selectedStatus].filter(Boolean).length} filters active
          </Text>
        </TouchableOpacity>
      )}
            <Picker.Item label="None" value="None" />
          </Picker>

          <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
            <View style={styles.filterButtonContent}>
              <FontAwesome name="check-circle" style={styles.filtericon} />
              <CustomText style={styles.applyButtonText}>Apply</CustomText>
            </View>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  filterButton: {
    position: "absolute",
    top: moderateScale(20),
    left: moderateScale(20),
    zIndex: 1000,
    backgroundColor: "#007BFF",
    paddingHorizontal: moderateScale(15),
    paddingVertical: moderateScale(10),
    borderRadius: moderateScale(25),
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  filterButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 14,

    marginTop: moderateScale(100),
    left: moderateScale(10),
    zIndex: 10,
    backgroundColor: "#007BFF",
    padding: moderateScale(10),
    borderRadius: moderateScale(50),
  },
  MeetingfilterButton: {
    position: "absolute",
    marginTop: moderateScale(220),
    right: moderateScale(10),
    zIndex: 5,
    backgroundColor: "#007BFF",
    padding: moderateScale(10),
    borderRadius: moderateScale(50),
  },
  filterButtonText: {
    color: "#fff",
    textAlign: "center",
    fontWeight: "bold",
    fontSize: 13,
  },
  filtericon: {
    color: "#fff",
    fontSize: moderateScale(16),

    marginRight: moderateScale(8),
    marginRight: moderateScale(5),
  },
  filterButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterContainer: {
    position: "absolute",
    top: moderateScale(70),
    left: moderateScale(20),
    backgroundColor: "#fff",
    padding: moderateScale(20),
    borderRadius: moderateScale(15),
    zIndex: 1000,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
    minWidth: moderateScale(280),
    maxWidth: moderateScale(320),
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    marginTop: 10,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: moderateScale(15),
    gap: 10,
  },
  applyButton: {
    backgroundColor: "#007BFF",
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(15),
    borderRadius: moderateScale(20),
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  resetButton: {
    backgroundColor: "#6C757D",
    paddingVertical: moderateScale(10),
    paddingHorizontal: moderateScale(15),
    borderRadius: moderateScale(20),
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
  },
  applyButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 5,
  },
  resetButtonText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
    marginLeft: 5,
  },
  statusIndicator: {
    position: "absolute",
    top: moderateScale(20),
    right: moderateScale(20),
    backgroundColor: "#DC3545",
    paddingVertical: moderateScale(8),
    paddingHorizontal: moderateScale(12),
    borderRadius: moderateScale(20),
    flexDirection: "row",
    alignItems: "center",
    zIndex: 999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
    elevation: 5,
  },
  statusIcon: {
    color: "#fff",
    fontSize: moderateScale(14),
    marginRight: moderateScale(6),
  },
  statusText: {
    color: "#fff",
    fontSize: 12,
    fontWeight: "600",
  },
});

export default Filter;
=======
  MeetingfilterButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  filterContainer: {
    position: "absolute",
    marginTop: moderateScale(155),
    left: moderateScale(10),
    backgroundColor: "#fff",
    padding: moderateScale(10),
    borderRadius: moderateScale(20),
    zIndex: 10,
    fontSize: moderateScale(10),
  },
  MeetingfilterContainer: {
    position: "absolute",
    marginTop: moderateScale(260),
    right: moderateScale(10),
    backgroundColor: "#fff",
    padding: moderateScale(10),
    borderRadius: moderateScale(20),
    zIndex: 5,
    fontSize: moderateScale(10),
  },
  applyButton: {
    backgroundColor: "#007BFF",
    padding: moderateScale(10),
    borderRadius: moderateScale(50),
    marginTop: moderateScale(10),
  },
  applyButtonText: {
    color: "#fff",
  },
});

export default Filter;

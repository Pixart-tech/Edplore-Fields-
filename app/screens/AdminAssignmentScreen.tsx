import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { db } from '../../src/firebase';
import { collection, getDocs, doc, setDoc, orderBy } from 'firebase/firestore';
import { useTheme } from '../../src/context/ThemeContext';
import Icon from '@expo/vector-icons/MaterialIcons';
import {
  showErrorToast,
  showSuccessToast,
  showWarningToast,
} from '../../src/utils/toast';

interface User {
  id?: string;
  uid?: string;
  name: string;
  email: string;
  role?: string;
  assignedCities?: string[];
  assignedAreas?: string[];
}

interface City {
  id: string;
  name: string;
}

interface Area {
  id: string;
  name: string;
  city: string;
}

const AdminAssignmentScreen: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [users, setUsers] = useState<User[]>([]);
  const [cities, setCities] = useState<City[]>([]);
  const [areas, setAreas] = useState<Area[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAssignmentModal, setShowAssignmentModal] = useState(false);
  
  // Assignment modal state
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedCities, setSelectedCities] = useState<string[]>([]);
  const [selectedAreas, setSelectedAreas] = useState<string[]>([]);

  useEffect(() => {
    // Validate Firebase configuration
    if (!db) {
      console.error('Firestore database instance is not initialized');
      showErrorToast('Error', 'Database connection not available. Please restart the app.');
      return;
    }
    
    console.log('Firebase db instance:', db);
    console.log('AdminAssignmentScreen: User role check:', user?.role);
    console.log('AdminAssignmentScreen: User data:', user);
    
    if (user?.role === 'admin') {
      loadData();
    }
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load users from Firestore
      try {
        const usersSnap = await getDocs(collection(db, 'users'));
        const usersData = usersSnap.docs.map(d => {
          const data = d.data();
          return {
            ...data,
            id: d.id,
            // Ensure arrays are properly initialized
            assignedCities: Array.isArray(data.assignedCities) ? data.assignedCities : [],
            assignedAreas: Array.isArray(data.assignedAreas) ? data.assignedAreas : [],
          } as User;
        });
        setUsers(usersData);
        console.log(`AdminAssignmentScreen: Loaded ${usersData.length} users`);
        console.log('Users data:', usersData.map(u => ({ name: u.name, role: u.role, email: u.email })));
      } catch (usersError) {
        console.error('Error loading users in AdminAssignmentScreen:', usersError);
        showErrorToast('Error', 'Failed to load users');
        setUsers([]);
      }

      // Set default cities and areas
      const defaultCities = [
        { id: 'city_1', name: 'Bangalore' },
        { id: 'city_2', name: 'Chennai' },
        { id: 'city_3', name: 'Mysuru' },
        { id: 'city_4', name: 'Tumkur' },
        { id: 'city_5', name: 'Kanakapura' },
        { id: 'city_6', name: 'Doddaballapura' },
        { id: 'city_7', name: 'Hoskote' },
        { id: 'city_8', name: 'Kolar' },
        { id: 'city_9', name: 'Koppal' },
        { id: 'city_10', name: 'Bidadi' },
        { id: 'city_11', name: 'Ramanagar' },
        { id: 'city_12', name: 'Kalaburagi' },
        { id: 'city_13', name: 'Vijayapura' },
        { id: 'city_14', name: 'Mandya' },
        { id: 'city_15', name: 'Solapur' },
        { id: 'city_16', name: 'Sandur' },
        { id: 'city_17', name: 'Gadag' },
        { id: 'city_18', name: 'Hubballi' },
        { id: 'city_19', name: 'Udupi' },
        { id: 'city_20', name: 'COIMBATORE' }
      ];

      setCities(defaultCities);

      const defaultAreas = [
        { id: 'area_1', name: 'Area 1', city: 'All' },
        { id: 'area_2', name: 'Area 2', city: 'All' },
        { id: 'area_3', name: 'Area 3', city: 'All' },
        { id: 'area_4', name: 'Area 4', city: 'All' },
        { id: 'area_5', name: 'Area 5', city: 'All' },
        { id: 'area_6', name: 'Area 6', city: 'All' },
        { id: 'area_7', name: 'Area 7', city: 'All' },
        { id: 'area_8', name: 'Area 8', city: 'All' },
        { id: 'area_9', name: 'Area 9', city: 'All' },
        { id: 'area_10', name: 'Area 10', city: 'All' }
      ];
      setAreas(defaultAreas);
      
      console.log(`AdminAssignmentScreen: Loaded ${defaultCities.length} default cities and ${defaultAreas.length} default areas`);
      
      // Optionally also load from organizations data as backup
      try {
        const orgsResponse = await fetch('https://script.google.com/macros/s/AKfycbwVhNTYSzGBddUDDOMBw3vOTlNKdJA3859dwb5YO2eWgIzM6Ao3fNRw_wZDFep1_S19/exec?key1=superadmininput&key2=superadmininput');
        if (orgsResponse.ok) {
          const orgsData = await orgsResponse.json();
          const organizations = orgsData.organizations;
          
          // Extract unique cities from organizations (as additional options)
          const uniqueCities = [...new Set(organizations.map((org: any) => org.city))];
          const orgCities = uniqueCities
            .filter(city => city != null && city !== '')
            .map((city, index) => ({
              id: `org_city_${index}`,
              name: String(city)
            }));
          
          // Extract unique areas/categories from organizations (as additional options)
          const uniqueAreas = [...new Set(organizations.map((org: any) => org.category))];
          const orgAreas = uniqueAreas
            .filter(area => area != null && area !== '')
            .map((area, index) => ({
              id: `org_area_${index}`,
              name: String(area),
              city: 'All'
            }));
          
          // Combine default with organization data (avoiding duplicates)
          const allCities = [...defaultCities];
          orgCities.forEach(orgCity => {
            if (!defaultCities.some(city => city.name === orgCity.name)) {
              allCities.push(orgCity);
            }
          });
          
          const allAreas = [...defaultAreas];
          orgAreas.forEach(orgArea => {
            if (!defaultAreas.some(area => area.name === orgArea.name)) {
              allAreas.push(orgArea);
            }
          });
          
          setCities(allCities);
          setAreas(allAreas);
          
          console.log(`AdminAssignmentScreen: Combined with org data - ${allCities.length} total cities and ${allAreas.length} total areas`);
        }
      } catch (orgsError) {
        console.log('Could not load additional organization data, using defaults only:', orgsError);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      showErrorToast('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const openAssignmentModal = (userToAssign: User) => {
    console.log('Opening assignment modal for user:', userToAssign);
    console.log('User assignedCities:', userToAssign.assignedCities);
    console.log('User assignedAreas:', userToAssign.assignedAreas);
    
    setSelectedUser(userToAssign);
    
    // More robust array initialization with validation
    const cities = Array.isArray(userToAssign.assignedCities) 
      ? userToAssign.assignedCities.filter(city => city != null && city !== '') 
      : [];
      
    const areas = Array.isArray(userToAssign.assignedAreas) 
      ? userToAssign.assignedAreas.filter(area => area != null && area !== '') 
      : [];
    
    console.log('Setting selectedCities to:', cities);
    console.log('Setting selectedAreas to:', areas);
    
    // Set the state and show modal
    setSelectedCities([...cities]); // Create new array to trigger re-render
    setSelectedAreas([...areas]); // Create new array to trigger re-render
    
    // Small delay to ensure state is set before showing modal
    setTimeout(() => {
      setShowAssignmentModal(true);
    }, 100);
  };

  const toggleCitySelection = (cityName: string) => {
    if (!cityName || cityName.trim() === '') return;
    
    console.log('Toggling city:', cityName, 'Current cities:', selectedCities);
    
    setSelectedCities(prev => {
      const currentCities = Array.isArray(prev) ? [...prev] : [];
      const hasCity = currentCities.includes(cityName);
      
      const newCities = hasCity 
        ? currentCities.filter(c => c !== cityName)
        : [...currentCities, cityName];
      
      console.log('New cities after toggle:', newCities);
      return newCities;
    });
  };

  const toggleAreaSelection = (areaName: string) => {
    if (!areaName || areaName.trim() === '') return;
    
    console.log('Toggling area:', areaName, 'Current areas:', selectedAreas);
    
    setSelectedAreas(prev => {
      const currentAreas = Array.isArray(prev) ? [...prev] : [];
      const hasArea = currentAreas.includes(areaName);
      
      const newAreas = hasArea 
        ? currentAreas.filter(a => a !== areaName)
        : [...currentAreas, areaName];
      
      console.log('New areas after toggle:', newAreas);
      return newAreas;
    });
  };

  const saveAssignment = async () => {
    if (!selectedUser) {
      showWarningToast('No user selected', 'Please choose a user before assigning cities.');
      return;
    }

    console.log('Save assignment - selectedUser:', selectedUser);
    console.log('Save assignment - selectedCities:', selectedCities);
    console.log('Save assignment - selectedAreas:', selectedAreas);

    setLoading(true);
    try {
      // Ensure arrays are properly initialized and valid
      const citiesToSave = Array.isArray(selectedCities) 
        ? selectedCities.filter(city => city != null && city.trim() !== '') 
        : [];
      const areasToSave = Array.isArray(selectedAreas) 
        ? selectedAreas.filter(area => area != null && area.trim() !== '') 
        : [];
      
      console.log('Save assignment - citiesToSave:', citiesToSave);
      console.log('Save assignment - areasToSave:', areasToSave);
      
      // Validate user document ID
      const userDocId = selectedUser.uid || selectedUser.id;
      if (!userDocId || userDocId.trim() === '') {
        throw new Error('User document ID is missing or invalid');
      }
      
      console.log('User document ID:', userDocId);
      
      // Validate db instance
      if (!db) {
        throw new Error('Firestore database instance is not initialized');
      }
      
      // Create update data object with proper validation
      const updateData = {
        assignedCities: citiesToSave,
        assignedAreas: areasToSave,
        updated_at: new Date(),
      };
      
      console.log('Update data:', updateData);
      
      // Save to Firestore with additional error handling
      try {
        await setDoc(doc(db, 'users', userDocId), updateData, { merge: true });
        console.log('Firestore update successful');
      } catch (firestoreError: any) {
        console.error('Firestore error details:', firestoreError);
        throw new Error(`Firestore update failed: ${firestoreError.message}`);
      }
      
      // Send data to Google Apps Script
      try {
        const scriptUrl = 'https://script.google.com/macros/s/AKfycbwVhNTYSzGBddUDDOMBw3vOTlNKdJA3859dwb5YO2eWgIzM6Ao3fNRw_wZDFep1_S19/exec';
        
        // Safely join arrays
        const key1 = citiesToSave.join(',');
        const key2 = areasToSave.join(',');
        
        console.log('Sending to script - key1:', key1, 'key2:', key2);
        
        const response = await fetch(`${scriptUrl}?key1=${encodeURIComponent(key1)}&key2=${encodeURIComponent(key2)}`);
        
        if (response.ok) {
          console.log('Assignment data sent to Google Apps Script successfully');
          console.log('Sent data:', { 
            user: selectedUser.name, 
            cities: citiesToSave, 
            areas: areasToSave 
          });
        } else {
          console.warn('Failed to send data to Google Apps Script:', response.status);
        }
      } catch (scriptError) {
        console.error('Error sending data to Google Apps Script:', scriptError);
        // Don't fail the whole operation if script fails
      }
      
      showSuccessToast('Assignment saved', 'Cities and areas assigned successfully.');
      setShowAssignmentModal(false);
      
      // Update local state to reflect changes
      setUsers(prevUsers => 
        prevUsers.map(user => 
          (user.uid || user.id) === userDocId 
            ? { ...user, assignedCities: citiesToSave, assignedAreas: areasToSave }
            : user
        )
      );
      
    } catch (error: any) {
      console.error('Error saving assignment:', error);
      showErrorToast('Error', `Failed to save assignment: ${error.message || 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const renderUserCard = (userItem: User) => {
    const userKey = userItem.uid || userItem.id || userItem.email;
    const assignedCities = Array.isArray(userItem.assignedCities) ? userItem.assignedCities : [];
    const assignedAreas = Array.isArray(userItem.assignedAreas) ? userItem.assignedAreas : [];
    
    return (
      <View key={userKey} style={[styles.userCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.userHeader}>
          <Icon name="person" size={24} color={theme.colors.primary} />
          <View style={styles.userInfo}>
            <Text style={[styles.userName, { color: theme.colors.text }]}>{userItem.name || 'Unknown User'}</Text>
            <Text style={[styles.userEmail, { color: theme.colors.secondary }]}>{userItem.email || 'No email'}</Text>
          </View>
          <TouchableOpacity
            style={[styles.assignButton, { backgroundColor: theme.colors.primary }]}
            onPress={() => openAssignmentModal(userItem)}
          >
            <Text style={styles.assignButtonText}>Assign</Text>
          </TouchableOpacity>
        </View>
        
        {/* Show current assignments */}
        {assignedCities.length > 0 && (
          <View style={styles.assignmentSection}>
            <Text style={[styles.assignmentLabel, { color: theme.colors.text }]}>🏙️ Cities:</Text>
            <View style={styles.assignmentTags}>
              {assignedCities.map((city, index) => (
                <View key={`${userKey}-city-${index}`} style={[styles.assignmentTag, { backgroundColor: '#E3F2FD' }]}>
                  <Text style={[styles.assignmentTagText, { color: '#1976D2' }]}>{city}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
        
        {assignedAreas.length > 0 && (
          <View style={styles.assignmentSection}>
            <Text style={[styles.assignmentLabel, { color: theme.colors.text }]}>📍 Areas:</Text>
            <View style={styles.assignmentTags}>
              {assignedAreas.map((area, index) => (
                <View key={`${userKey}-area-${index}`} style={[styles.assignmentTag, { backgroundColor: '#E8F5E8' }]}>
                  <Text style={[styles.assignmentTagText, { color: '#2E7D32' }]}>{area}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </View>
    );
  };

  const renderSelectionModal = () => (
    <Modal
      visible={showAssignmentModal}
      animationType="slide"
      presentationStyle="pageSheet"
      onShow={() => {
        // Debug log when modal shows
        console.log('Modal shown - selectedCities:', selectedCities);
        console.log('Modal shown - selectedAreas:', selectedAreas);
      }}
    >
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: theme.colors.background }]}>
        <View style={styles.modalHeader}>
          <TouchableOpacity onPress={() => setShowAssignmentModal(false)}>
            <Icon name="close" size={24} color={theme.colors.text} />
          </TouchableOpacity>
          <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
            Assign to {selectedUser?.name || 'User'}
          </Text>
          <TouchableOpacity onPress={saveAssignment} disabled={loading}>
            <Text style={[styles.saveButton, { color: loading ? theme.colors.secondary : theme.colors.primary }]}>
              {loading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalContent}>
          {/* Cities Selection */}
          <View style={styles.selectionSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              🏙️ Select Cities ({selectedCities.length} selected)
            </Text>
            <View style={styles.selectionGrid}>
              {cities.map((city) => {
                const isSelected = selectedCities.includes(city.name);
                return (
                  <TouchableOpacity
                    key={city.id}
                    style={[
                      styles.selectionItem,
                      {
                        backgroundColor: isSelected
                          ? theme.colors.primary
                          : theme.colors.surface,
                        borderWidth: isSelected ? 0 : 1,
                        borderColor: isSelected ? 'transparent' : '#e0e0e0',
                      },
                    ]}
                    onPress={() => toggleCitySelection(city.name)}
                  >
                    <Text
                      style={[
                        styles.selectionItemText,
                        {
                          color: isSelected ? '#fff' : theme.colors.text,
                        },
                      ]}
                    >
                      {city.name}
                      {isSelected && ' ✓'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Areas Selection */}
          <View style={styles.selectionSection}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              📍 Select Areas ({selectedAreas.length} selected)
            </Text>
            <View style={styles.selectionGrid}>
              {areas.map((area) => {
                const isSelected = selectedAreas.includes(area.name);
                return (
                  <TouchableOpacity
                    key={area.id}
                    style={[
                      styles.selectionItem,
                      {
                        backgroundColor: isSelected ? '#4CAF50' : theme.colors.surface,
                        borderWidth: isSelected ? 0 : 1,
                        borderColor: isSelected ? 'transparent' : '#e0e0e0',
                      },
                    ]}
                    onPress={() => toggleAreaSelection(area.name)}
                  >
                    <Text
                      style={[
                        styles.selectionItemText,
                        {
                          color: isSelected ? '#fff' : theme.colors.text,
                        },
                      ]}
                    >
                      {area.name}
                      {isSelected && ' ✓'}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  if (user?.role !== 'admin') {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
        <View style={styles.noAccessContainer}>
          <Icon name="security" size={64} color={theme.colors.secondary} />
          <Text style={[styles.noAccessText, { color: theme.colors.text }]}>
            Admin Access Required
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Icon name="admin-panel-settings" size={32} color={theme.colors.primary} />
        <View style={styles.headerText}>
          <Text style={[styles.title, { color: theme.colors.text }]}>City & Area Assignment</Text>
          <Text style={[styles.subtitle, { color: theme.colors.secondary }]}>
            Assign cities and areas to users
          </Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={[styles.loadingText, { color: theme.colors.secondary }]}>Loading users...</Text>
        </View>
      ) : (
        <ScrollView style={styles.scrollView}>
          {users.map(renderUserCard)}
          {users.length === 0 && (
            <View style={styles.noDataContainer}>
              <Icon name="people-outline" size={48} color={theme.colors.secondary} />
              <Text style={[styles.noDataText, { color: theme.colors.text }]}>No users found</Text>
            </View>
          )}
        </ScrollView>
      )}

      {renderSelectionModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  headerText: {
    marginLeft: 12,
    flex: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  userCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
    } : {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    }),
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  userInfo: {
    flex: 1,
    marginLeft: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '600',
  },
  userEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  assignButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  assignButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  assignmentSection: {
    marginTop: 8,
  },
  assignmentLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
  },
  assignmentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  assignmentTag: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  assignmentTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
  },
  noAccessContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  noAccessText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  noDataContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 50,
  },
  noDataText: {
    fontSize: 16,
    marginTop: 12,
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  saveButton: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalContent: {
    flex: 1,
    padding: 16,
  },
  selectionSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  selectionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectionItem: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 4,
  },
  selectionItemText: {
    fontSize: 14,
    fontWeight: '500',
  },
});

export default AdminAssignmentScreen;
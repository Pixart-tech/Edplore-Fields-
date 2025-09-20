import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
  ToastAndroid,
  Linking,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '../../src/context/AuthContext';
import { db } from '../../src/firebase';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { useLocation } from '../../src/context/LocationContext';
import { useTheme } from '../../src/context/ThemeContext';
import Icon from '@expo/vector-icons/MaterialIcons';
import { showErrorToast, showSuccessToast } from '../../src/utils/toast';

interface StatCard {
  title: string;
  value: string;
  icon: string;
  color: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  is_active: boolean;
}

const HomeScreen: React.FC = () => {
  const { user } = useAuth();
  const { 
    isTracking, 
    totalDistance, 
    startUnifiedTracking, 
    stopUnifiedTracking,
    isLiveTracking,
    liveUsers,
    currentLocation,
    refreshTotalDistance
  } = useLocation();
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [meetings, setMeetings] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [user]);

  // Refresh total distance periodically
  useEffect(() => {
    if (user && user.role !== 'admin') {
      const interval = setInterval(() => {
        refreshTotalDistance();
      }, 30000); // Refresh every 30 seconds
      
      return () => clearInterval(interval);
    }
  }, [user, refreshTotalDistance]);

  const loadData = async () => {
    try {
      if (user?.role === 'admin') {
        try {
          const usersSnap = await getDocs(query(collection(db, 'users'), orderBy('created_at', 'desc')));
          const users = usersSnap.docs.map(d => d.data() as any);
          const activeUsers = users.filter((u: any) => u.is_active === true);
          setActiveUsers(activeUsers);
          console.log(`Loaded ${activeUsers.length} active users out of ${users.length} total users`);
        } catch (usersError) {
          console.error('Error loading users:', usersError);
          setActiveUsers([]);
        }
      } else {
        // For regular users, refresh their total distance
        await refreshTotalDistance();
      }

      try {
        const meetingsQuery = user?.role === 'admin'
          ? query(collection(db, 'meetings'), orderBy('created_at', 'desc'))
          : query(collection(db, 'meetings'), where('created_by', '==', user?.id || user?.email || ''));
        const meetingsSnap = await getDocs(meetingsQuery);
        setMeetings(meetingsSnap.docs.map(d => d.data()));
      } catch (meetingsError) {
        console.error('Error loading meetings:', meetingsError);
        setMeetings([]);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      if (user?.role === 'admin') {
        setActiveUsers([]);
      }
      setMeetings([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const openLocationSettings = () => {
    try {
      if (typeof Linking.openSettings === 'function') {
        Linking.openSettings().catch((err) => {
          console.error('Unable to open settings:', err);
        });
      } else {
        Linking.openURL('app-settings:').catch((err) => {
          console.error('Unable to open settings:', err);
        });
      }
    } catch (error) {
      console.error('Unable to open settings:', error);
    }
  };

  const handleStartUnifiedTracking = async () => {
    try {
      const mode = await startUnifiedTracking();
      if (mode === 'foreground') {
        const message =
          'Location tracking started in foreground-only mode. Keep the app open and enable "Allow all the time" in system settings to continue tracking in the background.';

        if (Platform.OS === 'android') {
          ToastAndroid.show(message, ToastAndroid.LONG);
        }

        Alert.alert(
          'Enable Background Location',
          message,
          [
            {
              text: 'Open Settings',
              onPress: () => openLocationSettings(),
            },
            { text: 'OK', style: 'cancel' },
          ]
        );
      } else {
        Alert.alert('Success', 'Location tracking started');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to start location tracking');
    }
  };

  const handleUnifiedTrackingToggle = async () => {
    try {
      if (isTracking) {
        await stopUnifiedTracking();
        showSuccessToast('Success', 'Location tracking stopped');
      } else {
        await startUnifiedTracking();
        showSuccessToast('Success', 'Location tracking started');
      }
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Failed to toggle location tracking';
      showErrorToast('Error', message);
    }
  };

  const getStatCards = (): StatCard[] => {
    if (user?.role === 'admin') {
      return [
        {
          title: 'Active Users',
          value: activeUsers.length.toString(),
          icon: 'people',
          color: theme.colors.primary,
        },
        {
          title: 'Pending Meetings',
          value: meetings.filter((m: any) => m.status === 'pending').length.toString(),
          icon: 'event-note',
          color: theme.colors.warning,
        },
        {
          title: 'Total Meetings',
          value: meetings.length.toString(),
          icon: 'event',
          color: theme.colors.success,
        },
      ];
    } else {
      return [
        {
          title: 'Distance Traveled Today',
          value: `${totalDistance.toFixed(2)} km`,
          icon: 'directions-walk',
          color: theme.colors.primary,
        },
        {
          title: 'Tracking Status',
          value: isTracking ? 'Active' : 'Inactive',
          icon: isTracking ? 'gps-fixed' : 'gps-off',
          color: isTracking ? theme.colors.success : theme.colors.error,
        },
        {
          title: 'My Meetings',
          value: meetings.length.toString(),
          icon: 'event',
          color: theme.colors.warning,
        },
        {
          title: 'Assigned Cities',
          value: user?.assignedCities?.length?.toString() || '0',
          icon: 'location-city',
          color: theme.colors.secondary,
        },
      ];
    }
  };

  const StatCardComponent: React.FC<{ card: StatCard }> = ({ card }) => (
    <View style={[styles.statCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.statCardHeader}>
        <Icon name={card.icon} size={24} color={card.color} />
        <Text style={[styles.statValue, { color: theme.colors.text }]}>{card.value}</Text>
      </View>
      <Text style={[styles.statTitle, { color: theme.colors.secondary }]}>{card.title}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.header}>
          <Text style={[styles.greeting, { color: theme.colors.text }]}>
            Welcome back, {user?.name}!
          </Text>
          <Text style={[styles.role, { color: theme.colors.secondary }]}>
            {user?.role === 'admin' ? 'Super Admin' : 'User'}
          </Text>
        </View>

        <View style={styles.statsGrid}>
          {getStatCards().map((card, index) => (
            <StatCardComponent key={index} card={card} />
          ))}
        </View>

        {user?.role !== 'admin' && (
          <View style={[styles.unifiedTrackingCard, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.trackingHeader}>
              <Icon
                name={isTracking ? 'gps-fixed' : 'gps-off'}
                size={32}
                color={isTracking ? '#4CAF50' : theme.colors.error}
              />
              <View style={styles.trackingInfo}>
                <Text style={[styles.trackingTitle, { color: theme.colors.text }]}>
                  Location Tracking
                </Text>
                <Text style={[styles.trackingStatus, { color: theme.colors.secondary }]}>
                  {isTracking ? 'Active - Admin can see your location' : 'Inactive - Private location'}
                </Text>
                {currentLocation && isTracking && (
                  <Text style={[styles.locationText, { color: theme.colors.primary }]}>
                    Current: Lat {currentLocation.latitude.toFixed(4)}, Lng {currentLocation.longitude.toFixed(4)}
                  </Text>
                )}
                <Text style={[styles.distanceText, { color: theme.colors.primary }]}>
                  Distance Today: {totalDistance.toFixed(2)} km
                </Text>
              </View>
            </View>
            <TouchableOpacity
              style={[
                styles.unifiedTrackingButton,
                {
                  backgroundColor: isTracking ? '#FF6B35' : '#4CAF50',
                },
              ]}
              onPress={handleUnifiedTrackingToggle}
            >
              <Text style={styles.trackingButtonText}>
                {isTracking ? 'Stop Tracking' : 'Start Tracking'}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {user?.role === 'admin' && activeUsers.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Recent Active Users
            </Text>
            {activeUsers.slice(0, 5).map((activeUser) => (
              <View key={activeUser.id} style={styles.userItem}>
                <Icon name="person" size={20} color={theme.colors.primary} />
                <View style={styles.userInfo}>
                  <Text style={[styles.userName, { color: theme.colors.text }]}>
                    {activeUser.name}
                  </Text>
                  <Text style={[styles.userEmail, { color: theme.colors.secondary }]}>
                    {activeUser.email}
                  </Text>
                </View>
                <Icon name="circle" size={8} color={theme.colors.success} />
              </View>
            ))}
          </View>
        )}

        {user?.role === 'admin' && (
          <View style={[styles.liveTrackingSection, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.liveSectionHeader}>
              <Icon name="my-location" size={24} color="#FF6B35" />
              <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
                Live Tracking Users ({liveUsers.length})
              </Text>
            </View>
            
            {liveUsers.length > 0 ? (
              liveUsers.map((liveUser) => (
                <View key={liveUser.userId} style={styles.liveUserItem}>
                  <View style={styles.liveUserHeader}>
                    <Icon name="person-pin" size={20} color="#FF6B35" />
                    <Text style={[styles.liveUserName, { color: theme.colors.text }]}>
                      {liveUser.name}
                    </Text>
                    <View style={styles.liveIndicator}>
                      <Icon name="circle" size={8} color="#FF6B35" />
                      <Text style={[styles.liveText, { color: '#FF6B35' }]}>LIVE</Text>
                    </View>
                  </View>
                  <View style={styles.locationInfo}>
                    <Text style={[styles.locationText, { color: theme.colors.secondary }]}>
                      Lat: {liveUser.location.latitude.toFixed(4)}, Lng: {liveUser.location.longitude.toFixed(4)}
                    </Text>
                    <Text style={[styles.lastUpdateText, { color: theme.colors.secondary }]}>
                      Updated: {Math.round((Date.now() - liveUser.lastUpdate) / 1000)}s ago
                    </Text>
                  </View>
                </View>
              ))
            ) : (
              <View style={styles.noLiveUsers}>
                <Icon name="location-off" size={48} color={theme.colors.secondary} />
                <Text style={[styles.noLiveUsersText, { color: theme.colors.secondary }]}>
                  No users are currently sharing live location
                </Text>
              </View>
            )}
          </View>
        )}

        {user?.assignedCities && user.assignedCities.length > 0 && (
          <View style={[styles.section, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
              Assigned Cities
            </Text>
            <View style={styles.citiesContainer}>
              {user.assignedCities.map((city, index) => (
                <View key={index} style={[styles.cityChip, { backgroundColor: theme.colors.primary }]}>
                  <Text style={styles.cityChipText}>{city}</Text>
                </View>
              ))}
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  header: {
    marginBottom: 24,
  },
  greeting: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  role: {
    fontSize: 16,
    marginTop: 4,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 24,
    gap: 12,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    padding: 16,
    borderRadius: 12,
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
  statCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statTitle: {
    fontSize: 14,
  },
  unifiedTrackingCard: {
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
    borderWidth: 2,
    borderColor: '#4CAF50',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 4px 8px rgba(76, 175, 80, 0.2)',
    } : {
      shadowColor: '#4CAF50',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.2,
      shadowRadius: 8,
      elevation: 4,
    }),
  },
  trackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  trackingInfo: {
    marginLeft: 16,
    flex: 1,
  },
  trackingTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  trackingStatus: {
    fontSize: 14,
    marginTop: 4,
  },
  distanceText: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 6,
  },
  unifiedTrackingButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
    alignItems: 'center',
  },
  trackingButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  section: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  userInfo: {
    marginLeft: 12,
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: '500',
  },
  userEmail: {
    fontSize: 14,
    marginTop: 2,
  },
  citiesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  cityChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  cityChipText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  locationText: {
    fontSize: 12,
    marginTop: 4,
    fontFamily: 'monospace',
  },
  liveTrackingSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FF6B35',
    ...(Platform.OS === 'web' ? {
      boxShadow: '0px 2px 4px rgba(255, 107, 53, 0.1)',
    } : {
      shadowColor: '#FF6B35',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    }),
  },
  liveSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  liveUserItem: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(255, 107, 53, 0.1)',
    borderLeftWidth: 3,
    borderLeftColor: '#FF6B35',
  },
  liveUserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  liveUserName: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
    flex: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  liveText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  locationInfo: {
    marginLeft: 28,
  },
  lastUpdateText: {
    fontSize: 12,
    marginTop: 2,
  },
  noLiveUsers: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  noLiveUsersText: {
    fontSize: 16,
    marginTop: 12,
    textAlign: 'center',
  },
});

export default HomeScreen;
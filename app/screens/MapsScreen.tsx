import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../src/firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { MapView, PROVIDER_GOOGLE } from '../components/SimpleMapComponent';
import { useAuth } from '../../src/context/AuthContext';
import { useLocation } from '../../src/context/LocationContext';
import { useTheme } from '../../src/context/ThemeContext';
import Icon from '@expo/vector-icons/MaterialIcons';
import Constants from 'expo-constants';
import { getMarkerColor } from '../components/category';
import Filter from '../components/filter';
import { Marker, Region } from 'react-native-maps';
import ClusteredMarkers from '../components/ClusteredMarkers';
import type { Organization } from '../types/organization';

const LIVE_TRACKING_COLORS = [
  '#D32F2F',
  '#1976D2',
  '#388E3C',
  '#F57C00',
  '#7B1FA2',
  '#0097A7',
  '#F4511E',
  '#AFB42B',
  '#5D4037',
  '#455A64',
  '#C2185B',
  '#00796B',
];

const MapsScreen: React.FC = () => {
  const { user } = useAuth();
  const { currentLocation, liveUsers, getLiveTrackingUsers } = useLocation();
  const { theme } = useTheme();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [filteredOrganizations, setFilteredOrganizations] = useState<Organization[]>([]);
  const [filterMarkers, setFilterMarkers] = useState<Organization[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [assignedOrganizations, setAssignedOrganizations] = useState<Organization[]>([]);
  const [userAssignedData, setUserAssignedData] = useState<{
    cities: string[];
    areas: string[];
  } | null>(null);
  const [meetingData, setMeetingData] = useState({
    title: '',
    description: '',
    scheduledTime: '',
  });

  const handleOrganizationPress = useCallback((organization: Organization) => {
    setSelectedOrg(organization);
    setShowDetails(true);
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      getLiveTrackingUsers();
    }
  }, [user?.role, getLiveTrackingUsers]);

  const liveUserColors = useMemo<Record<string, string>>(() => {
    if (liveUsers.length === 0) {
      return {};
    }

    const paletteSize = LIVE_TRACKING_COLORS.length;
    const keyedUsers = liveUsers.map((liveUser, index) => ({
      key: liveUser.userId || liveUser.name || `user-${index}`,
    }));

    keyedUsers.sort((a, b) => a.key.localeCompare(b.key));

    return keyedUsers.reduce<Record<string, string>>((acc, entry, index) => {
      acc[entry.key] = LIVE_TRACKING_COLORS[index % paletteSize];
      return acc;
    }, {});
  }, [liveUsers]);

  useEffect(() => {
    if (user) {
      loadUserAssignedData();
    }
  }, [user]);

  useEffect(() => {
    if (userAssignedData) {
      loadOrganizations();
    }
  }, [userAssignedData]);

  useEffect(() => {
    const baseMarkers = filterMarkers ?? organizations;

    const filtered = baseMarkers.filter((org) => {
      if (!searchQuery) return true;
      const query = searchQuery.toLowerCase();
      return (
        org.name.toLowerCase().includes(query) ||
        org.city.toLowerCase().includes(query) ||
        org.category.toLowerCase().includes(query)
      );
    });

    console.log('Total organizations loaded:', organizations.length);
    console.log('Search filtered organizations:', filtered.length);

    setFilteredOrganizations(filtered);
  }, [filterMarkers, organizations, searchQuery]);

  useEffect(() => {
    // Filter organizations based on user's assigned cities and areas
    if (userAssignedData && organizations.length > 0) {
      console.log('User assigned data:', userAssignedData);
      console.log('Sample organization cities:', organizations.slice(0, 3).map(org => org.city));
      console.log('Sample organization states:', organizations.slice(0, 3).map(org => org.state));
      
      if (userAssignedData.cities.length > 0 || userAssignedData.areas.length > 0) {
        const assigned = organizations.filter((org) => {
          const cityMatch = userAssignedData.cities.includes(org.city);
          const areaMatch = userAssignedData.areas.includes(org.state);
          return cityMatch || areaMatch;
        });
        console.log('Assigned organizations:', assigned.length);
        setAssignedOrganizations(assigned);
      } else {
        console.log('No assigned cities or areas, showing all organizations');
        setAssignedOrganizations(organizations);
      }
    }
  }, [organizations, userAssignedData]);

  const parseJSONData = (jsonText: string): Organization[] => {
    try {
      const data = JSON.parse(jsonText);
      
      if (!data.results || !Array.isArray(data.results)) {
        console.log('No results array found in response');
        return [];
      }
      
      const organizations: Organization[] = [];
      
      data.results.forEach((item: any, index: number) => {
        const coordinates = item['Co-ordinates'] || '';
        const coordParts = coordinates.split(',').map((coord: string) => coord.trim());
        const latitude = parseFloat(coordParts[0]) || 0;
        const longitude = parseFloat(coordParts[1]) || 0;
        
        const org: Organization = {
          id: `org_${index}`,
          name: item.Title || 'Unknown Organization',
          address: coordinates || 'Address not available',
          latitude: latitude,
          longitude: longitude,
          city: item.City || 'Unknown City',
          state: item.area || 'Unknown State',
          category: item.Category || 'General',
          contact: item.Phone || '',
          description: item.Title || '',
          type: item.Type || '',
          ratings: item.Ratings || '',
          star: item.Star || '',
          website: item.Website || '',
          status: item.Status || '',
          pulseCode: item['Pulse Code'] || '',
          numberOfStudents: item['Number of students'] || '',
          currentPublicationName: item['Current Publication name '] || '',
          decisionMakerName: item['Decision Maker Name'] || '',
          phoneDM: item['Phone (DM)'] || '',
          ho: item.HO || '',
          currentStatusDetails: item['Current Status Details'] || '',
          demo: item.Demo || '',
          assignee: item.Asignee || '',
          whatsapp: item.Whatsapp || '',
          eventTitle: item['Event Title'] || '',
          startDate: item['Start Date'] || '',
          startTime: item['Start Time'] || '',
          endDate: item['End Date'] || '',
          endTime: item['End Time'] || '',
          location: item.Location || '',
          guests: item.Guests || '',
          beforeSchool: item['Before School'] || '',
          afterSchool: item['After School'] || '',
          addOns: item['Add-ons'] || '',
        };
        
        if (org.latitude !== 0 && org.longitude !== 0) {
          organizations.push(org);
        }
      });
      
      return organizations;
    } catch (error) {
      console.error('Error parsing JSON data:', error);
      return [];
    }
  };

  const loadUserAssignedData = async () => {
    if (!user) {
      setUserAssignedData({
        cities: [],
        areas: [],
      });
      return;
    }
    
    try {
      const userDoc = await getDoc(doc(db, 'users', user.id || user.uid || ''));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const assignedCities = userData.assignedCities || [];
        const assignedAreas = userData.assignedAreas || [];
        
        console.log('Loaded user assigned cities:', assignedCities);
        console.log('Loaded user assigned areas:', assignedAreas);
        
        setUserAssignedData({
          cities: assignedCities,
          areas: assignedAreas,
        });
      } else {
        console.log('User document does not exist, showing all organizations');
        setUserAssignedData({
          cities: [],
          areas: [],
        });
      }
    } catch (error) {
      console.error('Error loading user assigned data:', error);
      setUserAssignedData({
        cities: [],
        areas: [],
      });
    }
  };

  const loadOrganizations = async () => {
    try {
      setLoading(true);
      
      const cities = userAssignedData?.cities || [];
      const areas = userAssignedData?.areas || [];
      
      const key1 = cities.join(',');
      const key2 = areas.join(',');
      
      console.log('Loading organizations with cities:', cities);
      console.log('Loading organizations with areas:', areas);
      
      const url = `https://script.google.com/macros/s/AKfycbwVhNTYSzGBddUDDOMBw3vOTlNKdJA3859dwb5YO2eWgIzM6Ao3fNRw_wZDFep1_S19/exec?key1=${encodeURIComponent(key1)}&key2=${encodeURIComponent(key2)}`;
      
      console.log('Fetching from URL:', url);
      
      const response = await fetch(url);
      if (response.ok) {
        const jsonText = await response.text();
        console.log('Received JSON data length:', jsonText.length);
        
        const organizations = parseJSONData(jsonText);
        console.log('Parsed organizations count:', organizations.length);
        
        if (organizations.length > 0) {
          console.log('Sample organization:', organizations[0]);
        }
        
        setOrganizations(organizations);
      } else {
        console.error('Failed to fetch data:', response.status, response.statusText);
        Alert.alert('Error', 'Failed to load organization data');
      }
    } catch (error) {
      console.error('Error loading organizations:', error);
      Alert.alert('Error', 'Failed to load organization data');
    } finally {
      setLoading(false);
    }
  };

  const handleScheduleMeeting = () => {
    setShowDetails(false);
    setShowMeetingForm(true);
  };

  const submitMeeting = async () => {
    if (!meetingData.title || !meetingData.scheduledTime) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await addDoc(collection(db, 'meetings'), {
        title: meetingData.title,
        description: meetingData.description || null,
        location_id: selectedOrg?.id,
        scheduled_time: new Date(meetingData.scheduledTime).toISOString(),
        attendees: [user?.email],
        status: 'pending',
        created_at: new Date(),
        created_by: user?.id || user?.email || 'anonymous',
      });
      Alert.alert('Success', 'Meeting request submitted for approval');
      setShowMeetingForm(false);
      setMeetingData({ title: '', description: '', scheduledTime: '' });
    } catch (error) {
      console.error('Error creating meeting:', error);
      Alert.alert('Error', 'Failed to create meeting');
    }
  };

  const computedMapRegion = useMemo<Region>(() => {
    const latitudes: number[] = [];
    const longitudes: number[] = [];

    filteredOrganizations.forEach((org) => {
      latitudes.push(org.latitude);
      longitudes.push(org.longitude);
    });

    if (user?.role === 'admin') {
      liveUsers.forEach((liveUser) => {
        if (liveUser.location) {
          latitudes.push(liveUser.location.latitude);
          longitudes.push(liveUser.location.longitude);
        }
      });
    }

    if (latitudes.length === 0 && currentLocation) {
      latitudes.push(currentLocation.latitude);
      longitudes.push(currentLocation.longitude);
    }

    if (latitudes.length === 0) {
      return {
        latitude: 12.9716,
        longitude: 77.5946,
        latitudeDelta: 0.1,
        longitudeDelta: 0.1,
      };
    }

    const minLat = Math.min(...latitudes);
    const maxLat = Math.max(...latitudes);
    const minLng = Math.min(...longitudes);
    const maxLng = Math.max(...longitudes);

    const centerLat = (minLat + maxLat) / 2;
    const centerLng = (minLng + maxLng) / 2;

    const deltaLat = Math.max(maxLat - minLat, 0.01) * 1.2;
    const deltaLng = Math.max(maxLng - minLng, 0.01) * 1.2;

    return {
      latitude: centerLat,
      longitude: centerLng,
      latitudeDelta: deltaLat,
      longitudeDelta: deltaLng,
    };
  }, [filteredOrganizations, liveUsers, currentLocation, user?.role]);

  const [visibleRegion, setVisibleRegion] = useState<Region>(computedMapRegion);

  useEffect(() => {
    setVisibleRegion(computedMapRegion);
  }, [computedMapRegion]);

  // Handle filter updates from Filter component
  const handleFilterUpdate = (nextMarkers: Organization[]) => {
    console.log('Filter updated, received markers:', nextMarkers.length);

    if (organizations.length === 0) {
      setFilterMarkers(nextMarkers);
      return;
    }

    const markerIdSet = new Set(nextMarkers.map((marker) => marker.id));
    const matchesAllOrganizations =
      nextMarkers.length === organizations.length &&
      organizations.every((org) => markerIdSet.has(org.id));

    setFilterMarkers(matchesAllOrganizations ? null : nextMarkers);
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={{ marginTop: 16, fontSize: 16, color: theme.colors.text }}>Loading organization data...</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* Search Bar */}
      <View style={{ paddingHorizontal: 16, paddingVertical: 8 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, backgroundColor: theme.colors.surface }}>
          <Icon name="search" size={20} color={theme.colors.secondary} />
          <TextInput
            style={{ flex: 1, marginLeft: 8, fontSize: 16, color: theme.colors.text }}
            placeholder="Search organizations, cities, categories..."
            placeholderTextColor={theme.colors.secondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Icon name="clear" size={20} color={theme.colors.secondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Assigned Areas Display */}
      {userAssignedData && (userAssignedData.cities.length > 0 || userAssignedData.areas.length > 0) && (
        <View style={{ marginHorizontal: 16, marginBottom: 8, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: theme.colors.surface }}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
            {userAssignedData.cities.map((city, index) => (
              <View key={`city_${index}`} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8, backgroundColor: '#E3F2FD' }}>
                <Icon name="location-city" size={14} color="#1976D2" />
                <Text style={{ fontSize: 12, fontWeight: '600', marginLeft: 4, color: '#1976D2' }}>{city}</Text>
              </View>
            ))}
            {userAssignedData.areas.map((area, index) => (
              <View key={`area_${index}`} style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16, marginRight: 8, backgroundColor: '#E8F5E8' }}>
                <Icon name="business" size={14} color="#2E7D32" />
                <Text style={{ fontSize: 12, fontWeight: '600', marginLeft: 4, color: '#2E7D32' }}>{area}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {/* No Assigned Areas Message */}
      {userAssignedData && userAssignedData.cities.length === 0 && userAssignedData.areas.length === 0 && (
        <View style={{ marginHorizontal: 16, marginBottom: 8, paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8, backgroundColor: '#FFF3E0' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12 }}>
            <Icon name="info" size={20} color="#F57C00" />
            <Text style={{ marginLeft: 8, fontSize: 14, fontWeight: '500', color: '#F57C00' }}>
              No cities or areas assigned. Contact admin for assignment.
            </Text>
          </View>
        </View>
      )}

      {/* Category Legend */}
      {filteredOrganizations.length > 0 && (
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', backgroundColor: theme.colors.surface }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: theme.colors.text }}>Categories:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
            {Array.from(new Set(filteredOrganizations.map(org => org.category))).map((category, index) => (
              <View key={index} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
                <View style={{ width: 12, height: 12, borderRadius: 6, marginRight: 6, backgroundColor: getMarkerColor(undefined, category) }} />
                <Text style={{ fontSize: 12, fontWeight: '500', color: theme.colors.text }}>{category}</Text>
              </View>
            ))}
          </ScrollView>
        </View>
      )}

      {user?.role === 'admin' && liveUsers.length > 0 && (
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#E0E0E0', backgroundColor: theme.colors.surface }}>
          <Text style={{ fontSize: 14, fontWeight: 'bold', marginBottom: 8, color: theme.colors.text }}>Live Tracking Users:</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexDirection: 'row' }}>
            {liveUsers.map((liveUser, index) => {
              const colorKey = liveUser.userId || liveUser.name || `user-${index}`;
              const indicatorColor = liveUserColors[colorKey] || theme.colors.primary;
              const itemKey = liveUser.userId || `${colorKey}-${index}`;

              return (
                <View key={itemKey} style={{ flexDirection: 'row', alignItems: 'center', marginRight: 16 }}>
                  <View style={{ width: 12, height: 12, borderRadius: 6, marginRight: 6, backgroundColor: indicatorColor }} />
                  <Text style={{ fontSize: 12, fontWeight: '500', color: theme.colors.text }}>
                    {liveUser.name || liveUser.userId}
                  </Text>
                </View>
              );
            })}
          </ScrollView>
        </View>
      )}

      {/* Google Maps with Markers */}
      <View style={{ flex: 1, marginTop: 4 }}>
        {loading ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
            <ActivityIndicator size="large" color={theme.colors.primary} />
            <Text style={{ marginTop: 16, fontSize: 16, fontWeight: '500', color: theme.colors.text }}>
              Loading organization data...
            </Text>
          </View>
        ) : filteredOrganizations.length === 0 ? (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f5f5f5' }}>
            <Text style={{ marginTop: 16, fontSize: 16, fontWeight: '500', color: theme.colors.text }}>
              No organizations found for your assigned areas.
            </Text>
            <Text style={{ marginTop: 8, fontSize: 14, textAlign: 'center', paddingHorizontal: 20, color: theme.colors.secondary }}>
              Contact admin if you think this is an error.
            </Text>
          </View>
        ) : (
          <MapView
            key={`map-${filteredOrganizations.length}`}
            style={{ flex: 1, width: '100%', height: '100%' }}
            provider={PROVIDER_GOOGLE}
            initialRegion={computedMapRegion}
            region={visibleRegion}
            onRegionChangeComplete={setVisibleRegion}
          >
            <ClusteredMarkers
              organizations={filteredOrganizations}
              region={visibleRegion}
              onMarkerPress={handleOrganizationPress}
            />

            {user?.role === 'admin' && liveUsers.map((liveUser, index) => {
              const colorKey = liveUser.userId || liveUser.name || `user-${index}`;
              const markerColor = liveUserColors[colorKey] || theme.colors.primary;
              const lastUpdatedSeconds = Math.round((Date.now() - liveUser.lastUpdate) / 1000);
              const minutes = Math.floor(lastUpdatedSeconds / 60);
              const seconds = lastUpdatedSeconds % 60;
              const timeLabel = minutes > 0 ? `${minutes}m ${seconds}s ago` : `${seconds}s ago`;
              const markerKey = liveUser.userId || `${colorKey}-${index}`;

              return (
                <Marker
                  key={`live-${markerKey}`}
                  coordinate={{
                    latitude: liveUser.location.latitude,
                    longitude: liveUser.location.longitude,
                  }}
                  title={liveUser.name || 'Live User'}
                  description={`Last updated ${timeLabel}`}
                  pinColor={markerColor}
                />
              );
            })}
          </MapView>
        )}
        
        {/* Filter Component Overlay */}
        {!loading && organizations.length > 0 && (
          <Filter
            allMarkers={organizations}
            setFilteredMarkers={handleFilterUpdate}
          />
        )}
      </View>

      {/* Organization Details Modal */}
      <Modal
        visible={showDetails}
        animationType="slide"
        transparent
        onRequestClose={() => setShowDetails(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' }}>
          <View style={{ borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', backgroundColor: theme.colors.surface }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.text }}>
                {selectedOrg?.name}
              </Text>
              <TouchableOpacity onPress={() => setShowDetails(false)}>
                <Icon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 20 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Icon name="business" size={20} color={theme.colors.primary} />
                <Text style={{ marginLeft: 12, fontSize: 16, flex: 1, color: theme.colors.text }}>
                  {selectedOrg?.category}
                </Text>
              </View>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                <Icon name="location-city" size={20} color={theme.colors.primary} />
                <Text style={{ marginLeft: 12, fontSize: 16, flex: 1, color: theme.colors.text }}>
                  {selectedOrg?.city}, {selectedOrg?.state}
                </Text>
              </View>

              {selectedOrg?.contact && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <Icon name="phone" size={20} color={theme.colors.primary} />
                  <Text style={{ marginLeft: 12, fontSize: 16, flex: 1, color: theme.colors.text }}>
                    {selectedOrg.contact}
                  </Text>
                </View>
              )}

              {selectedOrg?.description && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <Icon name="info" size={20} color={theme.colors.primary} />
                  <Text style={{ marginLeft: 12, fontSize: 16, flex: 1, color: theme.colors.text }}>
                    {selectedOrg.description}
                  </Text>
                </View>
              )}

              {selectedOrg?.type && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <Icon name="category" size={20} color={theme.colors.primary} />
                  <Text style={{ marginLeft: 12, fontSize: 16, flex: 1, color: theme.colors.text }}>
                    Type: {selectedOrg.type}
                  </Text>
                </View>
              )}

              {selectedOrg?.ratings && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <Icon name="star" size={20} color={theme.colors.primary} />
                  <Text style={{ marginLeft: 12, fontSize: 16, flex: 1, color: theme.colors.text }}>
                    Ratings: {selectedOrg.ratings}
                  </Text>
                </View>
              )}

              {selectedOrg?.website && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <Icon name="web" size={20} color={theme.colors.primary} />
                  <Text style={{ marginLeft: 12, fontSize: 16, flex: 1, color: theme.colors.text }}>
                    Website: {selectedOrg.website}
                  </Text>
                </View>
              )}

              {selectedOrg?.numberOfStudents && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <Icon name="school" size={20} color={theme.colors.primary} />
                  <Text style={{ marginLeft: 12, fontSize: 16, flex: 1, color: theme.colors.text }}>
                    Students: {selectedOrg.numberOfStudents}
                  </Text>
                </View>
              )}

              {selectedOrg?.decisionMakerName && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <Icon name="person" size={20} color={theme.colors.primary} />
                  <Text style={{ marginLeft: 12, fontSize: 16, flex: 1, color: theme.colors.text }}>
                    Decision Maker: {selectedOrg.decisionMakerName}
                  </Text>
                </View>
              )}

              {selectedOrg?.phoneDM && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <Icon name="phone" size={20} color={theme.colors.primary} />
                  <Text style={{ marginLeft: 12, fontSize: 16, flex: 1, color: theme.colors.text }}>
                    DM Phone: {selectedOrg.phoneDM}
                  </Text>
                </View>
              )}

              {selectedOrg?.whatsapp && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <Icon name="chat" size={20} color={theme.colors.primary} />
                  <Text style={{ marginLeft: 12, fontSize: 16, flex: 1, color: theme.colors.text }}>
                    WhatsApp: {selectedOrg.whatsapp}
                  </Text>
                </View>
              )}

              {selectedOrg?.eventTitle && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <Icon name="event" size={20} color={theme.colors.primary} />
                  <Text style={{ marginLeft: 12, fontSize: 16, flex: 1, color: theme.colors.text }}>
                    Event: {selectedOrg.eventTitle}
                  </Text>
                </View>
              )}

              {selectedOrg?.startDate && selectedOrg?.startTime && (
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
                  <Icon name="schedule" size={20} color={theme.colors.primary} />
                  <Text style={{ marginLeft: 12, fontSize: 16, flex: 1, color: theme.colors.text }}>
                    Start: {selectedOrg.startDate} at {selectedOrg.startTime}
                  </Text>
                </View>
              )}
            </ScrollView>

            <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: '#e0e0e0' }}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, backgroundColor: theme.colors.primary }}
                onPress={handleScheduleMeeting}
              >
                <Icon name="event" size={20} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 }}>Schedule Meeting</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Meeting Modal */}
      <Modal
        visible={showMeetingForm}
        animationType="slide"
        transparent
        onRequestClose={() => setShowMeetingForm(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0, 0, 0, 0.5)', justifyContent: 'flex-end' }}>
          <View style={{ borderTopLeftRadius: 20, borderTopRightRadius: 20, maxHeight: '80%', backgroundColor: theme.colors.surface }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#e0e0e0' }}>
              <Text style={{ fontSize: 20, fontWeight: 'bold', color: theme.colors.text }}>
                Schedule Meeting
              </Text>
              <TouchableOpacity onPress={() => setShowMeetingForm(false)}>
                <Icon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <ScrollView style={{ padding: 20 }}>
              <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, marginTop: 16, color: theme.colors.text }}>Meeting Title *</Text>
              <TextInput
                style={{ borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, borderColor: theme.colors.border, color: theme.colors.text }}
                value={meetingData.title}
                onChangeText={(text) => setMeetingData({ ...meetingData, title: text })}
                placeholder="Enter meeting title"
                placeholderTextColor={theme.colors.secondary}
              />

              <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, marginTop: 16, color: theme.colors.text }}>Description</Text>
              <TextInput
                style={{ borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, height: 80, textAlignVertical: 'top', borderColor: theme.colors.border, color: theme.colors.text }}
                value={meetingData.description}
                onChangeText={(text) => setMeetingData({ ...meetingData, description: text })}
                placeholder="Enter meeting description"
                placeholderTextColor={theme.colors.secondary}
                multiline
                numberOfLines={3}
              />

              <Text style={{ fontSize: 16, fontWeight: '600', marginBottom: 8, marginTop: 16, color: theme.colors.text }}>Scheduled Time *</Text>
              <TextInput
                style={{ borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16, borderColor: theme.colors.border, color: theme.colors.text }}
                value={meetingData.scheduledTime}
                onChangeText={(text) => setMeetingData({ ...meetingData, scheduledTime: text })}
                placeholder="YYYY-MM-DD HH:MM"
                placeholderTextColor={theme.colors.secondary}
              />
            </ScrollView>

            <View style={{ padding: 20, borderTopWidth: 1, borderTopColor: '#e0e0e0' }}>
              <TouchableOpacity
                style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 8, backgroundColor: theme.colors.success }}
                onPress={submitMeeting}
              >
                <Icon name="send" size={20} color="#fff" />
                <Text style={{ color: '#fff', fontSize: 16, fontWeight: '600', marginLeft: 8 }}>Submit Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
  },
  assignedSection: {
    margin: 16,
    marginTop: 0,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  assignedSectionCompact: {
    marginHorizontal: 16,
    marginBottom: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  assignedTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  assignedScroll: {
    flexDirection: 'row',
  },
  assignedTag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  assignedTagText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
  },
  mapContainer: {
    flex: 1,
    marginTop: 4,
  },
  map: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalBody: {
    padding: 20,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailText: {
    marginLeft: 12,
    fontSize: 16,
    flex: 1,
  },
  modalActions: {
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    height: 80,
    textAlignVertical: 'top',
  },
  noAssignmentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  noAssignmentText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  legendContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  legendTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  legendScroll: {
    flexDirection: 'row',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 6,
    marginRight: 6,
  },
  legendText: {
    fontSize: 12,
    fontWeight: '500',
  },
  mapLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
  },
  mapLoadingText: {
    marginTop: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  noDataSubtext: {
    marginTop: 8,
    fontSize: 14,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
});

export default MapsScreen;
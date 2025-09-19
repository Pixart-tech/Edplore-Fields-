import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  ScrollView,
  ActivityIndicator,
  StyleSheet,
  Linking,
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
import OrganizationDetailsModal from '../components/maps/OrganizationDetailsModal';
import EditOrganizationModal, { EditFormState } from '../components/maps/EditOrganizationModal';
import MeetingRequestModal, { MeetingFormState } from '../components/maps/MeetingRequestModal';
import type { Organization } from '../types/organization';

const INITIAL_EDIT_FORM: EditFormState = {
  name: '',
  address: '',
  contact: '',
  whatsapp: '',
  category: '',
  pulseCode: '',
  status: '',
  currentStatus: '',
  currentStatusDetails: '',
  assignee: '',
};

const INITIAL_MEETING_FORM: MeetingFormState = {
  title: '',
  description: '',
  scheduledTime: '',
};

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
  const [showEditForm, setShowEditForm] = useState(false);
  const [assignedOrganizations, setAssignedOrganizations] = useState<Organization[]>([]);
  const [userAssignedData, setUserAssignedData] = useState<{
    cities: string[];
    areas: string[];
  } | null>(null);
  const [meetingData, setMeetingData] = useState<MeetingFormState>(INITIAL_MEETING_FORM);
  const [editFormData, setEditFormData] = useState<EditFormState>(INITIAL_EDIT_FORM);
  const [formURL, setFormURL] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [previousSchoolsValue, setPreviousSchoolsValue] = useState<string | null>(null);

  const extractFormEntryValue = useCallback((url: string | null, entryId: string): string => {
    if (!url) {
      return '';
    }

    const pattern = entryId.replace(/\./g, '\\.');
    const regex = new RegExp(`${pattern}=([^&]*)`);
    const match = url.match(regex);
    return match ? decodeURIComponent(match[1]) : '';
  }, []);

  const categoryOptions = useMemo(() => {
    const categories = new Set<string>();
    organizations.forEach((org) => {
      if (org.category && org.category.trim() !== '') {
        categories.add(org.category.trim());
      }
    });
    return Array.from(categories).sort((a, b) => a.localeCompare(b));
  }, [organizations]);

  const handlePhonePress = useCallback((phone?: string) => {
    if (!phone) {
      return;
    }

    const normalized = phone.replace(/[\s()-]/g, '').trim();
    if (!normalized || !/\d/.test(normalized)) {
      return;
    }

    Linking.openURL(`tel:${normalized}`);
  }, []);

  const handleWhatsAppPress = useCallback((whatsapp?: string) => {
    if (!whatsapp) {
      return;
    }

    const digitsOnly = whatsapp.replace(/\D/g, '');
    if (!digitsOnly) {
      return;
    }

    Linking.openURL(`https://wa.me/${digitsOnly}`);
  }, []);

  const handleWebsitePress = useCallback((website?: string) => {
    if (!website) {
      return;
    }

    const trimmed = website.trim();
    if (!trimmed) {
      return;
    }

    const url = trimmed.startsWith('http://') || trimmed.startsWith('https://') ? trimmed : `https://${trimmed}`;
    Linking.openURL(url);
  }, []);

  const handleOrganizationPress = useCallback((organization: Organization) => {
    setSelectedOrg(organization);
    setShowDetails(true);
  }, []);

  const locationText = useMemo(() => {
    if (!selectedOrg) {
      return '';
    }

    const parts = [selectedOrg.city, selectedOrg.state].filter(
      (part): part is string => !!part && part.trim().length > 0,
    );

    if (parts.length === 0) {
      return '';
    }

    return parts.join(', ');
  }, [selectedOrg]);

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
          recordKey: item.Key || item.key || item['Record Key'] || '',
          numberOfStudents: item['Number of students'] || '',
          currentPublicationName: item['Current Publication name '] || '',
          decisionMakerName: item['Decision Maker Name'] || '',
          phoneDM: item['Phone (DM)'] || '',
          ho: item.HO || '',
          currentStatus: item['Current Status'] || '',
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
          formUrl:
            item['Form URL'] ||
            item['Form Link'] ||
            item['Edit Form Link'] ||
            item['Edit Link'] ||
            item.link ||
            item.Link ||
            '',
          mapsUrl: item['Maps URL'] || item['Maps Link'] || item.mapsUrl || item['Map URL'] || '',
          link: item.link || item.Link || '',
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

  const handleEditOrganization = useCallback(() => {
    if (!selectedOrg) {
      return;
    }

    const formLink = selectedOrg.formUrl || selectedOrg.link || null;
    const categoryFromForm = extractFormEntryValue(formLink, 'entry.1748805668');
    const resolvedCategory = categoryFromForm || selectedOrg.category || '';
    const previousSchools = extractFormEntryValue(formLink, 'entry.1597701263');

    setFormURL(formLink);
    setSelectedCategory(resolvedCategory);
    setPreviousSchoolsValue(previousSchools ? previousSchools : null);

    setEditFormData({
      name: selectedOrg.name,
      address: selectedOrg.address,
      contact: selectedOrg.contact ?? '',
      whatsapp: selectedOrg.whatsapp ?? '',
      category: resolvedCategory,
      pulseCode: selectedOrg.pulseCode ?? '',
      status: selectedOrg.status ?? '',
      currentStatus: selectedOrg.currentStatus ?? '',
      currentStatusDetails: selectedOrg.currentStatusDetails ?? '',
      assignee: selectedOrg.assignee ?? '',
    });
    setShowDetails(false);
    setShowEditForm(true);
  }, [extractFormEntryValue, selectedOrg]);

  const handleEditInputChange = useCallback(
    (field: keyof EditFormState, value: string) => {
      setEditFormData((prev) => ({ ...prev, [field]: value }));
      if (field === 'category') {
        setSelectedCategory(value);
      }
    },
    [setSelectedCategory]
  );

  const handleMeetingInputChange = useCallback((field: keyof MeetingFormState, value: string) => {
    setMeetingData((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleCancelEdit = useCallback(() => {
    setShowEditForm(false);
    setEditFormData(INITIAL_EDIT_FORM);
    setFormURL(null);
    setSelectedCategory('');
    setPreviousSchoolsValue(null);
    setShowDetails(true);
  }, []);

  const submitCategoryUpdate = useCallback(
    async (organization: Organization, category: string) => {
      if (!category) {
        return { success: true, skipped: true } as const;
      }

      const recordKey = organization.recordKey || organization.pulseCode || organization.id;
      if (!recordKey) {
        console.warn('Missing record key for organization update:', organization.id);
        return { success: false, skipped: true } as const;
      }

      const mapsUrl =
        organization.mapsUrl ||
        `https://www.google.com/maps/search/?api=1&query=${organization.latitude},${organization.longitude}`;

      const payload = {
        key: recordKey,
        mapurl: mapsUrl,
        selectedCategory: category,
      };

      try {
        const response = await fetch(
          'https://script.google.com/macros/s/AKfycbxvc7ql3fN3MmfYmUuONI6TeDFfysalIA2sh_fAQC19xclIfEGoPXgf0fYXDTvYzvh39w/exec',
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          }
        );

        if (!response.ok) {
          const errorMessage = await response.text();
          throw new Error(errorMessage || 'Failed to update category');
        }

        return { success: true, skipped: false } as const;
      } catch (error) {
        console.error('Error updating category via script:', error);
        return { success: false, skipped: false } as const;
      }
    },
    []
  );

  const handleSaveEdit = useCallback(async () => {
    if (!selectedOrg) {
      Alert.alert('Error', 'No organization selected to edit.');
      return;
    }

    const updatedOrg: Organization = {
      ...selectedOrg,
      name: editFormData.name,
      address: editFormData.address,
      contact: editFormData.contact,
      whatsapp: editFormData.whatsapp,
      category: editFormData.category,
      pulseCode: editFormData.pulseCode,
      status: editFormData.status,
      currentStatus: editFormData.currentStatus,
      currentStatusDetails: editFormData.currentStatusDetails,
      assignee: editFormData.assignee,
    };

    setOrganizations((prev) => prev.map((org) => (org.id === updatedOrg.id ? updatedOrg : org)));
    setFilteredOrganizations((prev) => prev.map((org) => (org.id === updatedOrg.id ? updatedOrg : org)));
    setAssignedOrganizations((prev) => prev.map((org) => (org.id === updatedOrg.id ? updatedOrg : org)));
    setFilterMarkers((prev) => {
      if (!prev) {
        return prev;
      }
      return prev.map((org) => (org.id === updatedOrg.id ? updatedOrg : org));
    });
    setSelectedOrg(updatedOrg);

    const categoryToSubmit = selectedCategory || updatedOrg.category || '';
    const result = await submitCategoryUpdate(updatedOrg, categoryToSubmit);

    setEditFormData(INITIAL_EDIT_FORM);
    setFormURL(null);
    setSelectedCategory('');
    setPreviousSchoolsValue(null);
    setShowEditForm(false);
    setShowDetails(true);

    if (result.success) {
      Alert.alert('Success', result.skipped ? 'Organization details updated locally.' : 'Organization details updated.');
    } else {
      Alert.alert('Warning', 'Details saved locally, but updating the record remotely failed.');
    }
  }, [editFormData, selectedCategory, selectedOrg, submitCategoryUpdate]);

  const handleOpenDirections = useCallback(async () => {
    if (!selectedOrg) {
      return;
    }

    const { latitude, longitude, name, address } = selectedOrg;

    if (typeof latitude !== 'number' || typeof longitude !== 'number' || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      Alert.alert('Directions unavailable', 'This organization does not have valid coordinates.');
      return;
    }

    const baseUrl = 'https://www.google.com/maps/dir/?api=1';
    const queryParams = [`destination=${encodeURIComponent(`${latitude},${longitude}`)}`];

    const label = [name, address].filter(Boolean).join(' ');
    if (label) {
      queryParams.push(`query=${encodeURIComponent(label)}`);
    }

    const url = `${baseUrl}&${queryParams.join('&')}`;

    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Unable to open directions', 'No application is available to handle the directions link.');
      }
    } catch (error) {
      console.error('Error opening directions:', error);
      Alert.alert('Error', 'Failed to open directions.');
    }
  }, [selectedOrg]);

  const handleOpenFormWithParams = useCallback(() => {
    if (!formURL) {
      Alert.alert('Form unavailable', 'No edit form link is available for this organization.');
      return;
    }

    let updatedUrl = formURL;

    if (selectedCategory) {
      const encodedCategory = encodeURIComponent(selectedCategory);
      if (updatedUrl.includes('entry.1748805668=')) {
        updatedUrl = updatedUrl.replace(/entry\.1748805668=[^&]*/, `entry.1748805668=${encodedCategory}`);
      } else {
        updatedUrl += `${updatedUrl.includes('?') ? '&' : '?'}entry.1748805668=${encodedCategory}`;
      }
    }

    if (editFormData.currentStatusDetails) {
      const encodedDetails = encodeURIComponent(editFormData.currentStatusDetails);
      if (updatedUrl.includes('entry.1523910384=')) {
        const currentValue = updatedUrl.match(/entry\.1523910384=([^&]*)/);
        if (currentValue) {
          const newValue = `${currentValue[1]}%0A${encodedDetails}`;
          updatedUrl = updatedUrl.replace(/entry\.1523910384=[^&]*/, `entry.1523910384=${newValue}`);
        }
      } else {
        updatedUrl += `${updatedUrl.includes('?') ? '&' : '?'}entry.1523910384=${encodedDetails}`;
      }
    }

    try {
      Linking.openURL(updatedUrl);
    } catch (error) {
      console.error('Error opening edit form:', error);
      Alert.alert('Error', 'Unable to open the edit form link.');
    }
  }, [editFormData.currentStatusDetails, formURL, selectedCategory]);

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
      setMeetingData(INITIAL_MEETING_FORM);
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
      <View style={styles.searchContainer}>
        <View style={[styles.searchBar, { backgroundColor: theme.colors.surface }]}>
          <Icon name="search" size={20} color={theme.colors.secondary} />
          <TextInput
            style={[styles.searchInput, { color: theme.colors.text }]}
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

      <OrganizationDetailsModal
        visible={showDetails && !!selectedOrg}
        organization={selectedOrg}
        colors={theme.colors}
        locationText={locationText}
        onClose={() => setShowDetails(false)}
        onEdit={handleEditOrganization}
        onDirections={handleOpenDirections}
        onScheduleMeeting={handleScheduleMeeting}
        onPressPhone={handlePhonePress}
        onPressWhatsApp={handleWhatsAppPress}
        onPressWebsite={handleWebsitePress}
      />

      <EditOrganizationModal
        visible={showEditForm}
        colors={theme.colors}
        formData={editFormData}
        onChange={handleEditInputChange}
        onClose={handleCancelEdit}
        onSubmit={handleSaveEdit}
        organizationName={selectedOrg?.name}
        categoryOptions={categoryOptions}
        onOpenExternalForm={formURL ? handleOpenFormWithParams : undefined}
        previousSchools={previousSchoolsValue}
      />

      <MeetingRequestModal
        visible={showMeetingForm}
        colors={theme.colors}
        formData={meetingData}
        onChange={handleMeetingInputChange}
        onSubmit={submitMeeting}
        onClose={() => setShowMeetingForm(false)}
      />
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
    paddingVertical: 0,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 4,
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
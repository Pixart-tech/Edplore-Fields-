import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Alert, Linking, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../src/firebase';
import { collection, addDoc, doc, getDoc } from 'firebase/firestore';
import { useAuth } from '../../src/context/AuthContext';
import { useLocation } from '../../src/context/LocationContext';
import { useTheme } from '../../src/context/ThemeContext';
import Filter from '../components/filter';
import { Region } from 'react-native-maps';
import OrganizationDetailsModal from '../components/maps/OrganizationDetailsModal';
import EditOrganizationModal, { EditFormState } from '../components/maps/EditOrganizationModal';
import MeetingRequestModal, { MeetingFormState } from '../components/maps/MeetingRequestModal';
import type { Organization } from '../types/organization';

import AssignedAreasSection from './maps/AssignedAreasSection';
import CategoryLegend from './maps/CategoryLegend';
import LiveTrackingLegend from './maps/LiveTrackingLegend';
import LoadingState from './maps/LoadingState';
import MapContent from './maps/MapContent';
import SearchBar from './maps/SearchBar';
import styles from './maps/styles';
import {
  INITIAL_EDIT_FORM,
  INITIAL_MEETING_FORM,
  LIVE_TRACKING_COLORS,
  CATEGORY_OPTIONS,
  CURRENT_PUBLICATION_OPTIONS,
  CURRENT_STATUS_OPTIONS,
  CURRENT_STATUS_DETAIL_OPTIONS,
  WHATSAPP_OPTIONS,
  GUEST_OPTIONS,
  ADD_ON_OPTIONS,
  FORM_ENTRY_IDS,
} from './maps/constants';
import type { AssignedAreaData } from './maps/types';

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
  const [userAssignedData, setUserAssignedData] = useState<AssignedAreaData | null>(null);
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

  const categoryOptions = CATEGORY_OPTIONS;

  const categoryLegendItems = useMemo(() => {
    const seen = new Set<string>();
    const ordered: string[] = [];

    filteredOrganizations.forEach((org) => {
      const category = org.category?.trim();
      if (!category || seen.has(category)) {
        return;
      }

      seen.add(category);
      ordered.push(category);
    });

    return ordered;
  }, [filteredOrganizations]);

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
          mapsUrl: item['Maps URL'] || item['Maps Link'] || item.mapsUrl || item['Map URL'] || '',
          name: item.Title || 'Unknown Organization',
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
          currentStatus: item['Current Status'] || '',
          currentStatusDetails: item['Current Status Details'] || '',
          assignee: item.Asignee || '',
          whatsapp: item.Whatsapp || '',
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

  const handleEditOrganization = useCallback(() => {
    if (!selectedOrg) {
      return;
    }

    const formLink = selectedOrg.formUrl || selectedOrg.mapsUrl || null;
    const categoryFromForm = extractFormEntryValue(formLink, 'entry.1748805668');
    const resolvedCategory = categoryFromForm || selectedOrg.category || '';
    const previousSchools = extractFormEntryValue(formLink, 'entry.1597701263');

    setFormURL(formLink);
    setSelectedCategory(resolvedCategory);
    setPreviousSchoolsValue(previousSchools ? previousSchools : null);

    const publicationName = selectedOrg.currentPublicationName?.trim() ?? '';
    const publicationInOptions = publicationName && CURRENT_PUBLICATION_OPTIONS.includes(publicationName);
    const currentPublication = publicationInOptions ? publicationName : publicationName ? 'Other' : '';
    const currentPublicationOther = publicationInOptions ? '' : publicationName;

    const whatsappValue = selectedOrg.whatsapp && WHATSAPP_OPTIONS.includes(selectedOrg.whatsapp)
      ? selectedOrg.whatsapp
      : '';

    const addOnList = selectedOrg.addOns
      ? selectedOrg.addOns
          .split(',')
          .map((item) => item.trim())
          .filter(Boolean)
      : [];
    const recognizedAddOns = addOnList.filter((item) => ADD_ON_OPTIONS.includes(item));
    const otherAddOns = addOnList.filter((item) => !ADD_ON_OPTIONS.includes(item));
    const addOnsSelection = Array.from(
      new Set(
        recognizedAddOns
          .filter((item) => item !== 'Other')
          .concat(otherAddOns.length > 0 || recognizedAddOns.includes('Other') ? ['Other'] : [])
      )
    );
    const addOnsOther = otherAddOns.join(', ');

    setEditFormData({
      name: selectedOrg.name,
      contact: selectedOrg.contact ?? '',
      whatsapp: whatsappValue,
      category: resolvedCategory,
      pulseCode: selectedOrg.pulseCode ?? '',
      status: selectedOrg.status ?? '',
      currentPublication,
      currentPublicationOther,
      currentStatus: selectedOrg.currentStatus ?? '',
      currentStatusDetails: selectedOrg.currentStatusDetails ?? '',
      assignee: selectedOrg.assignee ?? '',
      addOns: addOnsSelection,
      addOnsOther,
    });
    setShowDetails(false);
    setShowEditForm(true);
  }, [extractFormEntryValue, selectedOrg]);

  const handleEditInputChange = useCallback(
    (field: keyof EditFormState, value: EditFormState[keyof EditFormState]) => {
      setEditFormData((prev) => ({ ...prev, [field]: value }));
      if (field === 'category' && typeof value === 'string') {
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

      const recordKey =  organization.pulseCode || organization.mapsUrl;
      if (!recordKey) {
        console.warn('Missing record key for organization update:', organization.mapsUrl);
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

    const resolvedPublication =
      editFormData.currentPublication === 'Other'
        ? editFormData.currentPublicationOther.trim()
        : editFormData.currentPublication;

    const guestEntries = new Set<string>();
    editFormData.guests.forEach((guest) => {
      const trimmed = guest.trim();
      if (trimmed) {
        guestEntries.add(trimmed);
      }
    });
    editFormData.additionalGuests
      .split(',')
      .map((guest) => guest.trim())
      .filter(Boolean)
      .forEach((guest) => guestEntries.add(guest));
    const guestsValue = Array.from(guestEntries).join(', ');

    const addOnEntries: string[] = [];
    editFormData.addOns.forEach((item) => {
      if (item !== 'Other' && item.trim()) {
        addOnEntries.push(item.trim());
      }
    });
    if (editFormData.addOns.includes('Other')) {
      editFormData.addOnsOther
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((item) => addOnEntries.push(item));
    }
    const addOnsValue = Array.from(new Set(addOnEntries)).join(', ');

    const updatedOrg: Organization = {
      ...selectedOrg,
      name: editFormData.name,
      contact: editFormData.contact,
      whatsapp: editFormData.whatsapp,
      category: editFormData.category,
      pulseCode: editFormData.pulseCode,
      status: editFormData.status,
      currentStatus: editFormData.currentStatus,
      currentStatusDetails: editFormData.currentStatusDetails,
      assignee: editFormData.assignee,
      currentPublicationName: resolvedPublication,
      addOns: addOnsValue,
    };

    setOrganizations((prev) => prev.map((org) => (org.mapsUrl === updatedOrg.mapsUrl ? updatedOrg : org)));
    setFilteredOrganizations((prev) => prev.map((org) => (org.mapsUrl === updatedOrg.mapsUrl ? updatedOrg : org)));
    setAssignedOrganizations((prev) => prev.map((org) => (org.mapsUrl === updatedOrg.mapsUrl ? updatedOrg : org)));
    setFilterMarkers((prev) => {
      if (!prev) {
        return prev;
      }
      return prev.map((org) => (org.mapsUrl === updatedOrg.mapsUrl ? updatedOrg : org));
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

    const { latitude, longitude, name } = selectedOrg;

    if (typeof latitude !== 'number' || typeof longitude !== 'number' || Number.isNaN(latitude) || Number.isNaN(longitude)) {
      Alert.alert('Directions unavailable', 'This organization does not have valid coordinates.');
      return;
    }

    const baseUrl = 'https://www.google.com/maps/dir/?api=1';
    const queryParams = [`destination=${encodeURIComponent(`${latitude},${longitude}`)}`];

    const label = [name].filter(Boolean).join(' ');
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
    const applyEntryValue = (
      url: string,
      entryId: string,
      value: string,
      options?: { append?: boolean }
    ) => {
      const trimmed = value.trim();
      if (!trimmed) {
        return url;
      }

      const entryPattern = entryId.replace(/\./g, '\\.');
      const regex = new RegExp(`${entryPattern}=([^&]*)`);
      const encodedValue = encodeURIComponent(trimmed);
      const hasEntry = regex.test(url);

      if (options?.append && hasEntry) {
        const match = url.match(regex);
        if (match) {
          const existingValue = match[1];
          const combined = existingValue ? `${existingValue}%0A${encodedValue}` : encodedValue;
          return url.replace(regex, `${entryId}=${combined}`);
        }
      }

      if (hasEntry) {
        return url.replace(regex, `${entryId}=${encodedValue}`);
      }

      const separator = url.includes('?') ? '&' : '?';
      return `${url}${separator}${entryId}=${encodedValue}`;
    };

    const publicationSelection = editFormData.currentPublication;
    const publicationOtherForForm =
      editFormData.currentPublication === 'Other' ? editFormData.currentPublicationOther : '';

    const guestEntriesForForm = new Set<string>();
    editFormData.guests.forEach((guest) => {
      const trimmed = guest.trim();
      if (trimmed) {
        guestEntriesForForm.add(trimmed);
      }
    });
    editFormData.additionalGuests
      .split(',')
      .map((guest) => guest.trim())
      .filter(Boolean)
      .forEach((guest) => guestEntriesForForm.add(guest));

    const addOnEntriesForForm: string[] = [];
    editFormData.addOns.forEach((item) => {
      if (item !== 'Other' && item.trim()) {
        addOnEntriesForForm.push(item.trim());
      }
    });
    if (editFormData.addOns.includes('Other')) {
      editFormData.addOnsOther
        .split(',')
        .map((item) => item.trim())
        .filter(Boolean)
        .forEach((item) => addOnEntriesForForm.push(item));
    }

    const addOnsForForm = Array.from(new Set(addOnEntriesForForm)).join(', ');

    updatedUrl = applyEntryValue(updatedUrl, FORM_ENTRY_IDS.name, editFormData.name);
    updatedUrl = applyEntryValue(updatedUrl, FORM_ENTRY_IDS.address, editFormData.address);
    updatedUrl = applyEntryValue(updatedUrl, FORM_ENTRY_IDS.contact, editFormData.contact);
    updatedUrl = applyEntryValue(updatedUrl, FORM_ENTRY_IDS.whatsapp, editFormData.whatsapp);
    updatedUrl = applyEntryValue(updatedUrl, FORM_ENTRY_IDS.category, selectedCategory || editFormData.category);
    updatedUrl = applyEntryValue(updatedUrl, FORM_ENTRY_IDS.pulseCode, editFormData.pulseCode);
    updatedUrl = applyEntryValue(updatedUrl, FORM_ENTRY_IDS.status, editFormData.status);
    updatedUrl = applyEntryValue(updatedUrl, FORM_ENTRY_IDS.currentPublication, publicationSelection);
    updatedUrl = applyEntryValue(updatedUrl, FORM_ENTRY_IDS.currentPublicationOther, publicationOtherForForm);
    updatedUrl = applyEntryValue(updatedUrl, FORM_ENTRY_IDS.currentStatus, editFormData.currentStatus);
    updatedUrl = applyEntryValue(
      updatedUrl,
      FORM_ENTRY_IDS.currentStatusDetails,
      editFormData.currentStatusDetails,
      { append: true }
    );
    updatedUrl = applyEntryValue(updatedUrl, FORM_ENTRY_IDS.assignee, editFormData.assignee);
    updatedUrl = applyEntryValue(updatedUrl, FORM_ENTRY_IDS.guests, Array.from(guestEntriesForForm).join(', '));
    updatedUrl = applyEntryValue(updatedUrl, FORM_ENTRY_IDS.additionalGuests, editFormData.additionalGuests);
    updatedUrl = applyEntryValue(updatedUrl, FORM_ENTRY_IDS.addOns, addOnsForForm);
    updatedUrl = applyEntryValue(updatedUrl, FORM_ENTRY_IDS.addOnsOther, editFormData.addOnsOther);

    try {
      Linking.openURL(updatedUrl);
    } catch (error) {
      console.error('Error opening edit form:', error);
      Alert.alert('Error', 'Unable to open the edit form link.');
    }
  }, [editFormData, formURL, selectedCategory]);

  const submitMeeting = async () => {
    if (!meetingData.title || !meetingData.scheduledTime) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    try {
      await addDoc(collection(db, 'meetings'), {
        title: meetingData.title,
        description: meetingData.description || null,
        location_id: selectedOrg?.mapsUrl,
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

    const markerIdSet = new Set(nextMarkers.map((marker) => marker.mapsUrl));
    const matchesAllOrganizations =
      nextMarkers.length === organizations.length &&
      organizations.every((org) => markerIdSet.has(org.mapsUrl));

    setFilterMarkers(matchesAllOrganizations ? null : nextMarkers);
  };

  if (loading) {
    return <LoadingState colors={theme.colors} />;
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: theme.colors.background }]}> 
      <SearchBar
        value={searchQuery}
        onChange={setSearchQuery}
        onClear={() => setSearchQuery('')}
        colors={theme.colors}
      />

      {userAssignedData && (
        <AssignedAreasSection
          cities={userAssignedData.cities}
          areas={userAssignedData.areas}
          colors={theme.colors}
        />
      )}

      <CategoryLegend categories={categoryLegendItems} colors={theme.colors} />

      {user?.role === 'admin' && (
        <LiveTrackingLegend
          liveUsers={liveUsers}
          colors={theme.colors}
          colorMap={liveUserColors}
        />
      )}

      <View style={{ flex: 1 }}>
        <MapContent
          organizations={filteredOrganizations}
          computedMapRegion={computedMapRegion}
          visibleRegion={visibleRegion}
          onRegionChange={setVisibleRegion}
          onOrganizationPress={handleOrganizationPress}
          colors={theme.colors}
          liveUsers={liveUsers}
          liveUserColors={liveUserColors}
          showLiveTracking={user?.role === 'admin'}
        />

        {organizations.length > 0 && (
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
        currentPublicationOptions={CURRENT_PUBLICATION_OPTIONS}
        currentStatusOptions={CURRENT_STATUS_OPTIONS}
        currentStatusDetailOptions={CURRENT_STATUS_DETAIL_OPTIONS}
        whatsappOptions={WHATSAPP_OPTIONS}
        guestOptions={GUEST_OPTIONS}
        addOnOptions={ADD_ON_OPTIONS}
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

export default MapsScreen;
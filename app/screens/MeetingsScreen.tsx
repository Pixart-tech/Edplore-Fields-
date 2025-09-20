import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  RefreshControl,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../src/firebase';
import {
  collection,
  query,
  orderBy,
  where,
  doc,
  setDoc,
  onSnapshot,
} from 'firebase/firestore';
import type { Unsubscribe } from 'firebase/firestore';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import Icon from '@expo/vector-icons/MaterialIcons';
import DateTimePicker from '@react-native-community/datetimepicker';
import {
  cancelCalendarEvents,
  createCalendarEvents,
  getSharedCalendarEmail,
  updateCalendarEvents,
  CalendarSyncResult,
} from '../../src/services/calendar';

interface Meeting {
  _id: string;
  title: string;
  username: string;
  userEmail: string;
  meetingReason: string;
  meetingDateTime: string;
  meetingEndDateTime?: string | null;
  approvalStatus: 'pending' | 'approved' | 'rejected';
  requestType: 'approval' | 'direct';
  organizationMapsUrl?: string | null;
  organizationCity?: string | null;
  createdAt: string;
  updatedAt?: string;
  requestedBy?: string | null;
  approvalNotes?: string | null;
  ownerCalendarEventId?: string | null;
  sharedCalendarEventId?: string | null;
  calendarSyncEnabled?: boolean;
  approvedAt?: string | null;
  approvedBy?: string | null;
  rejectedAt?: string | null;
}

const MeetingsScreen: React.FC = () => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvalNotes, setApprovalNotes] = useState('');
  const [view, setView] = useState<'list' | 'calendar'>('list');
  const [rescheduleDateTime, setRescheduleDateTime] = useState<Date | null>(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

  const normalizeMeeting = useCallback(
    (id: string, data: Record<string, any>): Meeting => {
      const fallbackDate = new Date().toISOString();
      const start = (data.meetingDateTime as string) || (data.scheduled_time as string) || fallbackDate;
      const end = (data.meetingEndDateTime as string) || null;
      const reason = (data.meetingReason as string) || (data.description as string) || '';
      const approvalStatus =
        (data.approvalStatus as Meeting['approvalStatus']) || (data.status as Meeting['approvalStatus']) || 'pending';
      const inferredRequestType =
        (data.requestType as Meeting['requestType']) ||
        (approvalStatus === 'approved' && data.created_by === data.approvedBy ? 'direct' : 'approval');

      return {
        _id: id,
        title: (data.title as string) || 'Untitled Meeting',
        username:
          (data.username as string) ||
          (data.created_by as string) ||
          (data.userEmail as string) ||
          'Unknown User',
        userEmail: (data.userEmail as string) || (data.created_by as string) || '',
        meetingReason: reason,
        meetingDateTime: start,
        meetingEndDateTime: end,
        approvalStatus,
        requestType: inferredRequestType || 'approval',
        organizationMapsUrl: (data.organizationMapsUrl as string) ?? (data.location_id as string) ?? null,
        organizationCity: (data.organizationCity as string) ?? null,
        createdAt: (data.createdAt as string) || (data.created_at as string) || fallbackDate,
        updatedAt: (data.updatedAt as string) || (data.updated_at as string) || undefined,
        requestedBy: (data.requestedBy as string) || (data.created_by as string) || null,
        approvalNotes: (data.approvalNotes as string) || (data.notes as string) || null,
        ownerCalendarEventId: (data.ownerCalendarEventId as string) ?? null,
        sharedCalendarEventId: (data.sharedCalendarEventId as string) ?? null,
        calendarSyncEnabled: (data.calendarSyncEnabled as boolean) ?? false,
        approvedAt: (data.approvedAt as string) ?? null,
        approvedBy: (data.approvedBy as string) ?? null,
        rejectedAt: (data.rejectedAt as string) ?? null,
      };
    },
    []
  );

  useEffect(() => {
    if (!user) {
      return;
    }

    setLoading(true);
    const meetingsRef = collection(db, 'meetings');
    const constraints =
      user.role === 'admin'
        ? [orderBy('meetingDateTime', 'asc')]
        : [where('userEmail', '==', user.email || ''), orderBy('meetingDateTime', 'asc')];
    const meetingsQuery = query(meetingsRef, ...constraints);

    const unsubscribe: Unsubscribe = onSnapshot(
      meetingsQuery,
      (snapshot) => {
        const mapped = snapshot.docs.map((docSnap) => normalizeMeeting(docSnap.id, docSnap.data()));
        setMeetings(mapped);
        setLoading(false);
        setRefreshing(false);
      },
      (error) => {
        console.error('Error loading meetings:', error);
        Alert.alert('Error', 'Failed to load meetings');
        setLoading(false);
        setRefreshing(false);
      }
    );

    return () => unsubscribe();
  }, [normalizeMeeting, user]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  }, []);

  const handleMeetingAction = useCallback((meeting: Meeting) => {
    setSelectedMeeting(meeting);
    setRescheduleDateTime(meeting.meetingDateTime ? new Date(meeting.meetingDateTime) : new Date());
    setApprovalNotes(meeting.approvalNotes || '');
    setShowApprovalModal(true);
  }, []);

  const closeApprovalModal = useCallback(() => {
    setShowApprovalModal(false);
    setApprovalNotes('');
    setSelectedMeeting(null);
    setRescheduleDateTime(null);
    setShowPicker(false);
  }, []);

  useEffect(() => {
    if (!showApprovalModal) {
      setShowPicker(false);
    }
  }, [showApprovalModal]);

  const openPicker = useCallback((mode: 'date' | 'time') => {
    setPickerMode(mode);
    setShowPicker(true);
  }, []);

  const handlePickerChange = useCallback(
    (_: unknown, date?: Date) => {
      if (Platform.OS !== 'ios') {
        setShowPicker(false);
      }

      if (!date) {
        return;
      }

      setRescheduleDateTime((prev) => {
        const base = prev || (selectedMeeting?.meetingDateTime ? new Date(selectedMeeting.meetingDateTime) : new Date());
        const updated = new Date(base);
        if (pickerMode === 'date') {
          updated.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
        } else {
          updated.setHours(date.getHours(), date.getMinutes(), 0, 0);
        }
        return updated;
      });
    },
    [pickerMode, selectedMeeting]
  );

  const handleDecision = useCallback(
    async (status: 'approved' | 'rejected') => {
      if (!selectedMeeting) {
        return;
      }

      try {
        const baseDate = rescheduleDateTime || (selectedMeeting.meetingDateTime ? new Date(selectedMeeting.meetingDateTime) : new Date());
        if (Number.isNaN(baseDate.getTime())) {
          Alert.alert('Invalid date', 'Please choose a valid meeting time before continuing.');
          return;
        }

        const startTime = new Date(baseDate);
        const endTime = (() => {
          if (selectedMeeting.meetingEndDateTime) {
            const existingEnd = new Date(selectedMeeting.meetingEndDateTime);
            if (!Number.isNaN(existingEnd.getTime())) {
              const duration = existingEnd.getTime() - new Date(selectedMeeting.meetingDateTime).getTime();
              if (!Number.isNaN(duration) && duration > 0) {
                return new Date(startTime.getTime() + duration);
              }
            }
          }
          const fallback = new Date(startTime);
          fallback.setMinutes(fallback.getMinutes() + 30);
          return fallback;
        })();

        const nowIso = new Date().toISOString();
        const updatePayload: Record<string, any> = {
          approvalStatus: status,
          approvalNotes: approvalNotes || null,
          meetingDateTime: startTime.toISOString(),
          meetingEndDateTime: endTime.toISOString(),
          updatedAt: nowIso,
          approvedBy: user?.email || user?.name || 'admin',
        };

        if (status === 'approved') {
          updatePayload.approvedAt = nowIso;
          const attendees = [selectedMeeting.userEmail, getSharedCalendarEmail()].filter(Boolean) as string[];
          const descriptionLines = [
            `Meeting with ${selectedMeeting.title}`,
            `Reason: ${selectedMeeting.meetingReason}`,
            `Requested by: ${selectedMeeting.username}`,
            selectedMeeting.userEmail ? `Email: ${selectedMeeting.userEmail}` : null,
          ].filter(Boolean) as string[];

          let calendarResult: CalendarSyncResult | null = null;
          if (selectedMeeting.ownerCalendarEventId || selectedMeeting.sharedCalendarEventId) {
            calendarResult = await updateCalendarEvents({
              title: selectedMeeting.title,
              description: descriptionLines.join('\n'),
              start: startTime.toISOString(),
              end: endTime.toISOString(),
              attendees,
              organizer: selectedMeeting.userEmail || getSharedCalendarEmail(),
              status: 'confirmed',
              ownerEventId: selectedMeeting.ownerCalendarEventId,
              sharedEventId: selectedMeeting.sharedCalendarEventId,
            });
          } else {
            calendarResult = await createCalendarEvents({
              title: selectedMeeting.title,
              description: descriptionLines.join('\n'),
              start: startTime.toISOString(),
              end: endTime.toISOString(),
              attendees,
              organizer: selectedMeeting.userEmail || getSharedCalendarEmail(),
              status: 'confirmed',
              ownerEventId: null,
              sharedEventId: null,
            });
          }

          if (calendarResult?.ownerEventId || calendarResult?.sharedEventId) {
            updatePayload.ownerCalendarEventId =
              calendarResult.ownerEventId ?? selectedMeeting.ownerCalendarEventId ?? null;
            updatePayload.sharedCalendarEventId =
              calendarResult.sharedEventId ?? selectedMeeting.sharedCalendarEventId ?? null;
          }
        } else {
          updatePayload.rejectedAt = nowIso;
          if (selectedMeeting.ownerCalendarEventId || selectedMeeting.sharedCalendarEventId) {
            await cancelCalendarEvents({
              ownerEventId: selectedMeeting.ownerCalendarEventId,
              sharedEventId: selectedMeeting.sharedCalendarEventId,
              reason: approvalNotes || 'Meeting rejected by admin',
            });
            updatePayload.ownerCalendarEventId = null;
            updatePayload.sharedCalendarEventId = null;
          }
        }

        await setDoc(doc(db, 'meetings', selectedMeeting._id), updatePayload, { merge: true });
        Alert.alert('Success', `Meeting ${status} successfully`);
        closeApprovalModal();
      } catch (error) {
        console.error('Error updating meeting:', error);
        Alert.alert('Error', 'Failed to update meeting');
      }
    },
    [approvalNotes, closeApprovalModal, rescheduleDateTime, selectedMeeting, user]
  );

  const formattedRescheduleDate = useMemo(() => {
    if (!rescheduleDateTime) {
      return 'Select date';
    }
    return rescheduleDateTime.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [rescheduleDateTime]);

  const formattedRescheduleTime = useMemo(() => {
    if (!rescheduleDateTime) {
      return 'Select time';
    }
    return rescheduleDateTime.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [rescheduleDateTime]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return theme.colors.success;
      case 'rejected':
        return theme.colors.error;
      case 'pending':
        return theme.colors.warning;
      default:
        return theme.colors.secondary;
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return 'check-circle';
      case 'rejected':
        return 'cancel';
      case 'pending':
        return 'schedule';
      default:
        return 'help';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const groupMeetingsByDate = (meetings: Meeting[]) => {
    const groups: { [key: string]: Meeting[] } = {};

    meetings.forEach((meeting) => {
      const date = new Date(meeting.meetingDateTime).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(meeting);
    });

    return Object.entries(groups).sort(([a], [b]) => 
      new Date(a).getTime() - new Date(b).getTime()
    );
  };

  const MeetingCard: React.FC<{ meeting: Meeting }> = ({ meeting }) => {
    const requestLabel =
      meeting.requestType === 'direct' ? 'Direct meeting' : 'Approval required';

    return (
      <View style={[styles.meetingCard, { backgroundColor: theme.colors.surface }]}>
        <View style={styles.meetingHeader}>
          <View style={styles.meetingTitle}>
            <Text style={[styles.meetingTitleText, { color: theme.colors.text }]}>
              {meeting.title}
            </Text>
            <View style={[styles.statusBadge, { backgroundColor: getStatusColor(meeting.approvalStatus) }]}>
              <Icon name={getStatusIcon(meeting.approvalStatus)} size={16} color="#fff" />
              <Text style={styles.statusText}>{meeting.approvalStatus.toUpperCase()}</Text>
            </View>
          </View>
        </View>

        <View style={styles.meetingDetails}>
          <View style={styles.detailRow}>
            <Icon name="schedule" size={16} color={theme.colors.secondary} />
            <Text style={[styles.detailText, { color: theme.colors.secondary }]}>
              {formatDate(meeting.meetingDateTime)}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="event-available" size={16} color={theme.colors.secondary} />
            <Text style={[styles.detailText, { color: theme.colors.secondary }]}>{requestLabel}</Text>
          </View>

          <View style={styles.detailRow}>
            <Icon name="person" size={16} color={theme.colors.secondary} />
            <Text style={[styles.detailText, { color: theme.colors.secondary }]}>
              {meeting.username}
              {meeting.userEmail ? ` • ${meeting.userEmail}` : ''}
            </Text>
          </View>

          {meeting.meetingReason ? (
            <View style={styles.detailRow}>
              <Icon name="chat" size={16} color={theme.colors.secondary} />
              <Text style={[styles.detailText, { color: theme.colors.secondary }]}>
                {meeting.meetingReason}
              </Text>
            </View>
          ) : null}

          {meeting.organizationCity || meeting.organizationMapsUrl ? (
            <View style={styles.detailRow}>
              <Icon name="domain" size={16} color={theme.colors.secondary} />
              <Text style={[styles.detailText, { color: theme.colors.secondary }]} numberOfLines={1}>
                {meeting.organizationCity || meeting.organizationMapsUrl}
              </Text>
            </View>
          ) : null}
        </View>

        {user?.role === 'admin' && meeting.approvalStatus === 'pending' && (
          <View style={styles.meetingActions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.approveButton, { backgroundColor: theme.colors.success }]}
              onPress={() => handleMeetingAction(meeting)}
            >
              <Icon name="check" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Approve</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.rejectButton, { backgroundColor: theme.colors.error }]}
              onPress={() => handleMeetingAction(meeting)}
            >
              <Icon name="close" size={16} color="#fff" />
              <Text style={styles.actionButtonText}>Reject</Text>
            </TouchableOpacity>
          </View>
        )}

        {meeting.approvalNotes && (
          <View style={styles.notesSection}>
            <Text style={[styles.notesLabel, { color: theme.colors.secondary }]}>Admin Notes:</Text>
            <Text style={[styles.notesText, { color: theme.colors.text }]}>{meeting.approvalNotes}</Text>
          </View>
        )}
      </View>
    );
  };

  const renderListView = () => {
    const groupedMeetings = groupMeetingsByDate(meetings);

    return (
      <ScrollView
        style={styles.scrollView}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {groupedMeetings.map(([date, dateMeetings]) => (
          <View key={date} style={styles.dateGroup}>
            <Text style={[styles.dateHeader, { color: theme.colors.text }]}>
              {new Date(date).toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
              })}
            </Text>
            {dateMeetings.map((meeting) => (
              <MeetingCard key={meeting._id} meeting={meeting} />
            ))}
          </View>
        ))}

        {meetings.length === 0 && (
          <View style={styles.emptyState}>
            <Icon name="event-busy" size={64} color={theme.colors.secondary} />
            <Text style={[styles.emptyStateText, { color: theme.colors.secondary }]}>
              No meetings found
            </Text>
          </View>
        )}
      </ScrollView>
    );
  };

  const renderCalendarView = () => {
    // Simplified calendar view - in a real app, you'd use a proper calendar library
    return (
      <ScrollView style={styles.scrollView}>
        <View style={styles.calendarPlaceholder}>
          <Icon name="calendar-today" size={64} color={theme.colors.secondary} />
          <Text style={[styles.calendarPlaceholderText, { color: theme.colors.secondary }]}>
            Calendar view coming soon
          </Text>
          <Text style={[styles.calendarPlaceholderSubtext, { color: theme.colors.secondary }]}>
            Use list view for now
          </Text>
        </View>
      </ScrollView>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text style={[styles.headerTitle, { color: theme.colors.text }]}>
          {user?.role === 'admin' ? 'All Meetings' : 'My Meetings'}
        </Text>
        
        <View style={styles.viewToggle}>
          <TouchableOpacity
            style={[
              styles.toggleButton,
              view === 'list' && { backgroundColor: theme.colors.primary },
              { borderColor: theme.colors.primary },
            ]}
            onPress={() => setView('list')}
          >
            <Icon name="list" size={20} color={view === 'list' ? '#fff' : theme.colors.primary} />
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.toggleButton,
              view === 'calendar' && { backgroundColor: theme.colors.primary },
              { borderColor: theme.colors.primary },
            ]}
            onPress={() => setView('calendar')}
          >
            <Icon name="calendar-today" size={20} color={view === 'calendar' ? '#fff' : theme.colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {user?.role === 'admin' && (
        <View style={styles.statsRow}>
          <View style={[styles.statItem, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.statValue, { color: theme.colors.warning }]}>
              {meetings.filter((m) => m.approvalStatus === 'pending').length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.secondary }]}>Pending</Text>
          </View>
          
          <View style={[styles.statItem, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.statValue, { color: theme.colors.success }]}>
              {meetings.filter((m) => m.approvalStatus === 'approved').length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.secondary }]}>Approved</Text>
          </View>
          
          <View style={[styles.statItem, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.statValue, { color: theme.colors.error }]}>
              {meetings.filter((m) => m.approvalStatus === 'rejected').length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.secondary }]}>Rejected</Text>
          </View>
        </View>
      )}

      {view === 'list' ? renderListView() : renderCalendarView()}

      {/* Approval Modal */}
      <Modal
        visible={showApprovalModal}
        animationType="slide"
        transparent
        onRequestClose={closeApprovalModal}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Review Meeting
              </Text>
              <TouchableOpacity onPress={closeApprovalModal}>
                <Icon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.meetingTitle, { color: theme.colors.text }]}>
                {selectedMeeting?.title}
              </Text>

              {selectedMeeting && (
                <>
                  <View style={styles.modalInfoRow}>
                    <Icon name="schedule" size={18} color={theme.colors.secondary} />
                    <Text style={[styles.modalInfoText, { color: theme.colors.secondary }]}>
                      {formatDate(selectedMeeting.meetingDateTime)}
                    </Text>
                  </View>

                  {selectedMeeting.meetingReason ? (
                    <View style={styles.modalInfoRow}>
                      <Icon name="chat" size={18} color={theme.colors.secondary} />
                      <Text
                        style={[styles.modalInfoText, { color: theme.colors.secondary }]}
                        numberOfLines={3}
                      >
                        {selectedMeeting.meetingReason}
                      </Text>
                    </View>
                  ) : null}
                </>
              )}

              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Adjust Date & Time</Text>
              <View style={styles.modalPickerRow}>
                <TouchableOpacity
                  style={[styles.modalPickerButton, { borderColor: theme.colors.border }]}
                  onPress={() => openPicker('date')}
                >
                  <Icon name="event" size={18} color={theme.colors.secondary} />
                  <Text style={[styles.modalPickerText, { color: theme.colors.text }]}>
                    {formattedRescheduleDate}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.modalPickerButton, styles.modalPickerButtonEnd, { borderColor: theme.colors.border }]}
                  onPress={() => openPicker('time')}
                >
                  <Icon name="schedule" size={18} color={theme.colors.secondary} />
                  <Text style={[styles.modalPickerText, { color: theme.colors.text }]}>
                    {formattedRescheduleTime}
                  </Text>
                </TouchableOpacity>
              </View>

              {showPicker && (
                <View style={styles.modalPickerContainer}>
                  {Platform.OS === 'ios' && (
                    <View style={styles.modalPickerHeader}>
                      <TouchableOpacity onPress={() => setShowPicker(false)}>
                        <Text style={[styles.modalPickerCloseText, { color: theme.colors.primary }]}>Done</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                  <DateTimePicker
                    value={rescheduleDateTime ?? new Date()}
                    mode={pickerMode}
                    display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                    onChange={handlePickerChange}
                    minimumDate={new Date()}
                  />
                </View>
              )}

              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>Admin Notes (Optional)</Text>
              <TextInput
                style={[styles.textArea, { borderColor: theme.colors.border, color: theme.colors.text }]}
                value={approvalNotes}
                onChangeText={setApprovalNotes}
                placeholder="Add notes for the requester..."
                placeholderTextColor={theme.colors.secondary}
                multiline
                numberOfLines={3}
              />
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.success }]}
                onPress={() => handleDecision('approved')}
              >
                <Icon name="check" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Approve</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.error, marginLeft: 12 }]}
                onPress={() => handleDecision('rejected')}
              >
                <Icon name="close" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Reject</Text>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  viewToggle: {
    flexDirection: 'row',
    borderRadius: 8,
    overflow: 'hidden',
  },
  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  statsRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 16,
    gap: 12,
  },
  statItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  scrollView: {
    flex: 1,
    paddingHorizontal: 16,
  },
  dateGroup: {
    marginBottom: 24,
  },
  dateHeader: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  meetingCard: {
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
  meetingHeader: {
    marginBottom: 12,
  },
  meetingTitle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  meetingTitleText: {
    fontSize: 18,
    fontWeight: '600',
    flex: 1,
    marginRight: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
  },
  meetingDetails: {
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  detailText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  meetingActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 6,
  },
  approveButton: {
    flex: 1,
  },
  rejectButton: {
    flex: 1,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 4,
  },
  notesSection: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  notesLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 4,
  },
  notesText: {
    fontSize: 14,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  emptyStateText: {
    fontSize: 16,
    marginTop: 16,
  },
  calendarPlaceholder: {
    alignItems: 'center',
    paddingVertical: 64,
  },
  calendarPlaceholderText: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 16,
  },
  calendarPlaceholderSubtext: {
    fontSize: 14,
    marginTop: 8,
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
  modalInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
  },
  modalInfoText: {
    marginLeft: 8,
    fontSize: 14,
    flex: 1,
  },
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
  },
  modalPickerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  modalPickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    marginRight: 12,
  },
  modalPickerButtonEnd: {
    marginRight: 0,
  },
  modalPickerText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  modalPickerContainer: {
    marginTop: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  modalPickerHeader: {
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  modalPickerCloseText: {
    fontSize: 16,
    fontWeight: '600',
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
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
});

export default MeetingsScreen;
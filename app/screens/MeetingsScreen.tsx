import React, { useState, useEffect } from 'react';
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
import { collection, getDocs, query, orderBy, where, doc, setDoc } from 'firebase/firestore';
import { useAuth } from '../../src/context/AuthContext';
import { useTheme } from '../../src/context/ThemeContext';
import Icon from '@expo/vector-icons/MaterialIcons';

interface Meeting {
  _id: string;
  title: string;
  description?: string;
  location_id: string;
  scheduled_time: string;
  attendees: string[];
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  created_by: string;
  notes?: string;
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

  useEffect(() => {
    loadMeetings();
  }, []);

  const loadMeetings = async () => {
    try {
      setLoading(true);
      const meetingsQuery = user?.role === 'admin'
        ? query(collection(db, 'meetings'), orderBy('created_at', 'desc'))
        : query(collection(db, 'meetings'), where('created_by', '==', user?.id || user?.email || ''));
      const snap = await getDocs(meetingsQuery);
      setMeetings(snap.docs.map(d => d.data() as any));
    } catch (error) {
      console.error('Error loading meetings:', error);
      Alert.alert('Error', 'Failed to load meetings');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadMeetings();
    setRefreshing(false);
  };

  const handleMeetingAction = (meeting: Meeting, action: 'approve' | 'reject') => {
    setSelectedMeeting(meeting);
    setShowApprovalModal(true);
  };

  const submitApproval = async (status: 'approved' | 'rejected') => {
    if (!selectedMeeting) return;

    try {
      await setDoc(doc(db, 'meetings', selectedMeeting._id), { status, notes: approvalNotes, updated_at: new Date() }, { merge: true });
      Alert.alert('Success', `Meeting ${status} successfully`);
      setShowApprovalModal(false);
      setApprovalNotes('');
      setSelectedMeeting(null);
      loadMeetings();
    } catch (error) {
      console.error('Error updating meeting:', error);
      Alert.alert('Error', 'Failed to update meeting');
    }
  };

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
      const date = new Date(meeting.scheduled_time).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(meeting);
    });

    return Object.entries(groups).sort(([a], [b]) => 
      new Date(a).getTime() - new Date(b).getTime()
    );
  };

  const MeetingCard: React.FC<{ meeting: Meeting }> = ({ meeting }) => (
    <View style={[styles.meetingCard, { backgroundColor: theme.colors.surface }]}>
      <View style={styles.meetingHeader}>
        <View style={styles.meetingTitle}>
          <Text style={[styles.meetingTitleText, { color: theme.colors.text }]}>
            {meeting.title}
          </Text>
          <View style={[styles.statusBadge, { backgroundColor: getStatusColor(meeting.status) }]}>
            <Icon name={getStatusIcon(meeting.status)} size={16} color="#fff" />
            <Text style={styles.statusText}>{meeting.status.toUpperCase()}</Text>
          </View>
        </View>
      </View>

      <View style={styles.meetingDetails}>
        <View style={styles.detailRow}>
          <Icon name="schedule" size={16} color={theme.colors.secondary} />
          <Text style={[styles.detailText, { color: theme.colors.secondary }]}>
            {formatDate(meeting.scheduled_time)}
          </Text>
        </View>

        <View style={styles.detailRow}>
          <Icon name="location-on" size={16} color={theme.colors.secondary} />
          <Text style={[styles.detailText, { color: theme.colors.secondary }]}>
            Location ID: {meeting.location_id}
          </Text>
        </View>

        {meeting.description && (
          <View style={styles.detailRow}>
            <Icon name="description" size={16} color={theme.colors.secondary} />
            <Text style={[styles.detailText, { color: theme.colors.secondary }]}>
              {meeting.description}
            </Text>
          </View>
        )}

        <View style={styles.detailRow}>
          <Icon name="people" size={16} color={theme.colors.secondary} />
          <Text style={[styles.detailText, { color: theme.colors.secondary }]}>
            {meeting.attendees.length} attendee(s)
          </Text>
        </View>
      </View>

      {user?.role === 'admin' && meeting.status === 'pending' && (
        <View style={styles.meetingActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.approveButton, { backgroundColor: theme.colors.success }]}
            onPress={() => handleMeetingAction(meeting, 'approve')}
          >
            <Icon name="check" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Approve</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.rejectButton, { backgroundColor: theme.colors.error }]}
            onPress={() => handleMeetingAction(meeting, 'reject')}
          >
            <Icon name="close" size={16} color="#fff" />
            <Text style={styles.actionButtonText}>Reject</Text>
          </TouchableOpacity>
        </View>
      )}

      {meeting.notes && (
        <View style={styles.notesSection}>
          <Text style={[styles.notesLabel, { color: theme.colors.secondary }]}>Admin Notes:</Text>
          <Text style={[styles.notesText, { color: theme.colors.text }]}>{meeting.notes}</Text>
        </View>
      )}
    </View>
  );

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
              {meetings.filter(m => m.status === 'pending').length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.secondary }]}>Pending</Text>
          </View>
          
          <View style={[styles.statItem, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.statValue, { color: theme.colors.success }]}>
              {meetings.filter(m => m.status === 'approved').length}
            </Text>
            <Text style={[styles.statLabel, { color: theme.colors.secondary }]}>Approved</Text>
          </View>
          
          <View style={[styles.statItem, { backgroundColor: theme.colors.surface }]}>
            <Text style={[styles.statValue, { color: theme.colors.error }]}>
              {meetings.filter(m => m.status === 'rejected').length}
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
        onRequestClose={() => setShowApprovalModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.surface }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: theme.colors.text }]}>
                Review Meeting
              </Text>
              <TouchableOpacity onPress={() => setShowApprovalModal(false)}>
                <Icon name="close" size={24} color={theme.colors.text} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalBody}>
              <Text style={[styles.meetingTitle, { color: theme.colors.text }]}>
                {selectedMeeting?.title}
              </Text>
              
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                Admin Notes (Optional)
              </Text>
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
                onPress={() => submitApproval('approved')}
              >
                <Icon name="check" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Approve</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: theme.colors.error, marginLeft: 12 }]}
                onPress={() => submitApproval('rejected')}
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
  inputLabel: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
    marginTop: 16,
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
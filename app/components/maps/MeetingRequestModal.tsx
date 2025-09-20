import React, { useEffect, useMemo, useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  TextInput,
  Platform,
} from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import SimpleDateTimePicker from '../common/SimpleDateTimePicker';

type ThemeColors = {
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  border: string;
  success: string;
  warning: string;
  error: string;
};

export type MeetingFormState = {
  organizationTitle: string;
  meetingReason: string;
  meetingDateTime: Date | null;
};

type Props = {
  visible: boolean;
  colors: ThemeColors;
  formData: MeetingFormState;
  onChange: (field: keyof MeetingFormState, value: MeetingFormState[keyof MeetingFormState]) => void;
  onSubmit: (mode: 'approval' | 'direct') => void;
  onClose: () => void;
};

const MeetingRequestModal: React.FC<Props> = ({
  visible,
  colors,
  formData,
  onChange,
  onSubmit,
  onClose,
}) => {
  const [showPicker, setShowPicker] = useState(false);
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date');

  useEffect(() => {
    if (!visible) {
      setShowPicker(false);
      setPickerMode('date');
    }
  }, [visible]);

  const formattedDate = useMemo(() => {
    if (!formData.meetingDateTime) {
      return 'Select date';
    }
    return formData.meetingDateTime.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }, [formData.meetingDateTime]);

  const formattedTime = useMemo(() => {
    if (!formData.meetingDateTime) {
      return 'Select time';
    }
    return formData.meetingDateTime.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  }, [formData.meetingDateTime]);

  const openPicker = (mode: 'date' | 'time') => {
    setPickerMode(mode);
    setShowPicker(true);
  };

  const handlePickerChange = (
    _event: { type: 'set'; nativeEvent: { timestamp: number } },
    selectedDate?: Date,
  ) => {
    if (Platform.OS !== 'ios') {
      setShowPicker(false);
    }

    if (!selectedDate) {
      return;
    }

    const baseDate = formData.meetingDateTime ? new Date(formData.meetingDateTime) : new Date();
    const updatedDate = new Date(baseDate);

    if (pickerMode === 'date') {
      updatedDate.setFullYear(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate());
    } else {
      updatedDate.setHours(selectedDate.getHours(), selectedDate.getMinutes(), 0, 0);
    }

    onChange('meetingDateTime', updatedDate);
  };

  const handleClosePicker = () => {
    setShowPicker(false);
  };

  const renderPicker = () => {
    if (!showPicker) {
      return null;
    }

    const picker = (
      <SimpleDateTimePicker
        value={formData.meetingDateTime ?? new Date()}
        mode={pickerMode}
        onChange={handlePickerChange}
        minimumDate={new Date()}
      />
    );

    if (Platform.OS === 'ios') {
      return (
        <View style={styles.pickerContainer}>
          <View style={styles.pickerHeader}>
            <TouchableOpacity onPress={handleClosePicker}>
              <Text style={[styles.pickerCloseText, { color: colors.primary }]}>Done</Text>
            </TouchableOpacity>
          </View>
          {picker}
        </View>
      );
    }

    return picker;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Schedule Meeting</Text>
            <TouchableOpacity onPress={onClose} accessibilityRole="button">
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            <Text style={[styles.inputLabel, { color: colors.text }]}>Organization</Text>
            <View style={[styles.readOnlyField, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Icon name="domain" size={18} color={colors.secondary} style={styles.fieldIcon} />
              <Text style={[styles.readOnlyText, { color: colors.text }]} numberOfLines={2}>
                {formData.organizationTitle || 'No organization selected'}
              </Text>
            </View>

            <Text style={[styles.inputLabel, { color: colors.text }]}>Meeting Reason *</Text>
            <TextInput
              style={[styles.textArea, { borderColor: colors.border, color: colors.text }]}
              value={formData.meetingReason}
              onChangeText={(value) => onChange('meetingReason', value)}
              placeholder="Describe the purpose of this meeting"
              placeholderTextColor={colors.secondary}
              multiline
              numberOfLines={4}
            />

            <Text style={[styles.inputLabel, { color: colors.text }]}>Meeting Date & Time *</Text>
            <View style={styles.pickerRow}>
              <TouchableOpacity
                style={[styles.pickerButton, styles.dateButton, { borderColor: colors.border }]}
                onPress={() => openPicker('date')}
              >
                <Icon name="event" size={18} color={colors.secondary} />
                <Text style={[styles.pickerText, { color: colors.text }]}>{formattedDate}</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.pickerButton, { borderColor: colors.border }]}
                onPress={() => openPicker('time')}
              >
                <Icon name="schedule" size={18} color={colors.secondary} />
                <Text style={[styles.pickerText, { color: colors.text }]}>{formattedTime}</Text>
              </TouchableOpacity>
            </View>

            {renderPicker()}
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.approvalButton, { backgroundColor: colors.warning }]}
              onPress={() => onSubmit('approval')}
              activeOpacity={0.85}
            >
              <Icon name="approval" size={20} color="#fff" />
              <Text style={styles.actionText}>Take Approval</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.directButton, { backgroundColor: colors.success }]}
              onPress={() => onSubmit('direct')}
              activeOpacity={0.85}
            >
              <Icon name="play-arrow" size={20} color="#fff" />
              <Text style={styles.actionText}>Meet Directly</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
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
  },
  readOnlyField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 16,
  },
  fieldIcon: {
    marginRight: 8,
  },
  readOnlyText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  textInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    marginBottom: 16,
  },
  textArea: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    minHeight: 80,
    textAlignVertical: 'top',
    marginBottom: 16,
  },
  pickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  pickerButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    justifyContent: 'flex-start',
  },
  dateButton: {
    marginRight: 12,
  },
  pickerText: {
    marginLeft: 8,
    fontSize: 16,
    fontWeight: '500',
  },
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  approvalButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
  },
  directButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginLeft: 12,
  },
  actionText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  pickerContainer: {
    marginTop: 16,
    borderRadius: 12,
    overflow: 'hidden',
  },
  pickerHeader: {
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  pickerCloseText: {
    fontSize: 16,
    fontWeight: '600',
  },
});

export default MeetingRequestModal;


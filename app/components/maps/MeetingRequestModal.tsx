import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';

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
  title: string;
  description: string;
  scheduledTime: string;
};

type Props = {
  visible: boolean;
  colors: ThemeColors;
  formData: MeetingFormState;
  onChange: (field: keyof MeetingFormState, value: string) => void;
  onSubmit: () => void;
  onClose: () => void;
};

const MeetingRequestModal: React.FC<Props> = ({ visible, colors, formData, onChange, onSubmit, onClose }) => (
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
          <Text style={[styles.inputLabel, { color: colors.text }]}>Meeting Title *</Text>
          <TextInput
            style={[styles.textInput, { borderColor: colors.border, color: colors.text }]}
            value={formData.title}
            onChangeText={(value) => onChange('title', value)}
            placeholder="Enter meeting title"
            placeholderTextColor={colors.secondary}
          />

          <Text style={[styles.inputLabel, { color: colors.text }]}>Description</Text>
          <TextInput
            style={[styles.textArea, { borderColor: colors.border, color: colors.text }]}
            value={formData.description}
            onChangeText={(value) => onChange('description', value)}
            placeholder="Enter meeting description"
            placeholderTextColor={colors.secondary}
            multiline
            numberOfLines={3}
          />

          <Text style={[styles.inputLabel, { color: colors.text }]}>Scheduled Time *</Text>
          <TextInput
            style={[styles.textInput, { borderColor: colors.border, color: colors.text }]}
            value={formData.scheduledTime}
            onChangeText={(value) => onChange('scheduledTime', value)}
            placeholder="YYYY-MM-DD HH:MM"
            placeholderTextColor={colors.secondary}
          />
        </ScrollView>

        <View style={[styles.modalFooter, { borderTopColor: colors.border }]}> 
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.success }]}
            onPress={onSubmit}
            activeOpacity={0.85}
          >
            <Icon name="send" size={20} color="#fff" />
            <Text style={styles.submitText}>Submit Request</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  </Modal>
);

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
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default MeetingRequestModal;


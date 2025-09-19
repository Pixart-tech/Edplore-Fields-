import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';

import type { Organization } from '../../types/organization';

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

export type EditFormState = {
  name: string;
  address: string;
  status: string;
  currentStatusDetails: string;
  assignee: string;
};

type Props = {
  visible: boolean;
  colors: ThemeColors;
  formData: EditFormState;
  onChange: (field: keyof EditFormState, value: string) => void;
  onClose: () => void;
  onSubmit: () => void;
  organizationName?: Organization['name'];
};

const EditOrganizationModal: React.FC<Props> = ({
  visible,
  colors,
  formData,
  onChange,
  onClose,
  onSubmit,
  organizationName,
}) => (
  <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
    <View style={styles.modalOverlay}>
      <View style={[styles.modalContent, { backgroundColor: colors.surface }]}> 
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}> 
          <View>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Edit Organization</Text>
            {organizationName ? (
              <Text style={[styles.modalSubtitle, { color: colors.secondary }]} numberOfLines={1}>
                {organizationName}
              </Text>
            ) : null}
          </View>
          <TouchableOpacity onPress={onClose} accessibilityRole="button">
            <Icon name="close" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
          <Text style={[styles.inputLabel, { color: colors.text }]}>Name</Text>
          <TextInput
            style={[styles.textInput, { borderColor: colors.border, color: colors.text }]}
            value={formData.name}
            onChangeText={(value) => onChange('name', value)}
            placeholder="Organization name"
            placeholderTextColor={colors.secondary}
          />

          <Text style={[styles.inputLabel, { color: colors.text }]}>Address</Text>
          <TextInput
            style={[styles.textInput, { borderColor: colors.border, color: colors.text }]}
            value={formData.address}
            onChangeText={(value) => onChange('address', value)}
            placeholder="Organization address"
            placeholderTextColor={colors.secondary}
          />

          <Text style={[styles.inputLabel, { color: colors.text }]}>Status</Text>
          <TextInput
            style={[styles.textInput, { borderColor: colors.border, color: colors.text }]}
            value={formData.status}
            onChangeText={(value) => onChange('status', value)}
            placeholder="Current status"
            placeholderTextColor={colors.secondary}
          />

          <Text style={[styles.inputLabel, { color: colors.text }]}>Status Details</Text>
          <TextInput
            style={[styles.textArea, { borderColor: colors.border, color: colors.text }]}
            value={formData.currentStatusDetails}
            onChangeText={(value) => onChange('currentStatusDetails', value)}
            placeholder="Additional details"
            placeholderTextColor={colors.secondary}
            multiline
          />

          <Text style={[styles.inputLabel, { color: colors.text }]}>Assignee</Text>
          <TextInput
            style={[styles.textInput, { borderColor: colors.border, color: colors.text }]}
            value={formData.assignee}
            onChangeText={(value) => onChange('assignee', value)}
            placeholder="Assigned to"
            placeholderTextColor={colors.secondary}
          />
        </ScrollView>

        <View style={[styles.modalFooter, { borderTopColor: colors.border }]}> 
          <TouchableOpacity
            style={[styles.submitButton, { backgroundColor: colors.primary }]}
            onPress={onSubmit}
            activeOpacity={0.85}
          >
            <Icon name="save" size={20} color="#fff" />
            <Text style={styles.submitText}>Save Changes</Text>
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
    maxHeight: '85%',
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
  modalSubtitle: {
    marginTop: 4,
    fontSize: 12,
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
    minHeight: 100,
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
    borderRadius: 8,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default EditOrganizationModal;


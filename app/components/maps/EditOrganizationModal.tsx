import React from 'react';
import { Modal, View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput } from 'react-native';
import Icon from '@expo/vector-icons/MaterialIcons';
import { Picker } from '@react-native-picker/picker';

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
  contact: string;
  whatsapp: string;
  category: string;
  pulseCode: string;
  status: string;
  currentStatus: string;
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
  categoryOptions: string[];
  onOpenExternalForm?: () => void;
  previousSchools?: string | null;
};

const EditOrganizationModal: React.FC<Props> = ({
  visible,
  colors,
  formData,
  onChange,
  onClose,
  onSubmit,
  organizationName,
  categoryOptions,
  onOpenExternalForm,
  previousSchools,
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

          <Text style={[styles.inputLabel, { color: colors.text }]}>Phone</Text>
          <TextInput
            style={[styles.textInput, { borderColor: colors.border, color: colors.text }]}
            value={formData.contact}
            onChangeText={(value) => onChange('contact', value)}
            placeholder="Primary phone number"
            placeholderTextColor={colors.secondary}
            keyboardType="phone-pad"
          />

          <Text style={[styles.inputLabel, { color: colors.text }]}>WhatsApp</Text>
          <TextInput
            style={[styles.textInput, { borderColor: colors.border, color: colors.text }]}
            value={formData.whatsapp}
            onChangeText={(value) => onChange('whatsapp', value)}
            placeholder="WhatsApp contact"
            placeholderTextColor={colors.secondary}
            keyboardType="phone-pad"
          />

          <Text style={[styles.inputLabel, { color: colors.text }]}>Category</Text>
          {categoryOptions.length > 0 ? (
            <View style={[styles.pickerContainer, { borderColor: colors.border }]}>
              <Picker
                selectedValue={formData.category}
                onValueChange={(value) => onChange('category', value)}
                style={[styles.picker, { color: colors.text }]}
                dropdownIconColor={colors.text}
              >
                {categoryOptions.map((option) => (
                  <Picker.Item key={option} label={option} value={option} />
                ))}
              </Picker>
            </View>
          ) : (
            <TextInput
              style={[styles.textInput, { borderColor: colors.border, color: colors.text }]}
              value={formData.category}
              onChangeText={(value) => onChange('category', value)}
              placeholder="Category"
              placeholderTextColor={colors.secondary}
            />
          )}

          <Text style={[styles.inputLabel, { color: colors.text }]}>Pulse Code</Text>
          <TextInput
            style={[styles.textInput, { borderColor: colors.border, color: colors.text }]}
            value={formData.pulseCode}
            onChangeText={(value) => onChange('pulseCode', value)}
            placeholder="Pulse code"
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

          <Text style={[styles.inputLabel, { color: colors.text }]}>Current Status</Text>
          <TextInput
            style={[styles.textInput, { borderColor: colors.border, color: colors.text }]}
            value={formData.currentStatus}
            onChangeText={(value) => onChange('currentStatus', value)}
            placeholder="Current status summary"
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

          {previousSchools ? (
            <View style={[styles.infoBox, { borderColor: colors.border, backgroundColor: colors.background }]}>
              <Text style={[styles.infoTitle, { color: colors.text }]}>Previous Schools</Text>
              <Text style={[styles.infoText, { color: colors.secondary }]}>{previousSchools}</Text>
            </View>
          ) : null}
        </ScrollView>

        <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
          <View style={styles.footerActions}>
            {onOpenExternalForm ? (
              <TouchableOpacity
                style={[styles.secondaryButton, { borderColor: colors.primary }]}
                onPress={onOpenExternalForm}
                activeOpacity={0.85}
              >
                <Icon name="open-in-new" size={20} color={colors.primary} />
                <Text style={[styles.secondaryText, { color: colors.primary }]}>Open Full Form</Text>
              </TouchableOpacity>
            ) : null}

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
  pickerContainer: {
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 16,
    overflow: 'hidden',
  },
  picker: {
    height: 48,
    width: '100%',
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
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    paddingHorizontal: 16,
  },
  submitText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  secondaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    marginRight: 12,
  },
  secondaryText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  infoBox: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoText: {
    fontSize: 13,
    lineHeight: 18,
  },
});

export default EditOrganizationModal;


import React, { useMemo } from 'react';
import { Modal, Text, TouchableOpacity, ScrollView, StyleSheet } from 'react-native';
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

type Props = {
  visible: boolean;
  organization: Organization | null;
  colors: ThemeColors;
  locationText: string;
  onClose: () => void;
  onEdit: () => void;
  onDirections: () => void;
  onScheduleMeeting: () => void;
  onPressPhone: (phone?: string) => void;
  onPressWhatsApp: (phone?: string) => void;
  onPressWebsite: (website?: string) => void;
};

type DetailEntry = {
  key: string;
  icon: string;
  text: string;
  onPress?: () => void;
};

const OrganizationDetailsModal: React.FC<Props> = ({
  visible,
  organization,
  colors,
  locationText,
  onClose,
  onEdit,
  onDirections,
  onScheduleMeeting,
  onPressPhone,
  onPressWhatsApp,
  onPressWebsite,
}) => {
  const details = useMemo<DetailEntry[]>(() => {
    if (!organization) {
      return [];
    }

    const normalize = (value?: string) => value?.trim() ?? '';

    const entries: DetailEntry[] = [];

    if (normalize(organization.category)) {
      entries.push({ key: 'category', icon: 'business', text: organization.category });
    }

    const locationParts = [normalize(organization.city), normalize(organization.state)].filter(Boolean);
    const fallbackLocation = locationParts.join(', ');
    const resolvedLocation = normalize(locationText) || fallbackLocation;
    if (normalize(resolvedLocation)) {
      entries.push({ key: 'location', icon: 'location-city', text: resolvedLocation });
    }

    if (normalize(organization.contact)) {
      entries.push({
        key: 'contact',
        icon: 'phone',
        text: organization.contact!,
        onPress: () => onPressPhone(organization.contact),
      });
    }

    if (normalize(organization.description)) {
      entries.push({ key: 'description', icon: 'info', text: organization.description! });
    }

    if (normalize(organization.type)) {
      entries.push({ key: 'type', icon: 'category', text: `Type: ${organization.type}` });
    }

    if (normalize(organization.ratings)) {
      entries.push({ key: 'ratings', icon: 'star', text: `Ratings: ${organization.ratings}` });
    }

    if (normalize(organization.website)) {
      entries.push({
        key: 'website',
        icon: 'web',
        text: `Website: ${organization.website}`,
        onPress: () => onPressWebsite(organization.website),
      });
    }

    if (normalize(organization.numberOfStudents)) {
      entries.push({
        key: 'students',
        icon: 'school',
        text: `Students: ${organization.numberOfStudents}`,
      });
    }

    if (normalize(organization.decisionMakerName)) {
      entries.push({
        key: 'decisionMaker',
        icon: 'person',
        text: `Decision Maker: ${organization.decisionMakerName}`,
      });
    }

    if (normalize(organization.phoneDM)) {
      entries.push({
        key: 'phoneDM',
        icon: 'phone',
        text: `DM Phone: ${organization.phoneDM}`,
        onPress: () => onPressPhone(organization.phoneDM),
      });
    }

    if (normalize(organization.whatsapp)) {
      entries.push({
        key: 'whatsapp',
        icon: 'chat',
        text: `WhatsApp: ${organization.whatsapp}`,
        onPress: () => onPressWhatsApp(organization.whatsapp),
      });
    }

    if (normalize(organization.currentStatus)) {
      entries.push({
        key: 'currentStatus',
        icon: 'update',
        text: `Current Status: ${organization.currentStatus}`,
      });
    }

    if (normalize(organization.currentStatusDetails)) {
      entries.push({
        key: 'currentStatusDetails',
        icon: 'description',
        text: `Status Details: ${organization.currentStatusDetails}`,
      });
    }

    if (normalize(organization.beforeSchool)) {
      entries.push({
        key: 'beforeSchool',
        icon: 'watch-later',
        text: `Before School: ${organization.beforeSchool}`,
      });
    }

    if (normalize(organization.afterSchool)) {
      entries.push({
        key: 'afterSchool',
        icon: 'event-available',
        text: `After School: ${organization.afterSchool}`,
      });
    }

    if (normalize(organization.addOns)) {
      entries.push({ key: 'addOns', icon: 'extension', text: `Add-ons: ${organization.addOns}` });
    }

    if (normalize(organization.eventTitle)) {
      entries.push({ key: 'eventTitle', icon: 'event', text: `Event: ${organization.eventTitle}` });
    }

    if (normalize(organization.startDate) && normalize(organization.startTime)) {
      entries.push({
        key: 'start',
        icon: 'schedule',
        text: `Start: ${organization.startDate} at ${organization.startTime}`,
      });
    }

    return entries;
  }, [organization, locationText, onPressPhone, onPressWebsite, onPressWhatsApp]);

  return (
    <Modal visible={visible && !!organization} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
          <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>{organization?.name}</Text>
            <TouchableOpacity onPress={onClose} accessibilityRole="button">
              <Icon name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
            {details.map((detail) => (
              <TouchableOpacity
                key={detail.key}
                style={styles.detailRow}
                onPress={detail.onPress}
                activeOpacity={detail.onPress ? 0.7 : 1}
                disabled={!detail.onPress}
              >
                <Icon name={detail.icon} size={20} color={colors.primary} />
                <Text style={[styles.detailText, { color: colors.text }]}>{detail.text}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
            <View style={styles.footerButtonRow}>
              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.warning }]}
                onPress={onEdit}
                activeOpacity={0.8}
              >
                <Icon name="edit" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Edit</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.success }]}
                onPress={onDirections}
                activeOpacity={0.8}
              >
                <Icon name="directions" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Directions</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionButton, { backgroundColor: colors.primary }]}
                onPress={onScheduleMeeting}
                activeOpacity={0.8}
              >
                <Icon name="event" size={20} color="#fff" />
                <Text style={styles.actionButtonText}>Schedule Meeting</Text>
              </TouchableOpacity>
            </View>
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
  modalFooter: {
    padding: 20,
    borderTopWidth: 1,
  },
  footerButtonRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    flex: 1,
    marginHorizontal: 6,
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default OrganizationDetailsModal;


import type { EditFormState } from '../../components/maps/EditOrganizationModal';
import type { MeetingFormState } from '../../components/maps/MeetingRequestModal';

export const INITIAL_EDIT_FORM: EditFormState = {
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

export const INITIAL_MEETING_FORM: MeetingFormState = {
  title: '',
  description: '',
  scheduledTime: '',
};

export const LIVE_TRACKING_COLORS = [
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

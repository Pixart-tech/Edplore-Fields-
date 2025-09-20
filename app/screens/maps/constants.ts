import type { EditFormState } from '../../components/maps/EditOrganizationModal';
import type { MeetingFormState } from '../../components/maps/MeetingRequestModal';

export const CATEGORY_OPTIONS: string[] = [
  'Standalone School',
  'Standalone Preschool',
  'Multibranch School',
  'Multibranch preschool',
  'Small Franchise Preschool',
  'Small Franchise School',
  'Large Franchise Preschool',
  'Large Franchise School',
  'No details',
  'Vinuth',
  'Delete',
];

export const CURRENT_PUBLICATION_OPTIONS: string[] = [
  'Eduvate',
  'Navneet',
  'Springboard(Jeevandeep)',
  'Iceberg',
  'Lil Beez',
  'Kreedo',
  'Next Primes Monthly',
  'Next Yearly',
  'Macmillan',
  'Shubash',
  'Cambridge',
  'Oxford',
  'Academy',
  'Smart kindergarten',
  'Dream land',
  'Black swan',
  'Mixed',
  'Tinker Next',
  'Other',
];

export const CURRENT_STATUS_OPTIONS: string[] = [
  'Verified',
  'Demo Rejected',
  'WO Demo Rejected',
  'Demo Scheduled',
  'Waiting for approval',
  'SLA Done',
  'Interested',
  'Not Interested',
  'Drop physical samples',
];

export const CURRENT_STATUS_DETAIL_OPTIONS: string[] = [
  'Seeking Appointment',
  'Demo Done',
  'Appointemnt Scheduled',
  'Interested',
  'Follow up pending',
  'Converted',
  'Physical samples to be dropped',
  'Samples dropped',
  'Awaiting Confirmation',
  'Not interested',
  'No response',
  'Need to talk to higher management',
  'Awaiting token advance',
  'Already have stock/ in agreement',
  'Already have stock/ in agreement( revisit next year)',
];

export const WHATSAPP_OPTIONS: string[] = ['To Create', "Don't create", 'Done'];

export const GUEST_OPTIONS: string[] = [
  'vinuthshiv@gmail.com',
  'praphul09@gmail.com',
  'sangumuttu114@gmail.com',
  'd.narendran.pixarttechnologies@gmail.com',
  'manoj.pixart1@gmail.com',
  'unplugstories2@gmail.com',
  'preetampixart@gmail.co',
];

export const ADD_ON_OPTIONS: string[] = [
  'Books',
  'Uniform',
  'Bag',
  'ID Cards',
  'Certificates',
  'Calendar',
  'Report cards',
  'Stationery items',
  'Greeting cards',
  'Pop up book',
  'Gifting book',
  'Lanyard',
  'Language Books',
  'Other',
];

export const FORM_ENTRY_IDS = {
  name: 'entry.1000000000',
  address: 'entry.1000000001',
  contact: 'entry.1000000002',
  whatsapp: 'entry.1000000003',
  category: 'entry.1748805668',
  pulseCode: 'entry.1000000004',
  status: 'entry.1000000005',
  currentPublication: 'entry.1000000006',
  currentPublicationOther: 'entry.1000000007',
  currentStatus: 'entry.1000000008',
  currentStatusDetails: 'entry.1523910384',
  assignee: 'entry.1000000009',
  guests: 'entry.1000000010',
  additionalGuests: 'entry.1000000011',
  addOns: 'entry.1000000012',
  addOnsOther: 'entry.1000000013',
};

export const INITIAL_EDIT_FORM: EditFormState = {
  name: '',
  address: '',
  contact: '',
  whatsapp: '',
  category: '',
  type: '',
  update: '',
  website: '',
  city: '',
  state: '',
  pulseCode: '',
  status: '',
  numberOfStudents: '',
  currentPublication: '',
  currentPublicationOther: '',
  currentStatus: '',
  currentStatusDetails: '',
  assignee: '',
  decisionMakerName: '',
  phoneDM: '',
  ho: '',
  guests: [],
  additionalGuests: '',
  addOns: [],
  addOnsOther: '',
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

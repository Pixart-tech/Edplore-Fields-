export interface Organization {
  mapsUrl?: string;
  name: string;
  latitude: number;
  longitude: number;
  city: string;
  state: string;
  category: string;
  contact?: string;
  description?: string;
  type?: string;
  ratings?: string;
  star?: string;
  website?: string;
  status?: string;
  pulseCode?: string;
  numberOfStudents?: string;
  currentPublicationName?: string;
  decisionMakerName?: string;
  phoneDM?: string;
  ho?: string;
  currentStatus?:string;
  currentStatusDetails?: string;
  assignee?: string;
  whatsapp?: string;
  beforeSchool?: string;
  afterSchool?: string;
  addOns?: string;
  formUrl?: string;
}

export type OrganizationList = Organization[];

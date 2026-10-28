export type EmergencyType = 'medical' | 'fire' | 'police' | 'general';

export interface EmergencyContact {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  notifyOnSOS: boolean;
}

export interface EmergencyAlertLog {
  id: string;
  timestamp: number;
  type: EmergencyType;
  latitude: number | null;
  longitude: number | null;
  accuracy: number | null;
  address: string;
  message: string;
  contactsNotified: string[];
  status: 'prepared' | 'dispatched-tel' | 'sms-opened';
}

import { ConversationSession, ChatMessage } from '../types/conversation';
import { EmergencyContact, EmergencyAlertLog } from '../types/emergency';
import { LanguageCode } from '../types/languages';

const KEYS = {
  CONVERSATIONS: 'ishara_conversations_v1',
  CONTACTS: 'ishara_emergency_contacts_v1',
  EMERGENCY_LOGS: 'ishara_sos_logs_v1',
  LEARNING_PROGRESS: 'ishara_learning_progress_v1',
  SETTINGS: 'ishara_user_settings_v1',
};

export interface UserSettings {
  highContrast: boolean;
  largeText: boolean;
  reducedMotion: boolean;
  hapticFeedback: boolean;
  speechRate: number;
  cameraMirrored: boolean;
  preferredLanguage: LanguageCode;
  autoSpeak: boolean;
}

const DEFAULT_SETTINGS: UserSettings = {
  highContrast: false,
  largeText: false,
  reducedMotion: false,
  hapticFeedback: true,
  speechRate: 0.95,
  cameraMirrored: true,
  preferredLanguage: 'hi',
  autoSpeak: true,
};

const DEFAULT_CONTACTS: EmergencyContact[] = [
  {
    id: 'contact-1',
    name: 'Aarav Sharma (Brother)',
    relationship: 'Family Member',
    phone: '+91 98765 43210',
    notifyOnSOS: true,
  },
  {
    id: 'contact-2',
    name: 'Dr. Priya Sen (Physician)',
    relationship: 'Family Doctor',
    phone: '+91 91234 56789',
    notifyOnSOS: true,
  },
];

const INITIAL_CONVERSATION: ConversationSession = {
  id: 'conv-demo-1',
  title: 'Consultation with Hearing Colleague',
  startTime: Date.now() - 3600000,
  primaryLanguage: 'hi',
  messages: [
    {
      id: 'msg-1',
      sender: 'deaf',
      originalText: 'Namaste',
      translatedText: 'नमस्ते',
      detectedSignId: 'namaste',
      confidence: 0.96,
      language: 'hi',
      timestamp: Date.now() - 3500000,
    },
    {
      id: 'msg-2',
      sender: 'hearing',
      originalText: 'Hello! Good to meet you. How can I help you today?',
      language: 'hi',
      timestamp: Date.now() - 3400000,
    },
    {
      id: 'msg-3',
      sender: 'deaf',
      originalText: 'I Need Water',
      translatedText: 'मुझे पानी चाहिए।',
      detectedSignId: 'water',
      confidence: 0.94,
      language: 'hi',
      timestamp: Date.now() - 3300000,
    },
    {
      id: 'msg-4',
      sender: 'hearing',
      originalText: 'Sure, here is a fresh glass of water.',
      language: 'hi',
      timestamp: Date.now() - 3200000,
    },
    {
      id: 'msg-5',
      sender: 'deaf',
      originalText: 'Thank You',
      translatedText: 'धन्यवाद',
      detectedSignId: 'thank-you',
      confidence: 0.95,
      language: 'hi',
      timestamp: Date.now() - 3100000,
    },
  ],
};

export class OfflineStorage {
  // --- Conversations ---
  public static getConversations(): ConversationSession[] {
    try {
      const data = localStorage.getItem(KEYS.CONVERSATIONS);
      if (!data) {
        this.saveConversations([INITIAL_CONVERSATION]);
        return [INITIAL_CONVERSATION];
      }
      return JSON.parse(data);
    } catch {
      return [INITIAL_CONVERSATION];
    }
  }

  public static saveConversations(sessions: ConversationSession[]): void {
    try {
      localStorage.setItem(KEYS.CONVERSATIONS, JSON.stringify(sessions));
    } catch (e) {
      console.warn('Failed to save conversations to localStorage:', e);
    }
  }

  public static addMessageToSession(sessionId: string, message: ChatMessage): void {
    const sessions = this.getConversations();
    const session = sessions.find((s) => s.id === sessionId);
    if (session) {
      session.messages.push(message);
      this.saveConversations(sessions);
    }
  }

  public static deleteSession(sessionId: string): void {
    const sessions = this.getConversations().filter((s) => s.id !== sessionId);
    this.saveConversations(sessions);
  }

  public static clearAllHistory(): void {
    try {
      localStorage.removeItem(KEYS.CONVERSATIONS);
    } catch (_) {}
  }

  // --- Emergency Contacts ---
  public static getEmergencyContacts(): EmergencyContact[] {
    try {
      const data = localStorage.getItem(KEYS.CONTACTS);
      if (!data) {
        this.saveEmergencyContacts(DEFAULT_CONTACTS);
        return DEFAULT_CONTACTS;
      }
      return JSON.parse(data);
    } catch {
      return DEFAULT_CONTACTS;
    }
  }

  public static saveEmergencyContacts(contacts: EmergencyContact[]): void {
    try {
      localStorage.setItem(KEYS.CONTACTS, JSON.stringify(contacts));
    } catch (e) {
      console.warn('Failed to save contacts to localStorage:', e);
    }
  }

  // --- SOS Alert Logs ---
  public static getSOSLogs(): EmergencyAlertLog[] {
    try {
      const data = localStorage.getItem(KEYS.EMERGENCY_LOGS);
      return data ? JSON.parse(data) : [];
    } catch {
      return [];
    }
  }

  public static logSOSAlert(log: EmergencyAlertLog): void {
    try {
      const logs = this.getSOSLogs();
      logs.unshift(log);
      localStorage.setItem(KEYS.EMERGENCY_LOGS, JSON.stringify(logs.slice(0, 50)));
    } catch (e) {
      console.warn('Failed to log SOS alert:', e);
    }
  }

  // --- User Settings ---
  public static getSettings(): UserSettings {
    try {
      const data = localStorage.getItem(KEYS.SETTINGS);
      return data ? { ...DEFAULT_SETTINGS, ...JSON.parse(data) } : DEFAULT_SETTINGS;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  public static saveSettings(settings: Partial<UserSettings>): UserSettings {
    try {
      const updated = { ...this.getSettings(), ...settings };
      localStorage.setItem(KEYS.SETTINGS, JSON.stringify(updated));
      return updated;
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  // --- Learning Progress ---
  public static getMasteredSigns(): string[] {
    try {
      const data = localStorage.getItem(KEYS.LEARNING_PROGRESS);
      return data ? JSON.parse(data) : ['namaste', 'thank-you'];
    } catch {
      return ['namaste', 'thank-you'];
    }
  }

  public static markSignMastered(signId: string): void {
    try {
      const list = this.getMasteredSigns();
      if (!list.includes(signId)) {
        list.push(signId);
        localStorage.setItem(KEYS.LEARNING_PROGRESS, JSON.stringify(list));
      }
    } catch (_) {}
  }
}

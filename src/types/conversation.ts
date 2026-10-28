import { LanguageCode } from './languages';

export interface ChatMessage {
  id: string;
  sender: 'deaf' | 'hearing' | 'system';
  originalText: string;
  translatedText?: string;
  detectedSignId?: string;
  confidence?: number;
  language: LanguageCode;
  timestamp: number;
  audioPlayed?: boolean;
}

export interface ConversationSession {
  id: string;
  startTime: number;
  endTime?: number;
  messages: ChatMessage[];
  title: string;
  primaryLanguage: LanguageCode;
}

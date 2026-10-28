export type LanguageCode =
  | 'en'
  | 'hi'
  | 'or'
  | 'bn'
  | 'te'
  | 'ta'
  | 'ml'
  | 'kn'
  | 'mr'
  | 'gu'
  | 'pa'
  | 'as'
  | 'ur';

export interface LanguageInfo {
  code: LanguageCode;
  name: string;
  nativeName: string;
  script: string;
  speechCode: string;
  supportsOfflineTranslation: boolean;
  supportsOfflineVoice: boolean;
  sampleGreeting: string;
}

export interface TranslationResult {
  originalText: string;
  translatedText: string;
  targetLang: LanguageCode;
  source: 'gemini-3.8-flash' | 'offline-lexicon' | 'local-fallback';
}

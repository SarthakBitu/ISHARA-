import { LanguageCode } from '../types/languages';
import { getLanguageByCode } from '../data/languages';

// Web Speech API interface declarations for TypeScript
interface IWindow extends Window {
  webkitSpeechRecognition?: any;
  SpeechRecognition?: any;
}

export class SpeechService {
  private static synth: SpeechSynthesis | null =
    typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : null;
  private static recognition: any = null;

  // Speak text using regional Indian speech voice
  public static speak(
    text: string,
    langCode: LanguageCode,
    options?: { rate?: number; pitch?: number; onEnd?: () => void }
  ): Promise<void> {
    return new Promise((resolve) => {
      if (!this.synth) {
        options?.onEnd?.();
        return resolve();
      }

      this.stop(); // Stop any ongoing utterance

      const langInfo = getLanguageByCode(langCode);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = langInfo.speechCode || 'en-IN';
      utterance.rate = options?.rate || 0.95;
      utterance.pitch = options?.pitch || 1.0;

      // Match voice preference if available
      const voices = this.synth.getVoices();
      const matchedVoice = voices.find(
        (v) => v.lang.startsWith(langCode) || v.lang.includes(langInfo.speechCode)
      );
      if (matchedVoice) {
        utterance.voice = matchedVoice;
      }

      utterance.onend = () => {
        options?.onEnd?.();
        resolve();
      };

      utterance.onerror = (e) => {
        console.warn('Speech synthesis error:', e);
        options?.onEnd?.();
        resolve();
      };

      this.synth.speak(utterance);
    });
  }

  // Stop active speech
  public static stop(): void {
    if (this.synth) {
      this.synth.cancel();
    }
  }

  // Check if browser has speech synthesis
  public static isSpeechSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  // Check if browser supports speech recognition
  public static isRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    const win = window as unknown as IWindow;
    return !!(win.SpeechRecognition || win.webkitSpeechRecognition);
  }

  // Start listening for speech from microphone
  public static startListening(
    langCode: LanguageCode,
    onResult: (transcript: string, isFinal: boolean) => void,
    onError: (error: string) => void,
    onEnd: () => void
  ): { stop: () => void } {
    const win = window as unknown as IWindow;
    const SpeechRec = win.SpeechRecognition || win.webkitSpeechRecognition;

    if (!SpeechRec) {
      onError('Speech recognition not supported in this browser.');
      onEnd();
      return { stop: () => {} };
    }

    try {
      const recognition = new SpeechRec();
      this.recognition = recognition;
      const langInfo = getLanguageByCode(langCode);
      recognition.lang = langInfo.speechCode || 'en-IN';
      recognition.continuous = true;
      recognition.interimResults = true;

      recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (event.results[i].isFinal) {
            finalTranscript += event.results[i][0].transcript;
          } else {
            interimTranscript += event.results[i][0].transcript;
          }
        }

        const text = finalTranscript || interimTranscript;
        if (text) {
          onResult(text, !!finalTranscript);
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        onError(event.error === 'not-allowed' ? 'Microphone permission denied.' : event.error);
      };

      recognition.onend = () => {
        onEnd();
      };

      recognition.start();

      return {
        stop: () => {
          try {
            recognition.stop();
          } catch (_) {}
        },
      };
    } catch (err: any) {
      onError(err?.message || 'Failed to initialize microphone speech recognition.');
      onEnd();
      return { stop: () => {} };
    }
  }
}

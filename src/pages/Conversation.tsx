import React, { useState, useEffect, useRef } from 'react';
import { CameraView } from '../components/CameraView';
import { LanguageSelector } from '../components/LanguageSelector';
import { RecognitionState } from '../types/isl';
import { LanguageCode } from '../types/languages';
import { ChatMessage } from '../types/conversation';
import { translateText } from '../services/translationService';
import { SpeechService } from '../services/speechService';
import { OfflineStorage } from '../services/offlineStorage';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { SoundService } from '../services/soundEffects';
import {
  Mic,
  MicOff,
  Volume2,
  Send,
  Trash2,
  Sparkles,
  Download,
  User,
  Hand,
  Share2,
  MessageCircle,
} from 'lucide-react';

export const Conversation: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [targetLang, setTargetLang] = useState<LanguageCode>('hi');

  // Messages thread
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const sessions = OfflineStorage.getConversations();
    return sessions[0]?.messages || [];
  });

  // Deaf user state
  const [currentSignState, setCurrentSignState] = useState<RecognitionState | null>(null);
  const [stagedDeafSign, setStagedDeafSign] = useState<string>('Namaste (Greetings)');
  const [stagedDeafTranslated, setStagedDeafTranslated] = useState<string>('नमस्ते');

  // Hearing user speech recognition state
  const [isListening, setIsListening] = useState<boolean>(false);
  const [hearingTranscript, setHearingTranscript] = useState<string>('');
  const [hearingManualText, setHearingManualText] = useState<string>('');
  const [hearingError, setHearingError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listenerRef = useRef<{ stop: () => void } | null>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle camera recognition from Deaf side
  const handleSignDetected = async (state: RecognitionState) => {
    setCurrentSignState(state);
    if (state.status === 'recognized' && state.currentSign) {
      setStagedDeafSign(state.currentSign.name);
      const trans = await translateText(state.currentSign.name, targetLang, isOnline);
      setStagedDeafTranslated(trans.translatedText);
    }
  };

  // Send Deaf sign into thread and speak it aloud for hearing user
  const handleSendDeafMessage = async (customSign?: string) => {
    const signToSend = customSign || stagedDeafSign;
    if (!signToSend) return;

    SoundService.playClick();
    const trans = await translateText(signToSend, targetLang, isOnline);

    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'deaf',
      originalText: signToSend,
      translatedText: trans.translatedText,
      confidence: currentSignState?.confidence ? currentSignState.confidence / 100 : 0.95,
      language: targetLang,
      timestamp: Date.now(),
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    OfflineStorage.addMessageToSession('conv-demo-1', newMsg);

    // Speak for hearing partner
    SpeechService.speak(trans.translatedText, targetLang);
  };

  // Toggle microphone for hearing user
  const toggleListening = () => {
    if (isListening) {
      listenerRef.current?.stop();
      setIsListening(false);
      SoundService.playClick();
    } else {
      SoundService.playChime();
      setHearingError(null);
      setIsListening(true);
      listenerRef.current = SpeechService.startListening(
        targetLang,
        (text, isFinal) => {
          setHearingTranscript(text);
          if (isFinal) {
            handleSendHearingMessage(text);
            setHearingTranscript('');
          }
        },
        (err) => {
          setHearingError(err);
          setIsListening(false);
        },
        () => {
          setIsListening(false);
        }
      );
    }
  };

  const handleSendHearingMessage = async (textToSend?: string) => {
    const text = (textToSend || hearingManualText || hearingTranscript).trim();
    if (!text) return;

    SoundService.playClick();
    const newMsg: ChatMessage = {
      id: `msg-${Date.now()}`,
      sender: 'hearing',
      originalText: text,
      language: targetLang,
      timestamp: Date.now(),
    };

    const updated = [...messages, newMsg];
    setMessages(updated);
    OfflineStorage.addMessageToSession('conv-demo-1', newMsg);

    setHearingManualText('');
    setHearingTranscript('');
  };

  const handleClearThread = () => {
    SoundService.playClick();
    setMessages([]);
    OfflineStorage.saveConversations([
      {
        id: 'conv-demo-1',
        title: 'New Conversation',
        startTime: Date.now(),
        primaryLanguage: targetLang,
        messages: [],
      },
    ]);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header Card */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950/40 border border-slate-800 p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xl">
        <div>
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-400">
              <MessageCircle className="w-3.5 h-3.5" />
            </span>
            <span className="text-xs font-mono uppercase font-bold tracking-wider text-indigo-400">
              Face-to-Face Companion Mode
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Two-Way Live Dialogue
          </h1>
          <p className="text-xs text-slate-300">
            Deaf user signs into camera on the left; hearing user speaks into mic on the right.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <LanguageSelector
            selectedLanguage={targetLang}
            onSelectLanguage={(lang) => {
              SoundService.playClick();
              setTargetLang(lang);
            }}
          />
          <button
            onClick={handleClearThread}
            className="p-2 rounded-xl text-slate-400 hover:text-rose-400 bg-slate-950 border border-slate-800 transition-colors"
            title="Clear dialogue thread"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Synchronized Dialogue Thread */}
      <div className="rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden flex flex-col h-[340px]">
        <div className="px-5 py-3 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-xs text-slate-400 font-mono">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-semibold text-slate-200">Synchronized Transcript ({messages.length} messages)</span>
          </div>
          <span className="text-cyan-400">Target Language: {targetLang.toUpperCase()}</span>
        </div>

        <div className="flex-1 p-5 overflow-y-auto space-y-3.5">
          {messages.length === 0 ? (
            <div className="h-full flex items-center justify-center text-xs text-slate-400 italic">
              Sign an ISL gesture on the left or tap the mic on the right to start speaking!
            </div>
          ) : (
            messages.map((msg) => {
              const isDeaf = msg.sender === 'deaf';
              return (
                <div
                  key={msg.id}
                  className={`flex items-start gap-3 ${isDeaf ? 'justify-start' : 'justify-end'}`}
                >
                  {isDeaf && (
                    <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-cyan-950 border border-cyan-500/40 text-cyan-400 shrink-0 text-xs font-bold shadow-md">
                      <Hand className="w-4 h-4" />
                    </div>
                  )}

                  <div
                    className={`max-w-[75%] rounded-3xl px-5 py-3 text-xs shadow-md ${
                      isDeaf
                        ? 'bg-slate-950 border border-cyan-500/30 text-slate-100 rounded-tl-sm'
                        : 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-tr-sm font-medium'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-75">
                      <span>{isDeaf ? 'Deaf Signer (ISL)' : 'Hearing Speaker'}</span>
                      <span className="font-mono tabular-nums">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    <p className="text-sm font-bold leading-relaxed">{msg.translatedText || msg.originalText}</p>

                    {isDeaf && msg.translatedText && (
                      <p className="text-[11px] text-cyan-400/90 mt-0.5">
                        ISL Sign: {msg.originalText}
                      </p>
                    )}

                    <div className="mt-1 flex items-center justify-end">
                      <button
                        onClick={() => {
                          SoundService.playClick();
                          SpeechService.speak(msg.translatedText || msg.originalText, msg.language);
                        }}
                        className={`p-1 rounded hover:opacity-80 transition-opacity ${
                          isDeaf ? 'text-cyan-400' : 'text-white'
                        }`}
                        title="Replay Voice"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {!isDeaf && (
                    <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-950 border border-indigo-500/40 text-indigo-400 shrink-0 text-xs font-bold shadow-md">
                      <User className="w-4 h-4" />
                    </div>
                  )}
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Split Interactive Stations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Deaf Signer Studio */}
        <div className="rounded-3xl bg-slate-900 border border-cyan-500/30 p-6 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-cyan-950 text-cyan-400 text-xs font-extrabold border border-cyan-500/30">
                1
              </span>
              <h2 className="text-sm font-bold text-white">Deaf Signer (ISL Camera)</h2>
            </div>
            <span className="text-xs font-mono font-bold text-cyan-400">
              {currentSignState?.confidence || 95}% Match
            </span>
          </div>

          <CameraView
            onSignRecognized={handleSignDetected}
            className="w-full"
          />

          {/* Staged Detected Gesture Ready to Send */}
          <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span>Detected ISL Sign:</span>
              <span className="text-cyan-400 font-bold">{stagedDeafSign}</span>
            </div>
            <p className="text-xl font-extrabold text-white">
              {stagedDeafTranslated}
            </p>

            <button
              onClick={() => handleSendDeafMessage()}
              className="w-full mt-2 py-3 px-4 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-300 hover:brightness-110 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-md shadow-cyan-500/20"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send & Speak Sign Aloud</span>
            </button>
          </div>

          {/* Quick Sign Shortcut Pads */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Quick One-Tap Signs:
            </span>
            <div className="flex flex-wrap gap-2">
              {[
                { label: 'Namaste 🙏', val: 'Namaste (Greetings)' },
                { label: 'Chai ☕', val: 'Chai / Tea' },
                { label: 'Water 💧', val: 'I Need Water' },
                { label: 'Hungry 🍛', val: 'I Need Food / Hungry' },
                { label: 'Doctor 🩺', val: 'Call Doctor / Hospital' },
                { label: 'Thank You 💐', val: 'Thank You' },
                { label: 'Yes 👍', val: 'Yes' },
                { label: 'No 👎', val: 'No' },
              ].map((item) => (
                <button
                  key={item.val}
                  onClick={() => handleSendDeafMessage(item.val)}
                  className="px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors active:scale-95"
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Hearing Speaker Studio */}
        <div className="rounded-3xl bg-slate-900 border border-indigo-500/30 p-6 space-y-4 shadow-2xl flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-indigo-950 text-indigo-400 text-xs font-extrabold border border-indigo-500/30">
                  2
                </span>
                <h2 className="text-sm font-bold text-white">Hearing Speaker (Voice Input)</h2>
              </div>
              <span className="text-xs font-mono font-bold text-indigo-400">Speech-to-Text</span>
            </div>

            {/* Microphone Button with Animated Ripple */}
            <div className="p-8 rounded-3xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center text-center space-y-4">
              <button
                onClick={toggleListening}
                className={`relative flex items-center justify-center w-20 h-20 rounded-full transition-all shadow-2xl active:scale-95 ${
                  isListening
                    ? 'bg-rose-600 text-white animate-pulse ring-8 ring-rose-500/20'
                    : 'bg-gradient-to-tr from-indigo-600 to-indigo-500 text-white hover:scale-105 shadow-indigo-500/30'
                }`}
                aria-label={isListening ? 'Stop microphone' : 'Start microphone'}
              >
                {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
              </button>

              <div>
                <p className="text-base font-extrabold text-white">
                  {isListening ? 'Listening to your speech...' : 'Tap Mic to Speak'}
                </p>
                <p className="text-xs text-slate-400 mt-1 max-w-xs">
                  Speak naturally. Your voice is transcribed and formatted in high-contrast text for your Deaf companion.
                </p>
              </div>

              {hearingError && (
                <p className="text-xs text-rose-300 bg-rose-950/50 px-3.5 py-1.5 rounded-xl border border-rose-500/30">
                  {hearingError}
                </p>
              )}

              {hearingTranscript && (
                <div className="w-full p-4 rounded-2xl bg-slate-900 border border-indigo-500/40 text-sm font-semibold text-indigo-200">
                  "{hearingTranscript}"
                </div>
              )}
            </div>

            {/* Manual text reply option */}
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                Or Type Reply:
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={hearingManualText}
                  onChange={(e) => setHearingManualText(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendHearingMessage()}
                  placeholder="Type a message in your language..."
                  className="flex-1 px-4 py-2.5 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
                />
                <button
                  onClick={() => handleSendHearingMessage()}
                  disabled={!hearingManualText.trim()}
                  className="px-5 py-2.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 rounded-xl transition-all shadow-md active:scale-95 shrink-0"
                >
                  Send
                </button>
              </div>
            </div>
          </div>

          <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>Two-way dialogue bridges spoken and visual languages effortlessly.</span>
          </div>
        </div>
      </div>
    </div>
  );
};

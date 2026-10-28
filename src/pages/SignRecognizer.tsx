import React, { useState, useEffect, useRef } from 'react';
import { CameraView } from '../components/CameraView';
import { LanguageSelector } from '../components/LanguageSelector';
import { RecognitionState, RecognizedSign } from '../types/isl';
import { LanguageCode } from '../types/languages';
import { translateText } from '../services/translationService';
import { SpeechService } from '../services/speechService';
import { OfflineStorage } from '../services/offlineStorage';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { SoundService } from '../services/soundEffects';
import { ISL_DICTIONARY } from '../data/islDictionary';
import {
  Volume2,
  VolumeX,
  Copy,
  Check,
  Trash2,
  BookmarkPlus,
  Edit3,
  Sliders,
  Sparkles,
  MessageSquare,
  ArrowRight,
  Share2,
  Radio,
  Flame,
  CheckCircle2,
  Clock,
  Undo2,
  ShieldCheck,
  X,
} from 'lucide-react';

type BufferSpeed = 'slow' | 'normal' | 'fast';

const BUFFER_DURATIONS: Record<BufferSpeed, number> = {
  slow: 2500,   // 2.5 seconds hold for careful / slow buffering
  normal: 1800, // 1.8 seconds hold (standard balanced)
  fast: 1000,   // 1.0 second hold (fluent signers)
};

export const SignRecognizer: React.FC = () => {
  const isOnline = useOnlineStatus();
  const [selectedLanguage, setSelectedLanguage] = useState<LanguageCode>('hi');
  const [recognitionState, setRecognitionState] = useState<RecognitionState | null>(null);

  // Gesture Buffering & Hold-to-Confirm States
  const [bufferSpeed, setBufferSpeed] = useState<BufferSpeed>('normal');
  const [holdingSign, setHoldingSign] = useState<RecognizedSign | null>(null);
  const [holdProgress, setHoldProgress] = useState<number>(0);
  const [isCommitted, setIsCommitted] = useState<boolean>(false);

  // Output text states
  const [activeSignText, setActiveSignText] = useState<string>('Namaste (Greetings)');
  const [translatedText, setTranslatedText] = useState<string>('नमस्ते');
  const [sentenceBuffer, setSentenceBuffer] = useState<string[]>(['Namaste (Greetings)']);
  const [bufferTranslated, setBufferTranslated] = useState<string>('नमस्ते');

  // Controls
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [autoSpeak, setAutoSpeak] = useState<boolean>(true);
  const [speechRate, setSpeechRate] = useState<number>(0.95);
  const [copied, setCopied] = useState<boolean>(false);
  const [sentenceCopied, setSentenceCopied] = useState<boolean>(false);
  const [savedSuccess, setSavedSuccess] = useState<boolean>(false);
  const [isCorrecting, setIsCorrecting] = useState<boolean>(false);

  // Selected gesture to test or emulate
  const [activeTestGesture, setActiveTestGesture] = useState<string | null>(null);

  const lastSpokenTextRef = useRef<string>('');
  const holdStartRef = useRef<{ signId: string; time: number } | null>(null);
  const lastCommittedIdRef = useRef<string | null>(null);
  const cooldownExpiryRef = useRef<number>(0);
  const lastActiveFrameRef = useRef<number>(Date.now());

  // Handle new recognition from CameraView with deliberate Hold-to-Confirm buffering
  const handleSignRecognized = async (state: RecognitionState) => {
    setRecognitionState(state);
    const now = Date.now();
    lastActiveFrameRef.current = now;

    if (state.status === 'recognized' && state.currentSign) {
      const sign = state.currentSign;

      // Lockout check: if this sign was just committed, prevent duplicate re-buffering until user changes gesture
      if (now < cooldownExpiryRef.current && sign.id === lastCommittedIdRef.current) {
        return;
      }

      // If user switched to a different sign, begin a new hold session
      if (holdStartRef.current?.signId !== sign.id) {
        holdStartRef.current = { signId: sign.id, time: now };
        setHoldingSign(sign);
        setHoldProgress(8);
        setIsCommitted(false);
        return;
      }

      // Ongoing hold: compute progress towards required hold time
      const targetDuration = BUFFER_DURATIONS[bufferSpeed];
      const elapsed = now - holdStartRef.current.time;
      const progress = Math.min(100, Math.round((elapsed / targetDuration) * 100));
      setHoldProgress(progress);

      // Successfully held for the required duration: COMMIT to sentence buffer
      if (progress >= 100 && !isCommitted) {
        setIsCommitted(true);
        lastCommittedIdRef.current = sign.id;
        cooldownExpiryRef.current = now + 2500; // 2.5s anti-spam lockout

        setActiveSignText(sign.name);
        SoundService.playSuccess();

        // Perform instant translation
        const trans = await translateText(sign.name, selectedLanguage, isOnline);
        setTranslatedText(trans.translatedText);

        // Append to continuous sentence builder
        setSentenceBuffer((prev) => {
          if (prev[prev.length - 1] === sign.name) return prev;
          const updated = [...prev, sign.name];
          return updated.slice(-10); // Keep last 10 signs
        });

        // Trigger auto-speak if enabled
        if (autoSpeak && trans.translatedText !== lastSpokenTextRef.current) {
          lastSpokenTextRef.current = trans.translatedText;
          playSpeech(trans.translatedText);
        }
      }
    } else {
      // Hands moved or no clear sign: if user was holding, reset hold after brief grace period (350ms)
      if (holdStartRef.current && now - lastActiveFrameRef.current > 350) {
        holdStartRef.current = null;
        setHoldingSign(null);
        setHoldProgress(0);
        setIsCommitted(false);
      }
    }
  };

  // Update translation when language changes
  useEffect(() => {
    let active = true;
    async function updateTranslation() {
      if (activeSignText) {
        const trans = await translateText(activeSignText, selectedLanguage, isOnline);
        if (active) {
          setTranslatedText(trans.translatedText);
        }
      }

      if (sentenceBuffer.length > 0) {
        const bufferStr = sentenceBuffer.join(' · ');
        const transBuffer = await translateText(bufferStr, selectedLanguage, isOnline);
        if (active) {
          setBufferTranslated(transBuffer.translatedText);
        }
      }
    }
    updateTranslation();
    return () => {
      active = false;
    };
  }, [selectedLanguage, activeSignText, sentenceBuffer, isOnline]);

  const playSpeech = (textToSpeak: string) => {
    if (!textToSpeak) return;
    setIsSpeaking(true);
    SpeechService.speak(textToSpeak, selectedLanguage, {
      rate: speechRate,
      onEnd: () => setIsSpeaking(false),
    });
  };

  const stopSpeech = () => {
    SpeechService.stop();
    setIsSpeaking(false);
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(`${translatedText} (${activeSignText})`);
      setCopied(true);
      SoundService.playClick();
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  const handleClear = () => {
    SoundService.playClick();
    setActiveSignText('');
    setTranslatedText('');
    setSentenceBuffer([]);
    setBufferTranslated('');
    stopSpeech();
  };

  const handleSaveToConversation = () => {
    const textToSave = translatedText || activeSignText;
    if (!textToSave) return;

    SoundService.playSuccess();
    OfflineStorage.addMessageToSession('conv-demo-1', {
      id: `msg-${Date.now()}`,
      sender: 'deaf',
      originalText: activeSignText,
      translatedText,
      confidence: recognitionState?.confidence ? recognitionState.confidence / 100 : 0.95,
      language: selectedLanguage,
      timestamp: Date.now(),
    });

    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleApplyCorrection = async (correctedSignName: string) => {
    SoundService.playClick();
    setActiveSignText(correctedSignName);
    const trans = await translateText(correctedSignName, selectedLanguage, isOnline);
    setTranslatedText(trans.translatedText);
    setIsCorrecting(false);
    if (autoSpeak) {
      playSpeech(trans.translatedText);
    }
  };

  // Quick Indian sign presets
  const quickPresets = [
    { id: 'namaste', label: 'Namaste', icon: '🙏', meaning: 'Greetings' },
    { id: 'chai-tea', label: 'Chai / Tea', icon: '☕', meaning: 'Cup of Tea' },
    { id: 'water', label: 'Water', icon: '💧', meaning: 'Paani' },
    { id: 'food-hungry', label: 'Food / Hungry', icon: '🍛', meaning: 'Khana' },
    { id: 'help-emergency', label: 'Emergency Help', icon: '🚨', meaning: 'Madad' },
    { id: 'doctor-hospital', label: 'Call Doctor', icon: '🩺', meaning: 'Hospital' },
    { id: 'how-are-you', label: 'How are you?', icon: '👋', meaning: 'Aap kaise hain?' },
    { id: 'thank-you', label: 'Thank You', icon: '💐', meaning: 'Dhanyavaad' },
    { id: 'yes', label: 'Yes', icon: '👍', meaning: 'Haan' },
    { id: 'no', label: 'No', icon: '👎', meaning: 'Nahi' },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Studio Header Card */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900 to-cyan-950/40 border border-slate-800 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400">
              <Radio className="w-3.5 h-3.5 animate-pulse" />
            </span>
            <span className="text-xs font-mono uppercase font-bold tracking-wider text-cyan-400">
              Real-Time ISL Vision Studio
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Sign to Speech & Multilingual Text
          </h1>
          <p className="text-xs text-slate-300">
            Sign naturally in front of your camera. ISHARA AI translates gestures into 13 Indian regional languages.
          </p>
        </div>

        {/* Language Selection Badge */}
        <div className="flex items-center gap-3 bg-slate-950/80 border border-slate-800 p-2.5 rounded-2xl shrink-0">
          <div className="text-right hidden sm:block">
            <p className="text-[10px] text-slate-400 uppercase font-mono">Output Dialect</p>
            <p className="text-xs font-bold text-white">Indian Regional</p>
          </div>
          <LanguageSelector
            selectedLanguage={selectedLanguage}
            onSelectLanguage={(lang) => {
              SoundService.playClick();
              setSelectedLanguage(lang);
            }}
          />
        </div>
      </div>

      {/* Main Studio Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left: Camera Feed & Real-Time Tracking */}
        <div className="lg:col-span-7 space-y-4">
          <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-900">
            <CameraView
              onSignRecognized={handleSignRecognized}
              activeSignId={activeTestGesture}
              holdProgress={holdProgress}
              holdingSignName={holdingSign?.name}
              isCommitted={isCommitted}
              bufferSpeedLabel={bufferSpeed === 'slow' ? '2.5s' : bufferSpeed === 'normal' ? '1.8s' : '1.0s'}
              className="w-full"
            />
          </div>

          {/* Buffering Speed & Anti-Flicker Hold Tuning Bar */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-3 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-6 h-6 rounded-lg bg-cyan-500/20 text-cyan-400">
                  <Clock className="w-3.5 h-3.5" />
                </span>
                <div>
                  <h3 className="text-xs font-bold text-white uppercase tracking-wider">
                    Gesture Buffering & Hold Speed
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Controls how long you must hold a sign before it commits to the sentence.
                  </p>
                </div>
              </div>

              {/* Speed Buttons */}
              <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800 shrink-0">
                <button
                  onClick={() => {
                    SoundService.playClick();
                    setBufferSpeed('slow');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    bufferSpeed === 'slow'
                      ? 'bg-gradient-to-r from-amber-500 to-orange-400 text-slate-950 shadow-md font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="2.5s hold: Prevents flicker, best for steady recognition"
                >
                  🐢 Slow (2.5s)
                </button>

                <button
                  onClick={() => {
                    SoundService.playClick();
                    setBufferSpeed('normal');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    bufferSpeed === 'normal'
                      ? 'bg-gradient-to-r from-cyan-400 to-sky-400 text-slate-950 shadow-md font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="1.8s hold: Balanced conversational timing"
                >
                  ⏱️ Normal (1.8s)
                </button>

                <button
                  onClick={() => {
                    SoundService.playClick();
                    setBufferSpeed('fast');
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    bufferSpeed === 'fast'
                      ? 'bg-gradient-to-r from-emerald-400 to-teal-300 text-slate-950 shadow-md font-extrabold'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="1.0s hold: Fast pace for fluent signers"
                >
                  ⚡ Fast (1.0s)
                </button>
              </div>
            </div>

            {/* Explanatory note */}
            <div className="flex items-center gap-2 text-[11px] text-slate-400 bg-slate-950/60 px-3 py-2 rounded-xl border border-slate-800/60">
              <ShieldCheck className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>
                {bufferSpeed === 'slow'
                  ? 'Slow mode enabled: Requires a stable 2.5-second hold before adding words. Eliminates flickering and accidental transitions.'
                  : bufferSpeed === 'normal'
                  ? 'Normal mode: Natural 1.8-second hold gives you time to transition between gestures without spamming.'
                  : 'Fast mode: 1.0-second hold registers words quickly for fluent, practiced signers.'}
              </span>
            </div>
          </div>

          {/* Quick Tap ISL Gesture Drawer */}
          <div className="rounded-2xl bg-slate-900/90 border border-slate-800 p-4 space-y-2.5 shadow-lg">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-slate-200 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                Tap to Test Indian Sign Vocabulary:
              </span>
              <span className="text-[11px] text-slate-400">Emulates verified ISL landmark pose</span>
            </div>

            <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-thin">
              {quickPresets.map((preset) => {
                const isActive = activeTestGesture === preset.id;
                return (
                  <button
                    key={preset.id}
                    onClick={() => {
                      SoundService.playClick();
                      setActiveTestGesture(preset.id);
                      const signDef = ISL_DICTIONARY.find((s) => s.id === preset.id);
                      if (signDef) {
                        setActiveSignText(signDef.name);
                        SoundService.playSuccess();
                        setHoldProgress(100);
                        setIsCommitted(true);
                        translateText(signDef.name, selectedLanguage, isOnline).then((trans) => {
                          setTranslatedText(trans.translatedText);
                          if (autoSpeak) {
                            playSpeech(trans.translatedText);
                          }
                        });
                        setSentenceBuffer((prev) => {
                          if (prev[prev.length - 1] === signDef.name) return prev;
                          return [...prev, signDef.name].slice(-10);
                        });
                      }
                    }}
                    className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0 active:scale-95 ${
                      isActive
                        ? 'bg-gradient-to-r from-cyan-500 to-sky-400 text-slate-950 shadow-md shadow-cyan-500/20 font-bold'
                        : 'bg-slate-950 text-slate-200 hover:bg-slate-800 border border-slate-800'
                    }`}
                  >
                    <span className="text-base">{preset.icon}</span>
                    <span>{preset.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right: Live Translation Stage & Speech Waveform */}
        <div className="lg:col-span-5 space-y-5">
          {/* Main Stage Display Card */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-5 shadow-2xl relative overflow-hidden">
            {/* Ambient corner glow */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

            <div className="flex items-center justify-between pb-3 border-b border-slate-800/80">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-mono font-bold uppercase text-slate-300 tracking-wider">
                  Live Spoken Translation
                </span>
              </div>
              <span className="text-xs font-mono text-emerald-400 font-bold tabular-nums">
                {recognitionState?.confidence || 96}% Confident
              </span>
            </div>

            {/* Translated Regional Script in Large Typography */}
            <div className="min-h-[105px] flex flex-col justify-center space-y-1">
              {translatedText ? (
                <>
                  <p className="text-3xl sm:text-4xl font-extrabold text-white leading-tight tracking-tight">
                    {translatedText}
                  </p>
                  <div className="flex items-center gap-2 text-xs font-medium text-cyan-300/80 pt-1">
                    <span>ISL Sign:</span>
                    <span className="bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-white font-semibold">
                      {activeSignText}
                    </span>
                  </div>
                </>
              ) : (
                <p className="text-slate-400 italic text-sm">
                  Sign in front of camera to trigger real-time translation...
                </p>
              )}
            </div>

            {/* Live Hold Progress Bar for Active Gesture */}
            {holdingSign && (
              <div className="p-3.5 rounded-2xl bg-slate-950 border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-cyan-300 flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
                    {isCommitted ? '✓ Confirmed & Added to Sentence' : `Holding: "${holdingSign.name}"`}
                  </span>
                  <span className="font-mono text-xs font-bold text-cyan-400 tabular-nums">
                    {holdProgress}%
                  </span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-150 ${
                      isCommitted
                        ? 'bg-emerald-400'
                        : 'bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400'
                    }`}
                    style={{ width: `${holdProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Simulated Audio Waveform Bar */}
            <div className="flex items-center gap-1 h-6 px-3 rounded-xl bg-slate-950 border border-slate-800/80">
              {[40, 70, 30, 90, 60, 100, 80, 50, 70, 40, 85, 55, 95, 60, 40, 75, 45, 90, 30].map(
                (h, i) => (
                  <div
                    key={i}
                    className={`flex-1 rounded-full transition-all duration-150 ${
                      isSpeaking ? 'bg-cyan-400 animate-pulse' : 'bg-slate-800'
                    }`}
                    style={{
                      height: isSpeaking ? `${h}%` : '20%',
                    }}
                  />
                )
              )}
            </div>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
              <div className="flex items-center gap-2">
                {isSpeaking ? (
                  <button
                    onClick={stopSpeech}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white bg-rose-600 hover:bg-rose-500 active:scale-95 transition-all shadow-md"
                  >
                    <VolumeX className="w-4 h-4" />
                    <span>Stop Audio</span>
                  </button>
                ) : (
                  <button
                    onClick={() => playSpeech(translatedText)}
                    disabled={!translatedText}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-300 hover:brightness-110 active:scale-95 disabled:opacity-40 transition-all shadow-md shadow-cyan-500/20"
                  >
                    <Volume2 className="w-4 h-4 text-slate-950" />
                    <span>Speak Aloud</span>
                  </button>
                )}

                <label className="flex items-center gap-1.5 text-xs text-slate-300 cursor-pointer ml-1 select-none">
                  <input
                    type="checkbox"
                    checked={autoSpeak}
                    onChange={(e) => setAutoSpeak(e.target.checked)}
                    className="w-4 h-4 rounded bg-slate-950 border-slate-700 text-cyan-400 focus:ring-0 cursor-pointer"
                  />
                  <span>Auto-speak</span>
                </label>
              </div>

              {/* Utility Tools */}
              <div className="flex items-center gap-1.5">
                <button
                  onClick={handleCopy}
                  disabled={!translatedText}
                  className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors"
                  title="Copy text"
                >
                  {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                </button>

                <button
                  onClick={handleSaveToConversation}
                  disabled={!translatedText}
                  className="p-2 rounded-xl text-slate-300 hover:text-white bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors"
                  title="Save phrase to history"
                >
                  {savedSuccess ? (
                    <Check className="w-4 h-4 text-emerald-400" />
                  ) : (
                    <BookmarkPlus className="w-4 h-4" />
                  )}
                </button>

                <button
                  onClick={handleClear}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-400 bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors"
                  title="Clear output"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Speech rate slider */}
            <div className="flex items-center justify-between text-xs text-slate-400 pt-1">
              <span className="flex items-center gap-1">
                <Sliders className="w-3.5 h-3.5 text-cyan-400" /> Cadence: {speechRate}x
              </span>
              <input
                type="range"
                min="0.7"
                max="1.3"
                step="0.05"
                value={speechRate}
                onChange={(e) => setSpeechRate(parseFloat(e.target.value))}
                className="w-28 accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>

          {/* Continuous Sign Sequence Ribbon */}
          <div className="rounded-3xl bg-slate-900/80 border border-slate-800 p-5 space-y-3.5 shadow-xl">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                Continuous Sentence Builder
              </span>
              <div className="flex items-center gap-2">
                {sentenceBuffer.length > 0 && (
                  <>
                    <button
                      onClick={() => {
                        SoundService.playClick();
                        setSentenceBuffer((prev) => prev.slice(0, -1));
                      }}
                      className="flex items-center gap-1 text-xs text-slate-300 hover:text-cyan-300 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800"
                      title="Remove last sign"
                    >
                      <Undo2 className="w-3.5 h-3.5" />
                      <span>Undo</span>
                    </button>
                    <button
                      onClick={() => {
                        SoundService.playClick();
                        setSentenceBuffer([]);
                      }}
                      className="text-xs text-slate-400 hover:text-rose-300 px-2 py-1 rounded-lg bg-slate-950 border border-slate-800"
                    >
                      Clear
                    </button>
                  </>
                )}
              </div>
            </div>

            {sentenceBuffer.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                Hold signs in front of the camera to assemble a continuous sentence here without accidental flickering.
              </p>
            ) : (
              <div className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  {sentenceBuffer.map((s, idx) => (
                    <span
                      key={idx}
                      className="group inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-slate-950 border border-cyan-500/40 text-cyan-300 shadow-sm"
                    >
                      <span>{s}</span>
                      <button
                        onClick={() => {
                          SoundService.playClick();
                          setSentenceBuffer((prev) => prev.filter((_, i) => i !== idx));
                        }}
                        className="text-slate-500 hover:text-rose-400 rounded-full transition-colors"
                        title="Remove this sign"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </span>
                  ))}
                </div>

                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-[10px] text-slate-400 uppercase font-mono">
                      Constructed Regional Sentence:
                    </p>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => playSpeech(bufferTranslated)}
                        className="flex items-center gap-1 text-[11px] font-bold text-cyan-400 hover:text-cyan-300 px-2 py-0.5 rounded bg-cyan-950/50 border border-cyan-500/30"
                      >
                        <Volume2 className="w-3 h-3" />
                        <span>Speak Sentence</span>
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(bufferTranslated);
                            setSentenceCopied(true);
                            SoundService.playClick();
                            setTimeout(() => setSentenceCopied(false), 2000);
                          } catch (_) {}
                        }}
                        className="text-[11px] font-bold text-slate-300 hover:text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-800"
                      >
                        {sentenceCopied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                  </div>
                  <p className="font-extrabold text-white text-base sm:text-lg">
                    {bufferTranslated}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Quick Sign Recalibration */}
          <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2 text-slate-300">
              <Edit3 className="w-4 h-4 text-cyan-400" />
              <span>Sign recognized incorrectly?</span>
            </div>
            <button
              onClick={() => setIsCorrecting(!isCorrecting)}
              className="text-xs font-semibold text-cyan-400 hover:underline"
            >
              {isCorrecting ? 'Close' : 'Recalibrate Sign'}
            </button>
          </div>

          {isCorrecting && (
            <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
              <p className="text-xs text-slate-400">Select what you intended to sign:</p>
              <div className="flex flex-wrap gap-1.5">
                {ISL_DICTIONARY.slice(0, 10).map((sign) => (
                  <button
                    key={sign.id}
                    onClick={() => handleApplyCorrection(sign.name)}
                    className="px-2.5 py-1 text-xs rounded-lg bg-slate-950 hover:bg-slate-800 text-slate-200 border border-slate-800 transition-colors"
                  >
                    {sign.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

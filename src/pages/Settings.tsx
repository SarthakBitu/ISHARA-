import React, { useState } from 'react';
import { useAccessibility } from '../hooks/useAccessibility';
import { LanguageSelector } from '../components/LanguageSelector';
import { SUPPORTED_LANGUAGES } from '../data/languages';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import {
  Sliders,
  Eye,
  Type,
  Vibrate,
  Volume2,
  HardDrive,
  Camera,
  ShieldCheck,
  CheckCircle2,
  Info,
} from 'lucide-react';

export const Settings: React.FC = () => {
  const { settings, updateSetting, triggerHaptic } = useAccessibility();
  const isOnline = useOnlineStatus();

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Settings Header */}
      <div className="pb-4 border-b border-slate-800">
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
          <span>Platform Settings & Accessibility</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">
          Configure WCAG 2.2 AA accessibility preferences, camera behavior, and offline language resources.
        </p>
      </div>

      <div className="space-y-6">
        {/* Section 1: Accessibility Controls */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-800">
            <Eye className="w-4 h-4 text-cyan-400" />
            Visual & Sensory Accessibility (WCAG 2.2 AA)
          </h2>

          <div className="space-y-3">
            {/* High Contrast */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <p className="text-sm font-bold text-white">High Contrast Mode</p>
                <p className="text-xs text-slate-400">
                  Increases contrast borders and text luminance for low-vision signers.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.highContrast}
                onChange={(e) => {
                  updateSetting('highContrast', e.target.checked);
                  triggerHaptic();
                }}
                className="w-5 h-5 accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Large Text */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <p className="text-sm font-bold text-white">Large Text & Caption Mode</p>
                <p className="text-xs text-slate-400">
                  Scales up typography for translated phrases, subtitles, and system alerts.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.largeText}
                onChange={(e) => {
                  updateSetting('largeText', e.target.checked);
                  triggerHaptic();
                }}
                className="w-5 h-5 accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Vibration Feedback */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <p className="text-sm font-bold text-white">Haptic Vibration Alerts</p>
                <p className="text-xs text-slate-400">
                  Provides gentle tactile confirmation when a sign is recognized or SOS is armed.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.hapticFeedback}
                onChange={(e) => {
                  updateSetting('hapticFeedback', e.target.checked);
                  if (e.target.checked) triggerHaptic(100);
                }}
                className="w-5 h-5 accent-cyan-400 cursor-pointer"
              />
            </div>
          </div>
        </div>

        {/* Section 2: Voice & Speech Playback */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
          <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-800">
            <Volume2 className="w-4 h-4 text-cyan-400" />
            Speech Output & Voice Cadence
          </h2>

          <div className="space-y-4">
            {/* Auto speak */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <p className="text-sm font-bold text-white">Auto-Speak Recognized Signs</p>
                <p className="text-xs text-slate-400">
                  Automatically speaks aloud the translated regional sentence upon gesture completion.
                </p>
              </div>
              <input
                type="checkbox"
                checked={settings.autoSpeak}
                onChange={(e) => updateSetting('autoSpeak', e.target.checked)}
                className="w-5 h-5 accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Speech rate slider */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-white">Voice Speech Rate: {settings.speechRate}x</span>
                <span className="text-slate-400 font-mono">0.7x (Deliberate) – 1.3x (Fast)</span>
              </div>
              <input
                type="range"
                min="0.7"
                max="1.3"
                step="0.05"
                value={settings.speechRate}
                onChange={(e) => updateSetting('speechRate', parseFloat(e.target.value))}
                className="w-full accent-cyan-400 cursor-pointer"
              />
            </div>

            {/* Preferred Default Language */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold text-white">Default Regional Language</p>
                <p className="text-xs text-slate-400">
                  Primary regional language loaded upon launching ISHARA AI.
                </p>
              </div>
              <LanguageSelector
                selectedLanguage={settings.preferredLanguage}
                onSelectLanguage={(code) => updateSetting('preferredLanguage', code)}
              />
            </div>
          </div>
        </div>

        {/* Section 3: Offline Language Packs & Model Status */}
        <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h2 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
              <HardDrive className="w-4 h-4 text-emerald-400" />
              Offline Model Status & Regional Packs
            </h2>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
              Cached Locally
            </span>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed">
            All 13 Indian regional languages are bundled with full offline lexicons so essential communication, greetings, daily needs, and emergency SOS payload formatting function without internet access.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-1">
            {SUPPORTED_LANGUAGES.map((lang) => (
              <div
                key={lang.code}
                className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs"
              >
                <div>
                  <p className="font-bold text-white">{lang.name}</p>
                  <p className="text-[11px] text-cyan-400">{lang.nativeName}</p>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Ready</span>
                </div>
              </div>
            ))}
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 text-xs text-slate-400 flex items-start gap-2.5">
            <Info className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              When online, ISHARA AI enriches translations with Google Gemini 3.8 Flash for fluid conversational nuances. When offline, it automatically routes through the built-in lexicon.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

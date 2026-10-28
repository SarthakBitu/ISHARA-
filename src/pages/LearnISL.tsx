import React, { useState } from 'react';
import { ISL_DICTIONARY } from '../data/islDictionary';
import { ISLSignDefinition, RecognitionState } from '../types/isl';
import { ISLHandGraphic } from '../components/ISLHandGraphic';
import { CameraView } from '../components/CameraView';
import { OfflineStorage } from '../services/offlineStorage';
import { SoundService } from '../services/soundEffects';
import confetti from 'canvas-confetti';
import {
  BookOpen,
  Award,
  Video,
  CheckCircle2,
  Sparkles,
  ChevronRight,
  Info,
  Flame,
  Zap,
  Gamepad2,
  Trophy,
  RotateCcw,
  Check,
} from 'lucide-react';

export const LearnISL: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [activeSign, setActiveSign] = useState<ISLSignDefinition>(ISL_DICTIONARY[0]);
  const [isPracticeMode, setIsPracticeMode] = useState<boolean>(false);
  const [practiceScore, setPracticeScore] = useState<number>(0);
  const [practiceMatched, setPracticeMatched] = useState<boolean>(false);

  // Gamification: Streak & XP
  const [xp, setXp] = useState<number>(350);
  const [streakDays, setStreakDays] = useState<number>(3);

  const [masteredSigns, setMasteredSigns] = useState<string[]>(() =>
    OfflineStorage.getMasteredSigns()
  );

  const categories = [
    { id: 'all', label: 'All Lessons' },
    { id: 'greeting', label: 'Greetings' },
    { id: 'needs', label: 'Everyday Needs' },
    { id: 'emergency', label: 'Emergency' },
    { id: 'conversation', label: 'Conversation' },
    { id: 'number', label: 'Numbers' },
    { id: 'alphabet', label: 'ISL Alphabet' },
  ];

  const filteredSigns =
    selectedCategory === 'all'
      ? ISL_DICTIONARY
      : ISL_DICTIONARY.filter((s) => s.category === selectedCategory);

  const isCurrentMastered = masteredSigns.includes(activeSign.id);

  const handleSignPracticeResult = (state: RecognitionState) => {
    if (state.currentSign) {
      if (state.currentSign.id === activeSign.id) {
        setPracticeScore(state.confidence);
        if (state.confidence >= 80 && !practiceMatched) {
          setPracticeMatched(true);
          handleAwardMastery(activeSign.id);
        }
      } else {
        setPracticeScore(Math.max(20, Math.round(state.confidence * 0.4)));
      }
    }
  };

  const handleAwardMastery = (signId: string) => {
    SoundService.playSuccess();
    setXp((prev) => prev + 50);
    OfflineStorage.markSignMastered(signId);
    setMasteredSigns(OfflineStorage.getMasteredSigns());

    try {
      confetti({
        particleCount: 70,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#06B6D4', '#38BDF8', '#818CF8', '#F59E0B'],
      });
    } catch (_) {}
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Gamified Header Banner */}
      <div className="rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 p-6 sm:p-8 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6 shadow-2xl">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-400 bg-amber-950/60 border border-amber-500/30 px-3 py-1 rounded-full">
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Interactive ISL Arcade & Academy</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Learn Indian Sign Language
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Master authentic signs, two-handed ISL finger spelling, daily greetings, and receive instant AI feedback through your camera.
          </p>
        </div>

        {/* Gamification Stats Island */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Streak Card */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 shadow-md">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-amber-500/10 text-amber-400">
              <Flame className="w-5 h-5 fill-amber-400 text-amber-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-mono font-bold">Daily Streak</p>
              <p className="text-base font-extrabold text-white tabular-nums">{streakDays} Days</p>
            </div>
          </div>

          {/* XP Card */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 shadow-md">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 text-cyan-400">
              <Zap className="w-5 h-5 fill-cyan-400 text-cyan-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-mono font-bold">Total XP</p>
              <p className="text-base font-extrabold text-cyan-300 tabular-nums">{xp} XP</p>
            </div>
          </div>

          {/* Mastery Progress Card */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-2xl bg-slate-950 border border-slate-800 shadow-md min-w-[150px]">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-400">
              <Trophy className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <p className="text-[10px] text-slate-400 uppercase font-mono font-bold">Mastered</p>
              <p className="text-base font-extrabold text-white tabular-nums">
                {masteredSigns.length} / {ISL_DICTIONARY.length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              SoundService.playClick();
              setSelectedCategory(cat.id);
            }}
            className={`px-4 py-2 rounded-xl font-bold whitespace-nowrap transition-all shrink-0 active:scale-95 ${
              selectedCategory === cat.id
                ? 'bg-gradient-to-r from-cyan-400 to-sky-300 text-slate-950 shadow-md shadow-cyan-500/20'
                : 'bg-slate-900 text-slate-300 hover:bg-slate-800 border border-slate-800'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Main Studio: Active Lesson Showcase & Camera Practice */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Active Sign Spotlight & Practice */}
        <div className="lg:col-span-7 space-y-6">
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 sm:p-8 space-y-6 shadow-2xl relative overflow-hidden">
            <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-800">
              <div>
                <span className="text-[11px] font-mono uppercase font-bold text-cyan-400 tracking-wider">
                  Lesson: {activeSign.category.toUpperCase()} · Level: {activeSign.difficulty}
                </span>
                <h2 className="text-3xl font-extrabold text-white mt-1">
                  {activeSign.name}
                </h2>
                <p className="text-sm text-slate-300 mt-1">
                  {activeSign.meaning}
                </p>
              </div>

              <button
                onClick={() => handleAwardMastery(activeSign.id)}
                className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 active:scale-95 ${
                  isCurrentMastered
                    ? 'bg-emerald-950 text-emerald-300 border border-emerald-500/40'
                    : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                }`}
              >
                <CheckCircle2 className={`w-4 h-4 ${isCurrentMastered ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{isCurrentMastered ? 'Mastered (+50 XP)' : 'Claim +50 XP'}</span>
              </button>
            </div>

            {/* Mode Switcher: Anatomical Diagram vs Guided Camera Challenge */}
            <div className="flex items-center justify-between p-2 rounded-2xl bg-slate-950 border border-slate-800 text-xs">
              <span className="font-semibold text-slate-300 px-2">
                {isPracticeMode ? 'Active Camera Recognition Challenge' : 'Anatomical Gesture Illustration'}
              </span>
              <button
                onClick={() => {
                  SoundService.playClick();
                  setIsPracticeMode(!isPracticeMode);
                  setPracticeMatched(false);
                  setPracticeScore(0);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-bold bg-cyan-500 text-slate-950 hover:bg-cyan-400 transition-colors"
              >
                <Video className="w-3.5 h-3.5" />
                <span>{isPracticeMode ? 'Show Diagram' : 'Launch Camera Practice'}</span>
              </button>
            </div>

            {/* Display Viewport */}
            {isPracticeMode ? (
              <div className="space-y-4">
                <CameraView
                  onSignRecognized={handleSignPracticeResult}
                  activeSignId={activeSign.id}
                  className="w-full"
                />

                {/* Score & Progress Ring */}
                <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-2.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-semibold">Target Sign Accuracy Match:</span>
                    <span className="font-mono font-extrabold text-cyan-400 text-sm tabular-nums">
                      {practiceScore}%
                    </span>
                  </div>

                  <div className="w-full h-3 rounded-full bg-slate-900 overflow-hidden p-0.5 border border-slate-800">
                    <div
                      className={`h-full rounded-full transition-all duration-300 ${
                        practiceScore >= 80 ? 'bg-emerald-400 shadow-sm shadow-emerald-400' : 'bg-cyan-400'
                      }`}
                      style={{ width: `${practiceScore}%` }}
                    />
                  </div>

                  {practiceMatched && (
                    <div className="flex items-center gap-2 p-3 rounded-xl bg-emerald-950/70 border border-emerald-500/40 text-xs text-emerald-200">
                      <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                      <span className="font-bold">Fantastic! Sign formation verified. You earned +50 XP!</span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col sm:flex-row items-center gap-6 p-6 rounded-2xl bg-slate-950 border border-slate-800/80">
                <ISLHandGraphic
                  type={activeSign.svgPathType}
                  size={150}
                  className="shrink-0 p-4"
                  animated
                />
                <div className="space-y-2.5 text-xs">
                  <span className="text-cyan-400 font-bold uppercase text-[10px] tracking-wider">
                    Anatomical Gesture Guide:
                  </span>
                  <p className="text-slate-200 leading-relaxed font-medium text-sm">
                    {activeSign.description}
                  </p>
                  <p className="text-slate-400">
                    Format: {activeSign.isTwoHanded ? 'Two-Handed ISL Sign' : 'One-Handed ISL Sign'}
                  </p>
                </div>
              </div>
            )}

            {/* Step-by-Step Breakdown */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                How to Perform This Sign
              </h3>
              <div className="space-y-2 text-xs">
                {activeSign.instructions.map((step, idx) => (
                  <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-slate-950 border border-slate-800/80">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-cyan-950 text-cyan-400 font-mono text-xs font-bold border border-cyan-500/30 shrink-0">
                      {idx + 1}
                    </span>
                    <p className="text-slate-200 leading-relaxed">{step}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Cultural & Linguistic Insight */}
            <div className="p-4 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 text-xs text-slate-200 leading-relaxed flex items-start gap-3">
              <Info className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <strong className="text-indigo-300">Indian Sign Language Note: </strong>
                {activeSign.tips}
              </div>
            </div>
          </div>
        </div>

        {/* Right: Lesson Grid Catalog */}
        <div className="lg:col-span-5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-bold text-white tracking-wide">
              Course Library ({filteredSigns.length})
            </h3>
            <span className="text-xs text-slate-400">Click to study</span>
          </div>

          <div className="space-y-2.5 max-h-[700px] overflow-y-auto pr-1">
            {filteredSigns.map((sign) => {
              const isSelected = sign.id === activeSign.id;
              const isMastered = masteredSigns.includes(sign.id);

              return (
                <button
                  key={sign.id}
                  onClick={() => {
                    SoundService.playClick();
                    setActiveSign(sign);
                    setPracticeMatched(false);
                    setPracticeScore(0);
                  }}
                  className={`w-full text-left p-4 rounded-2xl border transition-all flex items-center justify-between gap-3 active:scale-98 ${
                    isSelected
                      ? 'bg-slate-900 border-cyan-500/50 shadow-lg ring-1 ring-cyan-500/30'
                      : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ISLHandGraphic
                      type={sign.svgPathType}
                      size={46}
                      className="shrink-0 p-1.5 rounded-xl bg-slate-950"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{sign.name}</span>
                        {isMastered && (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                      </div>
                      <p className="text-xs text-slate-400 line-clamp-1">
                        {sign.meaning}
                      </p>
                    </div>
                  </div>

                  <ChevronRight className={`w-4 h-4 text-slate-500 ${isSelected ? 'text-cyan-400' : ''}`} />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

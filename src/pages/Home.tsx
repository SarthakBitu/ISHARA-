import React from 'react';
import {
  Sparkles,
  ArrowRight,
  Video,
  MessagesSquare,
  BookOpen,
  ShieldAlert,
  Globe,
  WifiOff,
  CheckCircle2,
  Hand,
  Mic,
  Gamepad2,
  Flame,
  Volume2,
  Heart,
} from 'lucide-react';
import { ISLHandGraphic } from '../components/ISLHandGraphic';
import { SoundService } from '../services/soundEffects';
import { SpeechService } from '../services/speechService';

interface HomeProps {
  onNavigate: (tab: string) => void;
  onOpenSOS: () => void;
}

export const Home: React.FC<HomeProps> = ({ onNavigate, onOpenSOS }) => {
  const handleHearDailySign = () => {
    SoundService.playClick();
    SpeechService.speak('नमस्ते! आप कैसे हैं? Hello, how are you?', 'hi');
  };

  return (
    <div className="space-y-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-8 pb-14 sm:pt-16 sm:pb-20 border-b border-slate-900">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
            {/* Left: Headline & Lovable Persona Actions */}
            <div className="lg:col-span-7 space-y-6">
              <div className="inline-flex items-center gap-2 text-xs font-bold text-cyan-300 bg-cyan-950/70 border border-cyan-500/40 px-4 py-1.5 rounded-full shadow-sm">
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                <span>AI-Powered Indian Sign Language & Multilingual Voice</span>
              </div>

              <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-white leading-[1.12]">
                Every gesture has a voice. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-sky-300 to-indigo-400">
                  Every voice deserves to be heard.
                </span>
              </h1>

              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-xl">
                Welcome to <strong>ISHARA AI</strong> — India's accessible communication platform that turns Indian Sign Language into natural speech and spoken words into readable sign graphics across 13 Indian languages.
              </p>

              {/* Three Lovable Role Launchers */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                <button
                  onClick={() => {
                    SoundService.playClick();
                    onNavigate('translate');
                  }}
                  className="p-4 rounded-2xl bg-gradient-to-br from-cyan-500 to-sky-400 text-slate-950 text-left font-bold transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-cyan-500/20 group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-xl bg-slate-950/15 text-slate-950">
                      <Hand className="w-5 h-5" />
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-base">I am Signing (Deaf)</p>
                  <p className="text-xs text-slate-900/80 font-medium mt-0.5">
                    Live camera recognition to speech & text
                  </p>
                </button>

                <button
                  onClick={() => {
                    SoundService.playClick();
                    onNavigate('conversation');
                  }}
                  className="p-4 rounded-2xl bg-slate-900 hover:bg-slate-850 text-white text-left font-bold transition-all hover:scale-[1.02] active:scale-95 border border-slate-800 shadow-xl group"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="p-2 rounded-xl bg-indigo-500/20 text-indigo-400">
                      <Mic className="w-5 h-5" />
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                  <p className="text-base">I am Speaking (Hearing)</p>
                  <p className="text-xs text-slate-400 font-medium mt-0.5">
                    Speak into mic for large accessible captions
                  </p>
                </button>
              </div>

              {/* Secondary Quick Jump */}
              <div className="flex flex-wrap items-center gap-4 pt-1">
                <button
                  onClick={() => {
                    SoundService.playClick();
                    onNavigate('learn');
                  }}
                  className="inline-flex items-center gap-2 text-xs font-bold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <Gamepad2 className="w-4 h-4" />
                  <span>Learn ISL in Arcade (+50 XP)</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <span className="text-slate-700">·</span>
                <button
                  onClick={() => {
                    SoundService.playClick();
                    onOpenSOS();
                  }}
                  className="inline-flex items-center gap-2 text-xs font-bold text-rose-400 hover:text-rose-300 transition-colors"
                >
                  <ShieldAlert className="w-4 h-4" />
                  <span>India 112 Safety Center</span>
                </button>
              </div>

              {/* Trust Indicators */}
              <div className="pt-4 flex flex-wrap items-center gap-6 text-xs text-slate-400 border-t border-slate-900">
                <span className="flex items-center gap-1.5 font-medium">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" /> 21 Landmarks per Hand
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <Globe className="w-4 h-4 text-cyan-400" /> 13 Indian Dialects
                </span>
                <span className="flex items-center gap-1.5 font-medium">
                  <WifiOff className="w-4 h-4 text-amber-400" /> Works 100% Offline
                </span>
              </div>
            </div>

            {/* Right: Hero Graphic & Daily Sign Card */}
            <div className="lg:col-span-5 space-y-6">
              {/* Cinematic Photo */}
              <div className="relative rounded-3xl overflow-hidden border border-slate-800 shadow-2xl group">
                <img
                  src="/src/assets/images/hero_isl_communication_1793184551921.jpg"
                  alt="Deaf woman and hearing colleague communicating warmly using Indian Sign Language"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto aspect-video sm:aspect-[4/3] object-cover group-hover:scale-105 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />

                <div className="absolute bottom-4 left-4 right-4 p-4 rounded-2xl bg-slate-900/90 backdrop-blur-md border border-slate-800 text-xs shadow-xl">
                  <div className="flex items-center justify-between font-bold text-white">
                    <span>Authentic Indian Sign Language</span>
                    <span className="font-mono text-cyan-400 text-[11px]">42 Landmark Tracking</span>
                  </div>
                  <p className="text-[11px] text-slate-300 mt-1">
                    Connecting millions of Deaf citizens across classrooms, workplaces, and public transit.
                  </p>
                </div>
              </div>

              {/* Daily Featured ISL Sign Card */}
              <div className="p-5 rounded-3xl bg-slate-900 border border-slate-800 flex items-center justify-between gap-4 shadow-xl">
                <div className="flex items-center gap-4">
                  <ISLHandGraphic type="joined-palms" size={60} className="shrink-0 p-1" />
                  <div>
                    <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-wider font-mono">
                      Daily Indian Sign
                    </span>
                    <p className="text-base font-extrabold text-white">Namaste 🙏</p>
                    <p className="text-xs text-slate-400">Respectful Greeting / Welcome</p>
                  </div>
                </div>

                <button
                  onClick={handleHearDailySign}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold text-cyan-300 bg-cyan-950 border border-cyan-500/30 hover:bg-cyan-900/50 transition-colors shrink-0"
                >
                  <Volume2 className="w-3.5 h-3.5" />
                  <span>Hear</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Lovable Feature Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
          <span className="text-xs font-mono font-bold uppercase tracking-wider text-cyan-400">
            Engineered with Heart
          </span>
          <h2 className="text-2xl sm:text-4xl font-extrabold text-white tracking-tight">
            Designed to Make Everyone Feel Included
          </h2>
          <p className="text-sm text-slate-400">
            No barrier should stop an Indian citizen from ordering tea, having a laugh with friends, or getting emergency help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 transition-all flex flex-col justify-between shadow-xl group">
            <div className="space-y-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-cyan-950 text-cyan-400 border border-cyan-500/30 group-hover:scale-110 transition-transform">
                <Hand className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Live Sign to Speech</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Uses 21 landmark hand tracking to translate one-handed and two-handed ISL gestures into readable text and regional voice in real time.
              </p>
            </div>
            <button
              onClick={() => onNavigate('translate')}
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-cyan-400 hover:text-cyan-300"
            >
              Open Sign Studio <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 2 */}
          <div className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-indigo-500/40 transition-all flex flex-col justify-between shadow-xl group">
            <div className="space-y-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-indigo-950 text-indigo-400 border border-indigo-500/30 group-hover:scale-110 transition-transform">
                <MessagesSquare className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Face-to-Face Companion</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                A seamless split-screen mode for Deaf and hearing peers. Speech is transcribed into large text; signs are translated into voice.
              </p>
            </div>
            <button
              onClick={() => onNavigate('conversation')}
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300"
            >
              Launch Companion <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Card 3 */}
          <div className="p-7 rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between shadow-xl group">
            <div className="space-y-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-2xl bg-amber-950 text-amber-400 border border-amber-500/30 group-hover:scale-110 transition-transform">
                <Gamepad2 className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-white">Interactive ISL Arcade</h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Learn the two-handed ISL alphabet, numbers, and daily greetings. Practice with your camera and earn streaks and XP!
              </p>
            </div>
            <button
              onClick={() => onNavigate('learn')}
              className="mt-6 inline-flex items-center gap-1.5 text-xs font-bold text-amber-400 hover:text-amber-300"
            >
              Play & Learn (+50 XP) <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* Community Story Spotlight */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="rounded-3xl bg-slate-900 border border-slate-800 p-8 sm:p-12 shadow-2xl">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-4 flex justify-center">
              <div className="relative rounded-3xl overflow-hidden border-2 border-cyan-500/40 shadow-xl max-w-[260px]">
                <img
                  src="/src/assets/images/avatar_deaf_community_1793184552199.jpg"
                  alt="Indian Deaf youth accessibility advocate"
                  referrerPolicy="no-referrer"
                  className="w-full h-auto aspect-square object-cover"
                />
              </div>
            </div>

            <div className="lg:col-span-8 space-y-4">
              <span className="text-xs font-bold text-cyan-400 uppercase tracking-wider font-mono">
                Indian Deaf Community Voice
              </span>
              <h3 className="text-2xl sm:text-3xl font-extrabold text-white">
                "ISHARA AI lets me express myself anywhere — from my college seminar to the local railway station."
              </h3>
              <p className="text-sm text-slate-300 leading-relaxed">
                Designed alongside signers and teachers across Delhi, Bangalore, and Bhubaneswar. ISHARA AI respects authentic two-handed ISL grammar, natural facial expressions, and regional mother tongues.
              </p>

              <div className="pt-2 flex items-center gap-4 text-xs text-slate-400 font-mono">
                <span>Ananya Sharma · ISL Advocate</span>
                <span>·</span>
                <span>Bengaluru, India</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

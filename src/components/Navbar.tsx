import React, { useState } from 'react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';
import { PWAInstallButton } from './PWAInstallButton';
import { SoundService } from '../services/soundEffects';
import {
  ShieldAlert,
  Wifi,
  WifiOff,
  Menu,
  X,
  Sparkles,
  Video,
  MessagesSquare,
  Gamepad2,
  History as HistoryIcon,
  Settings as SettingsIcon,
  Volume2,
  VolumeX,
  Hand,
  Mic,
  Users2,
} from 'lucide-react';

export type UserPersona = 'deaf' | 'hearing' | 'dual';

interface NavbarProps {
  activeTab: string;
  onSelectTab: (tab: string) => void;
  onOpenSOS: () => void;
  persona: UserPersona;
  onSelectPersona: (persona: UserPersona) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  onSelectTab,
  onOpenSOS,
  persona,
  onSelectPersona,
}) => {
  const isOnline = useOnlineStatus();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    SoundService.setEnabled(next);
    if (next) SoundService.playChime();
  };

  const navLinks = [
    { id: 'translate', label: 'Sign Studio', icon: Video, badge: 'Live AI' },
    { id: 'conversation', label: 'Companion', icon: MessagesSquare },
    { id: 'learn', label: 'ISL Arcade', icon: Gamepad2, badge: 'XP' },
    { id: 'emergency', label: 'Safety 112', icon: ShieldAlert },
    { id: 'history', label: 'History', icon: HistoryIcon },
    { id: 'settings', label: 'Settings', icon: SettingsIcon },
  ];

  return (
    <header className="sticky top-0 z-40 w-full bg-slate-950/85 backdrop-blur-xl border-b border-slate-800/80 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between gap-4 py-3">
          {/* Zone 1: Brand Wordmark */}
          <button
            onClick={() => {
              onSelectTab('home');
              setMobileMenuOpen(false);
              SoundService.playClick();
            }}
            className="flex items-center gap-2.5 text-left whitespace-nowrap shrink-0 group focus:outline-none"
          >
            <div className="relative flex items-center justify-center w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-500 text-slate-950 font-black shadow-md shadow-cyan-500/20 group-hover:scale-105 transition-transform">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-lg font-extrabold tracking-tight text-white font-['Plus_Jakarta_Sans']">
                ISHARA <span className="text-cyan-400">AI</span>
              </span>
              <p className="text-[10px] text-cyan-300/80 font-medium tracking-wide hidden sm:block">
                Indian Sign Language Platform
              </p>
            </div>
          </button>

          {/* Persona Mode Switcher: "I am Signing" vs "I am Speaking" vs "Together" */}
          <div className="hidden md:flex items-center p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs shadow-inner">
            <button
              onClick={() => {
                onSelectPersona('deaf');
                SoundService.playClick();
                if (activeTab === 'home') onSelectTab('translate');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                persona === 'deaf'
                  ? 'bg-cyan-500 text-slate-950 shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Deaf Signer: Focus on Camera & Sign-to-Speech"
            >
              <Hand className="w-3.5 h-3.5" />
              <span>I'm Signing</span>
            </button>

            <button
              onClick={() => {
                onSelectPersona('hearing');
                SoundService.playClick();
                if (activeTab === 'home') onSelectTab('conversation');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                persona === 'hearing'
                  ? 'bg-indigo-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Hearing Speaker: Focus on Voice-to-Text"
            >
              <Mic className="w-3.5 h-3.5" />
              <span>I'm Speaking</span>
            </button>

            <button
              onClick={() => {
                onSelectPersona('dual');
                SoundService.playClick();
                onSelectTab('conversation');
              }}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition-all ${
                persona === 'dual'
                  ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white shadow-sm'
                  : 'text-slate-400 hover:text-white'
              }`}
              title="Dual Conversation: Face-to-Face Split Screen"
            >
              <Users2 className="w-3.5 h-3.5" />
              <span>Two-Way Chat</span>
            </button>
          </div>

          {/* Zone 3: Interactive Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            {/* Sound FX Toggle */}
            <button
              onClick={toggleSound}
              className={`p-2 rounded-xl border transition-colors ${
                soundEnabled
                  ? 'bg-slate-900 border-slate-800 text-cyan-400 hover:bg-slate-800'
                  : 'bg-slate-900 border-slate-800 text-slate-500 hover:bg-slate-800'
              }`}
              title={soundEnabled ? 'Sound feedback active' : 'Sound feedback muted'}
            >
              {soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Online Status */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-mono font-medium border ${
                isOnline
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-500/30'
                  : 'bg-amber-950/40 text-amber-300 border-amber-500/30'
              }`}
              title={isOnline ? 'Online Cloud AI' : 'Offline Lexicon Active'}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-amber-400" />
                  <span>Offline</span>
                </>
              )}
            </div>

            {/* PWA Install */}
            <PWAInstallButton />

            {/* Emergency SOS Button */}
            <button
              onClick={() => {
                SoundService.playChime();
                onOpenSOS();
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-extrabold text-white bg-rose-600 rounded-xl hover:bg-rose-500 active:scale-95 transition-all shadow-md shadow-rose-900/40 shrink-0 whitespace-nowrap animate-pulse"
              aria-label="Emergency SOS 112"
            >
              <ShieldAlert className="w-3.5 h-3.5" />
              <span>SOS 112</span>
            </button>

            {/* Mobile Menu */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-400 hover:text-white rounded-xl bg-slate-900 border border-slate-800"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Primary Desktop Navigation Bar Links */}
        <nav className="hidden lg:flex items-center gap-1 pt-1 pb-2.5 border-t border-slate-900 text-xs">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = activeTab === link.id;
            return (
              <button
                key={link.id}
                onClick={() => {
                  onSelectTab(link.id);
                  SoundService.playClick();
                }}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg font-semibold transition-all whitespace-nowrap shrink-0 ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm border border-slate-700/80'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
                }`}
              >
                <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-cyan-400' : 'text-slate-400'}`} />
                <span>{link.label}</span>
                {link.badge && (
                  <span
                    className={`text-[9px] font-mono px-1.5 py-0.2 rounded ${
                      isActive ? 'bg-cyan-950 text-cyan-300 border border-cyan-500/40' : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {link.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-slate-950 border-b border-slate-800 px-4 py-4 space-y-3">
          {/* Mobile Persona Switcher */}
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-xl bg-slate-900 border border-slate-800 text-xs">
            <button
              onClick={() => {
                onSelectPersona('deaf');
                setMobileMenuOpen(false);
                onSelectTab('translate');
              }}
              className={`py-2 rounded-lg font-semibold text-center ${
                persona === 'deaf' ? 'bg-cyan-500 text-slate-950' : 'text-slate-400'
              }`}
            >
              Signer
            </button>
            <button
              onClick={() => {
                onSelectPersona('hearing');
                setMobileMenuOpen(false);
                onSelectTab('conversation');
              }}
              className={`py-2 rounded-lg font-semibold text-center ${
                persona === 'hearing' ? 'bg-indigo-500 text-white' : 'text-slate-400'
              }`}
            >
              Speaker
            </button>
            <button
              onClick={() => {
                onSelectPersona('dual');
                setMobileMenuOpen(false);
                onSelectTab('conversation');
              }}
              className={`py-2 rounded-lg font-semibold text-center ${
                persona === 'dual' ? 'bg-gradient-to-r from-cyan-500 to-indigo-500 text-white' : 'text-slate-400'
              }`}
            >
              Both
            </button>
          </div>

          <div className="space-y-1">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <button
                  key={link.id}
                  onClick={() => {
                    onSelectTab(link.id);
                    setMobileMenuOpen(false);
                    SoundService.playClick();
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm transition-colors ${
                    activeTab === link.id
                      ? 'bg-slate-900 text-cyan-300 font-bold border border-cyan-500/30'
                      : 'text-slate-300 hover:bg-slate-900/60'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className="w-4 h-4 text-cyan-400" />
                    <span>{link.label}</span>
                  </div>
                  {link.badge && (
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-300">
                      {link.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </header>
  );
};

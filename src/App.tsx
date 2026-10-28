import React, { useState } from 'react';
import { Navbar, UserPersona } from './components/Navbar';
import { Footer } from './components/Footer';
import { EmergencySOSModal } from './components/EmergencySOSModal';
import { Home } from './pages/Home';
import { SignRecognizer } from './pages/SignRecognizer';
import { Conversation } from './pages/Conversation';
import { LearnISL } from './pages/LearnISL';
import { Emergency } from './pages/Emergency';
import { History } from './pages/History';
import { Settings } from './pages/Settings';
import { useOnlineStatus } from './hooks/useOnlineStatus';
import { SoundService } from './services/soundEffects';
import {
  WifiOff,
  Video,
  MessagesSquare,
  Gamepad2,
  ShieldAlert,
  Home as HomeIcon,
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('home');
  const [persona, setPersona] = useState<UserPersona>('deaf');
  const [isSOSOpen, setIsSOSOpen] = useState<boolean>(false);
  const isOnline = useOnlineStatus();

  const handleSelectTab = (tab: string) => {
    setActiveTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500/30 selection:text-cyan-200">
      {/* Universal Top Navigation */}
      <Navbar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        onOpenSOS={() => setIsSOSOpen(true)}
        persona={persona}
        onSelectPersona={(p) => {
          setPersona(p);
          if (p === 'deaf') handleSelectTab('translate');
          else if (p === 'hearing' || p === 'dual') handleSelectTab('conversation');
        }}
      />

      {/* Main Viewport */}
      <main className="flex-1 w-full pb-20 lg:pb-0">
        {activeTab === 'home' && (
          <Home
            onNavigate={handleSelectTab}
            onOpenSOS={() => setIsSOSOpen(true)}
          />
        )}
        {activeTab === 'translate' && <SignRecognizer />}
        {activeTab === 'conversation' && <Conversation />}
        {activeTab === 'learn' && <LearnISL />}
        {activeTab === 'emergency' && (
          <Emergency onOpenSOSModal={() => setIsSOSOpen(true)} />
        )}
        {activeTab === 'history' && <History />}
        {activeTab === 'settings' && <Settings />}
      </main>

      {/* Global Emergency SOS Modal */}
      <EmergencySOSModal
        isOpen={isSOSOpen}
        onClose={() => setIsSOSOpen(false)}
      />

      {/* Mobile Floating Bottom Navigation Dock for instant native touch app feel */}
      <div className="lg:hidden fixed bottom-3 left-4 right-4 z-40 bg-slate-900/90 backdrop-blur-xl border border-slate-800 rounded-2xl p-1.5 shadow-2xl flex items-center justify-around">
        {[
          { id: 'home', label: 'Home', icon: HomeIcon },
          { id: 'translate', label: 'Studio', icon: Video },
          { id: 'conversation', label: 'Chat', icon: MessagesSquare },
          { id: 'learn', label: 'Arcade', icon: Gamepad2 },
          { id: 'emergency', label: '112 SOS', icon: ShieldAlert, isSos: true },
        ].map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => {
                SoundService.playClick();
                if (item.isSos) {
                  setIsSOSOpen(true);
                } else {
                  handleSelectTab(item.id);
                }
              }}
              className={`flex flex-col items-center gap-0.5 py-1 px-2.5 rounded-xl text-[10px] font-bold transition-all ${
                item.isSos
                  ? 'text-rose-400'
                  : isActive
                  ? 'text-cyan-400 bg-cyan-950/60 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Offline Toast Banner */}
      {!isOnline && (
        <div className="fixed bottom-20 lg:bottom-6 left-4 z-30 flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-amber-500/95 text-slate-950 font-bold text-xs shadow-2xl backdrop-blur-md border border-amber-300/40">
          <WifiOff className="w-4 h-4 shrink-0 text-slate-950" />
          <span>Offline Active — Using local ISL models & 13 Indian regional lexicons</span>
        </div>
      )}

      {/* Footer */}
      <Footer />
    </div>
  );
}

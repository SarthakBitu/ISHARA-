import React, { useState, useRef, useEffect } from 'react';
import { LanguageCode } from '../types/languages';
import { SUPPORTED_LANGUAGES, getLanguageByCode } from '../data/languages';
import { Languages, ChevronDown, Check, Wifi, HardDrive } from 'lucide-react';

interface LanguageSelectorProps {
  selectedLanguage: LanguageCode;
  onSelectLanguage: (code: LanguageCode) => void;
  className?: string;
  showCapabilities?: boolean;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  selectedLanguage,
  onSelectLanguage,
  className = '',
  showCapabilities = true,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const currentLang = getLanguageByCode(selectedLanguage);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800 hover:border-slate-700 text-xs text-slate-200 transition-colors shrink-0"
        aria-expanded={isOpen}
        aria-label="Select Indian Regional Language"
      >
        <Languages className="w-3.5 h-3.5 text-cyan-400" />
        <span className="font-semibold text-white">{currentLang.name}</span>
        <span className="text-slate-400 font-normal">({currentLang.nativeName})</span>
        <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1.5 w-72 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl py-2 z-50 max-h-80 overflow-y-auto">
          <div className="px-3 py-1.5 border-b border-slate-800/80 text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Indian Regional Languages (13)</span>
            <span className="text-cyan-400 font-mono text-[10px]">Unicode Ready</span>
          </div>

          <div className="divide-y divide-slate-800/40">
            {SUPPORTED_LANGUAGES.map((lang) => {
              const isSelected = lang.code === selectedLanguage;
              return (
                <button
                  key={lang.code}
                  onClick={() => {
                    onSelectLanguage(lang.code);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 text-left text-xs transition-colors hover:bg-slate-800/70 ${
                    isSelected ? 'bg-cyan-950/30 text-cyan-300 font-medium' : 'text-slate-300'
                  }`}
                >
                  <div className="flex flex-col">
                    <div className="flex items-center gap-1.5">
                      <span className="text-white font-medium">{lang.name}</span>
                      <span className="text-slate-400">·</span>
                      <span className="text-cyan-400 text-[13px]">{lang.nativeName}</span>
                    </div>
                    {showCapabilities && (
                      <div className="flex items-center gap-2 mt-0.5 text-[10px] text-slate-400">
                        <span className="flex items-center gap-0.5">
                          <HardDrive className="w-2.5 h-2.5 text-emerald-400" /> Offline Dictionary
                        </span>
                        <span>·</span>
                        <span className="flex items-center gap-0.5">
                          <Wifi className="w-2.5 h-2.5 text-cyan-400" /> Online AI TTS
                        </span>
                      </div>
                    )}
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-cyan-400 shrink-0 ml-2" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

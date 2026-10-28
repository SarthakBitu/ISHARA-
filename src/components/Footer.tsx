import React from 'react';
import { Heart, Sparkles, Shield, Accessibility, Globe } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full bg-slate-950 border-t border-slate-900 py-10 px-4 sm:px-6 text-slate-400 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="flex flex-col items-center md:items-start gap-1">
          <div className="flex items-center gap-2 text-slate-200 font-bold text-sm">
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>ISHARA AI</span>
            <span className="text-slate-500 font-normal">·</span>
            <span className="text-xs text-slate-400 font-normal">Indian Sign Language Platform</span>
          </div>
          <p className="text-slate-400 text-center md:text-left max-w-md">
            "Every Gesture Has a Voice. Every Voice Deserves to Be Heard."
          </p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400">
          <span className="flex items-center gap-1.5">
            <Accessibility className="w-3.5 h-3.5 text-cyan-400" /> WCAG 2.2 AA Accessible
          </span>
          <span className="flex items-center gap-1.5">
            <Shield className="w-3.5 h-3.5 text-rose-400" /> India 112 ERSS Integrated
          </span>
          <span className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-emerald-400" /> 13 Indian Languages
          </span>
        </div>

        <div className="text-slate-400 text-center md:text-right">
          <p>© 2026 ISHARA AI. Built for the Indian Deaf & Hard-of-Hearing Community.</p>
        </div>
      </div>
    </footer>
  );
};

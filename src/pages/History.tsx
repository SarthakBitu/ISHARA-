import React, { useState, useEffect } from 'react';
import { OfflineStorage } from '../services/offlineStorage';
import { ConversationSession } from '../types/conversation';
import { SpeechService } from '../services/speechService';
import {
  History as HistoryIcon,
  Search,
  Download,
  Trash2,
  Calendar,
  Volume2,
  Globe,
  Hand,
  User,
  Sparkles,
} from 'lucide-react';

export const History: React.FC = () => {
  const [sessions, setSessions] = useState<ConversationSession[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  useEffect(() => {
    const list = OfflineStorage.getConversations();
    setSessions(list);
    if (list.length > 0) {
      setActiveSessionId(list[0].id);
    }
  }, []);

  const filteredSessions = sessions.filter((session) => {
    const matchesTitle = session.title.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesMessage = session.messages.some(
      (m) =>
        m.originalText.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (m.translatedText && m.translatedText.toLowerCase().includes(searchQuery.toLowerCase()))
    );
    return matchesTitle || matchesMessage;
  });

  const activeSession = sessions.find((s) => s.id === activeSessionId) || sessions[0];

  const handleDeleteSession = (id: string) => {
    OfflineStorage.deleteSession(id);
    const updated = OfflineStorage.getConversations();
    setSessions(updated);
    if (activeSessionId === id) {
      setActiveSessionId(updated[0]?.id || null);
    }
  };

  const handleClearAll = () => {
    if (confirm('Clear all conversation history stored locally on this device?')) {
      OfflineStorage.clearAllHistory();
      setSessions([]);
      setActiveSessionId(null);
    }
  };

  const handleExportActiveSession = () => {
    if (!activeSession) return;
    const dataStr =
      'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(activeSession, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `${activeSession.title.replace(/\s+/g, '_')}_${Date.now()}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <span>Conversation History</span>
            <span className="text-xs font-mono font-medium px-2 py-0.5 rounded bg-cyan-950/60 text-cyan-400 border border-cyan-500/30">
              Local Storage
            </span>
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            Browse and export past sign-to-voice dialogues. Data resides safely on your device.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportActiveSession}
            disabled={!activeSession}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-slate-300 bg-slate-900 border border-slate-800 hover:bg-slate-800 disabled:opacity-40 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Export Session</span>
          </button>

          <button
            onClick={handleClearAll}
            disabled={sessions.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium text-rose-400 bg-slate-900 border border-slate-800 hover:bg-rose-950/40 disabled:opacity-40 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear All</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Left Sessions List / Right Message Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Sessions List with Search */}
        <div className="lg:col-span-5 space-y-4">
          <div className="relative">
            <Search className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Search conversation text or dates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          <div className="space-y-2.5 max-h-[600px] overflow-y-auto pr-1">
            {filteredSessions.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-slate-900/40 border border-slate-800 text-xs text-slate-400 italic">
                No past conversation records found.
              </div>
            ) : (
              filteredSessions.map((session) => {
                const isSelected = session.id === activeSessionId;
                const lastMsg = session.messages[session.messages.length - 1];

                return (
                  <div
                    key={session.id}
                    onClick={() => setActiveSessionId(session.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'bg-slate-900 border-cyan-500/50 shadow-md ring-1 ring-cyan-500/20'
                        : 'bg-slate-900/60 border-slate-800 hover:bg-slate-900'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <h3 className="font-bold text-white truncate max-w-[200px]">
                        {session.title}
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteSession(session.id);
                        }}
                        className="text-slate-500 hover:text-rose-400 p-1"
                        title="Delete session"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <p className="text-xs text-slate-300 truncate">
                      {lastMsg ? lastMsg.translatedText || lastMsg.originalText : 'Empty session'}
                    </p>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2 font-mono">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(session.startTime).toLocaleDateString()}
                      </span>
                      <span>{session.messages.length} messages</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Column: Full Thread Viewer */}
        <div className="lg:col-span-7">
          {activeSession ? (
            <div className="rounded-2xl bg-slate-900 border border-slate-800 p-6 space-y-6 shadow-xl">
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <div>
                  <h2 className="text-lg font-bold text-white">{activeSession.title}</h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    Started {new Date(activeSession.startTime).toLocaleString()} · Primary Language: {activeSession.primaryLanguage.toUpperCase()}
                  </p>
                </div>
              </div>

              {/* Message Transcript */}
              <div className="space-y-4 max-h-[500px] overflow-y-auto pr-1">
                {activeSession.messages.map((msg) => {
                  const isDeaf = msg.sender === 'deaf';

                  return (
                    <div
                      key={msg.id}
                      className={`flex items-start gap-3 ${isDeaf ? 'justify-start' : 'justify-end'}`}
                    >
                      {isDeaf && (
                        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400 shrink-0 text-xs">
                          <Hand className="w-3.5 h-3.5" />
                        </div>
                      )}

                      <div
                        className={`max-w-[80%] rounded-2xl px-4 py-3 text-xs shadow-sm ${
                          isDeaf
                            ? 'bg-slate-950 border border-slate-800 text-slate-100'
                            : 'bg-cyan-600 text-slate-950 font-medium'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-4 mb-1 text-[10px] opacity-75">
                          <span>{isDeaf ? 'Deaf User (ISL)' : 'Hearing User (Speech)'}</span>
                          <span className="font-mono tabular-nums">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <p className="text-sm font-semibold">{msg.translatedText || msg.originalText}</p>

                        {isDeaf && msg.translatedText && (
                          <p className="text-[11px] text-cyan-400/80 mt-1">
                            Original Sign: {msg.originalText}
                          </p>
                        )}

                        <div className="mt-1 flex items-center justify-end">
                          <button
                            onClick={() => SpeechService.speak(msg.translatedText || msg.originalText, msg.language)}
                            className={`p-1 rounded hover:opacity-80 transition-opacity ${
                              isDeaf ? 'text-cyan-400' : 'text-slate-950'
                            }`}
                            title="Play Speech"
                          >
                            <Volume2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {!isDeaf && (
                        <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-indigo-950 border border-indigo-500/40 text-indigo-400 shrink-0 text-xs">
                          <User className="w-3.5 h-3.5" />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="p-12 text-center rounded-2xl bg-slate-900 border border-slate-800 text-slate-400 text-sm">
              Select a conversation session to review message history.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

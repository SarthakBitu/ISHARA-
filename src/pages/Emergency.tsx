import React, { useState, useEffect } from 'react';
import { LocationService, GeoLocationState } from '../services/locationService';
import { OfflineStorage } from '../services/offlineStorage';
import { EmergencyType, EmergencyContact, EmergencyAlertLog } from '../types/emergency';
import { SoundService } from '../services/soundEffects';
import {
  ShieldAlert,
  PhoneCall,
  MessageSquare,
  MapPin,
  Users,
  Plus,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  Clock,
  AlertCircle,
  FileText,
  Share2,
  HeartHandshake,
} from 'lucide-react';

interface EmergencyProps {
  onOpenSOSModal: () => void;
}

export const Emergency: React.FC<EmergencyProps> = ({ onOpenSOSModal }) => {
  const [location, setLocation] = useState<GeoLocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    timestamp: null,
    address: 'Fetching device location...',
    error: null,
    loading: true,
  });

  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [logs, setLogs] = useState<EmergencyAlertLog[]>([]);
  const [copied, setCopied] = useState<boolean>(false);

  // New Contact Form
  const [showAddContact, setShowAddContact] = useState<boolean>(false);
  const [newName, setNewName] = useState<string>('');
  const [newPhone, setNewPhone] = useState<string>('');
  const [newRel, setNewRel] = useState<string>('');

  useEffect(() => {
    LocationService.getCurrentLocation().then(setLocation);
    setContacts(OfflineStorage.getEmergencyContacts());
    setLogs(OfflineStorage.getSOSLogs());
  }, []);

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newPhone.trim()) return;

    SoundService.playClick();
    const newContact: EmergencyContact = {
      id: `contact-${Date.now()}`,
      name: newName.trim(),
      phone: newPhone.trim(),
      relationship: newRel.trim() || 'Emergency Contact',
      notifyOnSOS: true,
    };

    const updated = [...contacts, newContact];
    setContacts(updated);
    OfflineStorage.saveEmergencyContacts(updated);

    setNewName('');
    setNewPhone('');
    setNewRel('');
    setShowAddContact(false);
  };

  const handleDeleteContact = (id: string) => {
    SoundService.playClick();
    const updated = contacts.filter((c) => c.id !== id);
    setContacts(updated);
    OfflineStorage.saveEmergencyContacts(updated);
  };

  const sampleTemplate = LocationService.formatEmergencyMessage('medical', location);

  const handleCopyTemplate = async () => {
    try {
      await navigator.clipboard.writeText(sampleTemplate.body);
      setCopied(true);
      SoundService.playClick();
      setTimeout(() => setCopied(false), 2000);
    } catch (_) {}
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
      {/* Reassuring Hero Safety Card */}
      <div className="relative rounded-3xl overflow-hidden border border-rose-500/40 bg-gradient-to-r from-slate-900 via-rose-950/30 to-slate-900 shadow-2xl">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-center">
          <div className="lg:col-span-7 p-6 sm:p-10 space-y-4">
            <div className="inline-flex items-center gap-2 text-xs font-bold text-rose-300 bg-rose-950/80 border border-rose-500/40 px-3.5 py-1.5 rounded-full">
              <HeartHandshake className="w-3.5 h-3.5 text-rose-400" />
              <span>You are safe with ISHARA AI</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              India 112 Emergency Safety Center
            </h1>

            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed max-w-xl">
              Specially designed for Deaf individuals across India. Formats instant SMS dispatch text with your exact GPS coordinates, informs responders of your speech preferences, and alerts your loved ones.
            </p>

            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                onClick={() => {
                  SoundService.playChime();
                  onOpenSOSModal();
                }}
                className="flex items-center gap-2 px-6 py-3.5 text-sm font-extrabold text-white bg-rose-600 rounded-2xl hover:bg-rose-500 active:scale-95 transition-all shadow-lg shadow-rose-900/50 animate-pulse"
              >
                <ShieldAlert className="w-4 h-4" />
                <span>Activate Emergency SOS Modal</span>
              </button>

              <a
                href="tel:112"
                onClick={() => SoundService.playClick()}
                className="flex items-center gap-2 px-5 py-3.5 text-sm font-bold text-white bg-slate-900 rounded-2xl hover:bg-slate-800 border border-slate-700 transition-all active:scale-95"
              >
                <PhoneCall className="w-4 h-4 text-rose-400" />
                <span>Direct Dial 112</span>
              </a>
            </div>
          </div>

          <div className="lg:col-span-5 h-64 lg:h-full relative overflow-hidden">
            <img
              src="/src/assets/images/emergency_assistance_india_1793184553661.jpg"
              alt="Emergency medical assistance responders in Indian city"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t lg:bg-gradient-to-r from-slate-900 via-transparent to-transparent" />
          </div>
        </div>
      </div>

      {/* Main Grid: Telemetry & Contacts */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: GPS & Accessible Dispatch Payload */}
        <div className="lg:col-span-7 space-y-6">
          {/* GPS Telemetry Card */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <MapPin className="w-4 h-4 text-rose-400" />
                Live GPS Telemetry
              </span>
              {location.loading ? (
                <span className="text-xs text-amber-400 font-mono animate-pulse">Acquiring GPS...</span>
              ) : location.error ? (
                <span className="text-xs text-rose-400 font-mono">{location.error}</span>
              ) : (
                <span className="text-xs text-emerald-400 font-mono font-bold">
                  Lock Acquired (±{location.accuracy}m)
                </span>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-white leading-relaxed">
                {location.address}
              </p>
              {location.latitude && location.longitude && (
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                  <span className="font-mono text-cyan-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                    {location.latitude.toFixed(6)}° N, {location.longitude.toFixed(6)}° E
                  </span>
                  <a
                    href={sampleTemplate.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-cyan-400 hover:underline font-semibold"
                  >
                    Open Live Maps <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                  <a
                    href={sampleTemplate.whatsappUri}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1.5 text-emerald-400 hover:underline font-semibold ml-auto"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    Share Location via WhatsApp
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Deaf Emergency Dispatch Template Card */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <FileText className="w-4 h-4 text-cyan-400" />
                Prepared Emergency Dispatch Payload
              </span>
              <button
                onClick={handleCopyTemplate}
                className="flex items-center gap-1.5 text-xs text-cyan-400 hover:underline font-bold"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied to Clipboard!' : 'Copy Payload'}</span>
              </button>
            </div>

            <pre className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap overflow-x-auto">
              {sampleTemplate.body}
            </pre>

            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-slate-400 flex items-start gap-3">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
              <p className="leading-relaxed">
                <strong className="text-slate-200">Deaf Communication Safeguard: </strong>
                This payload instructs emergency operators to avoid standard voice phone callbacks and immediately dispatch assistance with SMS/text status updates.
              </p>
            </div>
          </div>
        </div>

        {/* Right: Emergency Contacts & Dispatch Register */}
        <div className="lg:col-span-5 space-y-6">
          {/* Trusted Emergency Contacts */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2">
                <Users className="w-4 h-4 text-cyan-400" />
                Trusted Emergency Contacts ({contacts.length})
              </span>
              <button
                onClick={() => setShowAddContact(!showAddContact)}
                className="flex items-center gap-1 text-xs text-cyan-400 hover:underline font-bold"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{showAddContact ? 'Cancel' : 'Add Contact'}</span>
              </button>
            </div>

            {showAddContact && (
              <form onSubmit={handleAddContact} className="p-4 rounded-2xl bg-slate-950 border border-slate-800 space-y-3">
                <input
                  type="text"
                  placeholder="Full Name (e.g. Ramesh Kumar)"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <input
                  type="tel"
                  placeholder="Mobile Number (e.g. +91 98765 43210)"
                  value={newPhone}
                  onChange={(e) => setNewPhone(e.target.value)}
                  required
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <input
                  type="text"
                  placeholder="Relationship (e.g. Sister, Doctor, Friend)"
                  value={newRel}
                  onChange={(e) => setNewRel(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-900 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
                <button
                  type="submit"
                  className="w-full py-2.5 text-xs font-bold text-slate-950 bg-gradient-to-r from-cyan-400 to-sky-300 rounded-xl hover:brightness-110 transition-all active:scale-95"
                >
                  Save Emergency Contact
                </button>
              </form>
            )}

            <div className="space-y-2.5">
              {contacts.map((contact) => (
                <div
                  key={contact.id}
                  className="p-4 rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3 shadow-sm"
                >
                  <div>
                    <h3 className="text-xs font-bold text-white">{contact.name}</h3>
                    <p className="text-[11px] text-slate-400">{contact.phone} · {contact.relationship}</p>
                  </div>

                  <div className="flex items-center gap-2">
                    <a
                      href={`sms:${contact.phone.replace(/\s+/g, '')}?body=${encodeURIComponent(sampleTemplate.body)}`}
                      className="p-2 rounded-xl text-cyan-400 hover:bg-slate-900 border border-cyan-500/30 transition-colors"
                      title="Send test emergency SMS"
                    >
                      <MessageSquare className="w-3.5 h-3.5" />
                    </a>
                    <button
                      onClick={() => handleDeleteContact(contact.id)}
                      className="p-2 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition-colors"
                      title="Delete contact"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Past SOS Alert Logs */}
          <div className="rounded-3xl bg-slate-900 border border-slate-800 p-6 space-y-4 shadow-xl">
            <span className="text-xs font-bold text-slate-200 uppercase tracking-wider flex items-center gap-2 pb-3 border-b border-slate-800">
              <Clock className="w-4 h-4 text-cyan-400" />
              Emergency Dispatch Activity Log
            </span>

            {logs.length === 0 ? (
              <p className="text-xs text-slate-400 italic">
                No emergency dispatch alerts logged on this device.
              </p>
            ) : (
              <div className="space-y-2">
                {logs.slice(0, 5).map((log) => (
                  <div key={log.id} className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[11px] text-slate-400">
                      <span className="font-bold text-rose-400 uppercase">{log.type} SOS</span>
                      <span className="font-mono tabular-nums">{new Date(log.timestamp).toLocaleString()}</span>
                    </div>
                    <p className="text-slate-300 truncate">{log.address}</p>
                    <span className="text-[10px] text-emerald-400 font-mono font-bold">
                      Status: {log.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

import React, { useState, useEffect } from 'react';
import { LocationService, GeoLocationState } from '../services/locationService';
import { OfflineStorage } from '../services/offlineStorage';
import { EmergencyType, EmergencyContact } from '../types/emergency';
import {
  AlertTriangle,
  PhoneCall,
  MessageSquare,
  MapPin,
  X,
  Share2,
  Users,
  CheckCircle2,
  ExternalLink,
  ShieldAlert,
} from 'lucide-react';

interface EmergencySOSModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const EmergencySOSModal: React.FC<EmergencySOSModalProps> = ({ isOpen, onClose }) => {
  const [step, setStep] = useState<'confirm' | 'dispatch'>('confirm');
  const [countdown, setCountdown] = useState<number>(3);
  const [selectedType, setSelectedType] = useState<EmergencyType>('medical');
  const [location, setLocation] = useState<GeoLocationState>({
    latitude: null,
    longitude: null,
    accuracy: null,
    timestamp: null,
    address: 'Acquiring GPS coordinates...',
    error: null,
    loading: true,
  });
  const [contacts, setContacts] = useState<EmergencyContact[]>([]);
  const [notifiedStatus, setNotifiedStatus] = useState<Record<string, 'ready' | 'sent'>>({});
  const [copiedMessage, setCopiedMessage] = useState(false);
  const [patientNote, setPatientNote] = useState('');

  // Load contacts and fetch GPS when opened
  useEffect(() => {
    if (isOpen) {
      setStep('confirm');
      setCountdown(3);
      setContacts(OfflineStorage.getEmergencyContacts());

      LocationService.getCurrentLocation().then((loc) => {
        setLocation(loc);
      });
    }
  }, [isOpen]);

  // Fast countdown to prevent accidental activation
  useEffect(() => {
    if (!isOpen || step !== 'confirm') return;

    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setStep('dispatch');
    }
  }, [isOpen, step, countdown]);

  if (!isOpen) return null;

  const emergencyMessage = LocationService.formatEmergencyMessage(selectedType, location, patientNote);

  const handleLaunch112Call = () => {
    OfflineStorage.logSOSAlert({
      id: `sos-${Date.now()}`,
      timestamp: Date.now(),
      type: selectedType,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      address: location.address,
      message: emergencyMessage.body,
      contactsNotified: contacts.filter((c) => c.notifyOnSOS).map((c) => c.name),
      status: 'dispatched-tel',
    });
    window.location.href = 'tel:112';
  };

  const handleOpenSMS112 = () => {
    OfflineStorage.logSOSAlert({
      id: `sos-${Date.now()}`,
      timestamp: Date.now(),
      type: selectedType,
      latitude: location.latitude,
      longitude: location.longitude,
      accuracy: location.accuracy,
      address: location.address,
      message: emergencyMessage.body,
      contactsNotified: contacts.filter((c) => c.notifyOnSOS).map((c) => c.name),
      status: 'sms-opened',
    });
    window.location.href = emergencyMessage.smsUri;
  };

  const handleNotifyContact = (contact: EmergencyContact) => {
    const contactSms = `sms:${contact.phone.replace(/\s+/g, '')}?body=${encodeURIComponent(emergencyMessage.body)}`;
    setNotifiedStatus((prev) => ({ ...prev, [contact.id]: 'sent' }));
    window.open(contactSms, '_blank');
  };

  const handleCopyMessage = async () => {
    try {
      await navigator.clipboard.writeText(emergencyMessage.body);
      setCopiedMessage(true);
      setTimeout(() => setCopiedMessage(false), 2000);
    } catch (_) {}
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="w-full max-w-2xl rounded-2xl bg-slate-900 border border-rose-500/30 shadow-2xl overflow-hidden my-4 text-slate-100">
        {/* Top Alert Banner */}
        <div className="bg-rose-950/60 border-b border-rose-500/30 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-rose-600 text-white shadow-lg shadow-rose-900/50">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-white tracking-wide">
                India 112 Emergency SOS Assistance
              </h2>
              <p className="text-xs text-rose-200">
                Official National Emergency Response Support System (ERSS)
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-rose-200 hover:text-white hover:bg-rose-900/40 transition-colors"
            aria-label="Cancel Emergency Modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Confirmation Countdown */}
        {step === 'confirm' ? (
          <div className="p-8 text-center space-y-6">
            <div className="relative inline-flex items-center justify-center w-24 h-24 rounded-full bg-rose-900/20 border-2 border-rose-500/50 text-rose-400">
              <span className="text-4xl font-extrabold font-mono tabular-nums">{countdown}</span>
            </div>

            <div>
              <h3 className="text-xl font-bold text-white">Emergency SOS Activated</h3>
              <p className="text-sm text-slate-300 mt-1 max-w-md mx-auto">
                Preparing accessible emergency dispatch templates and GPS coordinates for India's 112 emergency center.
              </p>
            </div>

            <div className="flex items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setStep('dispatch')}
                className="px-6 py-2.5 text-sm font-semibold text-white bg-rose-600 rounded-xl hover:bg-rose-500 transition-colors shadow-lg shadow-rose-900/40"
              >
                Proceed Immediately
              </button>
              <button
                onClick={onClose}
                className="px-6 py-2.5 text-sm font-semibold text-slate-300 bg-slate-800 rounded-xl hover:bg-slate-700 transition-colors"
              >
                Cancel (False Alarm)
              </button>
            </div>
          </div>
        ) : (
          /* Step 2: Emergency Response Center */
          <div className="p-6 space-y-6">
            {/* Category Selector */}
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-2">
                Select Emergency Category
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'medical', label: 'Medical (102/112)', icon: '🚑' },
                  { id: 'fire', label: 'Fire Service (101)', icon: '🚒' },
                  { id: 'police', label: 'Police (100/112)', icon: '🚓' },
                  { id: 'general', label: 'General Emergency', icon: '⚠️' },
                ].map((cat) => (
                  <button
                    key={cat.id}
                    onClick={() => setSelectedType(cat.id as EmergencyType)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border text-xs font-semibold transition-colors ${
                      selectedType === cat.id
                        ? 'bg-rose-950/60 border-rose-500 text-white shadow-sm'
                        : 'bg-slate-800/60 border-slate-700/80 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <span className="text-xl mb-1">{cat.icon}</span>
                    <span>{cat.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* GPS Telemetry & OpenStreetMap Coordinate Display */}
            <div className="rounded-xl bg-slate-950/70 border border-slate-800 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-rose-400" /> Current GPS Telemetry
                </span>
                {location.loading ? (
                  <span className="text-xs text-amber-400 animate-pulse">Acquiring Lock...</span>
                ) : location.error ? (
                  <span className="text-xs text-rose-400">{location.error}</span>
                ) : (
                  <span className="text-xs text-emerald-400 font-mono">
                    Locked (±{location.accuracy}m)
                  </span>
                )}
              </div>

              <p className="text-sm text-slate-200 font-medium leading-relaxed">
                {location.address}
              </p>

              {location.latitude && location.longitude && (
                <div className="flex flex-wrap items-center gap-3 pt-1 text-xs">
                  <span className="font-mono text-cyan-400 bg-slate-900 px-2.5 py-1 rounded border border-slate-800">
                    {location.latitude.toFixed(6)}° N, {location.longitude.toFixed(6)}° E
                  </span>
                  <a
                    href={emergencyMessage.mapUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 text-cyan-400 hover:underline"
                  >
                    Open in Live Maps <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              )}
            </div>

            {/* Patient Custom Note */}
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider block mb-1">
                Optional Patient Note (e.g., Blood group, allergen, floor number)
              </label>
              <input
                type="text"
                value={patientNote}
                onChange={(e) => setPatientNote(e.target.value)}
                placeholder="e.g. 3rd Floor, Flat 302, Severe chest pain"
                className="w-full px-3.5 py-2 text-xs rounded-xl bg-slate-950 border border-slate-800 text-white placeholder-slate-500 focus:outline-none focus:border-rose-500"
              />
            </div>

            {/* Official 112 Dispatch Actions */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              <button
                onClick={handleLaunch112Call}
                className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-sm text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-900/40 transition-colors"
              >
                <PhoneCall className="w-4 h-4" />
                <span>Direct Dial 112 (Call Shortcut)</span>
              </button>

              <button
                onClick={handleOpenSMS112}
                className="flex items-center justify-center gap-2.5 py-3 px-4 rounded-xl font-bold text-sm text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 transition-colors"
              >
                <MessageSquare className="w-4 h-4 text-cyan-400" />
                <span>Dispatch 112 via SMS</span>
              </button>
            </div>

            {/* Trusted Emergency Contacts Quick Notify */}
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5 text-cyan-400" /> Notify Trusted Emergency Contacts
                </span>
                <button
                  onClick={handleCopyMessage}
                  className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
                >
                  <Share2 className="w-3 h-3" />
                  {copiedMessage ? 'Copied SOS Alert!' : 'Copy SOS Text'}
                </button>
              </div>

              {contacts.length === 0 ? (
                <p className="text-xs text-slate-400 italic">
                  No emergency contacts configured yet. Add them in Settings.
                </p>
              ) : (
                <div className="space-y-2">
                  {contacts.map((contact) => (
                    <div
                      key={contact.id}
                      className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950 border border-slate-800"
                    >
                      <div>
                        <p className="text-xs font-semibold text-white">{contact.name}</p>
                        <p className="text-[11px] text-slate-400">{contact.phone} · {contact.relationship}</p>
                      </div>
                      <button
                        onClick={() => handleNotifyContact(contact)}
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                          notifiedStatus[contact.id] === 'sent'
                            ? 'bg-emerald-950/60 text-emerald-300 border border-emerald-500/30'
                            : 'bg-cyan-950/60 text-cyan-300 border border-cyan-500/30 hover:bg-cyan-900/50'
                        }`}
                      >
                        {notifiedStatus[contact.id] === 'sent' ? (
                          <>
                            <CheckCircle2 className="w-3 h-3 text-emerald-400" /> SMS Prepared
                          </>
                        ) : (
                          <>
                            <MessageSquare className="w-3 h-3" /> Send SOS Alert
                          </>
                        )}
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Critical Compliance Disclosure */}
            <div className="p-3 rounded-xl bg-slate-950/90 border border-slate-800/80 text-[11px] text-slate-400 leading-relaxed">
              <span className="font-semibold text-slate-300">Notice:</span> ISHARA AI formats verified emergency dispatch payloads with GPS coordinates and caller speech status. Direct ERSS CAD arrival depends on regional state emergency dispatch telecom confirmation.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

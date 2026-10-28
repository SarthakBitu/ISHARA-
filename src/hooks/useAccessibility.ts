import { useState, useEffect } from 'react';
import { OfflineStorage, UserSettings } from '../services/offlineStorage';

export function useAccessibility() {
  const [settings, setSettingsState] = useState<UserSettings>(() => OfflineStorage.getSettings());

  const updateSetting = <K extends keyof UserSettings>(key: K, value: UserSettings[K]) => {
    const updated = OfflineStorage.saveSettings({ [key]: value });
    setSettingsState(updated);
  };

  const triggerHaptic = (pattern: number | number[] = 50) => {
    if (settings.hapticFeedback && typeof navigator !== 'undefined' && 'vibrate' in navigator) {
      try {
        navigator.vibrate(pattern);
      } catch (_) {}
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    if (settings.highContrast) {
      root.classList.add('high-contrast');
    } else {
      root.classList.remove('high-contrast');
    }

    if (settings.largeText) {
      root.classList.add('large-text');
    } else {
      root.classList.remove('large-text');
    }
  }, [settings.highContrast, settings.largeText]);

  return {
    settings,
    updateSetting,
    triggerHaptic,
  };
}

import { createContext, useContext, useEffect, useMemo, useState } from 'react';

export const ACCESSIBILITY_STORAGE_KEY = 'dsa-accessibility-preferences-v1';

export const DEFAULT_ACCESSIBILITY_PREFERENCES = Object.freeze({
  fontScale: 'normal',
  highContrast: false,
  colorVision: false,
  reduceMotion: false,
});

const FONT_SCALES = new Set(['normal', 'large', 'extra-large']);
const AccessibilityContext = createContext(null);

export function normalizeAccessibilityPreferences(value) {
  const source = value && typeof value === 'object' && !Array.isArray(value) ? value : {};
  return {
    fontScale: FONT_SCALES.has(source.fontScale) ? source.fontScale : DEFAULT_ACCESSIBILITY_PREFERENCES.fontScale,
    highContrast: source.highContrast === true,
    colorVision: source.colorVision === true,
    reduceMotion: source.reduceMotion === true,
  };
}

function readPreferences() {
  if (typeof window === 'undefined') return DEFAULT_ACCESSIBILITY_PREFERENCES;
  try {
    return normalizeAccessibilityPreferences(JSON.parse(window.localStorage.getItem(ACCESSIBILITY_STORAGE_KEY) ?? 'null'));
  } catch {
    return DEFAULT_ACCESSIBILITY_PREFERENCES;
  }
}

function applyPreferences(preferences) {
  const root = document.documentElement;
  root.dataset.fontScale = preferences.fontScale;
  root.dataset.highContrast = String(preferences.highContrast);
  root.dataset.colorVision = String(preferences.colorVision);
  root.dataset.reduceMotion = String(preferences.reduceMotion);
}

export function AccessibilityProvider({ children }) {
  const [preferences, setPreferences] = useState(readPreferences);

  useEffect(() => {
    applyPreferences(preferences);
    try {
      window.localStorage.setItem(ACCESSIBILITY_STORAGE_KEY, JSON.stringify(preferences));
    } catch {
      // Las preferencias siguen activas durante la sesión aunque el navegador bloquee localStorage.
    }
  }, [preferences]);

  const value = useMemo(() => ({
    preferences,
    setPreference: (name, setting) => setPreferences(current => normalizeAccessibilityPreferences({ ...current, [name]: setting })),
    resetPreferences: () => setPreferences(DEFAULT_ACCESSIBILITY_PREFERENCES),
  }), [preferences]);

  return <AccessibilityContext.Provider value={value}>{children}</AccessibilityContext.Provider>;
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) throw new Error('useAccessibility debe utilizarse dentro de AccessibilityProvider.');
  return context;
}

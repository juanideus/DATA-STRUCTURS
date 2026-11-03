export const STORAGE_KEYS = Object.freeze({
  introSeen: 'dsa-intro-seen',
  selectedAlgorithm: 'dsa-selected-algorithm',
  speed: 'dsa-playback-speed',
  codeMode: 'dsa-code-mode',
});

export function readPreference(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

export function writePreference(key, value) {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // La aplicación sigue funcionando aunque el navegador bloquee el almacenamiento.
  }
}

export const TURNSTILE_SCRIPT_ID = 'dsa-turnstile-script';
export const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
export const TURNSTILE_LOAD_TIMEOUT_MS = 15_000;

const isReady = api => typeof api?.render === 'function'
  && typeof api?.reset === 'function'
  && typeof api?.remove === 'function';

// A single download is shared by mounted widgets. Its lifetime is independent of
// any one component, so StrictMode cleanup cannot cancel another widget's load.
export function createTurnstileLoader({
  getWindow = () => globalThis.window,
  getDocument = () => globalThis.document,
  setTimer = globalThis.setTimeout,
  clearTimer = globalThis.clearTimeout,
  timeoutMs = TURNSTILE_LOAD_TIMEOUT_MS,
} = {}) {
  let pending = null;

  return function loadTurnstile() {
    if (pending) return pending;
    const browser = getWindow();
    const document = getDocument();
    if (isReady(browser?.turnstile)) return Promise.resolve(browser.turnstile);
    if (!browser || !document?.head) return Promise.reject(new Error('TURNSTILE_UNAVAILABLE'));

    let resolveLoad;
    let rejectLoad;
    const promise = new Promise((resolve, reject) => {
      resolveLoad = resolve;
      rejectLoad = reject;
    });
    pending = promise;
    let script;
    let timer = null;
    let settled = false;
    const finish = error => {
      if (settled) return;
      settled = true;
      script?.removeEventListener('load', onLoad);
      script?.removeEventListener('error', onError);
      if (timer !== null) clearTimer(timer);
      if (pending === promise) pending = null;
      if (error) {
        // A failed/expired element will not emit another load event on reopen.
        script?.remove();
        rejectLoad(error);
      } else {
        resolveLoad(browser.turnstile);
      }
    };
    const onLoad = () => finish(isReady(browser.turnstile) ? null : new Error('TURNSTILE_UNAVAILABLE'));
    const onError = () => finish(new Error('TURNSTILE_LOAD_FAILED'));

    try {
      // Without an in-flight promise or API, an existing owned script is stale.
      // Recreate it instead of waiting for events that may already have fired.
      document.getElementById(TURNSTILE_SCRIPT_ID)?.remove();
      script = document.createElement('script');
      script.id = TURNSTILE_SCRIPT_ID;
      script.src = TURNSTILE_SCRIPT_URL;
      script.async = true;
      script.defer = true;
      script.addEventListener('load', onLoad);
      script.addEventListener('error', onError);
      timer = setTimer(() => finish(new Error('TURNSTILE_TIMEOUT')), timeoutMs);
      document.head.appendChild(script);
    } catch {
      finish(new Error('TURNSTILE_LOAD_FAILED'));
    }
    return promise;
  };
}

export const loadTurnstile = createTurnstileLoader();

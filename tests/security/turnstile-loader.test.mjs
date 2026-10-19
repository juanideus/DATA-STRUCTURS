import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  createTurnstileLoader,
  TURNSTILE_LOAD_TIMEOUT_MS,
  TURNSTILE_SCRIPT_ID,
  TURNSTILE_SCRIPT_URL,
} from '../../src/logic/turnstileLoader.js';

const api = () => ({ render() {}, reset() {}, remove() {} });

function fixture() {
  const elements = new Map();
  const timers = new Map();
  const scripts = [];
  let nextTimer = 1;
  let appendError = false;
  const browser = {};
  const document = {
    getElementById: id => elements.get(id) ?? null,
    createElement(tagName) {
      const listeners = new Map();
      const script = {
        tagName,
        listeners,
        removed: false,
        addEventListener(name, callback) { listeners.set(name, callback); },
        removeEventListener(name, callback) {
          if (listeners.get(name) === callback) listeners.delete(name);
        },
        emit(name) { listeners.get(name)?.(); },
        remove() {
          script.removed = true;
          if (elements.get(script.id) === script) elements.delete(script.id);
        },
      };
      scripts.push(script);
      return script;
    },
    head: {
      appendChild(script) {
        if (appendError) throw new Error('mock append failure');
        elements.set(script.id, script);
      },
    },
  };
  const load = createTurnstileLoader({
    getWindow: () => browser,
    getDocument: () => document,
    setTimer(callback, delay) {
      const id = nextTimer++;
      timers.set(id, { callback, delay });
      return id;
    },
    clearTimer(id) { timers.delete(id); },
  });
  return {
    load, browser, document, scripts, timers,
    failAppend(value) { appendError = value; },
    timeOut() { [...timers.values()].forEach(timer => timer.callback()); },
  };
}

test('a ready API is reused without another script or timer', async () => {
  const f = fixture();
  f.browser.turnstile = api();
  assert.equal(await f.load(), f.browser.turnstile);
  assert.equal(f.scripts.length, 0);
  assert.equal(f.timers.size, 0);
});

test('simultaneous callers share one promise and clean listeners on success', async () => {
  const f = fixture();
  const first = f.load();
  const second = f.load();
  assert.equal(first, second);
  assert.equal(f.scripts.length, 1);
  const script = f.scripts[0];
  assert.equal(script.src, TURNSTILE_SCRIPT_URL);
  assert.equal(script.id, TURNSTILE_SCRIPT_ID);
  assert.equal(script.async, true);
  assert.equal(script.defer, true);
  assert.equal(script.listeners.size, 2);
  assert.equal(f.timers.size, 1);
  f.browser.turnstile = api();
  script.emit('load');
  assert.equal(await first, f.browser.turnstile);
  assert.equal(await second, f.browser.turnstile);
  assert.equal(script.listeners.size, 0);
  assert.equal(f.timers.size, 0);
  assert.equal(script.removed, false);
});

test('a failed download removes its script and can be retried on reopen', async () => {
  const f = fixture();
  const first = f.load();
  const rejected = assert.rejects(first, /TURNSTILE_LOAD_FAILED/);
  f.scripts[0].emit('error');
  await rejected;
  assert.equal(f.scripts[0].removed, true);
  assert.equal(f.scripts[0].listeners.size, 0);
  assert.equal(f.timers.size, 0);
  const retry = f.load();
  assert.notEqual(retry, first);
  assert.equal(f.scripts.length, 2);
  f.browser.turnstile = api();
  f.scripts[1].emit('load');
  assert.equal(await retry, f.browser.turnstile);
});

test('download timeout is bounded, removes listeners, and permits retry', async () => {
  const f = fixture();
  const first = f.load();
  const rejected = assert.rejects(first, /TURNSTILE_TIMEOUT/);
  assert.equal([...f.timers.values()][0].delay, TURNSTILE_LOAD_TIMEOUT_MS);
  f.timeOut();
  await rejected;
  assert.equal(f.scripts[0].removed, true);
  assert.equal(f.scripts[0].listeners.size, 0);
  assert.equal(f.timers.size, 0);
  const retry = f.load();
  f.browser.turnstile = api();
  f.scripts[1].emit('load');
  assert.equal(await retry, f.browser.turnstile);
});

test('load without a complete API fails closed and permits a clean retry', async () => {
  const f = fixture();
  f.browser.turnstile = { render() {} };
  const first = f.load();
  const rejected = assert.rejects(first, /TURNSTILE_UNAVAILABLE/);
  f.scripts[0].emit('load');
  await rejected;
  assert.equal(f.scripts[0].removed, true);
  const retry = f.load();
  f.browser.turnstile = api();
  f.scripts[1].emit('load');
  assert.equal(await retry, f.browser.turnstile);
});

test('an orphaned owned script is replaced instead of awaiting past events', async () => {
  const f = fixture();
  const stale = f.document.createElement('script');
  stale.id = TURNSTILE_SCRIPT_ID;
  f.document.head.appendChild(stale);
  const load = f.load();
  assert.equal(stale.removed, true);
  assert.equal(f.scripts.length, 2);
  f.browser.turnstile = api();
  f.scripts[1].emit('load');
  await load;
});

test('late events from a failed script cannot settle or clear a newer load', async () => {
  const f = fixture();
  const first = f.load();
  const staleLoad = f.scripts[0].listeners.get('load');
  const rejected = assert.rejects(first, /TURNSTILE_LOAD_FAILED/);
  f.scripts[0].emit('error');
  await rejected;
  const retry = f.load();
  staleLoad();
  assert.equal(f.load(), retry);
  assert.equal(f.scripts[1].removed, false);
  assert.equal(f.timers.size, 1);
  f.browser.turnstile = api();
  f.scripts[1].emit('load');
  assert.equal(await retry, f.browser.turnstile);
});

test('synchronous DOM errors do not retain timers or a rejected shared promise', async () => {
  const f = fixture();
  f.failAppend(true);
  await assert.rejects(f.load(), /TURNSTILE_LOAD_FAILED/);
  assert.equal(f.timers.size, 0);
  assert.equal(f.scripts[0].listeners.size, 0);
  assert.equal(f.scripts[0].removed, true);
  f.failAppend(false);
  const retry = f.load();
  f.browser.turnstile = api();
  f.scripts[1].emit('load');
  await retry;
});

test('calling outside a browser rejects without creating a hanging load', async () => {
  const load = createTurnstileLoader({ getWindow: () => undefined, getDocument: () => undefined });
  await assert.rejects(load(), /TURNSTILE_UNAVAILABLE/);
  await assert.rejects(load(), /TURNSTILE_UNAVAILABLE/);
});

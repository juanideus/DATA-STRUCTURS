import test from 'node:test';
import assert from 'node:assert/strict';
import { createReportRateLimiter } from '../src/rate-limit.js';

test('bloquea la sexta solicitud de una IP y libera el cupo al vencer la ventana', () => {
  let now = 0;
  const check = createReportRateLimiter({ clock: () => now });
  for (let attempt = 0; attempt < 5; attempt += 1) {
    assert.deepEqual(check('203.0.113.1'), { allowed: true });
  }
  assert.deepEqual(check('203.0.113.1'), { allowed: false, retryAfterSeconds: 900 });
  now = 15 * 60 * 1_000;
  assert.deepEqual(check('203.0.113.1'), { allowed: true });
});

test('el límite global detiene una ráfaga distribuida y se recupera', () => {
  let now = 0;
  const check = createReportRateLimiter({ clock: () => now, globalLimit: 3 });
  for (let index = 0; index < 3; index += 1) {
    assert.deepEqual(check(`198.51.100.${index}`), { allowed: true });
  }
  assert.deepEqual(check('198.51.100.3'), { allowed: false, retryAfterSeconds: 60 });
  now = 60 * 1_000;
  assert.deepEqual(check('198.51.100.3'), { allowed: true });
});

test('al saturar el registro no expulsa ni desbloquea una IP limitada', () => {
  let now = 0;
  const check = createReportRateLimiter({
    clock: () => now,
    perAddressLimit: 1,
    globalLimit: 100,
    maxTrackedAddresses: 2,
  });
  assert.deepEqual(check('203.0.113.1'), { allowed: true });
  assert.deepEqual(check('203.0.113.2'), { allowed: true });
  assert.deepEqual(check('203.0.113.3'), { allowed: false, retryAfterSeconds: 60 });
  assert.deepEqual(check('203.0.113.1'), { allowed: false, retryAfterSeconds: 900 });
  now = 15 * 60 * 1_000;
  assert.deepEqual(check('203.0.113.3'), { allowed: true });
});

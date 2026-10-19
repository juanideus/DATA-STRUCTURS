import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

test('el comando real de arranque acepta Railway público sin CIDRs ni credenciales de proveedores', async t => {
  const child = spawn(process.execPath, [fileURLToPath(new URL('../src/server.js', import.meta.url))], {
    // Deliberately do not inherit production keys, tokens or local proxy settings.
    env: {
      NODE_ENV: 'production', CLIENT_IP_SOURCE: 'railway-public', PORT: '0',
      RAILWAY_PROJECT_ID: 'startup-fixture', RAILWAY_SERVICE_ID: 'startup-fixture',
      RAILWAY_DEPLOYMENT_ID: 'startup-fixture',
      ...(process.env.SystemRoot ? { SystemRoot: process.env.SystemRoot } : {}),
    },
    stdio: ['ignore', 'pipe', 'pipe'], windowsHide: true,
  });
  t.after(() => { if (child.exitCode === null && child.signalCode === null) child.kill(); });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('El proceso no completó el arranque en 5 segundos.')), 5_000);
    let output = '';
    child.stdout.on('data', chunk => {
      output += chunk;
      if (output.includes('DSA Lab Report API disponible en el puerto 0')) {
        clearTimeout(timer);
        resolve();
      }
    });
    child.once('error', error => { clearTimeout(timer); reject(error); });
    child.once('exit', code => { clearTimeout(timer); reject(new Error(`El arranque terminó antes de escuchar (código ${code}).`)); });
  });
  const exited = once(child, 'exit');
  assert.equal(child.kill(), true);
  await exited;
});

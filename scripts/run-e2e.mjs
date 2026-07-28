import { spawn } from 'node:child_process';
import path from 'node:path';
import { build, preview } from 'vite';

const projectRoot = process.cwd();
const playwrightCli = path.join(projectRoot, 'node_modules', '@playwright', 'test', 'cli.js');
let server;

try {
  await build();
  server = await preview({
    preview: {
      host: '127.0.0.1',
      port: 4173,
      strictPort: true,
    },
  });

  const exitCode = await new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      [playwrightCli, 'test', ...process.argv.slice(2)],
      { cwd: projectRoot, stdio: 'inherit', shell: false },
    );
    child.once('error', reject);
    child.once('exit', code => resolve(code ?? 1));
  });
  process.exitCode = exitCode;
} finally {
  if (server) {
    await new Promise(resolve => server.httpServer.close(resolve));
  }
}

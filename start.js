import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const vite = spawn('node', ['./node_modules/vite/bin/vite.js'], {
  stdio: 'inherit',
  env: { ...process.env, NODE_ENV: 'development' },
  shell: true
});

const waitOn = spawn('node', ['./node_modules/wait-on/bin/wait-on', 'http://localhost:5175'], {
  stdio: 'inherit',
  shell: true
});

waitOn.on('close', (code) => {
  if (code === 0) {
    const electron = spawn('node', ['./node_modules/electron/cli.js', '.'], {
      stdio: 'inherit',
      env: { ...process.env, NODE_ENV: 'development' },
      shell: true
    });

    electron.on('close', () => {
      vite.kill();
      process.exit();
    });
  }
});

process.on('SIGINT', () => {
  vite.kill();
  process.exit();
});

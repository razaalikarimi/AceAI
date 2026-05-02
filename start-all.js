import { spawn } from 'child_process';
import path from 'path';

// Helper to run node modules by relative path to avoid shell path issues
const runModule = (modulePath, args, cwd = '.') => {
  return spawn('node', [modulePath, ...args], {
    cwd,
    stdio: 'inherit',
    shell: true, // Needed for windows command interpretation
    env: { ...process.env, NODE_ENV: 'development' }
  });
};

console.log('🚀 Parakeet AI Ecosystem is starting...');

// 1. Start Backend (Port 5000)
// Using ts-node directly from node_modules
const backend = runModule('./node_modules/ts-node/dist/bin.js', ['src/index.ts'], './server');

// 2. Start Website (Port 5176)
const website = runModule('./node_modules/vite/bin/vite.js', ['--port', '5176'], './website');

// 3. Start Desktop App (Port 5175 + Electron)
const desktopApp = spawn('node', ['start.js'], {
  stdio: 'inherit',
  shell: true
});

console.log('🌐 Website: http://localhost:5176');
console.log('💻 Desktop App: http://localhost:5175');
console.log('⚙️ Backend: http://localhost:5000');

process.on('SIGINT', () => {
  backend.kill();
  website.kill();
  desktopApp.kill();
  process.exit();
});

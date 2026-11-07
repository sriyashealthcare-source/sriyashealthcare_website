const { spawn } = require('child_process');
const path = require('path');

const rootDir = path.join(__dirname, '..');
const isWin = process.platform === 'win32';
const npmCmd = isWin ? 'npm.cmd' : 'npm';

const serverProc = spawn(npmCmd, ['--prefix', 'server', 'run', 'dev'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: isWin
});

const clientProc = spawn(npmCmd, ['--prefix', 'client', 'run', 'dev'], {
  cwd: rootDir,
  stdio: 'inherit',
  shell: isWin
});

function shutdown() {
  serverProc.kill();
  clientProc.kill();
  process.exit(0);
}

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);

#!/usr/bin/env node
const { spawn } = require('child_process');

const child = spawn('npm', ['run', 'start:prod'], {
  stdio: 'inherit',
  shell: true
});

child.on('exit', (code) => {
  process.exit(code);
});
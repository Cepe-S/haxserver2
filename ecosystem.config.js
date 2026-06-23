// PM2 Configuration — Linux production (GCE / Ubuntu)
// Windows: npm run start:prod

if (process.platform === 'win32') {
  console.error('PM2 configuration is for Linux only. On Windows use: npm run start:prod');
  process.exit(1);
}

module.exports = {
  apps: [
    {
      name: 'haxbotron-core',
      cwd: './core',
      script: 'dist/app.js',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '1500M',
      env: {
        NODE_ENV: 'production',
        LOG_SERVICE: 'core'
      },
      log_file: '../logs/core-combined.log',
      error_file: '../logs/core-error.log',
      out_file: '../logs/core-out.log',
      restart_delay: 5000,
      max_restarts: 10
    },
    {
      name: 'haxbotron-web',
      cwd: './web/backend',
      script: 'dist/server.js',
      interpreter: 'node',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '512M',
      env: {
        NODE_ENV: 'production',
        LOG_SERVICE: 'web'
      },
      log_file: '../../logs/web-combined.log',
      error_file: '../../logs/web-error.log',
      out_file: '../../logs/web-out.log',
      restart_delay: 5000,
      max_restarts: 10
    },
    {
      name: 'haxbotron-ui',
      cwd: './web/frontend',
      script: 'npx',
      args: 'vite preview --port 5173 --host 0.0.0.0',
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '256M',
      env: {
        NODE_ENV: 'production'
      },
      log_file: '../../logs/ui-combined.log',
      error_file: '../../logs/ui-error.log',
      out_file: '../../logs/ui-out.log',
      restart_delay: 3000,
      max_restarts: 5
    }
  ]
};

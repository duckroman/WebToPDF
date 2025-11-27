module.exports = {
  apps: [{
    name: 'web2pdf',
    script: './server.js',
    cwd: '/var/www/WebToPDF/server',
    env: {
      LD_LIBRARY_PATH: '/usr/lib/x86_64-linux-gnu',
      PORT: 5001
    }
  }]
};
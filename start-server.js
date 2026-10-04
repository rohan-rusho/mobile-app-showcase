const { execSync, spawn } = require('child_process');
const os = require('os');
const path = require('path');
const fs = require('fs');

const PORT = 3005;

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) {
        return net.address;
      }
    }
  }
  return '192.168.100.74';
}

const localIp = getLocalIp();

console.log('=======================================================');
console.log('  Mobile App Showcase Server');
console.log('=======================================================');
console.log(`  Local Access   : http://localhost:${PORT}`);
console.log(`  Network Access : http://${localIp}:${PORT}`);
console.log('=======================================================\n');

// Clean up any process already using the port
try {
  const out = execSync('netstat -ano', { encoding: 'utf-8' });
  const lines = out.split('\n');
  for (const line of lines) {
    if (line.includes(`:${PORT}`) && line.includes('LISTENING')) {
      const parts = line.trim().split(/\s+/);
      const pid = parts[parts.length - 1];
      if (pid && pid !== '0' && pid !== String(process.pid)) {
        console.log(`[INFO] Freeing port ${PORT} from previous instance (PID: ${pid})...`);
        try {
          execSync(`taskkill /F /PID ${pid}`, { stdio: 'ignore' });
        } catch {}
      }
    }
  }
} catch {}

// Ensure production build exists
const buildIdPath = path.join(__dirname, '.next', 'BUILD_ID');
if (!fs.existsSync(buildIdPath)) {
  console.log('[INFO] Production build not found. Running build first...');
  try {
    execSync('npm run build', { stdio: 'inherit' });
    console.log('');
  } catch (err) {
    console.error('[ERROR] Build failed:', err.message);
    process.exit(1);
  }
}

console.log(`Starting server on all interfaces (0.0.0.0:${PORT})...`);
console.log('(Accessible from this PC via localhost and mobile devices via Wi-Fi)\n');

const cmd = `npx next start -H 0.0.0.0 -p ${PORT}`;
const child = spawn(cmd, {
  stdio: 'inherit',
  shell: true,
  cwd: __dirname
});

child.on('error', (err) => {
  console.error('[ERROR] Failed to start server:', err);
});

child.on('exit', (code, signal) => {
  if (code !== 0 && code !== null) {
    console.log(`\n[INFO] Server exited with code ${code}`);
  }
  process.exit(code || 0);
});

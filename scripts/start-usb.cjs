const fs = require('node:fs');
const path = require('node:path');
const { execFileSync, spawn } = require('node:child_process');
const http = require('node:http');
const net = require('node:net');

function metroReady() {
  return new Promise(resolve => {
    const request = http.get('http://127.0.0.1:8081/status', response => {
      let body = '';
      response.on('data', chunk => { body += chunk; });
      response.on('end', () => resolve(body.trim() === 'packager-status:running'));
    });
    request.setTimeout(1500, () => request.destroy());
    request.on('error', () => resolve(false));
  });
}

function assertPortAvailable() {
  return new Promise((resolve, reject) => {
    const probe = net.createServer();
    probe.once('error', () => reject(new Error('Port 8081 is already in use. Stop the existing Expo terminal with Ctrl+C before running npm run start:usb again.')));
    probe.listen(8081, '::', () => probe.close(resolve));
  });
}

async function main() {
  const executable = process.platform === 'win32' ? 'adb.exe' : 'adb';
  const roots = [process.env.ANDROID_HOME, process.env.ANDROID_SDK_ROOT,
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'Android', 'Sdk')].filter(Boolean);
  const adb = roots.map(root => path.join(root, 'platform-tools', executable)).find(file => fs.existsSync(file)) || executable;
  let output;
  try { output = execFileSync(adb, ['devices', '-l'], { encoding: 'utf8', timeout: 15000 }); }
  catch { throw new Error('ADB was not found. Install Android SDK Platform Tools and set ANDROID_HOME to your SDK folder.'); }
  const rows = output.split(/\r?\n/).map(line => line.trim().split(/\s+/));
  const devices = rows.filter(row => row[1] === 'device');
  const selected = process.env.ANDROID_SERIAL
    ? devices.find(row => row[0] === process.env.ANDROID_SERIAL)
    : devices.length === 1 ? devices[0] : null;
  if (!selected) {
    if (rows.some(row => row[1] === 'unauthorized')) throw new Error('Unlock your phone and accept the Allow USB debugging prompt, then run this command again.');
    if (devices.length > 1) throw new Error('More than one Android device is connected. Set ANDROID_SERIAL to the intended device serial.');
    throw new Error('No authorized Android device. Enable Developer options > USB debugging, reconnect the cable, and accept the debugging prompt on your unlocked phone.');
  }
  const deviceArgs = ['-s', selected[0]];
  const androidUser = execFileSync(adb, [...deviceArgs, 'shell', 'am', 'get-current-user'], { encoding: 'utf8', timeout: 10000 }).trim();
  if (!/^\d+$/.test(androidUser)) throw new Error('Could not identify the active Android user. Unlock the phone and retry.');
  const packages = execFileSync(adb, [...deviceArgs, 'shell', 'pm', 'list', 'packages', '--user', androidUser, 'host.exp.exponent'], { encoding: 'utf8', timeout: 10000 });
  if (!packages.split(/\r?\n/).some(line => line.trim() === 'package:host.exp.exponent')) {
    throw new Error('Expo Go is not installed for the active phone profile. Install the Android version compatible with this project from https://expo.dev/go, then retry. This launcher will not reinstall or remove it.');
  }
  execFileSync(adb, [...deviceArgs, 'reverse', 'tcp:8081', 'tcp:8081'], { stdio: 'inherit', timeout: 10000 });
  console.log(`USB connected: ${selected[0]}. Expo Go is already installed for Android user ${androidUser}.`);
  if (process.argv.includes('--check')) return;
  await assertPortAvailable();
  const cli = path.join(path.dirname(require.resolve('expo/package.json')), 'bin', 'cli');
  // Launch through ADB ourselves: Expo's --android option may try to reinstall Expo Go.
  const child = spawn(process.execPath, [cli, 'start', '--go', '--offline', '--port', '8081'], {
    cwd: path.resolve(__dirname, '..'), stdio: 'inherit',
    env: { ...process.env, ANDROID_SERIAL: selected[0], EXPO_ADB_USER: androidUser, REACT_NATIVE_PACKAGER_HOSTNAME: '127.0.0.1' },
  });
  let exited = false;
  child.on('error', error => { exited = true; console.error(error.message); process.exitCode = 1; });
  child.on('exit', code => { exited = true; process.exitCode = code ?? 1; });
  const stop = () => { if (!exited) child.kill(); };
  process.on('SIGINT', stop);
  process.on('SIGTERM', stop);
  const deadline = Date.now() + 60000;
  while (!exited && Date.now() < deadline) {
    if (await metroReady()) {
      try {
        const launchOutput = execFileSync(adb, [...deviceArgs, 'shell', 'am', 'start', '--user', androidUser,
          '-a', 'android.intent.action.VIEW', '-d', 'exp://127.0.0.1:8081', '-p', 'host.exp.exponent'], { encoding: 'utf8', timeout: 15000 });
        if (/Error:|Exception/.test(launchOutput)) throw new Error(launchOutput.trim());
        console.log('Opened JC in the installed Expo Go. Keep this terminal running; waiting for logs is normal.');
      } catch (error) { stop(); throw error; }
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  if (!exited) { stop(); throw new Error('Expo did not become ready within 60 seconds. Check the startup output above.'); }
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });

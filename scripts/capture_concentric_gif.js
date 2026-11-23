const fs = require('fs');
const path = require('path');
const { spawn, execSync } = require('child_process');

const ARTIFACT_DIR = 'C:\\Users\\surya\\.gemini\\antigravity\\brain\\12cb1919-e846-449e-ac74-8ab8159fca5b';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

class CdpClient {
  constructor(wsUrl) {
    this.wsUrl = wsUrl;
    this.ws = null;
    this.id = 1;
    this.pending = new Map();
  }

  connect() {
    return new Promise((resolve, reject) => {
      this.ws = new WebSocket(this.wsUrl);
      this.ws.onopen = () => resolve();
      this.ws.onerror = (err) => reject(err);
      this.ws.onmessage = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id && this.pending.has(msg.id)) {
          const { res, rej } = this.pending.get(msg.id);
          this.pending.delete(msg.id);
          if (msg.error) rej(msg.error);
          else res(msg.result);
        }
      };
    });
  }

  send(method, params = {}) {
    return new Promise((res, rej) => {
      const curId = this.id++;
      this.pending.set(curId, { res, rej });
      this.ws.send(JSON.stringify({ id: curId, method, params }));
    });
  }

  async captureScreenshot(outputPath) {
    const res = await this.send('Page.captureScreenshot', { format: 'png' });
    const buf = Buffer.from(res.data, 'base64');
    fs.writeFileSync(outputPath, buf);
  }
}

(async () => {
  let versionRes = await fetch('http://127.0.0.1:9222/json/version').catch(() => null);
  if (!versionRes) {
    spawn(
      'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
      [
        '--headless=new',
        '--remote-debugging-port=9222',
        '--remote-allow-origins=*',
        '--disable-gpu',
        '--no-sandbox',
        '--hide-scrollbars',
        '--user-data-dir=C:\\Users\\surya\\AppData\\Local\\Google\\Chrome\\DevSession_OrbitalLogo'
      ],
      { stdio: 'ignore' }
    );
    for (let i = 0; i < 20; i++) {
      await sleep(200);
      versionRes = await fetch('http://127.0.0.1:9222/json/version').catch(() => null);
      if (versionRes) break;
    }
  }

  const targetsRes = await fetch('http://127.0.0.1:9222/json');
  const targets = await targetsRes.json();
  const page = targets.find((t) => t.type === 'page') || targets[0];
  const cdp = new CdpClient(page.webSocketDebuggerUrl);
  await cdp.connect();

  await cdp.send('Emulation.setDeviceMetricsOverride', {
    width: 1280,
    height: 800,
    deviceScaleFactor: 1,
    mobile: false
  });

  await cdp.send('Page.navigate', { url: 'http://127.0.0.1:5173/' });
  await sleep(2000);

  console.log('[Frames] Capturing 10 animation frames across 9s breathing cycle...');
  const framePaths = [];
  for (let i = 0; i < 10; i++) {
    const fPath = path.join(ARTIFACT_DIR, `temp_ring_frame_${i}.png`);
    await cdp.captureScreenshot(fPath);
    framePaths.push(fPath);
    console.log(`  Captured frame ${i + 1}/10`);
    await sleep(900);
  }

  cdp.ws.close();

  // Python PIL script to compile frames into GIF
  const pyCode = `
from PIL import Image
import os

artifact_dir = r"${ARTIFACT_DIR.replace(/\\/g, '\\\\')}"
frame_files = [f"temp_ring_frame_{i}.png" for i in range(10)]
frames = []
for f in frame_files:
    p = os.path.join(artifact_dir, f)
    if os.path.exists(p):
        img = Image.open(p).convert('RGBA')
        bg = Image.new('RGB', img.size, (251, 249, 244))
        bg.paste(img, mask=img.split()[3])
        w, h = bg.size
        small = bg.resize((int(w * 0.7), int(h * 0.7)), Image.Resampling.LANCZOS)
        frames.append(small)
        try: os.remove(p)
        except: pass

if frames:
    gif_path = os.path.join(artifact_dir, "150_concentric_rings_motion_showcase.gif")
    frames[0].save(gif_path, save_all=True, append_images=frames[1:], duration=900, loop=0)
    print("GIF generated successfully:", gif_path, "Frames:", len(frames))
`;
  fs.writeFileSync('scripts/make_ring_gif.py', pyCode);
  execSync('python scripts/make_ring_gif.py', { stdio: 'inherit' });
  fs.unlinkSync('scripts/make_ring_gif.py');
  fs.unlinkSync('scripts/create_concentric_gif.py');
  process.exit(0);
})();

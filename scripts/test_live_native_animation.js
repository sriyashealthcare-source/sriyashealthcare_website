const { spawn } = require('child_process');
const path = require('path');
const rootDir = path.join(__dirname, '..');

async function testNative() {
  const viteBin = path.join(rootDir, 'client', 'node_modules', 'vite', 'bin', 'vite.js');
  const clientProc = spawn('node', [viteBin, '--host', '127.0.0.1', '--port', '5173'], {
    cwd: path.join(rootDir, 'client'),
    stdio: 'ignore'
  });

  const chromeProc = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9226',
    '--user-data-dir=C:\\Users\\surya\\AppData\\Local\\Google\\Chrome\\DevSession_NativeTest2',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 2500));

  try {
    const list = await (await fetch('http://127.0.0.1:9226/json/list')).json();
    const ws = new global.WebSocket(list[0].webSocketDebuggerUrl);
    await new Promise(r => ws.onopen = r);

    let id = 1;
    const send = (method, params = {}) => new Promise((res, rej) => {
      const curId = id++;
      const handler = (e) => {
        const msg = JSON.parse(e.data);
        if (msg.id === curId) {
          ws.removeEventListener('message', handler);
          if (msg.error) rej(msg.error);
          else res(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });

    console.log('[Native] Navigating to http://127.0.0.1:5173...');
    await send('Page.navigate', { url: 'http://127.0.0.1:5173' });
    await new Promise(r => setTimeout(r, 3500));

    // Scroll to position right before the team section
    const topPos = await send('Runtime.evaluate', {
      expression: `(() => {
        const sec = document.getElementById('our-team');
        return sec ? sec.getBoundingClientRect().top + window.scrollY : 4800;
      })()`,
      returnByValue: true
    });
    console.log('[Native] Team section top is at:', topPos.result.value);

    // Initial check (before entering viewport)
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, ${Math.max(0, topPos.result.value - 1200)});` });
    await new Promise(r => setTimeout(r, 500));

    const initial = await send('Runtime.evaluate', {
      expression: `(() => {
        const cards = Array.from(document.querySelectorAll('.hp-team-card'));
        return {
          reducedMotion: window.matchMedia('(prefers-reduced-motion: reduce)').matches,
          cards: cards.map(c => {
            const comp = window.getComputedStyle(c);
            return {
              isRevealed: c.classList.contains('is-revealed'),
              opacity: comp.opacity,
              transform: comp.transform,
              transitionDuration: comp.transitionDuration
            };
          })
        };
      })()`,
      returnByValue: true
    });
    console.log('[Native] Initial State (BEFORE entering view):', JSON.stringify(initial.result.value, null, 2));

    // Scroll so section enters by 25%
    console.log('[Native] Scrolling to enter ~25% into view...');
    await send('Runtime.evaluate', { expression: `window.scrollTo(0, ${topPos.result.value - 1080 + 350});` });
    await new Promise(r => setTimeout(r, 200));

    const intermediate = await send('Runtime.evaluate', {
      expression: `(() => {
        const cards = Array.from(document.querySelectorAll('.hp-team-card'));
        return cards.map(c => {
          const comp = window.getComputedStyle(c);
          return {
            isRevealed: c.classList.contains('is-revealed'),
            opacity: comp.opacity,
            transform: comp.transform
          };
        });
      })()`,
      returnByValue: true
    });
    console.log('[Native] Intermediate Motion State:', JSON.stringify(intermediate.result.value, null, 2));

    // Wait for full settle
    await new Promise(r => setTimeout(r, 1400));
    const settled = await send('Runtime.evaluate', {
      expression: `(() => {
        const cards = Array.from(document.querySelectorAll('.hp-team-card'));
        return cards.map(c => {
          const comp = window.getComputedStyle(c);
          return {
            isRevealed: c.classList.contains('is-revealed'),
            opacity: comp.opacity,
            transform: comp.transform
          };
        });
      })()`,
      returnByValue: true
    });
    console.log('[Native] Settled State:', JSON.stringify(settled.result.value, null, 2));

    ws.close();
    chromeProc.kill();
    clientProc.kill();
    process.exit(0);
  } catch(e) {
    console.error(e);
    chromeProc.kill();
    clientProc.kill();
    process.exit(1);
  }
}

testNative();

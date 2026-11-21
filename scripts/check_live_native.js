const { spawn } = require('child_process');

async function run() {
  const chrome = spawn('C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', [
    '--headless=new',
    '--remote-debugging-port=9224',
    '--user-data-dir=C:\\Users\\surya\\AppData\\Local\\Google\\Chrome\\DevSession_NativeTest',
    'about:blank'
  ]);

  await new Promise(r => setTimeout(r, 1500));

  try {
    const list = await (await fetch('http://127.0.0.1:9224/json/list')).json();
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

    await send('Page.enable');
    await send('Runtime.enable');
    await send('Log.enable');

    ws.addEventListener('message', (e) => {
      const msg = JSON.parse(e.data);
      if (msg.method === 'Runtime.consoleAPICalled') {
        console.log('[Console]', msg.params.type, msg.params.args.map(a => a.value || a.description).join(' '));
      }
      if (msg.method === 'Log.entryAdded') {
        console.log('[Browser Log]', msg.params.entry.text);
      }
    });

    console.log('[Native Test] Navigating to https://sriyashealthcare.com...');
    await send('Page.navigate', { url: 'https://sriyashealthcare.com' });
    await new Promise(r => setTimeout(r, 5000));

    const pageState = await send('Runtime.evaluate', {
      expression: `(() => {
        const root = document.getElementById('root');
        const sections = Array.from(document.querySelectorAll('section')).map(s => s.id);
        const teamCards = Array.from(document.querySelectorAll('.hp-team-card')).length;
        const html = root ? root.innerHTML.slice(0, 300) : 'no root';
        return {
          rootExists: !!root,
          sections,
          teamCards,
          htmlPreview: html
        };
      })()`,
      returnByValue: true
    });
    console.log('Page State:', JSON.stringify(pageState.result.value, null, 2));

    ws.close();
    chrome.kill();
  } catch(err) {
    console.error('Error:', err);
    chrome.kill();
  }
}

run();

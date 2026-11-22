(async () => {
  const versionRes = await fetch('http://127.0.0.1:9222/json/version');
  const targetsRes = await fetch('http://127.0.0.1:9222/json');
  const targets = await targetsRes.json();
  const page = targets.find((t) => t.type === 'page') || targets[0];
  const ws = new WebSocket(page.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 1;
  const send = (method, params = {}) =>
    new Promise((res, rej) => {
      const curId = id++;
      const handler = (event) => {
        const msg = JSON.parse(event.data);
        if (msg.id === curId) {
          ws.removeEventListener('message', handler);
          if (msg.error) rej(msg.error);
          else res(msg.result);
        }
      };
      ws.addEventListener('message', handler);
      ws.send(JSON.stringify({ id: curId, method, params }));
    });
  const r = await send('Runtime.evaluate', {
    expression: `(() => {
      const getBox = (sel) => {
        const el = document.querySelector(sel);
        if (!el) return null;
        const b = el.getBoundingClientRect();
        return {
          top: Math.round(b.top),
          bottom: Math.round(b.bottom),
          left: Math.round(b.left),
          right: Math.round(b.right),
          width: Math.round(b.width),
          height: Math.round(b.height),
          cy: Math.round((b.top + b.bottom) / 2)
        };
      };
      return {
        lockupFlow: getBox('.hp-hero-lockup-flow'),
        outerWrap: getBox('.sriyas-orbital-outer-wrap'),
        tagline: getBox('.hp-hero-tagline'),
        title: getBox('.hp-hero-title-slot'),
        emblem: getBox('.hp-hero-emblem-slot'),
        heroCopy: getBox('.hp-hero-copy')
      };
    })()`,
    returnByValue: true
  });
  console.log(JSON.stringify(r.result.value, null, 2));
  ws.close();
  process.exit(0);
})();

// node planche.mjs <sortie> <img1> <img2> ... : planche côte à côte (390 px chacune), via un onglet jetable
import { createRequire } from 'node:module';
import fs from 'node:fs'; import path from 'node:path';
const require = createRequire('C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/package.json');
const puppeteer = require('puppeteer-core');
const [out, ...imgs] = process.argv.slice(2);
const cap = path.resolve('cap');
const html = '<html><body style="margin:0;display:flex;gap:6px;background:#888">' + imgs.map((i) => `<div style="width:390px"><div style="font:bold 13px sans-serif;background:#ff0;padding:1px">${i}</div><img style="width:390px;display:block" src="data:image/png;base64,${fs.readFileSync(path.join(cap, i + '.png')).toString('base64')}"></div>`).join('') + '</body></html>';

const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
const b = await browser.target().createCDPSession();
const { targetId } = await b.send('Target.createTarget', { url: 'about:blank', newWindow: true, background: true });
const t = await browser.waitForTarget((x) => x._targetId === targetId); const p = await t.page();
try {
  const { windowId } = await b.send('Browser.getWindowForTarget', { targetId }); await b.send('Browser.setWindowBounds', { windowId, bounds: { left: 1100, top: 0 } });
  await p.setViewport({ width: imgs.length * 396, height: 866, deviceScaleFactor: 1 });
  await p.setContent(html, { waitUntil: 'load' }); await new Promise((r) => setTimeout(r, 400));
  await p.screenshot({ path: path.join(cap, out + '.png') });
} finally { await p.close(); browser.disconnect(); }
console.log('planche', out);

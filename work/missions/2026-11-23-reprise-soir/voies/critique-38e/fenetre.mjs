import { ouvrir } from './outil.mjs';
const { browser, page, lacher } = await ouvrir();
const b = await browser.target().createCDPSession();
const tid = page.target()._targetId;
const { windowId, bounds } = await b.send('Browser.getWindowForTarget', { targetId: tid });
console.log('mien', windowId, bounds);
for (const t of browser.targets().filter((t) => t.type() === 'page')) { try { const w = await b.send('Browser.getWindowForTarget', { targetId: t._targetId }); console.log(w.windowId, JSON.stringify(w.bounds), t.url().slice(0, 60)); } catch {} }
await b.send('Browser.setWindowBounds', { windowId, bounds: { windowState: 'normal' } });
await b.send('Browser.setWindowBounds', { windowId, bounds: { left: 1100, top: 0, width: 520, height: 1000 } });
lacher(); process.exit(0);

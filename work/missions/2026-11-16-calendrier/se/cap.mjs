import { createRequire } from 'module'; import path from 'path'; import { pathToFileURL } from 'url';
const req = createRequire('C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/optimistic-ptolemy-2d1278/package.json');
const pp = req('puppeteer-core'); const nav = await pp.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: 'new' });
for (const [f, vp] of [['se/z2s.html', { width: 390, height: 844, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }], ['se/w3s.html', { width: 844, height: 390, isMobile: true, hasTouch: true, deviceScaleFactor: 2 }]]) {
  const p = await nav.newPage(); await p.setViewport(vp); await p.emulateMediaFeatures([{ name: 'prefers-color-scheme', value: 'light' }]);
  await p.goto(pathToFileURL(path.resolve(f)).href, { waitUntil: 'load' }); await new Promise((r) => setTimeout(r, 600));
  const n = path.basename(f, '.html');
  const a = await p.evaluate(() => { const fh = document.querySelector('#fh'); return { bande: Math.round(fh.getBoundingClientRect().height), txt: fh.innerText.replace(/\s+/g, ' ').slice(0, 120), frise: Math.round((document.querySelector('#fb') || document.querySelector('.frise')).getBoundingClientRect().top) }; });
  await p.screenshot({ path: `se/cap/${n}-repos.png` });
  await p.click('.mt-b'); await new Promise((r) => setTimeout(r, 300));
  const b = await p.evaluate(() => { const fh = document.querySelector('#fh'); return { bande: Math.round(fh.getBoundingClientRect().height), txt: fh.innerText.replace(/\s+/g, ' ').slice(0, 120) }; });
  await p.screenshot({ path: `se/cap/${n}-plusmoins.png` });
  console.log(n, 'repos', JSON.stringify(a), '| ±', JSON.stringify(b));
  await p.close();
}
await nav.close();

import puppeteer from 'puppeteer-core'; import fs from 'fs'; import path from 'path';
const D = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-25-carnet-passe4/jouable/cap-liens';
const P = path.join(D, 'planches'); fs.mkdirSync(P, { recursive: true });
const fichiers = fs.readdirSync(D).filter(f => f.endsWith('.png')).sort();
const b = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222' }); const page = await b.newPage();
await page.setViewport({ width: 1600, height: 900, deviceScaleFactor: 1 });
for (let i = 0; i < fichiers.length; i += 4) {
  const lot = fichiers.slice(i, i + 4);
  const html = '<body style="margin:0;background:#555;display:flex;gap:10px;font:14px sans-serif;color:#fff">' + lot.map(f => '<div><div>' + f + '</div><img style="width:390px" src="data:image/png;base64,' + fs.readFileSync(path.join(D, f)).toString('base64') + '"></div>').join('') + '</body>';
  await page.setContent(html); await page.screenshot({ path: path.join(P, 'planche-' + String(i / 4 + 1).padStart(2, '0') + '.png'), fullPage: true });
}
await page.close(); b.disconnect(); console.log(fichiers.length, 'captures,', Math.ceil(fichiers.length / 4), 'planches');

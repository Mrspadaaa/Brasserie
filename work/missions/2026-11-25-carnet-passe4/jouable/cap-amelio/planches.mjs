// Planches de trois captures à 390 (ouverture côte à côte) : node planches.mjs <dossier>
import puppeteer from 'puppeteer-core'; import fs from 'fs'; import path from 'path';
const CAP = path.resolve(process.argv[2]); const browser = await puppeteer.connect({ browserURL: 'http://127.0.0.1:9222', defaultViewport: null });
const P = await browser.newPage(); await P.setViewport({ width: 1190, height: 844, deviceScaleFactor: 1 });
const pngs = fs.readdirSync(CAP).filter(f => /^[0-9].*[.]png$/.test(f)).sort();
for (let i = 0; i < pngs.length; i += 3) {
  const html = '<body style="margin:0;background:#555;display:flex;gap:10px">' + pngs.slice(i, i + 3).map(f => '<img style="width:390px;height:844px;display:block" src="data:image/png;base64,' + fs.readFileSync(path.join(CAP, f)).toString('base64') + '">').join('') + '</body>';
  await P.setContent(html, { waitUntil: 'load' }); await P.screenshot({ path: path.join(CAP, 'planche-' + String(i / 3 + 1).padStart(2, '0') + '.png') });
}
await P.close(); browser.disconnect(); console.log(Math.ceil(pngs.length / 3) + ' planches :', pngs.join(' '));

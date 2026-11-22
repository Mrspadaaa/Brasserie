// D381, mesure avant l'app : rend la page de la pièce fictive de 300 lignes (pdf.js dans Chrome), planifie les morceaux avec le VRAI code
// (`planMorceaux`), dessine chaque vue comme l'app le fera (voisins teintés, trait rouge dans le blanc), écrit `morceaux.json` (k, n, JPEG en base64).
// Usage : npx vite-node <ce fichier> -- <dossier contenant facture-fictive-300-lignes.pdf>
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
import { inkRows, planJonctions, planMorceaux } from '../../../../functions/src/invoiceMorceaux';

const R = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/', B = 'C:/Users/mrspa/AppData/Local/Temp/deploy-hosting-qr/';
const puppeteer = createRequire(R + 'package.json')('puppeteer-core');
const dossier = process.argv.slice(2).find(a => a !== '--') ?? '.';
const pdf = fs.readFileSync(path.join(dossier, 'facture-fictive-300-lignes.pdf')).toString('base64');
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--allow-file-access-from-files'] });
const p = await nav.newPage();
await p.goto('file:///' + B + 'node_modules/pdfjs-dist/package.json');
const lib = fs.readFileSync(B + 'node_modules/pdfjs-dist/legacy/build/pdf.min.mjs', 'utf8'), worker = fs.readFileSync(B + 'node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs', 'utf8');
const page = await p.evaluate(async (lib, worker, data) => {
  const imp = new Function('u', 'return im' + 'port(u)');
  const pdfjs = await imp(URL.createObjectURL(new Blob([lib], { type: 'text/javascript' })));
  pdfjs.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([worker], { type: 'text/javascript' }));
  const doc = await pdfjs.getDocument({ data: Uint8Array.from(atob(data), c => c.charCodeAt(0)) }).promise;
  const pg = await doc.getPage(1), vp = pg.getViewport({ scale: 2 });
  const cv = document.createElement('canvas'); cv.width = Math.floor(vp.width); cv.height = Math.floor(vp.height);
  const g = cv.getContext('2d')!; g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
  await pg.render({ canvasContext: g, viewport: vp }).promise;
  (window as any).__cv = cv;
  const px = g.getImageData(0, 0, cv.width, cv.height).data, gray: number[] = new Array(cv.width * cv.height);
  for (let i = 0; i < gray.length; i++) gray[i] = Math.round(0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]);
  return { width: cv.width, height: cv.height, gray };
}, lib, worker, pdf);
const rows = inkRows({ width: page.width, height: page.height, gray: Uint8Array.from(page.gray) });
const plan = planMorceaux(rows, page.width);
console.log(`page ${page.width} × ${page.height}, ${plan.length} morceaux, forcés : ${plan.filter(m => m.forced).length}`);
const parties = [];
for (const [i, m] of plan.entries()) {
  const data = await p.evaluate((m: any) => {
    const src = (window as any).__cv as HTMLCanvasElement, h = m.viewBottom - m.viewTop, cv = document.createElement('canvas');
    cv.width = src.width; cv.height = h;
    const g = cv.getContext('2d')!;
    g.drawImage(src, 0, m.viewTop, src.width, h, 0, 0, src.width, h);
    g.fillStyle = 'rgba(255,190,0,0.18)';
    if (m.top > m.viewTop) g.fillRect(0, 0, cv.width, m.top - m.viewTop);
    if (m.viewBottom > m.bottom) g.fillRect(0, m.bottom - m.viewTop, cv.width, m.viewBottom - m.bottom);
    g.fillStyle = '#e00000';
    if (m.top > m.viewTop) g.fillRect(0, m.top - m.viewTop - 1, cv.width, 2);
    if (m.viewBottom > m.bottom) g.fillRect(0, m.bottom - m.viewTop - 1, cv.width, 2);
    return cv.toDataURL('image/jpeg', 0.85).split(',')[1];
  }, m);
  parties.push({ morceau: { k: i + 1, n: plan.length }, coupeForcee: m.forced, plan: m, data });
  if (i === 0 || i === 5) fs.writeFileSync(path.join(dossier, `morceau-${i + 1}.jpg`), Buffer.from(data, 'base64'));
}
fs.writeFileSync(path.join(dossier, 'morceaux.json'), JSON.stringify(parties));
// D381 : les bandes de contrôle des coupes (lues à part, seulement comparées).
const sortie = path.join(dossier, 'm300'); fs.mkdirSync(sortie, { recursive: true });
for (const f of fs.readdirSync(sortie)) fs.rmSync(path.join(sortie, f));
parties.forEach(x => fs.writeFileSync(path.join(sortie, `m${String(x.morceau.k).padStart(2, '0')}.jpg`), Buffer.from(x.data, 'base64')));
const jonctions = planJonctions(plan, rows);
for (const j of jonctions) {
  const data = await p.evaluate((j: any) => {
    const src = (window as any).__cv as HTMLCanvasElement, h = j.bottom - j.top, cv = document.createElement('canvas');
    cv.width = src.width; cv.height = h; cv.getContext('2d')!.drawImage(src, 0, j.top, src.width, h, 0, 0, src.width, h);
    return cv.toDataURL('image/jpeg', 0.85).split(',')[1];
  }, j);
  fs.writeFileSync(path.join(sortie, `j${String(j.k).padStart(2, '0')}.jpg`), Buffer.from(data, 'base64'));
}
fs.writeFileSync(path.join(sortie, 'plan.json'), JSON.stringify({ parties: parties.map(x => ({ morceau: x.morceau, coupeForcee: x.coupeForcee })), jonctions: jonctions.map(j => j.k) }));
console.log(`${parties.length} morceaux, ${jonctions.length} bandes de contrôle → ${sortie}`);
await nav.close();

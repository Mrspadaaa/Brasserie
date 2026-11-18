// D380, mesure de la taille de bande : rend la page haute de la pièce fictive de 300 lignes (pdf.js dans Chrome), mesure l'encre par rangée,
// planifie les bandes avec le VRAI code (`functions/src/invoiceMorceaux.ts`) pour 15, 25 et 40 lignes, et écrit deux bandes du milieu par taille.
// Usage : npx vite-node <ce fichier> -- <dossier>
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
import { inkedCuts, linePitch, planBands } from '../../../../functions/src/invoiceMorceaux';

const R = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/', B = 'C:/Users/mrspa/AppData/Local/Temp/deploy-hosting-qr/';
const puppeteer = createRequire(R + 'package.json')('puppeteer-core');
const dossier = process.argv.slice(2).find(a => a !== '--') ?? '.';
const pdf = fs.readFileSync(path.join(dossier, 'facture-fictive-300-lignes.pdf')).toString('base64');
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true, args: ['--allow-file-access-from-files'] });
const p = await nav.newPage();
await p.goto('file:///' + B + 'node_modules/pdfjs-dist/package.json');
const lib = fs.readFileSync(B + 'node_modules/pdfjs-dist/legacy/build/pdf.min.mjs', 'utf8'), worker = fs.readFileSync(B + 'node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs', 'utf8');
const mesure = await p.evaluate(async (lib, worker, data) => {
  const importer = new Function('u', 'return im' + 'port(u)'); const pdfjs = await importer(URL.createObjectURL(new Blob([lib], { type: 'text/javascript' })));
  pdfjs.GlobalWorkerOptions.workerSrc = URL.createObjectURL(new Blob([worker], { type: 'text/javascript' }));
  const doc = await pdfjs.getDocument({ data: Uint8Array.from(atob(data), c => c.charCodeAt(0)) }).promise;
  const page = await doc.getPage(1), vp = page.getViewport({ scale: 2 });
  const cv = document.createElement('canvas'); cv.width = Math.floor(vp.width); cv.height = Math.floor(vp.height);
  const g = cv.getContext('2d')!; g.fillStyle = '#fff'; g.fillRect(0, 0, cv.width, cv.height);
  await page.render({ canvasContext: g, viewport: vp }).promise;
  (window as any).__cv = cv;
  const px = g.getImageData(0, 0, cv.width, cv.height).data, hist = new Array(256).fill(0), gray = new Uint8Array(cv.width * cv.height);
  for (let i = 0; i < gray.length; i++) { gray[i] = Math.round(0.299 * px[i * 4] + 0.587 * px[i * 4 + 1] + 0.114 * px[i * 4 + 2]); hist[gray[i]]++; }
  const fond = hist.indexOf(Math.max(...hist)), rows: number[] = [];
  for (let y = 0; y < cv.height; y++) { let ink = 0; for (let x = 0; x < cv.width; x++) if (Math.abs(gray[y * cv.width + x] - fond) > 40) ink++; rows.push(ink / cv.width); }
  return { width: cv.width, height: cv.height, rows };
}, lib, worker, pdf);
console.log(`page rendue ${mesure.width} × ${mesure.height}, pas des lignes ${linePitch(mesure.rows)} rangées`);
const sortie: any = { width: mesure.width, height: mesure.height, tailles: {} };
for (const maxLines of [15, 25, 40]) {
  const bandes = planBands(mesure.rows, mesure.width, { maxLines });
  const coupes = inkedCuts(bandes, mesure.rows);
  const milieu = [Math.floor(bandes.length / 3), Math.floor((2 * bandes.length) / 3)];
  sortie.tailles[maxLines] = { n: bandes.length, coupesEncrees: coupes.length, choisies: milieu };
  for (const k of milieu) {
    const b = bandes[k];
    const jpeg = await p.evaluate((top: number, bottom: number) => {
      const src = (window as any).__cv as HTMLCanvasElement, cv = document.createElement('canvas');
      cv.width = src.width; cv.height = bottom - top; cv.getContext('2d')!.drawImage(src, 0, top, src.width, bottom - top, 0, 0, src.width, bottom - top);
      return cv.toDataURL('image/jpeg', 0.85).split(',')[1];
    }, b.top, b.bottom);
    const nom = `bande-${maxLines}l-${k + 1}sur${bandes.length}.jpg`;
    fs.writeFileSync(path.join(dossier, nom), Buffer.from(jpeg, 'base64'));
    console.log(`${maxLines} lignes max : ${bandes.length} bandes, coupes encrées ${coupes.length} ; ${nom} (${b.bottom - b.top} px)`);
  }
}
fs.writeFileSync(path.join(dossier, 'bandes-plan.json'), JSON.stringify(sortie, null, 1));
await nav.close();

// Compte les mots visibles dans le premier écran à 390 × 844, pour chaque maquette.
// Usage : node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs <dossier-etape> [ids…] [--max=N]
// Un mot est compté s'il appartient à un nœud texte visible dont la boîte touche le
// premier écran. Les chiffres comptent comme des mots. Sortie : une ligne par maquette,
// puis MOTS OK si toutes respectent --max (si fourni), sinon MOTS ECHEC.
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const args = process.argv.slice(2);
const max = Number((args.find((a) => a.startsWith('--max=')) || '').slice(6)) || null;
// --page=etat-b.html : compte un autre fichier de chaque dossier (défaut : index.html).
const pageFile = (args.find((a) => a.startsWith('--page=')) || '--page=index.html').slice(7);
const rest = args.filter((a) => !a.startsWith('--'));
const dir = path.resolve(rest[0] || '.');
const only = rest.slice(1);
const ids = fs.readdirSync(dir)
  .filter((d) => fs.existsSync(path.join(dir, d, pageFile)))
  .filter((d) => (only.length ? only.includes(d) : /^p\d+|^consolide$|^version-/.test(d)))
  .sort();

const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
let over = 0;
for (const id of ids) {
  const page = await browser.newPage();
  await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  await page.goto(pathToFileURL(path.join(dir, id, pageFile)).href, { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((r) => setTimeout(r, 300));
  const n = await page.evaluate(() => {
    const H = innerHeight;
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    let words = 0;
    const range = document.createRange();
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const text = node.textContent.trim();
      if (!text) continue;
      const el = node.parentElement;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || cs.display === 'none' || Number(cs.opacity) === 0) continue;
      range.selectNodeContents(node);
      const r = range.getBoundingClientRect();
      if (r.width === 0 || r.height === 0 || r.bottom <= 0 || r.top >= H) continue;
      words += text.split(/\s+/).filter(Boolean).length;
    }
    // Textes SVG dessinés aussi comptés par le parcours ci-dessus (nœuds texte).
    return words;
  });
  await page.close();
  const bad = max && n > max;
  if (bad) over++;
  console.log(id + ' ' + n + ' mots' + (bad ? ' (> ' + max + ')' : ''));
}
await browser.close();
if (max) console.log(over === 0 ? 'MOTS OK' : 'MOTS ECHEC ' + over + '/' + ids.length + ' au-dessus de ' + max);

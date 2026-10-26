// Contrôle Chrome (a3-etoile, D156 étendu) : dans Dryhopper, quand le moment tenu est le meilleur (★), le ★ du rail se voit.
// Même défaut que le contour de Galaxy : un repère dessiné SOUS les séries. Idaho 7 à 1 j : le gain du floral dépasse le haut de
// l'échelle (+26), l'anneau du doigt est calé sur TOP et recouvrait le ★ (elementFromPoint au centre du ★ rendait « circle »).
// Ce n'est pas un test vitest (nom sans .test) : il lance Chrome sur la maquette construite (état de repos de Dryhopper, fixture).
// Usage (racine) :
//   node tests/integration/controle-etoile-dryhopper.mjs [<dossier construit>]      (défaut : prototypes/houblons-v4/maquettes/parcours)
// Par format (390 × 844 et 1280 × 800) : le moment tenu est Idaho 7 à 1 j, le ★ est au moment tenu, et l'élément du dessus
// au centre du ★ (et 4 px plus bas, là où tombe le corps du glyphe) est le ★ (text.pq-dry-etoile).
// Sortie : « ETOILE OK » ou « ETOILE ECHEC n » (code 1).
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import puppeteer from 'puppeteer-core';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(import.meta.dirname, '..', '..');
const dossier = path.resolve(RACINE, process.argv.slice(2).find((a) => !a.startsWith('--')) ?? 'prototypes/houblons-v4/maquettes/parcours');
const SORTIE = path.join(os.tmpdir(), 'controle-etoile-dryhopper');
fs.mkdirSync(SORTIE, { recursive: true });
const CHROME = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const FORMATS = [{ nom: '390x844', width: 390, height: 844, isMobile: true, hasTouch: true }, { nom: '1280x800', width: 1280, height: 800, isMobile: false, hasTouch: false }];
const echecs = [];
const bilan = {};

const nav = await puppeteer.launch({ executablePath: CHROME, headless: true });
for (const f of FORMATS) {
  const page = await nav.newPage();
  await page.setViewport({ width: f.width, height: f.height, isMobile: f.isMobile, hasTouch: f.hasTouch, deviceScaleFactor: 2 });
  await page.goto(pathToFileURL(path.join(dossier, 'dryhopper', 'etat.html')).href, { waitUntil: 'networkidle0' });
  await page.waitForSelector('.pq-dry-svg', { timeout: 60000 });
  await new Promise((r) => setTimeout(r, 600));
  const svg = await page.$('.pq-dry-svg');
  await svg.evaluate((e) => e.scrollIntoView({ block: 'center' }));
  await new Promise((r) => setTimeout(r, 300));
  const m = await page.evaluate(() => {
    const et = document.querySelector('.pq-dry-etoile');
    if (!et) return { absent: true };
    const b = et.getBoundingClientRect();
    const trait = document.querySelector('[data-role="trait-doigt"] line').getBoundingClientRect();
    const nom = (e) => (e ? e.tagName.toLowerCase() + (e.getAttribute('class') ? '.' + e.getAttribute('class') : '') : 'rien');
    const cx = b.x + b.width / 2, cy = b.y + b.height / 2;
    const dessus = [0, 4].map((dy) => nom(document.elementFromPoint(cx, cy + dy)));
    const texte = (document.body.textContent || '').replace(/\s+/g, ' ');
    return { dessus, ecartX: Math.abs(cx - (trait.x + trait.width / 2)), idaho: /Idaho 7/.test(texte), unJour: /actif\s*·\s*1 j/.test(texte), etoile: { x: b.x, y: b.y, w: b.width, h: b.height } };
  });
  bilan[f.nom] = m;
  await svg.screenshot({ path: path.join(SORTIE, `etoile-${f.nom}.png`) });
  if (m.absent) echecs.push(`${f.nom} : aucun ★ (.pq-dry-etoile) alors que le moment tenu doit être le meilleur`);
  else {
    if (!m.idaho || !m.unJour) echecs.push(`${f.nom} : la page n'est pas Idaho 7 à 1 j (Idaho 7 : ${m.idaho}, « actif · 1 j » : ${m.unJour})`);
    if (m.ecartX > 1.5) echecs.push(`${f.nom} : le ★ n'est pas au moment tenu (${m.ecartX.toFixed(1)} px d'écart)`);
    m.dessus.forEach((d, i) => { if (!d.startsWith('text.pq-dry-etoile')) echecs.push(`${f.nom} : au ${i ? 'centre + 4 px' : 'centre'} du ★, l'élément du dessus est « ${d} » (attendu text.pq-dry-etoile) : ★ recouvert`); });
  }
  await page.close();
}
await nav.close();
fs.writeFileSync(path.join(SORTIE, 'bilan.json'), JSON.stringify(bilan, null, 1) + '\n');
console.log(JSON.stringify(bilan));
if (echecs.length) { console.log(`ETOILE ECHEC ${echecs.length}`); for (const e of echecs) console.log(' - ' + e); process.exit(1); }
console.log('ETOILE OK');

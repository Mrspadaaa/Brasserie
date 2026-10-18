// Extrait les données des trois radars de la base (Comparer, Ma bière, Suggestions) dans un
// JSON commun, pour un lot de fils de fer radar qui dessine exactement les mêmes cas.
// Usage : node work/refonte-frontend/v4/tournoi/outils/extraire-radars.mjs <dossier base consolide> <sortie.json>
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import puppeteer from 'puppeteer-core';

const [src, out] = process.argv.slice(2).map((p) => path.resolve(p));
const root = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '../../../../..');
const PACK = JSON.parse(fs.readFileSync(path.join(root, 'prototypes/houblons-v4/data/pack-mini-protos.json'), 'utf8'));
const NOMS = Object.fromEntries((PACK.roueAromes?.familles || PACK.families || []).map((f) => [f.key || f.family || f.id, f.name || f.nom]).filter(([k]) => k));
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const lire = async (page) => {
  const p = await browser.newPage();
  await p.setViewport({ width: 390, height: 844 });
  await p.goto(pathToFileURL(path.join(src, page)).href, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 300));
  const r = await p.evaluate(() => { const s = document.querySelector('svg[data-radar]'); return s && {
    objet: s.getAttribute('data-objet'), axes: s.getAttribute('data-axes').split(','),
    inconnues: [...s.querySelectorAll('[data-inconnu]')].map((e) => e.getAttribute('data-inconnu')),
    anneaux: [...s.querySelectorAll('text')].map((t) => t.textContent.trim()).filter((t) => /^(faible|moyen|marqué|cité)$/.test(t)),
    series: [...s.querySelectorAll('[data-serie]')].map((e) => ({ nom: e.getAttribute('data-serie'), couleur: e.getAttribute('data-couleur') || null,
      valeurs: (e.getAttribute('data-valeurs') || '').split(',').map((x) => (x.trim() === '' ? null : Number(x))) })) }; });
  await p.close();
  return r;
};
const comparer = await lire('comparer-radar.html');
const biere = await lire('biere-radar.html');
const sugg = await lire('suggestions-radar.html');
await browser.close();
const style = PACK.styles['16D'];
const json = {
  source: 'base v4.1 (ecran-1/base/consolide), pack-mini-protos.json, pack-fiches.json',
  noms: NOMS,
  attenduesDuStyle: Object.entries(style.families).filter(([, v]) => v.status === 'attendue').map(([k]) => k),
  comparer: { ...comparer, echelle: 'citations des fiches : 0 non décrit, 1 cité, 2 marqué', max: 2 },
  biere: { ...biere, echelle: '0 à 3 (faible, moyen, marqué), soit 0–100 ÷ 33,33 ; zone = bande du style ; vide = famille non située', max: 3, alerte: ['resin'] },
  suggestions: { ...sugg, echelle: 'comme Ma bière ; avant et après la voie « Ajouter Golding 10 g à 10′ »', max: 3 },
};
fs.mkdirSync(path.dirname(out), { recursive: true });
fs.writeFileSync(out, JSON.stringify(json, null, 1));
console.log('RADARS ' + out + ' · comparer ' + comparer.series.length + ' séries · bière ' + biere.series.length + ' · suggestions ' + sugg.series.length);

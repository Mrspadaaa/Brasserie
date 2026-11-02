#!/usr/bin/env node
// Contrôle 3 de VOIE.md (l3-cas) : la référence A de chaque question reprend sa maquette au pixel, hors des éléments du cas, chacun nommé.
// Compare élément par élément (en-tête, fil, bandeau, preuve, puces, TVA, bandes, rangées, pied) la capture A à sa maquette rendue
// (choix-lenteur/maquettes/d-lue.html, d-15.html), chacun recadré à sa propre boîte : un élément qui a seulement bougé (le fil parti)
// reste comparable. Rend, par élément : identique, diffère (n pixels), absent ou neuf. Puis vérifie que seuls les éléments du cas,
// nommés ci-dessous, diffèrent ; et que la vue « avant » de la question 2 est d-15 au pixel.
// Usage (racine) : node work/missions/2026-10-31-ecran-depense/choix-cas-38/outils/mesure-a.mjs
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ICI = path.dirname(fileURLToPath(import.meta.url));
const DOSSIER = path.resolve(ICI, '..');
const RACINE = path.resolve(DOSSIER, '..', '..', '..', '..');
const SA = path.join(DOSSIER, '..', 'choix-lenteur');
const puppeteer = createRequire(path.join(RACINE, 'package.json'))('puppeteer-core');
const nav = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const p = await nav.newPage();
await p.setViewport({ width: 390, height: 700, deviceScaleFactor: 2 });

// Les éléments, nommés, et leurs boîtes ; puis la capture de la page.
async function relever(fichier) {
  await p.goto(pathToFileURL(fichier).href, { waitUntil: 'networkidle0' }).catch(() => {});
  await p.evaluate(() => document.fonts.ready);
  await new Promise((r) => setTimeout(r, 200));
  const els = await p.evaluate(() => {
    const out = [];
    const nom = (e) => e.textContent.replace(/\s+/g, ' ').trim().slice(0, 22);
    const pousse = (cle, e, rogne = 0) => { const r = e.getBoundingClientRect(); out.push({ cle, x: r.left, y: r.top, w: r.width, h: r.height - rogne }); };
    const un = (cle, s) => { const e = document.querySelector(s); if (e) pousse(cle, e); };
    un('en-tête', '.cl-h'); un('fil', '.cl-fil'); un('bandeau : fournisseur et date', '.cl-band .r1'); un('bandeau : total et « 7 lignes »', '.cl-band .r2'); un('bandeau : barre', '.cl-barre');
    // reprise 1 : la rangée du total, puis ses deux parties à part, pour dire laquelle diffère
    un('bandeau : total (le nombre)', '.cl-band .tot'); un('bandeau : « 7 lignes »', '.cl-band .cl-chip');
    // les cases de la preuve, sans leurs 4 px du bas : le cadre bleu de « Lectures ●●◌ » (d-15, outline de 2,5 px décalé de 1 px) y déborde
    document.querySelectorAll('.cl-preuve > .rg').forEach((e, i) => pousse(`preuve : ${nom(e) || 'case vide ' + i}`, e, 4));
    document.querySelectorAll('.cl-preuve .cl-pu').forEach((e) => pousse(`puce : ${nom(e)}`, e));
    un('preuve : remarque', '.cl-preuve .l3-rem');
    document.querySelectorAll('.cl-duo > div').forEach((e) => pousse(`case : ${nom(e)}`, e));
    document.querySelectorAll('.cl-bande').forEach((e) => pousse(`bande : ${nom(e)}`, e));
    document.querySelectorAll('.cl-li').forEach((e) => pousse(`rangée : ${e.querySelector('.n > span').textContent.trim()}`, e));
    un('pied : Catégorie | Papier', '.cl-seg'); un('pied : Confirmer', '.cl-conf');
    return out;
  });
  const png = await p.screenshot({ encoding: 'base64' });
  return { els, png };
}

async function comparer(a, r) {
  await p.goto('about:blank');
  return p.evaluate(async ({ a, r }) => {
    const charge = (s) => new Promise((ok) => { const i = new Image(); i.onload = () => ok(i); i.src = 'data:image/png;base64,' + s; });
    const [ia, ir] = await Promise.all([charge(a.png), charge(r.png)]);
    const px = (i) => { const c = document.createElement('canvas'); c.width = i.width; c.height = i.height; const x = c.getContext('2d'); x.drawImage(i, 0, 0); return x.getImageData(0, 0, i.width, i.height); };
    const A = px(ia), R = px(ir), S = 2;
    const parCle = new Map(r.els.map((e) => [e.cle, e]));
    const res = [];
    for (const ea of a.els) {
      const er = parCle.get(ea.cle);
      if (!er) { res.push({ cle: ea.cle, etat: 'neuf' }); continue; }
      parCle.delete(ea.cle);
      if (Math.round(ea.w) !== Math.round(er.w) || Math.round(ea.h) !== Math.round(er.h)) { res.push({ cle: ea.cle, etat: `taille ${Math.round(er.w)}×${Math.round(er.h)} → ${Math.round(ea.w)}×${Math.round(ea.h)}` }); continue; }
      let n = 0;
      const w = Math.round(ea.w * S), h = Math.round(ea.h * S), xa = Math.round(ea.x * S), ya = Math.round(ea.y * S), xr = Math.round(er.x * S), yr = Math.round(er.y * S);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = ((ya + y) * A.width + xa + x) * 4, j = ((yr + y) * R.width + xr + x) * 4;
        if (Math.abs(A.data[i] - R.data[j]) + Math.abs(A.data[i + 1] - R.data[j + 1]) + Math.abs(A.data[i + 2] - R.data[j + 2]) > 6) n++;
      }
      res.push({ cle: ea.cle, etat: n <= 2 ? 'identique' : `diffère (${n} px)`, bouge: Math.round((ea.y - er.y) * 10) / 10 });
    }
    for (const cle of parCle.keys()) res.push({ cle, etat: 'absent' });
    return res;
  }, { a, r });
}

const maq = (n) => path.join(DOSSIER, 'maquettes', `${n}.html`);
const ref = (n) => path.join(SA, 'maquettes', `${n}.html`);
// Les éléments du cas : seuls ceux-là peuvent différer.
const CAS = [
  ['q1-a', 'd-lue', ['bandeau : total', 'bandeau : barre', 'preuve : Somme = imprimé', 'puce : 3 corrigées', 'puce : 5 corrigées', 'bande : Malts', 'rangée : Malt de Munich']],
  ['q2-avant', 'd-15', []],
  // reprise 1 (e-t14) : A est l'app d'aujourd'hui ; la rangée du total ne diffère que par « 7 lignes » (le nombre reste identique)
  ['q2-a', 'd-15', ['fil', 'preuve : Lectures', 'preuve : ·Lectures', 'puce : 1Lecture coupée', 'bandeau : total et « 7 lignes »', 'bandeau : « 7 lignes »', 'pied : Confirmer']],
];
let ko = 0;
for (const [nom, de, permis] of CAS) {
  const res = await comparer(await relever(maq(nom)), await relever(ref(de)));
  console.log(`${nom} contre ${de}.html :`);
  const casse = [];
  for (const e of res) {
    // un élément du cas : son nom commence par un nom permis (le nom porte le texte : « 3 corrigées » part, « 5 corrigées » arrive)
    const ok = e.etat === 'identique', du_cas = permis.some((k) => e.cle.startsWith(k));
    if (!ok && !du_cas) casse.push(e.cle);
    console.log(`   ${ok ? '=' : du_cas ? '~' : '!'} ${e.cle} : ${e.etat}${e.bouge ? ` (déplacé de ${e.bouge} px)` : ''}`);
  }
  if (casse.length) { ko++; console.log(`   HORS DU CAS : ${casse.join(' ; ')}`); }
}
// La vue « avant » : d-15 au pixel, image entière.
const a = await relever(maq('q2-avant')), r = fs.readFileSync(path.join(SA, 'img', 'd-15.png')).toString('base64');
const entier = await comparer({ els: [{ cle: 'page', x: 0, y: 0, w: 390, h: 700 }], png: a.png }, { els: [{ cle: 'page', x: 0, y: 0, w: 390, h: 700 }], png: r });
console.log(`q2-avant contre img/d-15.png (capture de sa maquette) : ${entier[0].etat}`);
if (entier[0].etat !== 'identique') ko++;
await nav.close();
console.log(ko ? `MESURE-A ECHEC (${ko})` : 'MESURE-A OK (hors des éléments du cas, nommés ci-dessus, A est sa maquette au pixel)');
process.exit(ko ? 1 : 0);

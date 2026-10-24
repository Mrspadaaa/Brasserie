// Lot 20 · les vraies fiches g1 des houblons du lot (Citra, Cascade, Galaxy, Idaho 7), reprises du
// mécanisme de fils17-standard/b5b/extraire-fiches.mjs : la base v4.10 (base/consolide/etat-b.html)
// rend la fiche avec sa propre fonction (ouvrirFiche, fiche.js), et l'on garde son outerHTML, ses replis
// et les règles CSS de la fiche.
// Cascade, Galaxy et Idaho 7 sont des fiches du pack (D.fichesH). Citra T-90 n'est pas dans le pack de
// la base : sa fiche est construite comme la base construit celle d'un remplaçant du catalogue
// (ficheCatalogue de base/generateur/build.mjs, recopiée telle quelle ci-dessous), avec Citra cryo pour
// original et le remplaçant « Citra » que pack-fiches.json calcule pour Citra cryo.
// Usage : node extraire-fiches.mjs  (écrit fiches-lot20.json à côté)
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { createRequire } from 'node:module';
const REPO = 'C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie';
const require = createRequire(REPO + '/package.json');
const puppeteer = require('puppeteer-core');
const ici = path.dirname(fileURLToPath(import.meta.url));
const SRC = REPO + '/work/refonte-frontend/v4/ecran-1/base/consolide/etat-b.html';
const PF = JSON.parse(fs.readFileSync(REPO + '/prototypes/houblons-v4/data/pack-fiches.json', 'utf8')).fichesHoublons;
const VARIETES = JSON.parse(fs.readFileSync(REPO + '/prototypes/houblons-v4/data/proto-data.json', 'utf8')).varieties;
const CLES = ['beermaverick-citra', 'beermaverick-cascade', 'beermaverick-galaxy', 'beermaverick-idaho-7'];

// ---- recopié de base/generateur/build.mjs (ficheCatalogue et roleRegle), sans changement ----
const roleRegle = (a, marque) => (a >= 10 ? (marque ? 'double' : 'amérisant') : a <= 6 ? 'aromatique' : 'double');
function ficheCatalogue(v, orig, c, ref) {
  const NOMS_H = { myrcene: 'myrcène', humulene: 'humulène', caryophyllene: 'caryophyllène', farnesene: 'farnésène', linalool: 'linalol' };
  const src = (a) => (Array.isArray(a) ? [{ src: 'Beer Maverick', an: v.bmYear || null, min: a[0], max: a[1] }] : []);
  const M = (v.descriptions || []).length + (v.citedFacts || []).length;
  const corr = Object.fromEntries([...c.gagne, ...c.perd].map((x) => [x.family, x.a]));
  const aromes = orig.aromes.map((a) => { const lv = a.f in corr ? corr[a.f] : a.lv; return { f: a.f, lv, n: lv && M === 1 ? 1 : 0, of: M === 1 ? 1 : 0, auteurs: lv ? ['Beer Maverick'] : [] }; });
  const aMid = Array.isArray(v.alpha) ? (v.alpha[0] + v.alpha[1]) / 2 : null;
  const comp = { ...(v.oils || {}), linalool: Array.isArray(v.hsLinalool) ? v.hsLinalool : null };
  return {
    nom: v.name, origine: v.origin || null,
    role: aMid != null ? { v: roleRegle(aMid, aromes.some((a) => a.lv === 2)), src: 'règle : règle rôle-α v1 (prototype, à valider)' } : null,
    alpha: src(v.alpha), lot: null, lotOrigine: null, alphaRef: aMid,
    beta: src(v.beta), huiles: src(v.oil),
    composants: Object.entries(NOMS_H).map(([k, nom]) => (Array.isArray(comp[k]) ? { nom, min: comp[k][0], max: comp[k][1], src: k === 'linalool' ? 'Hopsteiner' : 'Beer Maverick' } : { nom, raison: k === 'farnesene' ? 'non importé (#131)' : 'non publié dans le catalogue' })),
    aromes, desc: v.tagsFr || [], subsCalc: [], subs: [], subsRaison: null,
    styles: [], stylesSrc: [], stylesRaison: 'styles d’emploi non publiés dans le dépôt',
    ibuPG: c.dose && c.dose.g ? { [ref.moment]: ref.ibu / c.dose.g } : {}, base: c.dose ? 'dose du pack à IBU égal, ' + ref.quand : null,
    catalogue: true,
  };
}
// ---- fin de la recopie ----

const cryo = PF.find((f) => f.key === 'beermaverick-citra:cryo');
const sc = cryo.substitutsCalcules;
const cand = sc.remplacants.find((r) => r.key === 'beermaverick-citra');
const c = { gagne: cand.gagne || [], perd: cand.perd || [], dose: cand.dose ? { g: cand.dose.grams, min: cand.dose.min, max: cand.dose.max } : null };
const ref = { moment: sc.reference.moment, quand: sc.reference.momentLabel, g: sc.reference.grams, ibu: sc.reference.ibu };
const vCitra = VARIETES.find((x) => x.id === 'beermaverick-citra');

const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const browser = await puppeteer.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
const page = await browser.newPage();
await page.setViewport({ width: 390, height: 844, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
await page.goto(pathToFileURL(SRC).href, { waitUntil: 'networkidle0' });
await wait(300);
const orig = await page.evaluate(() => D.fichesH['beermaverick-citra:cryo']);
const ficheCitra = ficheCatalogue(vCitra, orig, c, ref);
await page.evaluate((f) => { D.fichesH['beermaverick-citra'] = f; }, ficheCitra);
const res = { _origine: 'base/consolide/etat-b.html (fiche.js) ; Citra par ficheCatalogue de base/generateur/build.mjs', fiches: {}, css: [] };
for (const cle of CLES) {
  const r = await page.evaluate((k) => {
    ouvrirFiche(k, { mode: 'feuille' });
    const f = document.querySelector('section.f-fiche[data-role="fiche"]');
    if (!f) return null;
    const html = f.outerHTML, nom = f.getAttribute('aria-label').replace(/^Fiche de /, '');
    const sections = {};
    for (const id of ['styles', 'huiles', 'sources', 'subs']) { FICHE.sec = id; construireFiche(); const x = document.querySelector('section.f-fiche .f-sec'); sections[id] = x ? x.outerHTML : null; }
    FICHE.sec = null; construireFiche();
    return { nom, html, sections };
  }, cle);
  await page.evaluate(() => { const b = document.querySelector('[data-role="fermer-fiche"]'); if (b) b.click(); });
  await wait(200);
  if (r) { res.fiches[cle] = r; console.log(cle, '→', r.nom, r.html.length + ' o'); } else console.log(cle, '→ aucune fiche');
}
// Les règles CSS de la fiche (sélecteurs .f-… et #fiche-racine), et les symboles svg qu'elle utilise.
res.css = await page.evaluate(() => {
  const out = [];
  const garde = (sel) => /\.f-|#fiche-racine|\[data-role="fiche/.test(sel);
  for (const sh of document.styleSheets) for (const r of sh.cssRules) {
    if (r.selectorText && garde(r.selectorText)) out.push(r.cssText);
    else if (r.media && r.cssRules) { const inner = [...r.cssRules].filter((x) => x.selectorText && garde(x.selectorText)).map((x) => x.cssText); if (inner.length) out.push('@media ' + r.media.mediaText + ' { ' + inner.join(' ') + ' }'); }
    else if (r.type === 7 && /^f-|remplit|fiche/i.test(r.name)) out.push(r.cssText);
  }
  return out;
});
const ids = new Set(); for (const f of Object.values(res.fiches)) for (const m of (f.html + Object.values(f.sections).join('')).matchAll(/href="#([^"]+)"/g)) ids.add(m[1]);
res.symboles = await page.evaluate((l) => l.map((id) => { const s = document.getElementById(id); return s ? s.outerHTML : null; }).filter(Boolean), [...ids]);
console.log('css', res.css.length, 'règles · symboles', res.symboles.length, [...ids].join(' '));
await browser.close();
fs.writeFileSync(path.join(ici, 'fiches-lot20.json'), JSON.stringify(res, null, 1));
console.log('écrit fiches-lot20.json');

// Parcours réel export → import → ré-export, version x2 (export concis, D184). Reprend le parcours de v1-import-export,
// dont les contrôles de texte lisaient l'ancien format (« Masse (g) : 46 », « Moment : "boil" ») ; ils lisent maintenant le texte lisible
// (« 46 g Nugget (60 min · 13 % AA) ») et ajoutent : ni JSON, ni URL avant le bloc de réimport ; un seul bloc ; import lu localement ;
// ré-export identique à l'export initial (ligne à ligne).
// Fixture seulement : `?dev-local&etape=houblons` (Stout export, Nugget 46 g à 60′). Gemini coupé (ouvrir() bloque tout hors localhost).
// Usage (racine) :
//   node scripts/with_server.mjs --server "npm run dev -- --port 5263 --strictPort" --port 5263 --env VITE_HOP_V4=on -- node work/missions/2026-10-25-integration-houblons/voies/x2-export-concis/parcours-export-concis.mjs
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(process.cwd());
const DOSSIER = path.resolve(RACINE, 'work/missions/2026-10-25-integration-houblons/voies/x2-export-concis');
const IMG = path.join(DOSSIER, 'img');
fs.mkdirSync(IMG, { recursive: true });
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const base = `http://localhost:${process.env.WITH_SERVER_PORTS}`;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));
const MARQUEUR = '— Données de réimport (ne pas modifier) —';

const echecs = [];
const ok = (c, m) => { if (!c) echecs.push(m); console.log(c ? 'OK   ' : 'ECHEC', m); };

const { browser, page, journal } = await ouvrir({ largeur: 390, hauteur: 844 });

async function cliquerBouton(texte) {
  const trouve = await page.evaluate((t) => {
    const b = [...document.querySelectorAll('button, summary, [role="button"]')]
      .find((x) => ((x.getAttribute('aria-label') || x.textContent || '').trim()).startsWith(t));
    if (!b) return false;
    b.scrollIntoView({ block: 'center' }); b.click(); return true;
  }, texte);
  ok(trouve, `bouton « ${texte} » cliquable`);
  await dormir(700);
  return trouve;
}

async function saisir(selecteur, valeur) {
  await page.evaluate((s, v) => {
    const el = document.querySelector(s);
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
    setter.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, selecteur, valeur);
  await dormir(500);
}

const lisible = (texte) => texte.split(MARQUEUR)[0];
// Lignes de la section HOUBLONS du texte lisible : après le titre et son soulignement, jusqu'à la première ligne vide.
function sectionHoublons(texte) {
  const lignes = lisible(texte).split('\n');
  const i = lignes.findIndex((l) => l.trim() === 'HOUBLONS');
  if (i < 0) return [];
  const res = [];
  for (let k = i + 2; k < lignes.length && lignes[k].trim() !== ''; k++) res.push(lignes[k].trim());
  return res;
}
const exportCourant = () => page.evaluate(() => document.querySelector('textarea[aria-label="Texte complet de la recette"]')?.value ?? '');

await page.goto(`${base}/?dev-local&etape=houblons`, { waitUntil: 'networkidle0' });
await page.waitForSelector('[aria-label="Coller une recette"]', { timeout: 120000 });
await dormir(1200);

// (1) EXPORT
await cliquerBouton('Récapitulatif');
await page.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => /Copier la recette en texte/.test(b.textContent || '')), { timeout: 60000 }).catch(() => {});
await dormir(800);
await cliquerBouton('Texte complet et fichier');
await page.waitForSelector('textarea[aria-label="Texte complet de la recette"]', { timeout: 30000 }).catch(() => {});
await dormir(600);
const export1 = await exportCourant();
fs.writeFileSync(path.join(DOSSIER, 'export-chrome-1.txt'), export1, 'utf8');
await page.screenshot({ path: path.join(IMG, '02-export-texte.png') });
console.log('--- export-1 ---\n' + export1.split('\n').map((l) => l.slice(0, 160)).join('\n') + '\n--- fin ---');

const lu1 = lisible(export1);
ok(export1.length > 0, 'export non vide (' + export1.length + ' caractères)');
ok(export1.startsWith('L’AFFINÉE — RECETTE v3'), 'en-tête de recette v3');
const hops1 = sectionHoublons(export1);
ok(hops1.some((l) => /46 g\s+Nugget.*60 min.*13 % AA/.test(l)), 'export : « 46 g Nugget (60 min · 13 % AA) » (' + hops1.join(' | ') + ')');
ok(/\beau\b/i.test(lu1), 'export : mention de l’eau présente');
ok(!/[{}]/.test(lu1) && !/https?:/i.test(lu1), 'texte lisible : ni accolade, ni URL');
ok(export1.includes(MARQUEUR) && export1.split(MARQUEUR).length === 2, 'un seul bloc de réimport');
ok(lu1.split('\n').length < 70, 'texte lisible : ' + lu1.split('\n').length + ' lignes (< 70)');

// (2) IMPORT depuis le texte exporté
await cliquerBouton('Coller une recette');
await page.waitForSelector('textarea[aria-label="Texte de la recette"]', { timeout: 60000 });
await saisir('textarea[aria-label="Texte de la recette"]', export1);
await cliquerBouton('Lire la recette');
await page.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => (b.textContent || '').trim() === 'Reprendre'), { timeout: 90000 }).catch(() => {});
await dormir(800);
await page.screenshot({ path: path.join(IMG, '03-import-lu.png') });
const sousTitre = await page.evaluate(() => [...document.querySelectorAll('*')].map((e) => e.textContent?.trim()).find((t) => t && /^Lue (localement|par l’IA)$/.test(t)) ?? '');
ok(/localement/.test(sousTitre), 'import lu localement (sans IA) : « ' + sousTitre + ' »');
const avertissements = await page.evaluate(() => [...document.querySelectorAll('[role="alert"], [data-import-admission]')].map((e) => e.textContent?.trim()));
console.log('avertissements/admissions à l’import :', JSON.stringify(avertissements));
ok(avertissements.length === 0, 'aucun avertissement à l’import');
await cliquerBouton('Reprendre');
await dormir(1500);

// (3) RÉ-EXPORT de la recette importée
await cliquerBouton('Récapitulatif');
await page.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => /Texte complet et fichier/.test(b.textContent || '') || /Copier la recette en texte/.test(b.textContent || '')), { timeout: 60000 }).catch(() => {});
await dormir(800);
await cliquerBouton('Texte complet et fichier');
await page.waitForSelector('textarea[aria-label="Texte complet de la recette"]', { timeout: 30000 }).catch(() => {});
await dormir(600);
const export2 = await exportCourant();
fs.writeFileSync(path.join(DOSSIER, 'export-chrome-2-apres-import.txt'), export2, 'utf8');
await page.screenshot({ path: path.join(IMG, '05-reexport-apres-import.png') });
const hops2 = sectionHoublons(export2);
ok(hops2.some((l) => /Nugget/i.test(l)), 'après import : Nugget conservé (' + hops2.join(' | ') + ')');
ok(JSON.stringify(hops2) === JSON.stringify(hops1), 'après import : houblons identiques à l’export initial');
// Le texte complet ne change que par la date du jour et ce qui se recalcule ; on compare ligne à ligne et on liste les écarts.
const l1 = export1.split('\n'), l2 = export2.split('\n');
const ecarts = l1.map((l, k) => (l === l2[k] ? null : `ligne ${k + 1} : « ${l.slice(0, 90)} » ≠ « ${(l2[k] ?? '').slice(0, 90)} »`)).filter(Boolean);
console.log('écarts export 1 / export 2 :', ecarts.length ? ecarts.join('\n') : 'aucun');
ok(l1.length === l2.length && ecarts.length === 0, 'ré-export identique à l’export initial, ligne à ligne');

console.log('journal erreurs page :', JSON.stringify(journal.erreurs));
console.log('journal console error :', JSON.stringify(journal.console.filter((c) => c.type === 'error').map((c) => c.texte).slice(0, 10)));
console.log('requêtes bloquées (hors localhost) :', journal.bloquees.length, JSON.stringify(journal.bloquees.slice(0, 5)));
ok(journal.erreurs.length === 0, 'aucune erreur de page');
await browser.close();
console.log(echecs.length ? `ECHEC ${echecs.length} : ${echecs.join(' ; ')}` : 'OK tous les contrôles du parcours');
process.exit(echecs.length ? 1 : 0);

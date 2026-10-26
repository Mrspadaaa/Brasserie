// Parcours réel import/export de recette (voie v1-import-export, brasseur 26.10 « l'import, export de recette fonctionne toujours »).
// Fixture seulement : `?dev-local&etape=houblons` ouvre la recette d'aperçu (Stout export, Nugget 46 g à 60′). Aucune donnée réelle,
// aucune écriture hors brouillon local, Gemini coupé (ouvrir() bloque tout hors localhost).
// Étapes : (1) export : Récapitulatif → fiche → texte complet ; contrôle des houblons, grammes, moments, eau.
// (2) import : « Coller une recette » → texte exporté → « Lire la recette » (lecture locale) → « Reprendre » ;
// (3) ré-export : le texte doit reprendre les mêmes houblons (moments et grammes) que l'export initial.
// Usage (racine) :
//   node scripts/with_server.mjs --server "npm run dev -- --port 5263 --strictPort" --port 5263 --env VITE_HOP_V4=on -- node work/missions/2026-10-25-integration-houblons/voies/v1-import-export/parcours-import-export.mjs
import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const RACINE = path.resolve(process.cwd());
const DOSSIER = path.resolve(RACINE, 'work/missions/2026-10-25-integration-houblons/voies/v1-import-export');
const IMG = path.join(DOSSIER, 'img');
fs.mkdirSync(IMG, { recursive: true });
const { ouvrir } = await import(pathToFileURL(path.join(RACINE, '.claude/skills/webapp-testing/examples/_lanceur.mjs')).href);
const base = `http://localhost:${process.env.WITH_SERVER_PORTS}`;
const dormir = (ms) => new Promise((r) => setTimeout(r, ms));

const echecs = [];
const ok = (c, m) => { if (!c) echecs.push(m); console.log(c ? 'OK   ' : 'ECHEC', m); };

const { browser, page, journal } = await ouvrir({ largeur: 390, hauteur: 844 });

// Clique le premier bouton dont le nom accessible (aria-label, sinon texte) commence par ce texte.
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

// Un nouveau texte dans un champ React : setter natif + événement input, comme une saisie.
async function saisir(selecteur, valeur) {
  await page.evaluate((s, v) => {
    const el = document.querySelector(s);
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
    setter.call(el, v);
    el.dispatchEvent(new Event('input', { bubbles: true }));
  }, selecteur, valeur);
  await dormir(500);
}

// Lit les lignes de houblons de l'export : la section entre « Houblons » et la ligne suivante vide ou en majuscules.
function sectionHoublons(texte) {
  const lignes = texte.split('\n');
  const i = lignes.findIndex((l) => /houblon/i.test(l));
  if (i < 0) return [];
  const res = [];
  // Le bloc des houblons est indenté ; la première ligne sans indentation ferme la section.
  for (let k = i + 1; k < lignes.length && /^\s+\S/.test(lignes[k]); k++) res.push(lignes[k].trim());
  return res;
}

await page.goto(`${base}/?dev-local&etape=houblons`, { waitUntil: 'networkidle0' });
await page.waitForSelector('[aria-label="Coller une recette"]', { timeout: 120000 });
await dormir(1200);
await page.screenshot({ path: path.join(IMG, '01-wizard-houblons.png') });

// (1) EXPORT
await cliquerBouton('Récapitulatif');
await page.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => /Copier la recette en texte/.test(b.textContent || '')), { timeout: 60000 }).catch(() => {});
await dormir(800);
await cliquerBouton('Texte complet et fichier');
await page.waitForSelector('textarea[aria-label="Texte complet de la recette"]', { timeout: 30000 }).catch(() => {});
await dormir(600);
const export1 = await page.evaluate(() => document.querySelector('textarea[aria-label="Texte complet de la recette"]')?.value ?? '');
fs.writeFileSync(path.join(DOSSIER, 'export-1.txt'), export1, 'utf8');
await page.screenshot({ path: path.join(IMG, '02-export-texte.png') });
console.log('--- export-1 (début) ---\n' + export1.split('\n').slice(0, 40).join('\n') + '\n--- fin extrait ---');

ok(export1.length > 0, 'export non vide (' + export1.length + ' caractères)');
ok(/RECETTE v[12]/.test(export1), 'en-tête de recette présent');
const hops1 = sectionHoublons(export1);
ok(hops1.length >= 1 && hops1.some((l) => /Nugget/i.test(l)), 'export : Nugget présent dans les houblons (' + hops1.join(' | ') + ')');
ok(export1.includes('Masse (g) : 46'), 'export : masse 46 g présente (« Masse (g) : 46 »)');
ok(hops1.includes('Moment : "boil"') && hops1.includes('Durée (min) : 60'), 'export : moment « boil » et durée 60 min présents');
ok(/\beau\b/i.test(export1), 'export : mention de l’eau présente');

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
await cliquerBouton('Reprendre');
await dormir(1500);
await page.screenshot({ path: path.join(IMG, '04-apres-reprise.png') });

// (3) RÉ-EXPORT de la recette importée
await cliquerBouton('Récapitulatif');
await page.waitForFunction(() => [...document.querySelectorAll('button')].some((b) => /Texte complet et fichier/.test(b.textContent || '') || /Copier la recette en texte/.test(b.textContent || '')), { timeout: 60000 }).catch(() => {});
await dormir(800);
await cliquerBouton('Texte complet et fichier');
await page.waitForSelector('textarea[aria-label="Texte complet de la recette"]', { timeout: 30000 }).catch(() => {});
await dormir(600);
const export2 = await page.evaluate(() => document.querySelector('textarea[aria-label="Texte complet de la recette"]')?.value ?? '');
fs.writeFileSync(path.join(DOSSIER, 'export-2-apres-import.txt'), export2, 'utf8');
await page.screenshot({ path: path.join(IMG, '05-reexport-apres-import.png') });
const hops2 = sectionHoublons(export2);
ok(hops2.some((l) => /Nugget/i.test(l)), 'après import : Nugget conservé (' + hops2.join(' | ') + ')');
ok(JSON.stringify(hops2) === JSON.stringify(hops1), 'après import : houblons identiques à l’export initial');

console.log('journal erreurs page :', JSON.stringify(journal.erreurs));
console.log('journal console error :', JSON.stringify(journal.console.filter((c) => c.type === 'error').map((c) => c.texte).slice(0, 10)));
console.log('requêtes bloquées (hors localhost) :', journal.bloquees.length, JSON.stringify(journal.bloquees.slice(0, 5)));
ok(journal.erreurs.length === 0, 'aucune erreur de page');
await browser.close();
console.log(echecs.length ? `ECHEC ${echecs.length} : ${echecs.join(' ; ')}` : 'OK tous les contrôles du parcours');
process.exit(echecs.length ? 1 : 0);

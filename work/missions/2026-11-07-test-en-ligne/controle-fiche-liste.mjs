// Test en ligne n° 1, 2, 3 (07.11) : la liste des recettes et la fiche disent le même IBU, et les densités s'écrivent à la virgule (« 1,0xx »).
// Parcours réel : recette de la maquette (?dev-local&etape=houblons) → étapes jusqu'au récapitulatif → « Enregistrer la recette » → Recettes → fiche.
// Usage : node controle-fiche-liste.mjs <build> <dossier captures> [clair|cave] [390|1280]   → FICHE OK | FICHE ECHEC <raisons>
import fs from 'node:fs';
import { ouvrir, dormir } from '../2026-10-31-ecran-fermentescibles/banc-critique/banc.mjs';
const [construit, sortie, theme = 'clair', l = '390'] = process.argv.slice(2);
fs.mkdirSync(sortie, { recursive: true });
const largeur = Number(l);
const raisons = [];
const { nav, p } = await ouvrir(construit, { theme, largeur, url: '/?dev-local&etape=houblons' });
const texte = (e) => e.textContent.replace(/\s+/g, ' ').trim();
const cliquer = (re) => p.evaluate((src) => {
  const r = new RegExp(src, 'i');
  const vis = (e) => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0; };
  const b = [...document.querySelectorAll('button, a, [role=button]')].filter(vis).find((x) => r.test(x.textContent.replace(/\s+/g, ' ').trim()) || r.test(x.getAttribute('aria-label') ?? ''));
  if (b) b.click(); return b ? b.textContent.replace(/\s+/g, ' ').trim().slice(0, 60) : null;
}, re.source);
await dormir(2500);
// Aller au récapitulatif par le fil des étapes (dernier bouton du fil), sinon « Suivant » répété.
for (let i = 0; i < 8; i++) {
  if (await p.evaluate(() => [...document.querySelectorAll('button')].some((b) => /Enregistrer la recette/.test(b.textContent)))) break;
  const fait = await cliquer(/^(Suivant|Continuer|Étape suivante)/);
  if (!fait) await p.evaluate(() => { const f = [...document.querySelectorAll('nav[aria-label="Étapes"] button')]; f.at(-1)?.click(); });
  await dormir(1200);
}
await p.screenshot({ path: `${sortie}/recap-${theme}-${largeur}.png` });
const enr = await cliquer(/^Enregistrer la recette/);
if (!enr) raisons.push('« Enregistrer la recette » introuvable');
await dormir(2500);
await p.screenshot({ path: `${sortie}/apres-enregistrer-${theme}-${largeur}.png`, fullPage: true });
const ficheTexte = await p.evaluate(() => document.body.innerText);
// Vers la liste des recettes.
await cliquer(/^Brassins$/); await dormir(1500);
await p.screenshot({ path: `${sortie}/brassins-${theme}-${largeur}.png`, fullPage: true });
let liste = await cliquer(/^Recettes/);
await dormir(2000);
await p.screenshot({ path: `${sortie}/liste-${theme}-${largeur}.png`, fullPage: true });
const listeTexte = await p.evaluate(() => document.body.innerText);
// Ouvrir la fiche depuis la liste (première recette).
await p.evaluate(() => { const c = document.querySelector('[data-recipe-id], [data-recette], article button, li button'); c?.click(); });
await dormir(2000);
await p.screenshot({ path: `${sortie}/fiche-${theme}-${largeur}.png`, fullPage: true });
const fiche2 = await p.evaluate(() => document.body.innerText);
const ibu = (t) => [...t.matchAll(/(\d+(?:[.,]\d+)?)\s*IBU|IBU\s*(\d+(?:[.,]\d+)?)/g)].map((m) => m[1] ?? m[2]);
const points = (t) => [...t.matchAll(/\b1\.0\d\d\b|\b\d+\.\d\s*%/g)].map((m) => m[0]);
const info = { enregistre: enr, liste, ibuListe: ibu(listeTexte), ibuFiche: ibu(fiche2), pointsFiche: points(fiche2), pointsListe: points(listeTexte), pointsApres: points(ficheTexte) };
console.log(JSON.stringify(info));
if (!info.ibuListe.length) raisons.push('aucun IBU lu dans la liste');
if (!info.ibuFiche.length) raisons.push('aucun IBU lu dans la fiche');
if (info.ibuListe.length && info.ibuFiche.length && info.ibuListe[0] !== info.ibuFiche[0]) raisons.push(`IBU liste ${info.ibuListe[0]} ≠ fiche ${info.ibuFiche[0]}`);
if (info.pointsFiche.length || info.pointsListe.length) raisons.push(`format à point : ${[...info.pointsFiche, ...info.pointsListe].join(', ')}`);
const colles = [...fiche2.matchAll(/\S*·\d\S*/g)].map((m) => m[0]);
if (colles.length) raisons.push(`séparateur collé : ${colles.join(', ')}`);
await nav.close();
console.log(raisons.length ? `FICHE ECHEC ${raisons.join(' ; ')}` : 'FICHE OK');

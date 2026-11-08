// Test en ligne n° 15, partie NOLO : la fiche d'une recette NOLO lit ses volumes au décilitre (« 24 L »), jamais « 24,012 L ».
// Fixture simulée : le vrai brouillon de l'assistant (amorce.mjs) reçoit 24,012 L et la configuration NOLO de fixture-nolo.ts ; puis le vrai parcours
// jusqu'à la fiche enregistrée (Enregistrer → Brassins → Recettes → fiche).
// Usage : node controle-15-nolo.mjs <build> <nolo.json> <dossier captures> [clair|cave] [390|1280]   → NOLO OK | NOLO ECHEC <raisons>
import fs from 'node:fs';
import { dormir } from '../../2026-10-31-ecran-fermentescibles/banc-critique/banc.mjs';
import { ouvrirAmorce, jusquALaFiche } from './amorce.mjs';
const [construit, fichier, sortie, theme = 'clair', l = '390'] = process.argv.slice(2);
fs.mkdirSync(sortie, { recursive: true });
const raisons = [];
const nolo = fs.readFileSync(fichier, 'utf8');
const { nav, p } = await ouvrirAmorce(construit, {
  theme, largeur: Number(l),
  transformer: `recipe.volumeL = 24.012; recipe.nolo = ${nolo};`,
});
await jusquALaFiche(p, sortie, `c15n-${theme}-${l}`);
const apercu = await p.evaluate(() => { const s = document.querySelector('section[aria-label="Aperçu NOLO"]'); s?.scrollIntoView({ block: 'center' }); return s?.innerText ?? null; });
await dormir(600);
await p.screenshot({ path: `${sortie}/c15n-apercu-${theme}-${l}.png` });
// Toute la fiche (en-tête « Style · 24.012 L » compris, vu le 08.11) : un volume à 2 décimales ou plus, à virgule ou à point.
const fiche = await p.evaluate(() => document.body.innerText);
const abus = [...new Set([...fiche.matchAll(/\d+[.,]\d{2,}\s*L\b/g)].map((x) => x[0]))];
console.log(JSON.stringify({ apercu: apercu?.replace(/\s+/g, ' ').slice(0, 400) ?? null, abus }));
if (apercu === null) raisons.push('« Aperçu NOLO » absent de la fiche');
if (abus.length) raisons.push(`volumes trop précis : ${abus.join(', ')}`);
if (apercu && !/\b24 L\b/.test(apercu)) raisons.push('« 24 L » absent de l\'aperçu');
await nav.close();
console.log(raisons.length ? `NOLO ECHEC ${raisons.join(' ; ')}` : 'NOLO OK');

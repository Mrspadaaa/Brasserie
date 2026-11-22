// Test en ligne n° 15 : pas de précision absurde (« 2,7021 L/kg », « 24,012 L », « 91,73 – 93,73 % ») à l'affichage de la fiche et des étapes.
// Cas : recette avec grains (fixture identité) menée par le vrai parcours jusqu'à la fiche enregistrée ; NOLO exclu ici (voir controle-15-nolo.mjs si présent).
// Attendu : aucun nombre à 3 décimales ou plus hors densités (1,0xx) sur chaque étape et sur la fiche, volumes et rapports compris.
// Usage : node controle-15.mjs <build> <dossier captures> [clair|cave] [390|1280]   → PRECISION OK | PRECISION ECHEC <raisons>
import fs from 'node:fs';
import { ouvrirAmorce, allerEtape, jusquALaFiche } from './amorce.mjs';
const [construit, sortie, theme = 'clair', l = '390'] = process.argv.slice(2);
fs.mkdirSync(sortie, { recursive: true });
const raisons = [];
const { nav, p } = await ouvrirAmorce(construit, {
  theme, largeur: Number(l),
  // Un rapport eau/grain et des volumes qui ne tombent pas juste : 20 L, 6,1 kg de grain.
  transformer: `recipe.volumeL = 23.7; recipe.mash = { ratioLPerKg: 2.70213, steps: [{ name: 'Saccharification', tempC: 66.5, minutes: 60 }] };`,
});
const abus = (t) => [...t.matchAll(/(?<![\d,.])(\d{1,3}(?:[  ]\d{3})*|\d+),(\d{3,})(?!\d)(?!\s*(?:CHF|€))/g)]
  .map((m) => m[0]).filter((x) => !/^1,[01]\d{2}$/.test(x));
const vues = {};
for (const etape of ['Identité', 'Fermentescibles', 'Houblons', 'Levure', 'Paliers', 'Eau', 'Récapitulatif']) {
  await allerEtape(p, etape);
  vues[etape] = abus(await p.evaluate(() => document.body.innerText + ' ' + [...document.querySelectorAll('input, textarea')].map((i) => i.value).join(' ')));
  if (etape === 'Eau' || etape === 'Récapitulatif') await p.screenshot({ path: `${sortie}/c15-${etape}-${theme}-${l}.png` });
}
await jusquALaFiche(p, sortie, `c15-${theme}-${l}`);
vues.Fiche = abus(await p.evaluate(() => document.body.innerText + ' ' + [...document.querySelectorAll('input, textarea')].map((i) => i.value).join(' ')));
console.log(JSON.stringify(vues));
for (const [v, liste] of Object.entries(vues)) if (liste.length) raisons.push(`${v} : ${[...new Set(liste)].join(', ')}`);
await nav.close();
console.log(raisons.length ? `PRECISION ECHEC ${raisons.join(' ; ')}` : 'PRECISION OK');

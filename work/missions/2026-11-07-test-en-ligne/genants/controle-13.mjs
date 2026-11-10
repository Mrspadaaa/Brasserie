// Test en ligne n° 13, partie levure : l'étape Houblons (Ma bière) nomme la levure de la recette (« LalBrew Munich Classic »), jamais son identifiant
// (« lallemand-munich-classic »). Fixture simulée : le brouillon de l'assistant reçoit cette levure du catalogue (amorce.mjs, vrai brouillon de l'app).
// Usage : node controle-13.mjs <build> <dossier captures> [clair|cave] [390|1280]   → LEVURE OK | LEVURE ECHEC <raisons>
import fs from 'node:fs';
import { ouvrirAmorce, allerEtape } from './amorce.mjs';
const [construit, sortie, theme = 'clair', l = '390'] = process.argv.slice(2);
fs.mkdirSync(sortie, { recursive: true });
const raisons = [];
const { nav, p } = await ouvrirAmorce(construit, {
  theme, largeur: Number(l),
  transformer: `recipe.yeast = { ...(recipe.yeast ?? {}), name: 'LalBrew Munich Classic', lab: 'Lallemand', hopIndexId: 'lallemand-munich-classic' };`,
});
await allerEtape(p, 'Houblons');
const lu = await p.evaluate(() => document.body.innerText + ' ' + [...document.querySelectorAll('[aria-label]')].map((e) => e.getAttribute('aria-label')).join(' | '));
await p.evaluate(() => document.querySelector('.pq-mb-levure-nom')?.scrollIntoView({ block: 'center' }));
await p.screenshot({ path: `${sortie}/c13-houblons-${theme}-${l}.png` });
const lignes = [...new Set((lu.match(/[^\n|]*(?:levure|Munich)[^\n|]*/gi) ?? []).map((x) => x.trim()))].slice(0, 8);
console.log(JSON.stringify({ lignes }));
if (/lallemand-munich-classic/.test(lu)) raisons.push('identifiant « lallemand-munich-classic » affiché');
if (!/Munich Classic/.test(lu)) raisons.push('nom « Munich Classic » absent de l\'étape');
await nav.close();
console.log(raisons.length ? `LEVURE ECHEC ${raisons.join(' ; ')}` : 'LEVURE OK');

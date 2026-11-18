// Lot 6, n° 28 (option B) : les suggestions de Ma bière gardent leur classement ; celle qui n'a aucune donnée pour le style de la recette dit « non documenté pour ce style ».
// Recette amorcée (genants/amorce.mjs) en « Imperial Stout ». Exige un build `VITE_HOP_V4=on`.
// Attendu : « Fantasia Blend » (sans donnée pour ce style) porte la mention.
// Usage : node controle-non-documente.mjs <build> [<capture.png>] [clair|cave]   → NONDOC OK | NONDOC ECHEC <raisons>
import { ouvrirAmorce, allerEtape } from './genants/amorce.mjs';
import { dormir } from '../2026-10-31-ecran-fermentescibles/banc-critique/banc.mjs';
const [construit, capture, theme = 'clair'] = process.argv.slice(2);
const raisons = [];
// « Imperial stout » : le cas du test en ligne (suggestions Motueka, Galaxy, Fantasia Blend « 12 g · 10′ »).
const { nav, p } = await ouvrirAmorce(construit, { theme, transformer: "recipe.style = 'Imperial Stout'; delete recipe.styleRef; recipe.hops = [{ name: 'Saaz', alpha: 3.5, weightG: 20, stage: 'boil', timeMin: 15 }];" });
await allerEtape(p, 'Houblons'); await dormir(4500);
const liste = await p.evaluate(() => [...document.querySelectorAll('[data-role="ajout-rapide"]')].map((li) => ({ nom: li.querySelector('[data-houblon]')?.textContent.trim(), mention: !!li.querySelector('[data-role="non-documente"]') })));
console.log(JSON.stringify(liste));
if (!liste.length) raisons.push('aucune suggestion à l\'écran (banc cassé)');
else if (!liste.some((l) => /Fantasia/.test(l.nom) && l.mention)) raisons.push(`aucune suggestion ne dit « non documenté pour ce style » (${liste.map((l) => l.nom).join(', ')})`);
if (capture) { await p.evaluate(() => document.querySelector('[data-role="ajouts-proposes"]')?.scrollIntoView({ block: 'center' })); await dormir(300); await p.screenshot({ path: capture }); }
await nav.close();
console.log(raisons.length ? `NONDOC ECHEC ${raisons.join(' ; ')}` : 'NONDOC OK');

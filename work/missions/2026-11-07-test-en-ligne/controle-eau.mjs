// Test en ligne n° 5, 15, 29 (lot 5) sur la recette « Stout export » avec grains (`?dev-local&etape=houblons&recette=identite`).
// n° 5 : Identité dit « ~31,1 L avant ébullition » (à chaud), Eau et sels « à froid 29,5 L » : deux volumes sans différence dite. Attendu : Identité dit « à chaud ».
// n° 15 : « Épaisseur de maische 2,7021 L/kg » : attendu ≤ 2 décimales à l'écran.
// n° 29 : « Rinçage à chaud : 13,9 L. 13,9 L dans le récipient principal. » : attendu une seule fois le volume quand tout va dans le récipient principal.
// Usage : node controle-eau.mjs <build> [<capture.png>] [clair|cave]   → EAU OK | EAU ECHEC <raisons>
import { ouvrir, dormir, capturer } from '../2026-10-31-ecran-fermentescibles/banc-critique/banc.mjs';
const [construit, capture, theme = 'clair'] = process.argv.slice(2);
const raisons = [];
const { nav, p } = await ouvrir(construit, { theme, url: '/?dev-local&etape=houblons&recette=identite' });
await dormir(3000);
const aller = async (nom) => { await p.evaluate((n) => { [...document.querySelectorAll('nav[aria-label="Étapes"] button')].find((b) => b.getAttribute('aria-label') === n)?.click(); }, nom); await dormir(2000); };
const texte = () => p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
await aller('Identité');
const ident = await texte();
const m5 = ident.match(/~[\d,]+ L[^.·]{0,30}avant ébullition/);
if (!m5) raisons.push('n° 5 : volume avant ébullition introuvable sur Identité');
else if (!/à chaud/.test(m5[0])) raisons.push(`n° 5 : « ${m5[0]} » sans dire que c'est à chaud (Eau et sels dit « à froid »)`);
await aller('Eau et sels');
const eau = await texte();
const epais = await p.evaluate(() => document.querySelector('[aria-label^="Rapport eau grain exact"]')?.value ?? null);
if (epais == null) raisons.push('n° 15 : champ d\'épaisseur de maische introuvable');
else if (/[.,]\d{3,}/.test(epais)) raisons.push(`n° 15 : épaisseur de maische « ${epais} L/kg »`);
const rin = eau.match(/Rinçage à chaud : ([\d,]+) L\.?\s*([\d,]+) L dans le récipient principal/);
if (rin && rin[1] === rin[2]) raisons.push(`n° 29 : phrase doublée « ${rin[0]} »`);
else if (!/Rinçage à chaud/.test(eau)) raisons.push('n° 29 : pas de phrase de rinçage à mesurer (recette sans rinçage ?)');
if (capture) await capturer(p, capture);
console.log(JSON.stringify({ m5: m5?.[0], epais, rin: rin?.[0] ?? eau.match(/Rinçage à chaud[^.]*\./)?.[0] }));
await nav.close();
console.log(raisons.length ? `EAU ECHEC ${raisons.join(' ; ')}` : 'EAU OK');

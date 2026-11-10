// Critique B1 n° 4 : en famille Grain, « dext » ne propose que Carapils ; Dextrose (rayon Sucre) n'est ni proposé ni atteignable.
// Attendu : l'article d'un autre rayon est proposé (avec sa famille dite), et « dextrose » ↵ en Grain ajoute la ligne en famille Sucre.
// Usage : node controle-4-dext.mjs <build> [<capture.png>]   → DEXT OK | DEXT ECHEC <raisons>
import { ouvrir, taper, lignes, verdict, capturer, dormir } from './banc.mjs';
const [construit, capture] = process.argv.slice(2);
const { nav, p } = await ouvrir(construit, { etat: 'maquette' });
const raisons = [];
const options = () => p.$$eval('[data-role="puces"] [data-role="resultat"], [data-role="puces"] [data-role="creer"]', (els) => els.map((e) => e.innerText.replace(/\s+/g, ' ').trim()));
const famille = () => p.$eval('[data-role="fam"]', (e) => e.textContent.trim());

await taper(p, 'dext', false);
const pourDext = await options();
if (capture) await capturer(p, capture);
if (!pourDext.some((t) => /^Dextrose/.test(t))) raisons.push(`« dext » en Grain ne propose pas Dextrose (options : ${pourDext.join(' | ') || 'aucune'})`);
else if (!pourDext.find((t) => /^Dextrose/.test(t)).toLowerCase().includes('sucre')) raisons.push('Dextrose proposé sans dire que c\'est un sucre');

await p.keyboard.down('Control'); await p.keyboard.press('KeyA'); await p.keyboard.up('Control'); await p.keyboard.press('Backspace');
await p.keyboard.type('dextrose', { delay: 10 });
await dormir(300);
const pourDextrose = await options();
await p.keyboard.press('Enter'); await dormir(600);
const apres = await lignes(p);
const ligne = apres.find((l) => /^Dextrose|Dextrose/.test(l));
if (!ligne) raisons.push(`« dextrose » ↵ n'ajoute aucune ligne (options : ${pourDextrose.join(' | ') || 'aucune'}; lignes : ${apres.length})`);
else if (!/sucre/i.test(ligne)) raisons.push(`la ligne Dextrose n'est pas en famille Sucre (« ${ligne.slice(0, 60)} »)`);
const fam = await famille();
await verdict(nav, 'DEXT', raisons, { pourDext, pourDextrose, ligne, fam });

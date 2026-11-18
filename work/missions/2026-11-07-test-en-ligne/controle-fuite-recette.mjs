// Test en ligne n° 4 : l'assistant mélange l'état de la recette précédente dans la suivante (« à la place de Nuget », houblons « nouveau »).
// Parcours : recette A (« Stout export », Nugget, US-05) ouverte à l'étape Houblons → fermée → recette neuve B (Actions rapides → Créer une recette) → étape Houblons.
// Attendu : rien de A dans B : ni « à la place de », ni « nouveau », ni « Nugget », ni « US-05 ».
// Usage : node controle-fuite-recette.mjs <build> [<capture.png>] [clair|cave]   → FUITE OK | FUITE ECHEC <raisons>
import { ouvrir, dormir, capturer } from '../2026-10-31-ecran-fermentescibles/banc-critique/banc.mjs';
const [construit, capture, theme = 'clair'] = process.argv.slice(2);
const raisons = [];
const { nav, p } = await ouvrir(construit, { theme, url: '/?dev-local&etape=houblons&recette=identite' });
await dormir(3500);
const texteHoublons = () => p.evaluate(() => document.body.innerText.replace(/\s+/g, ' '));
const A = await texteHoublons();
if (!/Nugget/i.test(A)) raisons.push('la recette A n\'affiche pas son houblon (banc cassé)');
// fermer A (la route ?etape= ne rouvre rien : « une seule fois »)
await p.evaluate(() => document.querySelector('button[aria-label="Fermer"]')?.click());
await dormir(2000);
const fab = await p.$('[aria-label^="Actions rapides"]');
await fab.tap(); await dormir(700);
await p.evaluate(() => [...document.querySelectorAll('[role=menuitem]')].find((b) => /^Créer une recette/.test(b.textContent.replace(/\s+/g, ' ').trim()))?.click());
await dormir(2000);
await p.evaluate(() => [...document.querySelectorAll('nav[aria-label="Étapes"] button')].find((b) => b.getAttribute('aria-label') === 'Houblons')?.click());
await dormir(2500);
const B = await texteHoublons();
if (capture) await capturer(p, capture);
for (const re of [/à la place de/i, /\bnouveau\b/i, /Nugget/i, /US-05/i]) if (re.test(B)) raisons.push(`dans la recette B : « ${B.match(re)[0]} »`);
if (!/Houblons\s*3\/7/.test(B)) raisons.push('B n\'est pas à l\'étape Houblons (banc cassé)');
await nav.close();
console.log(raisons.length ? `FUITE ECHEC ${raisons.join(' ; ')}` : 'FUITE OK');

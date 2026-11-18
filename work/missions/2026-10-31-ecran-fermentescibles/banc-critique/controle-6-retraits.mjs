// Critique B1 n° 6 (+ banc d'actionneurs N1) : deux × de suite (Pilsner puis Weizenmalz) ; le second retrait remplaçait le premier, perdu sans « Annuler ».
// Attendu : après deux retraits, UN « Annuler » rend tous les retraits en attente, dans l'ordre d'origine.
// (Première version, B1 n° 6 : « Annuler » rendait le dernier puis le précédent ; N1 a demandé qu'un seul « Annuler » rende tout.)
// Usage : node controle-6-retraits.mjs <build> [<capture.png>]   → RETRAITS OK | RETRAITS ECHEC <raisons>
import { ouvrir, toucher, noms, verdict, capturer } from './banc.mjs';
const [construit, capture] = process.argv.slice(2);
const { nav, p } = await ouvrir(construit, { etat: 'maquette' });
const raisons = [];
const origine = await noms(p);
const annuler = () => p.$$eval('[data-role="annuler"]', (els) => els.length);
await toucher(p, '[data-role="retirer"][data-ret="0"]');
await toucher(p, '[data-role="retirer"][data-ret="0"]');
const restant = await noms(p);
if (capture) await capturer(p, capture);
if (restant.length !== origine.length - 2) raisons.push(`deux retraits : ${restant.length} lignes au lieu de ${origine.length - 2}`);
if (await annuler() !== 1) raisons.push(`« Annuler » attendu une fois après deux retraits (vu ${await annuler()})`);
await toucher(p, '[data-role="annuler"]');
const tout = await noms(p);
if (JSON.stringify(tout) !== JSON.stringify(origine)) raisons.push(`un « Annuler » après deux retraits : ${tout.join(' | ')} au lieu de ${origine.join(' | ')}`);
await verdict(nav, 'RETRAITS', raisons, { origine, restant, tout });

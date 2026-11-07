// Critique B1 n° 6 : deux × de suite (Pilsner puis Weizenmalz) ; le second retrait remplaçait le premier, perdu sans « Annuler ».
// Attendu : après deux retraits, « Annuler » rend le dernier, puis encore « Annuler » rend le premier ; l'ordre d'origine est retrouvé.
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
const unRendu = await noms(p);
if (unRendu.length !== origine.length - 1) raisons.push(`1er Annuler : ${unRendu.length} lignes au lieu de ${origine.length - 1}`);
if (await annuler() < 1) raisons.push('après le 1er Annuler, plus d\'« Annuler » : la première ligne retirée est perdue');
else {
  await toucher(p, '[data-role="annuler"]');
  const tout = await noms(p);
  if (JSON.stringify(tout) !== JSON.stringify(origine)) raisons.push(`2e Annuler : ${tout.join(' | ')} au lieu de ${origine.join(' | ')}`);
}
await verdict(nav, 'RETRAITS', raisons, { origine, restant, unRendu });

// B2 n° 11 : « supprimer » retirait la ligne au premier toucher, sans retour (aucun « Annuler », 18 → 17 lignes ; une ligne lue ne revenait que par « Relire »).
// Attendu, état 3, 390 clair et cave, puis 1280 : deux « supprimer » de suite (Haferflocken, Motueka) : 2 lignes de moins et un bouton « ↶ Annuler » (data-dp-annuler) ; un toucher rend la dernière
// retirée (Motueka), un second rend la première (Haferflocken) ; les lignes et leur ordre d'origine sont retrouvés ; le bouton disparaît quand il n'y a plus rien à rendre.
// Usage : node controle-b2-11-annuler.mjs [<build>] [<dossier captures>]   → ANNULER OK | ANNULER ECHEC <raisons>
import { demarrer, ouvrirLigne, dormir } from './aide-b2.mjs';
const { ouvrir, raisons, cap, verdict } = await demarrer();
const infos = [];
const ids = p => p.evaluate(() => [...document.querySelectorAll('[data-dp-ligne]')].map(a => a.dataset.dpLigne));
const annuler = p => p.evaluate(() => { const b = document.querySelector('[data-dp-annuler]'); return b ? { texte: b.innerText.replace(/\s+/g, ' ').trim(), titre: b.title } : null; });
const retirer = async (p, nom) => { await ouvrirLigne(p, nom); const ok = await p.evaluate(n => { const a = [...document.querySelectorAll('[data-dp-ligne]')].find(a => a.querySelector('summary')?.innerText.includes(n)); const b = [...(a?.querySelectorAll('button') ?? [])].find(b => /^Retirer la ligne/.test(b.getAttribute('aria-label') ?? '')); b?.click(); return !!b; }, nom); await dormir(500); return ok; };
for (const [mode, theme] of [['t390', 'clair'], ['t390', 'cave'], ['pc1280', 'clair']]) {
  const p = await ouvrir('3', mode, theme);
  const ou = `${mode} ${theme}`;
  const origine = await ids(p);
  if (!(await retirer(p, 'Haferflocken'))) raisons.push(`${ou} : « supprimer » introuvable sur Haferflocken`);
  if (!(await retirer(p, 'Motueka'))) raisons.push(`${ou} : « supprimer » introuvable sur Motueka`);
  const restant = await ids(p), bouton = await annuler(p);
  infos.push({ ou, origine: origine.length, restant: restant.length, bouton });
  await cap(p, `11-retraits-${mode}-${theme}`);
  if (restant.length !== origine.length - 2) raisons.push(`${ou} : deux retraits : ${restant.length} lignes au lieu de ${origine.length - 2}`);
  if (!bouton) { raisons.push(`${ou} : aucun « Annuler » après deux retraits`); await p.close(); continue; }
  await p.evaluate(() => document.querySelector('[data-dp-annuler]').click()); await dormir(500);
  const un = await ids(p);
  if (un.length !== origine.length - 1) raisons.push(`${ou} : 1er Annuler : ${un.length} lignes au lieu de ${origine.length - 1}`);
  if (!(await annuler(p))) raisons.push(`${ou} : après le 1er Annuler, plus de bouton : la première ligne retirée est perdue`);
  else { await p.evaluate(() => document.querySelector('[data-dp-annuler]').click()); await dormir(500); }
  const tout = await ids(p);
  if (JSON.stringify(tout) !== JSON.stringify(origine)) raisons.push(`${ou} : après deux Annuler, les lignes ne sont pas celles d'origine dans l'ordre (${tout.length} / ${origine.length})`);
  if (await annuler(p)) raisons.push(`${ou} : « Annuler » reste affiché sans rien à rendre`);
  await p.close();
}
await verdict('ANNULER', infos);

// Test en ligne 07.11, n° 40 : fermer la saisie remplie (12,50 CHF, fournisseur, deux lignes, TVA) perdait tout au « × », sans « abandonner ? ».
// Attendu, formulaire manuel, 390 clair et cave, 1280 : (a) une saisie vide se ferme d'un toucher ; (b) remplie (total, libellé de ligne, TVA), le × ouvre « Abandonner cette saisie ? » et la feuille reste
// ouverte, valeurs gardées ; « Continuer la saisie » referme la question et rend la main ; Échap redemande ; « Abandonner » ferme pour de bon. (c) un état lu (`3`) demande aussi.
// Usage : node controle-b2-40-fermer.mjs [<build>] [<dossier captures>]   → FERMER OK | FERMER ECHEC <raisons>
import { demarrer, saisir, dormir } from './aide-b2.mjs';
const { ouvrir, raisons, cap, verdict } = await demarrer();
const infos = [];
const clic = (p, src) => p.evaluate(s => { const r = new RegExp(s, 'i'); const b = [...document.querySelectorAll('button, summary')].find(x => r.test(x.textContent.replace(/\s+/g, ' ').trim())); b?.click(); return !!b; }, src);
const ouverte = p => p.evaluate(() => [...document.querySelectorAll('h2')].some(h => /Nouvelle dépense/.test(h.innerText)));
const question = p => p.evaluate(() => { const e = document.querySelector('[data-dp="abandon"]'); return e ? e.innerText.replace(/\s+/g, ' ').trim() : null; });
const fermer = p => p.evaluate(() => document.querySelector('button[aria-label="Fermer"]').click());
for (const [mode, theme] of [['t390', 'clair'], ['t390', 'cave'], ['pc1280', 'clair']]) {
  const ou = `${mode} ${theme}`;
  // (a) saisie vide
  let p = await ouvrir('difficile', mode, theme);
  await clic(p, '^Saisir à la main'); await dormir(400);
  await fermer(p); await dormir(500);
  if (await ouverte(p)) raisons.push(`${ou} : une saisie VIDE ne se ferme pas d'un toucher (question posée : ${await question(p)})`);
  await p.close();
  // (b) saisie remplie
  p = await ouvrir('difficile', mode, theme);
  await clic(p, '^Saisir à la main'); await dormir(400);
  await saisir(p, '#purchase-total', '12,50');
  await clic(p, '^Articles, stock'); await dormir(300);
  await saisir(p, '[aria-label="Libellé ligne 1"]', 'ZZ TEST fermeture');
  await fermer(p); await dormir(500);
  const q = await question(p), ouv = await ouverte(p);
  infos.push({ ou, q, ouv });
  if (!ouv) raisons.push(`${ou} : la saisie remplie est fermée sans question (tout perdu)`);
  if (!q || !/Abandonner cette saisie/.test(q)) raisons.push(`${ou} : pas de « Abandonner cette saisie ? » (${q})`);
  await cap(p, `40-question-${mode}-${theme}`);
  await clic(p, '^Continuer la saisie'); await dormir(300);
  if (await question(p)) raisons.push(`${ou} : « Continuer la saisie » ne ferme pas la question`);
  const total = await p.evaluate(() => document.querySelector('#purchase-total')?.value);
  if (total !== '12,50') raisons.push(`${ou} : après « Continuer », le total est « ${total} » au lieu de « 12,50 »`);
  await p.keyboard.press('Escape'); await dormir(500);
  if (!(await question(p)) && !(await ouverte(p))) raisons.push(`${ou} : Échap ferme la saisie remplie sans question`);
  await clic(p, '^Abandonner$'); await dormir(500);
  if (await ouverte(p)) raisons.push(`${ou} : « Abandonner » ne ferme pas la feuille`);
  await p.close();
}
// (c) un état lu
{
  const p = await ouvrir('3', 't390', 'clair');
  await fermer(p); await dormir(500);
  if (!(await ouverte(p)) || !(await question(p))) raisons.push(`3 t390 clair : une facture lue se ferme sans question`);
  await p.close();
}
await verdict('FERMER', infos.slice(0, 1));

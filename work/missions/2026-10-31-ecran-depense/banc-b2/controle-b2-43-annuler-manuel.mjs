// Test en ligne 07.11, n° 43 : retrait d'une ligne dans la saisie manuelle : pas d'« Annuler », et la liste repassait en mode simple (« Articles … · 1 »).
// Attendu, formulaire manuel (état `difficile`), 390 clair et cave, 1280 : deux lignes saisies (« ZZ A » 5, « ZZ B » 7) ; « supprimer » sur la ligne 2 → une ligne ; « ↶ Annuler « ZZ B » » (data-dp-annuler) la rend
// à sa place avec son libellé et son montant ; le bouton disparaît ensuite ; puis deux retraits de suite se défont dans l'ordre inverse.
// Usage : node controle-b2-43-annuler-manuel.mjs [<build>] [<dossier captures>]   → ANNULERMANUEL OK | ANNULERMANUEL ECHEC <raisons>
import { demarrer, saisir, dormir, ouvrirLigneN } from './aide-b2.mjs';
const { ouvrir, raisons, cap, verdict } = await demarrer();
const infos = [];
const clic = (p, src) => p.evaluate(s => { const r = new RegExp(s, 'i'); const b = [...document.querySelectorAll('button, summary')].find(x => r.test(x.textContent.replace(/\s+/g, ' ').trim())); b?.click(); return !!b; }, src);
const etat = p => p.evaluate(() => ({ libelles: [...document.querySelectorAll('[aria-label^="Libellé ligne"]')].map(e => e.value), montants: [...document.querySelectorAll('[aria-label^="Montant ligne"]')].map(e => e.value), annuler: document.querySelector('[data-dp-annuler]')?.innerText.replace(/\s+/g, ' ').trim() ?? null }));
const retirer = (p, n) => p.evaluate(n => { const b = document.querySelector(`[aria-label="Retirer la ligne ${n}"]`); b?.click(); return !!b; }, n);
for (const [mode, theme] of [['t390', 'clair'], ['t390', 'cave'], ['pc1280', 'clair']]) {
  const ou = `${mode} ${theme}`;
  const p = await ouvrir('difficile', mode, theme);
  await clic(p, '^Saisir à la main'); await dormir(400);
  await clic(p, '^Articles, stock'); await dormir(300);
  await clic(p, 'Ajouter une ligne'); await dormir(400);
  await ouvrirLigneN(p, 1); await saisir(p, '[aria-label="Libellé ligne 1"]', 'ZZ A'); await saisir(p, '[aria-label="Montant ligne 1"]', '5');
  await ouvrirLigneN(p, 2); await saisir(p, '[aria-label="Libellé ligne 2"]', 'ZZ B'); await saisir(p, '[aria-label="Montant ligne 2"]', '7');
  const avant = await etat(p);
  if (!(await retirer(p, 2))) { raisons.push(`${ou} : « Retirer la ligne 2 » introuvable`); await p.close(); continue; }
  await dormir(500);
  const un = await etat(p); infos.push({ ou, avant, un });
  await cap(p, `43-retrait-${mode}-${theme}`);
  if (un.libelles.length !== 1) raisons.push(`${ou} : après le retrait : ${un.libelles.length} lignes au lieu de 1`);
  if (!un.annuler || !/Annuler « ZZ B »/.test(un.annuler)) raisons.push(`${ou} : aucun « Annuler « ZZ B » » après le retrait (${un.annuler})`);
  else {
    await p.evaluate(() => document.querySelector('[data-dp-annuler]').click()); await dormir(500);
    const rendu = await etat(p);
    if (JSON.stringify(rendu.libelles) !== JSON.stringify(avant.libelles) || JSON.stringify(rendu.montants) !== JSON.stringify(avant.montants)) raisons.push(`${ou} : « Annuler » ne rend pas la ligne telle quelle (${JSON.stringify(rendu)} au lieu de ${JSON.stringify(avant)})`);
    if (rendu.annuler) raisons.push(`${ou} : « Annuler » reste affiché sans rien à rendre`);
    // deux retraits de suite
    await retirer(p, 2); await dormir(300); await retirer(p, 1); await dormir(500);
    await p.evaluate(() => document.querySelector('[data-dp-annuler]')?.click()); await dormir(400);
    await p.evaluate(() => document.querySelector('[data-dp-annuler]')?.click()); await dormir(500);
    const fin = await etat(p);
    if (JSON.stringify(fin.libelles) !== JSON.stringify(avant.libelles)) raisons.push(`${ou} : deux retraits puis deux Annuler : ${JSON.stringify(fin.libelles)} au lieu de ${JSON.stringify(avant.libelles)}`);
  }
  await p.close();
}
await verdict('ANNULERMANUEL', infos.slice(0, 1));

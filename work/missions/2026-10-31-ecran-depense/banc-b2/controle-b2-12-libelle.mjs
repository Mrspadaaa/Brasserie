// B2 n° 12 : « + Ajouter une ligne », un libellé de plus de 30 caractères était tronqué en silence au Tab (« Malt Pilsner 25kg xxxxxxxxxxxx »).
// Attendu, 390 clair : le libellé tapé (45 caractères, puis 80) est conservé entier dans le champ après Tab, et la rangée le montre sans perdre sa fin (coupé à
// l'affichage par la mise en page seulement : le texte du DOM est entier).
// Usage : node controle-b2-12-libelle.mjs [<build>] [<dossier captures>]   → LIBELLE OK | LIBELLE ECHEC <raisons>
import { demarrer, ouvrirLigne, saisir, dormir } from './aide-b2.mjs';
const { ouvrir, raisons, cap, verdict } = await demarrer();
const infos = [];
for (const theme of ['clair', 'cave']) {
  const p = await ouvrir('3', 't390', theme);
  await ouvrirLigne(p, 'Weizenmalz');
  await p.evaluate(() => [...document.querySelectorAll('button')].find(b => /Ajouter une ligne/.test(b.innerText))?.click()); await dormir(500);
  const sel = await p.evaluate(() => { const e = [...document.querySelectorAll('textarea')].find(t => /Article ou prestation/.test(t.placeholder || '')); return e ? `[aria-label="${e.getAttribute('aria-label')}"]` : null; });
  if (!sel) { raisons.push(`${theme} : le champ libellé de la ligne ajoutée est introuvable`); await p.close(); continue; }
  // La suite du critique (journal3 C5) : les premiers libellés changent la ligne de bande ; le long vient ensuite, sur la même ligne.
  for (const v of ['Crystal 60', '123', '0', 'Malt Pilsner 25kg ' + 'x'.repeat(62), 'Weyermann Pilsner Malz 25 kg Sack', 'Citra']) {
    const apres = await saisir(p, sel, v);
    const rangee = await p.evaluate(() => document.querySelector('[data-dp-neuve] summary, [data-dp-ligne] summary:not([hidden])') && [...document.querySelectorAll('[data-dp-ligne]')].map(a => a.querySelector('[data-dp-nom]')?.textContent ?? '').find(t => t.startsWith('Weyermann') || t.startsWith('Malt Pilsner 25kg')));
    infos.push({ theme, tape: v.length, apres: apres?.length, rangee: rangee?.length });
    if (apres !== v) raisons.push(`${theme} : libellé de ${v.length} caractères : le champ garde « ${String(apres).slice(0, 45)}… » (${apres?.length} caractères)`);
    if (rangee !== undefined && rangee !== v) raisons.push(`${theme} : libellé de ${v.length} caractères : la rangée garde ${rangee?.length} caractères`);
  }
  await cap(p, `12-libelle-${theme}`);
  await p.close();
}
await verdict('LIBELLE', infos);

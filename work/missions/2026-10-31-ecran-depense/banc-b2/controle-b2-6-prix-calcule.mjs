// B2 n° 6 : montant posé 10 sur 3 Kg : le prix calculé s'affichait « 3,3333 » (4 décimales) et « = 10,00 » passait à la ligne sous la rangée de calcul.
// Attendu, 390 clair et cave : le prix calculé a trois décimales au plus (« 3,333 »), q × prix rend encore 10,00 au centime (aucun « ≠ montant »), et la rangée de calcul tient sur une ligne
// (une seule position verticale de ses champs, hauteur ≤ 44 px).
// Usage : node controle-b2-6-prix-calcule.mjs [<build>] [<dossier captures>]   → PRIXCALCULE OK | PRIXCALCULE ECHEC <raisons>
import { demarrer, ouvrirLigne, numeroLigne, saisir } from './aide-b2.mjs';
const { ouvrir, raisons, cap, verdict } = await demarrer();
const infos = [];
for (const theme of ['clair', 'cave']) {
  const p = await ouvrir('3', 't390', theme);
  await ouvrirLigne(p, 'Weizenmalz'); const n = await numeroLigne(p, 'Weizenmalz');
  for (const [champ, v] of [['Quantité', '3'], ['Prix', '2'], ['Montant', '10']]) await saisir(p, `[aria-label="${champ} ligne ${n}"]`, v);
  const m = await p.evaluate(n => {
    const a = document.querySelector(`[aria-label="Prix ligne ${n}"]`).closest('[data-dp-calcul]');
    const centres = [...a.children].map(e => { const r = e.getBoundingClientRect(); return (r.top + r.bottom) / 2; });
    const lignes = centres.sort((x, y) => x - y).filter((c, i, t) => i === 0 || c - t[i - 1] > 12).length;
    return { prix: document.querySelector(`[aria-label="Prix ligne ${n}"]`).value, h: Math.round(a.getBoundingClientRect().height), lignes, ecart: !!a.querySelector('[data-dp-centime]'), montant: document.querySelector(`[aria-label="Montant ligne ${n}"]`).value };
  }, n);
  infos.push({ theme, ...m });
  if ((m.prix.split(',')[1] ?? '').length > 3) raisons.push(`${theme} : prix calculé « ${m.prix} » : plus de trois décimales`);
  if (m.ecart) raisons.push(`${theme} : « ≠ montant, écart à vérifier » apparaît avec le prix « ${m.prix} »`);
  if (m.montant !== '10,00') raisons.push(`${theme} : le montant posé est devenu « ${m.montant} »`);
  if (m.lignes > 1 || m.h > 44) raisons.push(`${theme} : la rangée de calcul passe sur ${m.lignes} lignes (${m.h} px)`);
  await cap(p, `6-prix-${theme}`);
  await p.close();
}
await verdict('PRIXCALCULE', infos);

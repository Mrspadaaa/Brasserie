// B2 n° 4 : le montant d'une bande (« 36,85 ») était coupé au bord droit (403 px pour 390) quand une quantité longue (« 16,002 Kg ») poussait la colonne.
// Attendu, état 3 à 390 (clair et cave) : au repos, après la case g de Weizenmalz, après une quantité longue, après « Plié » : le bord droit de chaque montant de
// bande, de sous-famille et de rangée ≤ la largeur de l'écran, et aucun débordement horizontal de la page.
// Usage : node controle-b2-4-montant.mjs [<build>] [<dossier captures>]   → MONTANT OK | MONTANT ECHEC <raisons>
import { demarrer, ouvrirLigne, numeroLigne, uniteChoisir, saisir, dormir } from './aide-b2.mjs';
const { ouvrir, raisons, cap, verdict } = await demarrer();
const bords = p => p.evaluate(() => {
  const w = innerWidth;
  const hors = [...document.querySelectorAll('[data-dp-sous-montant], [data-dp-sg-montant], [data-dp-montant]')].filter(e => e.offsetParent).map(e => ({ t: e.innerText.trim(), r: Math.round(e.getBoundingClientRect().right) })).filter(x => x.r > w);
  return { hors, debord: document.scrollingElement.scrollWidth > w + 1, w };
});
const verifier = async (p, quand) => { const b = await bords(p); if (b.hors.length) raisons.push(`${quand} : ${b.hors.length} montant(s) coupé(s) au bord droit (${b.hors.slice(0, 3).map(x => `« ${x.t} » à ${x.r} px`).join(', ')} pour ${b.w})`); if (b.debord) raisons.push(`${quand} : la page déborde horizontalement`); };
for (const theme of ['clair', 'cave']) {
  const p = await ouvrir('3', 't390', theme);
  await verifier(p, `${theme}, au repos`);
  await ouvrirLigne(p, 'Weizenmalz'); const n = await numeroLigne(p, 'Weizenmalz');
  await uniteChoisir(p, 'Weizenmalz', 'g'); await verifier(p, `${theme}, après la case g`);
  await cap(p, `4-g-${theme}`);
  await saisir(p, `[aria-label="Quantité ligne ${n}"]`, '1234,567'); await verifier(p, `${theme}, quantité 1234,567 g`);
  await cap(p, `4-longue-${theme}`);
  await p.evaluate(() => [...document.querySelectorAll('[data-dp-plier-bouton="plie"]')][0]?.click()); await dormir(400); await verifier(p, `${theme}, après « Plié »`);
  await p.close();
}
await verdict('MONTANT');

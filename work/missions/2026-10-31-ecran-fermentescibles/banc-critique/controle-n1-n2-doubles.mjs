// Banc d'actionneurs N1 et N2 : un double toucher.
// N1 : sur la corbeille du plateau, deux articles retirés (le plateau passe à la ligne suivante et le 2e toucher la retire) ; « Annuler » n'en rendait qu'un.
//      Attendu : un seul « Annuler » rend tous les retraits du geste (le geste de sa maquette, un toucher = un retrait, ne change pas).
// N2 : sur une proposition (tuile du repos), l'article est ajouté deux fois. Attendu : une ligne de plus, pas deux.
// Usage : node controle-n1-n2-doubles.mjs <build> [<capture.png>]   → DOUBLES OK | DOUBLES ECHEC <raisons>
import { ouvrir, noms, dormir, verdict, capturer } from './banc.mjs';
const [construit, capture] = process.argv.slice(2);
const raisons = [];
const infos = {};
{
  const { nav, p } = await ouvrir(construit, { etat: 'maquette' });
  const origine = await noms(p);
  const corbeille = await p.$('[data-del]');
  await corbeille.tap(); await corbeille.tap().catch(() => {}); // le 2e toucher tombe sur la même place, déjà occupée par la ligne suivante
  await dormir(500);
  const apres = await noms(p);
  infos.n1 = { origine, apres };
  if (capture) await capturer(p, capture);
  let annuler = await p.$$('[data-role="annuler"]');
  if (apres.length === origine.length) raisons.push('N1 : aucun retrait (le geste n\'a pas pris)');
  else if (!annuler.length) raisons.push('N1 : retrait sans « Annuler »');
  else {
    await annuler[0].tap(); await dormir(500);
    const rendu = await noms(p);
    infos.n1.rendu = rendu;
    if (JSON.stringify(rendu) !== JSON.stringify(origine)) raisons.push(`N1 : un « Annuler » après ${origine.length - apres.length} retrait(s) rend ${rendu.length} ligne(s) sur ${origine.length} (${rendu.join(' | ')})`);
  }
  await nav.close();
}
{
  // Huit lignes, page défilée en bas : l'ancrage du défilement garde les tuiles en place quand une ligne s'ajoute au-dessus ; le 2e toucher tombe alors sur la tuile suivante.
  const { nav, p } = await ouvrir(construit, { etat: 'huit' });
  await dormir(2000);
  await p.evaluate(() => { const m = document.querySelector('[data-floating-actions-gap^="page"]')?.closest('main'); m?.scrollTo({ top: m.scrollHeight, behavior: 'instant' }); });
  await dormir(400);
  const origine = await noms(p);
  const tuile = await p.$('[data-role="puces"] button[data-role="resultat"]:not([data-hors])');
  if (!tuile) raisons.push('N2 : aucune proposition au repos');
  else {
    // Deux touchers au même endroit de l'écran (la tuile touchée disparaît, la suivante prend sa place sous le doigt).
    // Le cas le plus dur d'un double toucher : deux clics sur la même tuile avant que l'écran ait eu le temps de la retirer (téléphone lent) ; puis deux touchers au doigt, 90 ms d'écart.
    await tuile.evaluate((b) => { b.click(); b.click(); });
    await dormir(700);
    const r = await p.$('[data-role="puces"] button[data-role="resultat"]:not([data-hors])').then((t) => t?.boundingBox());
    if (r) { const x = r.x + r.width / 2, y = r.y + r.height / 2; await p.touchscreen.tap(x, y); await dormir(90); await p.touchscreen.tap(x, y); await dormir(700); }
    const apres = await noms(p);
    infos.n2 = { origine: origine.length, apres };
    // Deux gestes doubles : attendu 2 lignes (une par geste), pas 3 ou 4 ; et aucun nom en double.
    const doublons = apres.filter((n, i) => apres.indexOf(n) !== i);
    if (apres.length - origine.length !== 2 || doublons.length) raisons.push(`N2 : deux doubles touchers sur des propositions → ${apres.length - origine.length} ligne(s) ajoutée(s) au lieu de 2${doublons.length ? `, doublon : ${doublons.join(' | ')}` : ''} (${apres.slice(origine.length).join(' | ')})`);
  }
  await nav.close();
}
console.log(JSON.stringify(infos));
console.log(raisons.length ? `DOUBLES ECHEC ${raisons.join(' ; ')}` : 'DOUBLES OK');

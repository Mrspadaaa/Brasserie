// Critique B1 n° 7 (verdict du pilote) : AU REPOS le « + » flottant est dans sa maquette (on n'y touche pas) ; EN BAS DE PAGE, défilement fini, il ne doit plus
// couvrir « kg », « Ajouter un cran », la piste, ses graduations, ni l'alerte, ni « Suivant ». Ne juge QUE le bas de page, 2 s après le chargement.
// Cause : `PageShell` pose `data-floating-actions-gap="page-row"` dès qu'il y a des actions de fin et retire alors la réserve de 4,5 rem.
// Usage : node controle-7-fab.mjs <build> [<capture.png> [clair|cave]]   → FAB OK | FAB ECHEC <raisons>
import { ouvrir, toucher, dormir, capturer } from './banc.mjs';
const [construit, capture, theme = 'clair'] = process.argv.slice(2);
const raisons = [];
const sortie = {};
const COUVERT = () => {
  const fab = document.querySelector('[aria-label^="Actions rapides"]');
  if (!fab) return null;
  // 8 px d'air au-dessus du bouton : la règle de l'app (floating-actions.css : « 48 px, 16 px de décalage, 8 px d'air »). Sur HEAD le plateau touche le bouton à 1 px.
  const b = fab.getBoundingClientRect();
  const f = { left: b.left, right: b.right, top: b.top - 8, bottom: b.bottom };
  const dedans = (r) => r.width > 0 && r.height > 0 && r.left < f.right && f.left < r.right && r.top < f.bottom && f.top < r.bottom;
  const couverts = [];
  document.querySelectorAll('[data-role="bal"] button, [data-role="bal"] [data-role="piste"], [data-role="bal"] .fer-bu, [data-role="bal"] .fer-gr span, [data-role="alertes"] p').forEach((e) => {
    if (dedans(e.getBoundingClientRect())) couverts.push((e.getAttribute('aria-label') || e.textContent || e.className).trim().slice(0, 28));
  });
  const pied = [...document.querySelectorAll('button')].find((b) => /^Suivant/.test(b.textContent ?? ''));
  if (pied && dedans(pied.getBoundingClientRect())) couverts.push('Suivant');
  return couverts;
};
// Le défilement de la page : le `main` du PageShell (celui qui porte la réserve), pas le premier `main` de l'app.
const AU_BAS = () => {
  const m = document.querySelector('[data-floating-actions-gap^="page"]')?.closest('main');
  if (m) m.scrollTo({ top: m.scrollHeight, behavior: 'instant' });
  return m ? { reste: Math.round(m.scrollHeight - m.clientHeight - m.scrollTop), defile: m.scrollHeight > m.clientHeight } : null;
};
for (const [scene, etat, avant] of [['repos', 'maquette', null], ['huit', 'huit', null], ['ouverture-huit', 'huit', async (p) => { await toucher(p, '[data-role="ajout"]'); }]]) {
  const { nav, p } = await ouvrir(construit, { etat, theme });
  await dormir(2000); // la mise en page se stabilise (repères repliés d'eux-mêmes, polices)
  if (avant) { await avant(p); await dormir(500); }
  const defil = await p.evaluate(AU_BAS);
  await dormir(500);
  const bas = await p.evaluate(COUVERT);
  sortie[scene] = { defil, bas };
  if (bas === null) raisons.push(`${scene} : pas de bouton Actions rapides`);
  else if (bas.length) raisons.push(`${scene} : en bas de page, le bouton couvre ${bas.join(' | ')}`);
  if (capture && scene === 'huit') await capturer(p, capture);
  await nav.close();
}
console.log(JSON.stringify(sortie));
console.log(raisons.length ? `FAB ECHEC ${raisons.join(' ; ')}` : 'FAB OK');

// Critique B1 n° 7 : le « + » flottant (Actions rapides) couvre le « + » du plateau, « kg », le bout de la piste et le texte de l'alerte lactose.
// Ce contrôle MESURE (il ne juge pas la maquette, qui a le même bouton fixe, en bas à droite) : par scène, ce que le bouton couvre en haut de page, puis en bas de page
// (la page réserve 4,5 rem en fin de contenu : à cet endroit rien ne doit rester dessous). Verdict : FAB OK si, en bas de page, rien du plateau ni de l'alerte n'est couvert.
// Usage : node controle-7-fab.mjs <build>   → FAB OK | FAB ECHEC <raisons>
import { ouvrir, toucher, dormir } from './banc.mjs';
const [construit] = process.argv.slice(2);
const raisons = [];
const sortie = {};
const COUVERT = () => {
  const fab = document.querySelector('[aria-label^="Actions rapides"]');
  if (!fab) return { fab: false, couverts: [] };
  const f = fab.getBoundingClientRect();
  const dedans = (r) => r.left < f.right && f.left < r.right && r.top < f.bottom && f.top < r.bottom && r.width > 0 && r.height > 0;
  const couverts = [];
  document.querySelectorAll('[data-role="bal"] button, [data-role="bal"] [data-role="piste"], [data-role="bal"] .fer-bu, [data-role="bal"] .fer-gr span, [data-role="alertes"] p').forEach((e) => {
    if (dedans(e.getBoundingClientRect())) couverts.push((e.getAttribute('aria-label') || e.textContent || e.className).trim().slice(0, 28));
  });
  const pied = [...document.querySelectorAll('button')].find((b) => /^Suivant/.test(b.textContent ?? ''));
  if (pied && dedans(pied.getBoundingClientRect())) couverts.push('Suivant');
  return { fab: true, couverts };
};
for (const [scene, etat, avant] of [['repos', 'maquette', null], ['huit', 'huit', null], ['ouverture-huit', 'huit', async (p) => { await toucher(p, '[data-role="ajout"]'); }]]) {
  const { nav, p } = await ouvrir(construit, { etat });
  await dormir(1500); // la mise en page se stabilise (repères repliés d'eux-mêmes, polices)
  if (avant) await avant(p);
  await p.evaluate(() => { const m = document.querySelector('main'); (m && m.scrollHeight > m.clientHeight ? m : document.scrollingElement).scrollTo({ top: 0, behavior: 'instant' }); });
  await dormir(200);
  const haut = await p.evaluate(COUVERT);
  await p.evaluate(() => { const m = document.querySelector('main'); const s = m && m.scrollHeight > m.clientHeight ? m : document.scrollingElement; s.scrollTo({ top: s.scrollHeight, behavior: 'instant' }); });
  await dormir(300);
  const bas = await p.evaluate(COUVERT);
  sortie[scene] = { haut: haut.couverts, bas: bas.couverts };
  if (!bas.fab) raisons.push(`${scene} : pas de bouton Actions rapides trouvé`);
  else if (bas.couverts.length) raisons.push(`${scene} : en bas de page, le bouton couvre encore ${bas.couverts.join(' | ')}`);
  await nav.close();
}
console.log(JSON.stringify(sortie));
console.log(raisons.length ? `FAB ECHEC ${raisons.join(' ; ')}` : 'FAB OK');

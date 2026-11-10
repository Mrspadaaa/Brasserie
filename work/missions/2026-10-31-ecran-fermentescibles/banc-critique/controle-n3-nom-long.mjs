// Banc d'actionneurs N3 : un nom de 90 caractères passe sous « 0 kg » et sort de l'écran, dans la ligne comme dans le plateau.
// Attendu : le nom passe à la ligne ; rien de la ligne ni du plateau ne dépasse la largeur de l'écran ; le nom ne recouvre ni « kg » ni « ⇄ », ni la corbeille.
// Usage : node controle-n3-nom-long.mjs <build> [<capture.png>] [clair|cave]   → NOMLONG OK | NOMLONG ECHEC <raisons>
import { ouvrir, taper, dormir, verdict, capturer } from './banc.mjs';
const [construit, capture, theme = 'clair'] = process.argv.slice(2);
const { nav, p } = await ouvrir(construit, { etat: 'maquette', theme });
await dormir(800);
const nom = 'Malt de printemps très long avec un nom de quatre-vingt-dix caractères pour éprouver la ligne et le plateau';
await taper(p, nom.slice(0, 90));
await dormir(800);
const raisons = [];
const m = await p.evaluate(() => {
  const W = innerWidth;
  const li = [...document.querySelectorAll('[data-sel]')].pop();
  const r = (e) => e.getBoundingClientRect();
  const nomB = li.querySelector('.fer-nom b'), kg = li.querySelector('.fer-kg'), ret = li.querySelector('.fer-ret');
  const hors = [];
  for (const e of [...li.querySelectorAll('*'), ...document.querySelectorAll('[data-role="bal"] *')]) { const b = r(e); if (b.width && (b.right > W + 0.5 || b.left < -0.5)) hors.push(`${e.tagName.toLowerCase()}.${String(e.className).split(' ')[0]} ${Math.round(b.left)}→${Math.round(b.right)}`); }
  const bal = document.querySelector('[data-role="bal"]'), bn = bal.querySelector('.fer-bh b'), bm = bal.querySelector('.fer-bmo'), bd = bal.querySelector('.fer-del');
  const inter = (a, b) => a.left < b.right - 0.5 && b.left < a.right - 0.5 && a.top < b.bottom - 0.5 && b.top < a.bottom - 0.5;
  return {
    W, hors: hors.slice(0, 4), nomLignes: Math.round(r(nomB).height / 18),
    nomSurKg: inter(r(nomB), r(kg)), nomSurRet: inter(r(nomB), r(ret)),
    plateauNomSurMoment: inter(r(bn), r(bm)), plateauNomSurCorbeille: inter(r(bn), r(bd)), plateauNomDroite: Math.round(r(bn).right),
    nomTexte: nomB.textContent.length,
  };
});
if (m.nomTexte < 80) raisons.push(`le nom créé est trop court pour l'épreuve (${m.nomTexte})`);
if (m.hors.length) raisons.push(`dépasse l'écran (${m.W}) : ${m.hors.join(' ; ')}`);
if (m.nomSurKg) raisons.push('le nom recouvre « kg » de la ligne');
if (m.nomSurRet) raisons.push('le nom recouvre la croix de la ligne');
if (m.plateauNomSurMoment) raisons.push('le nom du plateau recouvre la pastille du moment');
if (m.plateauNomSurCorbeille) raisons.push('le nom du plateau recouvre la corbeille');
if (capture) { await p.$eval('[data-sel]:last-child', (e) => e.scrollIntoView({ block: 'center' })); await dormir(200); await capturer(p, capture); }
await verdict(nav, 'NOMLONG', raisons, m);

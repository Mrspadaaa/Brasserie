// Critique B1 n° 9 : fruit, curseur J+ poussé à 14 au clavier : le cadre de focus du curseur barre « J0 J7 J14 » et « J0 » se cache derrière « J+ 14 ».
// Attendu : aucune étiquette J0/J7/J14 ne chevauche le champ « J+ » ni le cadre de focus du curseur ; les trois restent lisibles (aucune sous une autre).
// Usage : node controle-9-jours.mjs <build> [<capture.png> [clair|cave [largeur]]]   → JOURS OK | JOURS ECHEC <raisons>
import { ouvrir, toucher, verdict, capturer, dormir } from './banc.mjs';
const [construit, capture, theme = 'clair', largeur = '390'] = process.argv.slice(2);
const { nav, p } = await ouvrir(construit, { etat: 'fruit', theme, largeur: Number(largeur) });
const raisons = [];
await toucher(p, '[data-sel="3"] [data-role="nom"]');
await p.focus('input[data-jr="3"]');
await p.keyboard.press('End');
await dormir(300);
const m = await p.evaluate(() => {
  const r = (e) => { const b = e.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom }; };
  const rg = document.querySelector('input[data-jr="3"]');
  const cs = getComputedStyle(rg);
  // Le cadre de focus : la boîte du curseur élargie de l'épaisseur et du décalage du contour (quand il est tracé).
  const ow = cs.outlineStyle !== 'none' ? parseFloat(cs.outlineWidth) + parseFloat(cs.outlineOffset || '0') : 0;
  const b = r(rg);
  return {
    valeur: rg.value, cadre: { l: b.l - ow, r: b.r + ow, t: b.t - ow, b: b.b + ow }, outline: cs.outlineStyle,
    champ: r(document.querySelector('.fer-jin')),
    etiquettes: [...document.querySelectorAll('.fer-jl-lab')].map((e) => ({ texte: e.textContent, ...r(e) })),
  };
});
const inter = (a, b) => a.l < b.r - 0.5 && b.l < a.r - 0.5 && a.t < b.b - 0.5 && b.t < a.b - 0.5;
if (m.valeur !== '14') raisons.push(`le curseur n'est pas à 14 (${m.valeur})`);
for (const e of m.etiquettes) {
  if (inter(e, m.champ)) raisons.push(`« ${e.texte} » chevauche le champ J+`);
  if (inter(e, m.cadre)) raisons.push(`« ${e.texte} » sous le cadre de focus du curseur`);
}
for (let i = 0; i < m.etiquettes.length; i++) for (let j = i + 1; j < m.etiquettes.length; j++) if (inter(m.etiquettes[i], m.etiquettes[j])) raisons.push(`« ${m.etiquettes[i].texte} » et « ${m.etiquettes[j].texte} » se chevauchent`);
if (capture) { await p.$eval('.fer-jp', (e) => e.scrollIntoView({ block: 'center' })); await dormir(200); await capturer(p, capture); }
await verdict(nav, 'JOURS', raisons, m);

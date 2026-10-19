// Lot 20 · la lecture des sorties du moteur « pouvoir aromatique » (fils19-choix/donnees/*.json, produites par
// prototypes/houblons-v4/src/engine/pouvoir.ts). Les maquettes disent ce que dit le moteur : plages, repère
// central, lecture ordinale, base commune, drapeaux, conventions [H]. donnees-h.json ne sert qu'à ce que le
// moteur ne sort pas.
import fs from 'node:fs';
import path from 'node:path';
import { ICI, num, inc, uniq } from './socle-h.mjs';

const DON = path.resolve(ICI, '../../fils19-choix/donnees');
export function cas(id) {
  const F = JSON.parse(fs.readFileSync(path.join(DON, id + '.json'), 'utf8'));
  const T = F.textes || {};
  // Les renvois « §n » se résolvent dans « textes » (pas « H §8.4 », qui est une section de H).
  const r = (s) => (typeof s === 'string' ? s.replace(/§\d+(?![.\d])/g, (m) => (T[m] != null ? r(T[m]).trim() : m)) : s);
  return { F, r, P: F.pouvoir, sources: F.sources || {} };
}
// Une clé de source du moteur : « H30 » → « [30] » (numéro de H) ; « H50-us05 » → « [50] » ; les autres
// (bm-citra, hs-nug, spec…) restent des clés du moteur, lisibles dans son en-tête « sources ».
export const cle = (k) => { const m = String(k).match(/^H(\d+)/); return m ? '[' + m[1] + ']' : String(k) === 'H' ? 'H' : String(k); };
export const srcM = (xs) => uniq((xs || []).map(cle));
// Le niveau le plus bas d'une liste de sources (P > F > S > H).
export const nivM = (o) => (o && o.niveau) || 'H';

// Un nombre comme le moteur l'écrit : entier à partir de 10, deux chiffres significatifs en dessous.
export const n = (x) => {
  if (x == null) return null;
  const a = Math.abs(x);
  const v = a >= 10 ? Math.round(x) : Number(x.toPrecision(2));
  const s = String(v).replace('.', ',');
  return a >= 10000 ? s.replace(/\B(?=(\d{3})+(?!\d))/g, ' ') : s;
};
// Une plage du moteur { min, max, central, minAuMoins } en texte, avec sa source et son niveau.
export function txt(p, { pre = '', unite = '', src = [], niv = 'H', central = false, motMax = true } = {}) {
  const u = unite ? ' ' + unite : '';
  if (!p || (p.min == null && p.max == null)) return inc('non chiffré', src);
  let t;
  if (p.max == null) t = '≥ ' + pre + n(p.min) + u;
  else if (p.min == null) t = '≤ ' + pre + n(p.max) + u;
  else if (n(p.min) === n(p.max)) t = pre + n(p.min) + u;
  else t = (p.minAuMoins ? '≥ ' : '') + pre + n(p.min) + '–' + pre.replace('×', '') + n(p.max) + u;
  let s = num(t, src, niv);
  if (p.max == null && motMax) s += ' ' + inc('borne haute inconnue', src, 'max inconnu', 'inc mi');
  if (central && p.central != null && p.min != null && p.max != null) s += ' ' + num('c. ' + pre + n(p.central), src, niv, 'v ctr');
  return s;
}
// La lecture ordinale du moteur → nos signes.
export const LEC = { 'au-dessus du seuil': 'dessus', 'autour du seuil': 'autour', 'sous le seuil': 'sous', inconnu: 'inconnu' };

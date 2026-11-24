/**
 * C56-3 (R27) puis C58-2 (R31) : un nombre n'est jamais séparé de son unité en fin de ligne (« 250 g », « 50 L », « 2,6 m³ »), ni coupé à l'intérieur
 * (« 5 » / « 0 L » : le tour 58 a vu l'enveloppe ne prendre que le DERNIER chiffre) ni restylé (« 2 » à 18 px, « 0 mm » à 14 px).
 * Le texte garde son espace ORDINAIRE (les données, la recherche, le copier-coller et les comparaisons n'y perdent rien) ; c'est l'AFFICHAGE qui
 * entoure le nombre ENTIER (« 50 », « 2,6 », « 1 000 », « 2 697,74 ») avec son unité d'un `<span class="cn-nombre">` (white-space: nowrap, taille
 * héritée : voir carnets.css). Un nombre à groupes de milliers (« 2 697,74 ») est lui aussi d'un seul tenant, même sans unité. Un nombre sans espace
 * ni unité reste du texte nu : aucun élément ne s'ouvre jamais au milieu d'un nombre.
 */
import React from 'react';

const UNITES = '(?:kg|mg|g|ml|cl|dl|l|L|mm|cm|m²|m³|m|°C|kW|kWh|W|V|CHF|€|bar)';
const ESPACES = '[ \\u00A0\\u202F]';
/** Un nombre entier : « 50 », « 2,6 », « 1 000 » (groupes de trois chiffres), « 2 697,74 » ; jamais commencé au milieu d'un autre. */
const NOMBRE = `(?<![\\d.,])(?:\\d{1,3}(?:[ \\u00A0\\u202F']\\d{3})+(?!\\d)(?:[.,]\\d+)?|\\d+(?:[.,]\\d+)?)`;
/** Le nombre, puis (facultatif) son unité. Une unité collée à une lettre (« 50 Lait ») ou à une puissance (« m/s ») n'en est pas une. */
const NOMBRE_UNITE = new RegExp(`${NOMBRE}(?:${ESPACES}${UNITES}(?![\\p{L}²³/]))?`, 'gu');
const A_UN_ESPACE = /[   ']/;

/** Les morceaux du texte : le texte nu et, intercalés, les « nombre + unité » qui contiennent une espace (donc coupables). */
function decoupe(t: string, tous = false): Array<{ s: string; lie: boolean }> {
  const parts: Array<{ s: string; lie: boolean }> = [];
  let fin = 0;
  for (const m of t.matchAll(NOMBRE_UNITE)) {
    if (!tous && !A_UN_ESPACE.test(m[0])) continue;
    const a = m.index ?? 0;
    if (a > fin) parts.push({ s: t.slice(fin, a), lie: false });
    parts.push({ s: m[0], lie: true });
    fin = a + m[0].length;
  }
  if (fin < t.length) parts.push({ s: t.slice(fin), lie: false });
  return parts;
}

/** Un texte où le mot trouvé est en gras (recherche) : un nombre touché par le gras l'est en entier (« 4,06 m³ »), jamais coupé en deux. */
export function InsecMarque({ t, debut, fin }: { t: string; debut: number; fin: number }): React.ReactElement {
  let a = 0;
  const sortie: React.ReactNode[] = [];
  decoupe(t, true).forEach((p, i) => {
    const d = a, f = a + p.s.length;
    a = f;
    const touche = d < fin && f > debut;
    const tranche = (x: string) => (p.lie ? <span key={i} className="cn-nombre">{x}</span> : x);
    if (p.lie) { sortie.push(touche ? <b key={i}><span className="cn-nombre">{p.s}</span></b> : tranche(p.s)); return; }
    const g = Math.max(debut, d) - d, h = Math.min(fin, f) - d;
    if (touche && h > g) sortie.push(<React.Fragment key={i}>{p.s.slice(0, g)}<b>{p.s.slice(g, h)}</b>{p.s.slice(h)}</React.Fragment>);
    else sortie.push(p.s);
  });
  return <>{sortie}</>;
}

/** Le texte, ses « nombre unité » liés. Un texte sans nombre à espace est rendu tel quel. */
export function Insec({ t }: { t: string | null | undefined }): React.ReactElement | null {
  if (t === null || t === undefined) return null;
  const parts = decoupe(t);
  if (!parts.some(p => p.lie)) return <>{t}</>;
  return <>{parts.map((p, i) => (p.lie ? <span key={i} className="cn-nombre">{p.s}</span> : p.s))}</>;
}

/**
 * Le même lien par des espaces INSÉCABLES (U+00A0) dans le texte, pour un titre qui reste UN seul nœud de texte (liste des carnets : lu d'un bloc,
 * tronqué par `text-overflow` ; titre du carnet ouvert : aucun élément dans un titre de 18 px). Ne sert qu'à l'affichage ; ailleurs, `Insec` garde
 * l'espace ordinaire.
 */
export function liesParNbsp(t: string): string {
  return decoupe(t).map(p => (p.lie ? p.s.replace(/[  ]/g, ' ') : p.s)).join('');
}

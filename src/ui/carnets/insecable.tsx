/**
 * C56-3 (R27) : un nombre n'est jamais séparé de son unité en fin de ligne (« 250 g », « 50 L », « 2,6 m³ »). Le texte garde son espace ORDINAIRE
 * (les données, la recherche, le copier-coller et les comparaisons n'y perdent rien) ; c'est l'AFFICHAGE qui entoure « chiffre + espace + unité »
 * d'un `<span class="cn-nowrap">` (white-space: nowrap) : le navigateur ne coupe plus entre les deux. Un chiffre seul est entouré, jamais le
 * nombre entier : « 1 000 kg » peut se couper avant « 000 kg » mais jamais entre « 0 » et « kg ».
 */
import React from 'react';

const UNITES = '(?:kg|mg|g|ml|cl|dl|l|L|mm|cm|m²|m³|m|°C|kW|kWh|W|V|CHF|€|bar)';
const NOMBRE_ESPACE_UNITE = new RegExp(`(\\d[ \\u00A0\\u202F]${UNITES}(?![\\p{L}²³/]))`, 'gu');

/** Le texte, ses « nombre unité » liés. Un texte sans nombre suivi d'une unité est rendu tel quel. */
export function Insec({ t }: { t: string | null | undefined }): React.ReactElement | null {
  if (t === null || t === undefined) return null;
  const parts = t.split(NOMBRE_ESPACE_UNITE);
  if (parts.length === 1) return <>{t}</>;
  return <>{parts.map((s, i) => (i % 2 === 1 ? <span key={i} className="cn-nowrap">{s}</span> : s))}</>;
}

/**
 * Le même lien par une espace INSÉCABLE (U+00A0) dans le texte, pour un titre qui reste UN seul nœud de texte (liste des carnets : lu d'un bloc,
 * tronqué par `text-overflow`). Ne sert qu'à l'affichage ; ailleurs, `Insec` garde l'espace ordinaire.
 */
export function liesParNbsp(t: string): string {
  return t.replace(NOMBRE_ESPACE_UNITE, (m: string) => `${m[0]}\u00A0${m.slice(2)}`);
}

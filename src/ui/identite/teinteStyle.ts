import { familleDuStyle } from '../BeerStyleTag';

/**
 * La teinte de la pastille du style (r4-a : « Double IPA » en vert d'eau). Elle suit la famille de BeerStyleTag, qui
 * distingue les styles d'un coup d'œil ; la valeur est un triplet RGB lu par identite.css (fond, bord et texte en
 * dérivent, donc le thème clair comme « cave » tiennent leur contraste). Un style inconnu reste neutre : null.
 */
const TRIPLETS: Record<string, string> = {
  red: '220 80 70',
  orange: '230 130 50',
  yellow: '225 185 40',
  lime: '140 190 40',
  green: '60 170 90',
  teal: '43 181 159',
  cyan: '40 170 200',
  blue: '70 120 220',
  violet: '140 90 220',
  fuchsia: '200 70 190',
  pink: '230 90 150'
};

export function teinteDuStyle(style: string): string | null {
  const famille = style.trim() ? familleDuStyle(style) : null;
  return famille ? TRIPLETS[famille] ?? null : null;
}

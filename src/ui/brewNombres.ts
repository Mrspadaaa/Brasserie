/**
 * K6 n° 26 : un nombre et son unité ne se coupent pas en fin de ligne (« ~14 h / 45 », « 35,4 / g »). À l'affichage seulement, les espaces de l'heure « 14 h 45 »
 * et de la mesure « 35,4 g » deviennent insécables : la donnée et les tests de lecture (qui normalisent les espaces) ne changent pas, et le texte reste un seul nœud.
 */
const NOMBRE_UNITE = /~?\d{1,2}\s?h\s\d{2}|\d+(?:,\d+)?\s(?:°C|kg|g|L|min|%)(?![\p{L}\d])/gu;

export function insecables(texte: string): string {
  return texte.replace(NOMBRE_UNITE, (m) => m.replace(/\s/g, ' '));
}

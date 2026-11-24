import { R } from './r.mjs';

/* T30-12 : 72,50 CHF, jamais 72,5 */
R('src/domain/carnets/comparer.ts', [
  ["  const f = centimes / 100;\n  return `${nombreTexte(Number.isInteger(f) ? f : Math.round(f * 100) / 100)} ${devise ?? 'CHF'}`;",
   "  const c = Math.round(centimes);\n  /* T30-12 : deux décimales dès qu'il y en a (72,50 CHF, jamais 72,5) */\n  const texte = c % 100 === 0 ? nombreTexte(c / 100) : `${c < 0 && Math.trunc(c / 100) === 0 ? '−' : ''}${nombreTexte(Math.trunc(c / 100))},${String(Math.abs(c) % 100).padStart(2, '0')}`;\n  return `${texte} ${devise ?? 'CHF'}`;"],
]);

/* T30-8 : la carte rangée après un lien tient en peu de lignes : trois caractéristiques, le reste dit en nombre ; « lu sur la page » ne les répète pas */
R('src/ui/carnets/CarteArticle.tsx', [
  ["/**\n * Ce que la page a donné (g5:v06-10,",
   "/** T30-8 : combien de caractéristiques la carte rangée montre au plus (la fiche montre le reste). */\nexport const VALEURS_VUES_MAX = 3;\n\n/**\n * T30-8 : « lu sur la page : nom, prix, photo, 8 caractéristiques » : les noms des caractéristiques que la carte montre déjà (ou que la fiche porte)\n * ne se répètent pas ; ils se comptent. Un seul nom se dit « 1 caractéristique ».\n */\nexport function luEnBref(lu: readonly string[], valeurs: Record<string, unknown>): string[] {\n  const noms = new Set(Object.keys(valeurs));\n  const champs = lu.filter(x => !noms.has(x));\n  const n = lu.length - champs.length;\n  return n > 0 ? [...champs, `${n} caractéristique${n > 1 ? 's' : ''}`] : champs;\n}\n\n/**\n * Ce que la page a donné (g5:v06-10,"],
  ["    const lu = (p.luSurPage ?? luDeLArticle(a, sujet)).filter(x => x !== sujet);\n", "    const lu = luEnBref((p.luSurPage ?? luDeLArticle(a, sujet)).filter(x => x !== sujet), a.valeurs);\n    const vues = valeurs.slice(0, VALEURS_VUES_MAX), reste = valeurs.length - vues.length;\n"],
  ["{valeurs.length > 0 && <span className=\"cn-encre-2 cn-mono-chiffres cn-valeurs-lues\">{valeurs.join(' · ')}</span>}", "{valeurs.length > 0 && <span className=\"cn-encre-2 cn-mono-chiffres cn-valeurs-lues\">{vues.join(' · ')}{reste > 0 ? <span className=\"cn-mut\"> · +{reste}</span> : null}</span>}"],
]);

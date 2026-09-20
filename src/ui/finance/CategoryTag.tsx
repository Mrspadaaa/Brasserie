import React from 'react';
import type { FinanceCategory } from '../../types';
import { CATEGORY_LABELS } from './FinanceForms';

/**
 * La pastille de catégorie d'une écriture.
 *
 * ⚠️ Pourquoi une couleur, et pourquoi PAS celles de la bière.
 *
 * Dans une liste d'opérations, la question posée en parcourant du pouce est
 * « qu'est-ce que c'est ? » — du malt, du loyer, du nettoyage. Écrite en gris
 * au milieu du nom du fournisseur, la catégorie se lisait mot à mot ; on ne
 * repérait pas d'un coup d'œil que trois lignes d'affilée sont des charges
 * fixes. Une palette CATÉGORIELLE répond à ça, exactement comme la pastille de
 * style le fait pour les bières.
 *
 * L'échelle `ebc-*` est interdite ici : elle décrit la couleur d'un moût, et
 * une catégorie comptable n'a pas de couleur de bière. Les jetons d'état
 * (`alert`, `attention`, `hop`) le sont aussi : une catégorie n'est pas une
 * alerte. Ces teintes forment donc leur propre famille, déclarée dans
 * `finance.css` et reportée dans `DESIGN.md`.
 *
 * MESURES (script de vérification, fonds et textes réels) :
 *   · contraste texte/fond minimum  **6.86:1** — au-dessus du minimum AA de 4.5
 *   · écart perceptuel ΔE entre fonds minimum   **16.9**
 *   · écart perceptuel ΔE entre textes minimum  **13.4**
 * En dessous de ΔE 10 deux pastilles ne se distinguent plus d'un coup d'œil ;
 * les deux échelles restent au-dessus.
 *
 * « Autres frais » ne reçoit aucune teinte : c'est la catégorie fourre-tout,
 * elle n'a rien à signaler et garde le gris chaud du système.
 *
 * Le libellé est toujours écrit. La couleur accompagne le mot, elle ne le
 * remplace jamais — un daltonien lit la même chose que les autres.
 */
export function CategoryTag({ category, className = '' }: { category: string; className?: string }) {
  const known = Object.prototype.hasOwnProperty.call(CATEGORY_LABELS, category);
  const label = known ? CATEGORY_LABELS[category as FinanceCategory] : category;
  return <span className={`finance-tag finance-tag-${known ? category : 'divers'}${className ? ` ${className}` : ''}`}>{label}</span>;
}

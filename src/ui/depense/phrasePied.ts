// Le pied de la liste de la Dépense : ce que sont les deux nombres, et d'où vient l'écart (voie SM, 08.11).
// Sa plainte : « Et Détail 56,80 / 51,80 c'est assez trompeur et donne pas d'info.... Mettre des informations cooreante. On a l'impression que c'est faux
// alors que c'est juste ». Les lignes du ticket faisaient 51,80 (= le total imprimé) ; il avait ajouté « Idaho7 » 5,00 à la main : 56,80 / 51,80, juste mais illisible.
// Pur : aucun React. Les montants sont en centimes entiers ; l'arrondi suisse à 5 centimes est déjà dans `lignes` (D358).
import type { PurchaseLineDraft } from '../../services/purchaseEntry';

/** Une ligne ajoutée à la main : son nom (celui du libellé) et son montant, en centimes. */
export interface AjoutMain { nom: string; cents: number }

/**
 * Une ligne ajoutée à la main : une ligne sans rien de ce que la lecture pose sur les siennes. `nomLu` (le nom imprimé, gardé à la lecture, `lignesDeLecture`) la dit déjà :
 * « rien pour une saisie à la main ou un brouillon d'avant B » (`nomImprimeDe`). `imprime`, la référence et l'extrait s'ajoutent pour qu'une ligne lue dont le nom serait vide
 * ne passe jamais pour une ajoutée. Limite : une ligne de brouillon d'avant la version B, sans `nomLu`, serait dite « ajoutée » (le pied dit alors le vrai, un montant en plus).
 */
export const estAjouteeAMain = (l: Pick<PurchaseLineDraft, 'nomLu' | 'imprime' | 'sourceReference' | 'evidence'>): boolean =>
  !l.nomLu?.trim() && !l.imprime && !l.sourceReference?.trim() && !l.evidence?.trim();

/** Les lignes ajoutées à la main qui portent un montant, dans l'ordre de la liste. */
export function ajoutsALaMain(lines: readonly PurchaseLineDraft[]): AjoutMain[] {
  return lines.filter(l => estAjouteeAMain(l) && l.amount !== undefined && Math.round(l.amount * 100) !== 0)
    .map(l => ({ nom: l.description.trim(), cents: Math.round((l.amount ?? 0) * 100) }));
}

const NOM_MAX = 20;
const court = (nom: string): string => (nom.length > NOM_MAX ? `${nom.slice(0, NOM_MAX - 1)}…` : nom);

/**
 * La phrase du pied et son ton. Égal : « Lignes = total 51,80 » (neutre). Lignes au-dessus du total, l'écart égal aux lignes ajoutées à la main :
 * « Lignes 56,80 = total 51,80 + 5,00 ajouté (Idaho7) » (neutre : ce n'est pas une erreur) ; au-delà de deux lignes, leur nombre. Tout autre écart est un vrai écart,
 * dit en chiffres : « Lignes 56,80 · total 51,80 · 5,00 de plus » ou « de moins » (attention).
 * `lignes` et `total` sont en centimes (l'arrondi à 5 centimes dans `lignes`) ; `fr` écrit un montant en centimes (« 51,80 »).
 */
export function phraseDuPied(lignes: number, total: number, ajouts: readonly AjoutMain[], fr: (cents: number) => string): { texte: string; attention: boolean } {
  const ecart = lignes - total;
  if (ecart === 0) return { texte: `Lignes = total ${fr(total)}`, attention: false };
  const ajoutes = ajouts.reduce((s, a) => s + a.cents, 0);
  if (ecart > 0 && ajouts.length > 0 && ecart === ajoutes) {
    const qui = ajouts.length <= 2 ? ajouts.map(a => court(a.nom) || 'sans nom').join(', ') : `${ajouts.length} lignes`;
    return { texte: `Lignes ${fr(lignes)} = total ${fr(total)} + ${fr(ecart)} ajouté (${qui})`, attention: false };
  }
  return { texte: `Lignes ${fr(lignes)} · total ${fr(total)} · ${fr(Math.abs(ecart))} de ${ecart > 0 ? 'plus' : 'moins'}`, attention: true };
}

/** s1 (jeu en ligne, VERDICT-EN-LIGNE n° 5) : les natures que le serveur écrit en mot de code (« other / equipment ») se disent en français. */
const NATURE_FR: Record<string, string> = {
  stock: 'ingrédient', ingredient: 'ingrédient', packaging: 'emballage', cleaning: 'nettoyage', equipment: 'matériel', maintenance: 'entretien',
  service: 'service', shipping: 'port', discount: 'rabais', other: 'autre', unknown: 'inconnu',
};
/**
 * Un message du serveur (« VITRIFIC… — nature : lectures divergentes (other / equipment), vérifier… ») ne montre jamais un mot du code : dans ses parenthèses, chaque mot de nature
 * passe en français. Hors parenthèses (le nom de l'article, la phrase) rien ne change : « service » dans un nom reste « service ».
 */
export function sansMotsBruts(message: string): string {
  return message.replace(/\(([^)]*)\)/g, (_tout, dedans: string) => `(${dedans.replace(/\b[a-z]+\b/g, mot => NATURE_FR[mot] ?? mot)})`);
}

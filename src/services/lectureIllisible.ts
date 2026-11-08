// Rejeu en ligne ff0f822e, LL-5 et B2-17 : une lecture qui rend « ok » mais sans rien d'exploitable (photo floue ou sombre : ni ligne, ni total, ni fournisseur, ni date, ni numéro)
// n'est pas une dépense à confirmer champ par champ : c'est un document illisible, dit UNE fois, avec les deux issues du brasseur (03.11 : « documents illisible, entrer valeur
// à la main ou meilleure qualité de documents »). Aucune ligne n'est fabriquée à sa place (avant : une ligne « Achat » vide, « Lignes de la facture · 1 »).
// Pur : aucun service, aucun réseau. Les types sont importés en `import type` : un test qui simule `geminiScanner` n'a pas à le redéfinir ici.
import type { ScanOutcome, ScannedInvoiceResult } from './geminiScanner';

/** Les deux issues : une meilleure photo, ou la saisie à la main. Une seule phrase, un seul message. */
export const DOCUMENT_ILLISIBLE = 'Document illisible : rien d’exploitable n’a pu être lu. Reprends une photo plus nette, ou saisis les valeurs à la main.';

const rempli = (texte: string | undefined): boolean => typeof texte === 'string' && texte.trim() !== '';
const nombre = (n: number | null | undefined): boolean => typeof n === 'number' && Number.isFinite(n);

/**
 * Vrai quand la lecture ne porte aucune valeur : pas de total (TTC, HT, TVA), pas de fournisseur, de date ni de numéro, et aucune ligne portant un nom, une quantité, un prix
 * ou un montant. Une seule valeur lue (un fournisseur, un total) suffit pour que la lecture reste une lecture : l'inconnu n'est jamais fabriqué, mais le lu n'est jamais jeté.
 * Les avertissements, les points et la revue ne comptent pas : ils disent comment une valeur a été lue, pas qu'une valeur existe.
 */
export function lectureSansRien(result: Pick<ScannedInvoiceResult, 'vendor' | 'date' | 'invoiceNumber' | 'amountHT' | 'tvaAmount' | 'amountTTC' | 'items'> | undefined): boolean {
  if (!result) return false;
  if (nombre(result.amountTTC) || nombre(result.amountHT) || nombre(result.tvaAmount)) return false;
  if (rempli(result.vendor) || rempli(result.date) || rempli(result.invoiceNumber)) return false;
  return !(result.items ?? []).some(ligne => rempli(ligne.name) || nombre(ligne.quantity) || nombre(ligne.price) || nombre(ligne.amountTTC));
}

/** Une lecture sans rien d'exploitable devient une lecture non aboutie (`ok: false`, la pièce reste jointe) ; toute autre lecture passe telle quelle. */
export function illisibleSiVide(outcome: ScanOutcome): ScanOutcome {
  if (!outcome.ok || !lectureSansRien(outcome.result)) return outcome;
  const { result: _lecture, ...reste } = outcome;
  return { ...reste, ok: false, error: DOCUMENT_ILLISIBLE };
}

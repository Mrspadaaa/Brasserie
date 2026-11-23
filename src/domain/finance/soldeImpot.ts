// PD-2 (21.11) — la facture de l'impôt sur la bière solde l'échéance d'impôt de sa période, comme une facture d'achat solde son prévu.
// Pur : aucune écriture. L'échéance n'est pas un plan : c'est la sortie `brew:<brassin>:impot` que la prévision DÉRIVE de chaque brassin
// (`brewForecast.ts`, date = fin de la période du conditionnement + délai de paiement). Le lien s'écrit sur la pièce, `finance.soldeIds` : la prévision
// retire alors ces sorties (une seule règle, `retirerSoldees` dans forecast.ts) et la pièce, réelle, est seule à compter.
import type { ForecastItem } from './forecast';

/** Une échéance d'impôt à solder : tous les brassins qui tombent le même jour (une déclaration par période). */
export interface EcheanceImpot { ids: string[]; date: string; amountCents: number; nbBrassins: number; titre: string }

const normalise = (s?: string): string => (s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

/** La pièce est-elle une facture d'impôt sur la bière ? Son fournisseur (office fédéral) ou son libellé le dit ; une catégorie seule ne suffit pas. */
export function estPieceImpot(p: { vendor?: string; description?: string }): boolean {
  const t = `${normalise(p.vendor)} ${normalise(p.description)}`;
  return /\b(ofdf|bazg|ofd[cs]|douane|zoll)\b|impot sur la biere|taxe sur la biere|biersteuer|imposta sulla birra/.test(t);
}

/** Une sortie d'impôt dérivée d'un brassin (`brew:<id>:impot`), encore à payer. Montant 0 admis : un brassin sans litres nets garde son échéance (partielle), que la pièce réelle remplace. */
const estSortieImpot = (i: ForecastItem): boolean => i.source === 'brew' && i.direction === 'out' && i.id.endsWith(':impot');

/**
 * L'échéance que cette pièce solde : parmi les échéances d'impôt à venir, la plus proche de la date de la pièce (la plus ancienne si deux sont à égale distance).
 * Rien si la pièce n'est pas une facture d'impôt, ou si aucune échéance n'est dérivée. Jamais deux échéances d'un coup.
 */
export function echeanceImpotSoldeePar(items: readonly ForecastItem[], piece: { vendor?: string; description?: string; dateIso?: string }): EcheanceImpot | null {
  if (!estPieceImpot(piece)) return null;
  const parJour = new Map<string, ForecastItem[]>();
  for (const i of items) if (estSortieImpot(i)) parJour.set(i.date, [...(parJour.get(i.date) ?? []), i]);
  const jour = (d: string) => Date.parse(`${d}T12:00:00Z`);
  const ref = piece.dateIso ? jour(piece.dateIso) : null;
  const [date, sorties] = [...parJour.entries()].sort(([a], [b]) => (ref === null ? 0 : Math.abs(jour(a) - ref) - Math.abs(jour(b) - ref)) || a.localeCompare(b))[0] ?? [];
  if (!date || !sorties) return null;
  const nbBrassins = new Set(sorties.map(i => i.batchId ?? i.id)).size;
  return { ids: sorties.map(i => i.id), date, amountCents: sorties.reduce((s, i) => s + i.amountCents, 0), nbBrassins, titre: nbBrassins > 1 ? `Impôt sur la bière · ${nbBrassins} brassins` : 'Impôt sur la bière' };
}

/** Ce que la prévision retire : les sorties dérivées que les pièces actives disent soldées (`finance.soldeIds`). Les autres restent, intactes. */
export function retirerSoldees<T extends { id: string }>(derivees: readonly T[], soldees: ReadonlySet<string>): T[] {
  return soldees.size ? derivees.filter(i => !soldees.has(i.id)) : [...derivees];
}

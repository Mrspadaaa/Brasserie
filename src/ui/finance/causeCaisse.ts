import type { CashCause, LedgerSummary } from '../../domain/finance/ledger';
import { montant } from './previsions/format';

/** CP-4 : ce que dit, et où renvoie, la ligne « caisse inconnue » (Prévisions et Synthèse › En caisse). Le texte suit la cause du registre ; aucun chiffre n'est inventé. */
export interface RenvoiCaisse {
  cause: CashCause;
  titre: string;
  /** Petite ligne sous le titre (vide : rien à ajouter). */
  aide: string;
  /** profil : la feuille du solde ; paiements : le journal filtré « à confirmer » ; registre : le journal, sans filtre. */
  geste: 'profil' | 'paiements' | 'registre';
}

type Ouverture = { amountCents: number; date: string; confirmed: boolean } | undefined;

/** « 8 janv. » ; l'année seulement quand ce n'est pas celle d'aujourd'hui. */
export function jourLisible(iso: string, asOf: string): string {
  const autreAnnee = iso.slice(0, 4) !== asOf.slice(0, 4);
  return new Date(`${iso}T12:00:00Z`).toLocaleDateString('fr-CH', { day: 'numeric', month: 'short', timeZone: 'UTC', ...(autreAnnee ? { year: 'numeric' as const } : {}) });
}

/** La cause lue du registre ; un registre sans `cashCause` (ancienne forme) se lit d'après le solde saisi. null : la caisse est connue. */
export function causeDeLaCaisse(ledger: LedgerSummary, opening: Ouverture): CashCause | null {
  if (ledger.cashCause !== undefined) return ledger.cashCause;
  if (ledger.cashComplete) return null;
  return opening && Number.isSafeInteger(opening.amountCents) ? 'a-confirmer' : 'absent';
}

export function renvoiCaisse(ledger: LedgerSummary, opening: Ouverture, asOf: string): RenvoiCaisse | null {
  const cause = causeDeLaCaisse(ledger, opening);
  if (!cause) return null;
  if (cause === 'a-confirmer' && opening) {
    return { cause, geste: 'profil', titre: `Solde de ${montant(opening.amountCents)} au ${jourLisible(opening.date, asOf)} à confirmer`,
      aide: 'coche « J’ai vérifié ce solde » ; sans lui, seul l’écart est connu' };
  }
  if (cause === 'paiements' && opening) {
    return { cause, geste: 'paiements', titre: `Confirmer les paiements (${ledger.unknownSinceOpeningCount})`,
      aide: `depuis le ${jourLisible(opening.date, asOf)} ; sans eux, le solde n’est pas connu` };
  }
  if (cause === 'autre') return { cause, geste: 'registre', titre: 'Données à vérifier', aide: ledger.cashAlert ?? ledger.warnings[0] ?? '' };
  return { cause: 'absent', geste: 'profil', titre: 'Solde de départ à renseigner', aide: 'sans lui, seul l’écart de la période est connu' };
}

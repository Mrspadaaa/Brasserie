import type { PeriodeSynthese } from '../../../domain/finance/periodeSynthese';

/**
 * La puce IA d'Opérations (v6b) : « ✦ Pourquoi les charges fixes pèsent autant ? ». Le poste est le plus gros des piles de la période
 * (`periode.postes`, tous les montants viennent de `periodeSynthese`) ; sans poste, rien : la puce garde son libellé actuel.
 * La question envoyée parle du même poste : jamais un libellé qui promet une chose et une question qui en pose une autre.
 */
const POSTE: Record<string, { nom: string; pluriel: boolean }> = {
  chargesFixes: { nom: 'les charges fixes', pluriel: true }, brassage: { nom: 'le brassage', pluriel: false },
  nettoyage: { nom: 'le nettoyage', pluriel: false }, divers: { nom: 'les autres frais', pluriel: true },
};

export function questionPoste(periode: PeriodeSynthese, periodeDite: string): { libelle: string; question: string } | null {
  const plus = [...periode.postes].filter(p => p.cents > 0).sort((a, b) => b.cents - a.cents)[0];
  if (!plus) return null;
  const poste = POSTE[plus.categorie] ?? { nom: plus.categorie, pluriel: false };
  const verbe = poste.pluriel ? 'pèsent' : 'pèse';
  return {
    libelle: `Pourquoi ${poste.nom} ${verbe} autant ?`,
    question: `Pourquoi ${poste.nom} ${verbe} autant sur ${periodeDite} ? Explique ce qui compose ce poste (pièces, fournisseurs, charges qui reviennent), ce qui est payé ou à payer, et ce qui sort de l'ordinaire. Signale les données manquantes (pièce sans date, montant à confirmer).`,
  };
}

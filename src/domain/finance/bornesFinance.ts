// Les bornes métier des écritures : une seule table, lue par `validateFinanceTransaction` (donc par toute écriture enregistrée : vente, dépense,
// apport, avoir) et par les écrans qui préviennent avant d'enregistrer. Audit du 08.11 : MV-38 (vente de 999 999 CHF encaissée au comptoir),
// MV-41 (dépense de 999 999), AM-57 (date de pièce en 2062 ou 1999), B2-NOTE-10 (plafonds de Dépense posés sans donnée).
//
// Comme `bornesMetier.ts` pour la recette : hors bornes, une erreur claire, jamais un enregistrement silencieux. Chaque borne cite sa source,
// ou se dit « estimée » avec son raisonnement. Une écriture déjà enregistrée n'est pas réécrite : la borne ne joue qu'à l'enregistrement.

export interface BorneFinance { valeur: number; unite: string; source: string }

export const BORNES_FINANCE = {
  /** Une vente (comptoir, facture, quittance). */
  venteCents: {
    valeur: 5_000_000, unite: 'centimes',
    source: 'Estimée : une micro-brasserie de quelques hectolitres vend au plus quelques milliers de litres d’un coup (une palette, ~1 000 L à 5–8 CHF/L, soit ~8 000 CHF) ; marge de six, soit 50 000 CHF.',
  },
  /** Une dépense, un apport, un avoir ou toute autre pièce. */
  operationCents: {
    valeur: 25_000_000, unite: 'centimes',
    source: 'Estimée : l’achat le plus lourd d’une micro-brasserie est une installation de brassage (ordre de grandeur : 50 000 à 150 000 CHF pour une salle de brassage de 5 à 10 hl) ; marge de moitié, soit 250 000 CHF.',
  },
  /** Année de la date de pièce, au plus ancien. */
  anneeMin: { valeur: 2000, unite: 'année', source: 'Aucune brasserie suisse de l’outil n’a de pièce comptable antérieure à 2000.' },
  /** Date de pièce, au plus tard : combien de jours après aujourd'hui. */
  joursFutur: { valeur: 366, unite: 'jours', source: 'Une pièce se date du jour ou d’un mois à venir (facture d’avance) ; au-delà d’un an, c’est une prévision, pas une écriture.' },
} as const satisfies Record<string, BorneFinance>;

const fr = (cents: number) => (cents / 100).toLocaleString('fr-FR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

/** Le montant, s'il dépasse la borne de son genre : le message ; sinon `null`. `genre` : 'income' (vente) ou toute autre pièce. */
export function messageMontantHorsBornes(amountCents: number, genre: string = 'expense'): string | null {
  if (!Number.isFinite(amountCents) || amountCents <= 0) return null;
  const borne = genre === 'income' ? BORNES_FINANCE.venteCents : BORNES_FINANCE.operationCents;
  if (amountCents <= borne.valeur) return null;
  return `${fr(amountCents)} CHF dépasse ${fr(borne.valeur)} CHF, le plafond d’${genre === 'income' ? 'une vente' : 'une écriture'} dans cet outil : erreur de saisie probable (un zéro de trop ?). Vérifie le montant.`;
}

/** La même borne en CHF, pour un champ montant en francs. */
export const messageMontantChfHorsBornes = (chf: number | undefined, genre: string = 'expense'): string | null =>
  chf === undefined ? null : messageMontantHorsBornes(Math.round(chf * 100), genre);

/** La date de pièce (ISO `AAAA-MM-JJ`), si elle est trop ancienne ou trop loin dans le futur : le message ; sinon `null`. */
export function messageDateHorsBornes(isoDate: string, aujourdhui: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(isoDate) || !/^\d{4}-\d{2}-\d{2}$/.test(aujourdhui)) return null;
  const annee = Number(isoDate.slice(0, 4));
  if (annee < BORNES_FINANCE.anneeMin.valeur) return `La date ${isoDate.split('-').reverse().join('.')} est antérieure à ${BORNES_FINANCE.anneeMin.valeur} : erreur de saisie probable. Vérifie l’année.`;
  const limite = new Date(`${aujourdhui}T00:00:00Z`).getTime() + BORNES_FINANCE.joursFutur.valeur * 86_400_000;
  if (new Date(`${isoDate}T00:00:00Z`).getTime() > limite) return `La date ${isoDate.split('-').reverse().join('.')} est à plus d’un an : une pièce future se prévoit dans les prévisions. Vérifie l’année.`;
  return null;
}

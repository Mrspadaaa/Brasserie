/**
 * Les trois consignes de lecture d'un justificatif (voie k1-banc, 01.11).
 *
 * Déplacées telles quelles de `ai.ts` (`scanInvoiceSafely`) pour que le banc de lecture (`scripts/banc-lecture-facture.ts`) envoie
 * exactement les mêmes : jamais une copie. Le texte est celui d'avant, à l'octet près ; le test `banc-lecture-facture.test.ts` en
 * garde l'empreinte. Les lectures 1 et 2 partent ensemble ; la 3ᵉ ne part que sur une divergence (vote à trois).
 */
export const INVOICE_SCAN_PROMPTS = [
  'Transcris tout le justificatif joint, en-tête, totaux et chaque ligne, dans l’ordre du document. Contrôle les chiffres et les signes des remises.',
  'Effectue une lecture indépendante complète du justificatif joint. Vérifie en priorité fournisseur, date, référence, devise, HT, TVA, TTC puis chaque article dans l’ordre imprimé. Distingue achat durable, réparation et consommable. Ne paraphrase pas les désignations.',
  'Troisième contrôle attentif du document original : relis les petites lignes, séparateurs décimaux, signes, totaux, quantités, unités et la nature achat durable/réparation/consommable. Transcris de nouveau TOUS les champs et lignes dans leur ordre imprimé, avec les désignations exactes. Ne calcule aucune valeur absente.'
] as const;

/** La phrase d'une lecture à plusieurs captures jusqu'au 10.11 (témoin du banc). */
export const notePlusieursCapturesAvant = (count: number): string =>
  `Les ${count} images jointes sont des captures successives d’un même document, dans l’ordre de lecture ; elles peuvent se recouvrir. Chaque ligne imprimée ne se lit qu’une seule fois : si une ligne apparaît sur deux captures, ne la transcris qu’une fois.`;
/**
 * Mission 2026-11-10-fusion-lectures (jeux en ligne 4 à 7) : deux tickets d'un même règlement (Sun Store, « Total EFT 163,85 » sur les deux) envoyés en deux
 * captures ; l'ancienne phrase (« un même document ») faisait garder un seul ticket à la 3.8. La phrase dit aussi le cas de plusieurs pièces.
 */
export const notePlusieursCaptures = (count: number): string =>
  `Les ${count} images jointes sont, dans l’ordre, soit des captures successives d’un même document (elles peuvent se recouvrir : une ligne imprimée sur deux captures ne se transcrit qu’une fois), soit plusieurs tickets ou factures d’un même règlement. Dans ce second cas, transcris les lignes de chaque pièce, sans en laisser aucune de côté ; le montant total est celui du règlement commun quand il est imprimé (paiement, terminal), sinon la somme des totaux des pièces.`;

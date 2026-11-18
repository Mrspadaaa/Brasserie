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

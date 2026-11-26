// Adresse d'une QR-facture, sans le PDF : le repli des Réglages (companyDefaults) la lit au démarrage. Séparée de swissQrBill.ts (nuit du 26.11, PERF) :
// son import statique tirait jsPDF (334 Ko) dans le morceau de démarrage App.
/** Adresse structurée (norme SIX IG QR-bill 2.3 : seule l'adresse structurée est permise depuis le 22.11.2025). Pays = code ISO à 2 lettres. */
export interface AdresseStructuree { nom: string; rue: string; numero: string; npa: string; localite: string; pays: string }

const CASE_POSTALE = /^(case postale|postfach|c\.?\s?p\.?\s)/i;
const RUE_NUMERO = /^(.*\D)[ ,]+(\d+[A-Za-z]?(?:[-/]\d+[A-Za-z]?)?)$/;
const NPA_LOCALITE = /^(\d{4})\s+(.+)$/;

/**
 * Repli pour les données existantes (adresse en une chaîne, « 1700 Fribourg ») : découpe sans inventer, `null` si le texte ne se découpe pas
 * (NPA à 4 chiffres seulement, CH et LI). « Case postale 123 » reste entière dans `rue`. Ne remplace pas le contrôle `problemesAdresse`.
 */
export function adresseDepuisTexte(rue: string, npaLocalite?: string): Omit<AdresseStructuree, 'nom'> | null {
  let texteRue = (rue ?? '').trim(), texteLieu = (npaLocalite ?? '').trim();
  if (npaLocalite === undefined) {
    const coupe = /^(.*?)[,\n]+\s*(\d{4}\s+[^,\n]+)$/s.exec(texteRue);
    if (!coupe) return null;
    texteRue = coupe[1].trim(); texteLieu = coupe[2].trim();
  }
  const lieu = NPA_LOCALITE.exec(texteLieu);
  if (!lieu) return null;
  const numero = !CASE_POSTALE.test(texteRue) ? RUE_NUMERO.exec(texteRue) : null;
  return numero ? { rue: numero[1].trim(), numero: numero[2], npa: lieu[1], localite: lieu[2].trim(), pays: 'CH' } : { rue: texteRue, numero: '', npa: lieu[1], localite: lieu[2].trim(), pays: 'CH' };
}

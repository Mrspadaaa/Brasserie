/**
 * Les coordonnées de l'entreprise, quand la configuration ne les porte pas.
 *
 * ⚠️ Elles étaient ÉCRITES EN CLAIR dans le code — IBAN de la BCV, numéro
 * d'identification CHE, nom légal de l'exploitant — à trois endroits
 * différents, avec deux IBAN qui ne concordaient même pas. Sur un dépôt public,
 * un IBAN est une invitation à la fraude à la facture ; il n'a rien à faire
 * dans un fichier source, dépôt public ou non.
 *
 * Elles se lisent donc dans `.env` (jamais committé, voir `.env.example`). Le
 * vrai chemin reste la configuration de l'application — `config.company`, saisie
 * dans les Réglages — ces valeurs ne servent que de repli.
 */
const env = import.meta.env;

export const COMPANY_FALLBACK = {
  name: env.VITE_COMPANY_NAME || 'Ma Brasserie',
  owner: env.VITE_COMPANY_OWNER || 'Propriétaire',
  address: env.VITE_COMPANY_ADDRESS || '',
  npa: env.VITE_COMPANY_NPA || '',
  uid: env.VITE_COMPANY_UID || '',
  iban: env.VITE_COMPANY_IBAN || ''
};

/**
 * IBAN de repli, ou une consigne lisible.
 *
 * ⚠️ Un IBAN vide imprimé sur une QR-facture donne un document d'apparence
 * valable et impayable. Mieux vaut que le document dise ce qui manque.
 */
export const ibanOrNotice = (iban?: string): string =>
  iban || COMPANY_FALLBACK.iban || '⚠️ IBAN à renseigner dans les Réglages';

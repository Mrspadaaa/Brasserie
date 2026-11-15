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
import type { AppConfig } from '../types';
import { adresseDepuisTexte, type AdresseStructuree } from '../services/swissQrBill';

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

/** UID d'entreprise suisse : `CHE-123.456.789` (le gabarit `CHE-XXX.XXX.XXX` n'en est pas un). */
export const uidValide = (uid?: string): boolean => /^CHE-\d{3}\.\d{3}\.\d{3}$/.test((uid ?? '').trim());

/**
 * L'adresse structurée de la brasserie (nom compris), ou `null` si rien de lisible.
 * Ordre : `company.adresse` saisie, puis la chaîne `company.address` + `npa` découpée sans rien inventer, puis le repli `.env`.
 * Le gabarit de départ (« Ville ») est refusé en aval par `problemesAdresse`, pas ici.
 */
export function adresseBrasserie(company: Pick<AppConfig['company'], 'name' | 'address' | 'npa' | 'adresse'>, repli: { address?: string; npa?: string } = COMPANY_FALLBACK): AdresseStructuree | null {
  const nom = (company.name ?? '').trim();
  const a = company.adresse;
  if (a && (a.rue || a.npa || a.localite)) return { nom, rue: a.rue ?? '', numero: a.numero ?? '', npa: a.npa ?? '', localite: a.localite ?? '', pays: a.pays || 'CH' };
  const lue = adresseDepuisTexte(company.address ?? '', company.npa) ?? adresseDepuisTexte(repli.address ?? '', repli.npa);
  return lue ? { nom, ...lue } : null;
}

/**
 * Fusion d'identité à l'enregistrement de Réglages : un champ que le brasseur n'a pas touché (`saisi` = `initial`) reprend la valeur
 * fraîche du stockage (écrite entre-temps, par exemple depuis la caisse) ; un champ touché garde sa saisie. Évite qu'un instantané périmé
 * réécrase une adresse ou un IBAN.
 */
export function companyFraiche(initial: AppConfig['company'], saisi: AppConfig['company'], frais: AppConfig['company']): AppConfig['company'] {
  const same = (a: unknown, b: unknown) => JSON.stringify(a ?? null) === JSON.stringify(b ?? null);
  const sortie: AppConfig['company'] = { ...saisi };
  for (const cle of ['name', 'uid', 'adresse', 'iban', 'address', 'npa'] as const) {
    if (same(initial[cle], saisi[cle]) && frais[cle] !== undefined) (sortie as Record<string, unknown>)[cle] = frais[cle];
  }
  return sortie;
}

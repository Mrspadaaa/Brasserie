// IBAN : la méthode standard (ISO 13616) — pays + clé, longueur du pays, puis modulo 97 égal à 1. Pas de bibliothèque : dix lignes, sans dépendance.
// AM-66 : l'IBAN saisi dans les Réglages n'était pas validé et s'imprimait tel quel sur la facture client.

/** Longueur d'un IBAN suisse ou liechtensteinois (21) ; les autres pays ne sont contrôlés que par le modulo 97 et la longueur générale. */
const LONGUEUR_PAR_PAYS: Record<string, number> = { CH: 21, LI: 21 };

/** L'IBAN sans espaces et en majuscules, ou `null` s'il est vide. */
export function ibanCompact(texte: string | undefined): string | null {
  const compact = (texte ?? '').replace(/\s+/g, '').toUpperCase();
  return compact || null;
}

export function ibanValide(texte: string | undefined): boolean {
  const iban = ibanCompact(texte);
  if (!iban || !/^[A-Z]{2}\d{2}[A-Z0-9]{11,30}$/.test(iban)) return false;
  const attendu = LONGUEUR_PAR_PAYS[iban.slice(0, 2)];
  if (attendu && iban.length !== attendu) return false;
  // Les 4 premiers caractères passent à la fin ; chaque lettre vaut A=10 … Z=35 ; le reste de la division par 97 doit être 1.
  const rearrange = iban.slice(4) + iban.slice(0, 4);
  let reste = 0;
  for (const c of rearrange) {
    const valeur = c >= 'A' ? String(c.charCodeAt(0) - 55) : c;
    for (const chiffre of valeur) reste = (reste * 10 + Number(chiffre)) % 97;
  }
  return reste === 1;
}

/** L'IBAN en groupes de quatre (CH93 0076 2011 6238 5295 7), pour l'affichage. */
export const ibanAffiche = (texte: string | undefined): string => (ibanCompact(texte) ?? '').replace(/(.{4})/g, '$1 ').trim();

export const MESSAGE_IBAN = 'Cet IBAN n’est pas valide : vérifie les chiffres (un IBAN suisse a 21 caractères, par exemple CH93 0076 2011 6238 5295 7).';

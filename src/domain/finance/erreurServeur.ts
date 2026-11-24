/**
 * Erreurs du serveur (Firestore) en français (E44, 24.11) : le bandeau disait « Enregistrement refusé : Missing or insufficient permissions ».
 * Un texte par code ; le message brut du serveur reste dans la console (`console.error`), jamais dans le bandeau. Sans code connu : « erreur du serveur (code) ».
 */
const TEXTES: Record<string, string> = {
  'permission-denied': 'le serveur refuse cette écriture (droits insuffisants ou pièce modifiée entre-temps)',
  'unavailable': 'le serveur est injoignable (réseau coupé ou service indisponible)',
  'deadline-exceeded': 'le serveur n’a pas répondu à temps',
  'unauthenticated': 'tu n’es plus connecté : reconnecte-toi',
  'resource-exhausted': 'le serveur est saturé ou le quota est atteint',
  'failed-precondition': 'le serveur refuse : la pièce a changé entre-temps',
  'aborted': 'le serveur a interrompu l’écriture (conflit)',
  'already-exists': 'cette écriture existe déjà',
  'not-found': 'la pièce n’existe plus sur le serveur',
  'cancelled': 'l’écriture a été interrompue',
};

/** Le code d'une erreur Firestore, sans le préfixe « firestore/ » ; `''` si l'erreur n'en porte pas. */
export function codeServeur(erreur: unknown): string {
  const code = (erreur as { code?: unknown } | null | undefined)?.code;
  return typeof code === 'string' ? code.replace(/^firestore\//, '') : '';
}

/** Le texte français d'une erreur du serveur. */
export function texteErreurServeur(erreur: unknown): string {
  const code = codeServeur(erreur);
  if (code && TEXTES[code]) return TEXTES[code];
  return `erreur du serveur (${code || 'sans code'})`;
}

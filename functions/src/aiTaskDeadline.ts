/**
 * Délais de la passerelle IA, partagés par le serveur et le client.
 *
 * Banc réel #91 : un import en 3.8 `high` dépassait 100 s, alors que le client
 * Firebase abandonne par défaut à 70 s. Le serveur continuait, et Google
 * facturait, sans que personne ne l'apprenne. Désormais le serveur borne toute
 * la tâche, nouvelle tentative comprise, et le client attend plus longtemps
 * que lui : c'est toujours le serveur qui dit ce qui s'est passé.
 */

/** Durée totale d'une tâche `aiTask`, toutes tentatives comprises (le scan de facture a son propre délai de 100 s). */
export const AI_TASK_DEADLINE_MS = 120_000;

/**
 * Délais d'une lecture de facture (`scanInvoiceSafely`). SU-NOTE-6 (g1, 20.11, banc réel) : la photo d'un ticket tâché atteint 45 s en 3.8 (45 002 ms, « délai », la lecture entière
 * 52 s) : le résultat retombait sur le provisoire et ses montants faux. La 3.8 a donc 60 s ; les Flash-Lite (7 à 10 s au banc) gardent 45 s ; le total de 100 s coupe toujours tout.
 */
export const SCAN_LITE_TIMEOUT_MS = 45_000;
export const SCAN_STRONG_TIMEOUT_MS = 60_000;
export const SCAN_TOTAL_TIMEOUT_MS = 100_000;

/** Une nouvelle tentative ne part que s'il lui reste au moins ce temps. */
export const AI_TASK_MIN_ATTEMPT_MS = 30_000;

/** Plafond d'une seule requête ; la tâche entière reste bornée par `AI_TASK_DEADLINE_MS`. */
export const AI_ATTEMPT_TIMEOUT_MS = 100_000;

/**
 * Dit quand le délai arrête la tâche : la réponse a pu être générée, et facturée. Sans nom de fournisseur (DESIGN.md).
 * Partagé par `aiTask` et la correction de la base levures, qui ne relancent ni l'un ni l'autre après un dépassement.
 */
export const AI_OUT_OF_TIME_MESSAGE = `L’IA n’a pas abouti dans le délai de ${AI_TASK_DEADLINE_MS / 60_000} minutes. L’appel a pu être compté dans le budget IA ; réessaie plus tard.`;

/** Attente du client : délai serveur, plus les transactions de budget, un démarrage à froid et l'envoi d'une photo. */
export const AI_CLIENT_TIMEOUT_MS = 150_000;

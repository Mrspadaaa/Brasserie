/**
 * Côté worker des outils houblons v4 (#171) : la boucle qui sert le contrat de messages de
 * `src/domain/hopIndex/v4/client.ts` dans un worker persistant (un seul pour la session).
 *
 * Ce module ne connaît pas la table des calculs : le point d'entrée du worker l'importe et appelle `ecouter`
 * (maquette : `prototypes/houblons-v4/parcours/src/moteur/calcul.worker.ts` ; l'app fera de même au portage des écrans,
 * T12). Ainsi le domaine ne dépend pas d'un écran, et la même boucle se teste sans worker (tests/unit/hopIndexV4).
 *
 * Messages reçus, dans l'ordre d'envoi (un worker les traite un à un) :
 * - `{ type: 'donnees', donnees }` : alimente le moteur du worker (une fois au démarrage, puis à chaque changement de
 *   données) ; les requêtes suivantes lisent ces données ;
 * - une requête du contrat (`calcul` ou `prechauffer`) : la réponse au même identifiant, ou l'erreur en message.
 * Message émis hors contrat : `{ type: 'panne', message }` si l'alimentation échoue ; la page sert alors tout sur le fil
 * principal (repli, hopToolsTransport.ts).
 */
import { servir, type Calculs, type RequeteCalcul } from '../../domain/hopIndex/v4/client';

export interface MessageDonnees { type: 'donnees'; donnees: unknown }
export interface MessagePanne { type: 'panne'; message: string }
export type MessageVersWorker<C extends Calculs> = MessageDonnees | RequeteCalcul<C>;

/** Ce que la boucle lit de la portée du worker (`self`) : de quoi la tester sans worker. */
export interface PorteeWorker {
  onmessage: ((evenement: { data: unknown }) => void) | null;
  postMessage(message: unknown): void;
}

export interface OptionsEcoute {
  /** Reçoit les données du moteur (format choisi par l'entrée du worker : des données clonables, jamais une fonction). */
  alimenter?: (donnees: unknown) => void;
  /** Enveloppe des requêtes `prechauffer` (journal de l'adaptateur). */
  prechauffage?: <T>(f: () => T) => T;
}

/** Sert `calculs` sur la portée du worker. */
export function ecouter<C extends Calculs>(portee: PorteeWorker, calculs: C, options: OptionsEcoute = {}): void {
  portee.onmessage = (evenement) => {
    const m = evenement.data as MessageVersWorker<C> | null;
    if (!m || typeof m !== 'object') return;
    if (m.type === 'donnees') {
      try { options.alimenter?.(m.donnees); } catch (e) {
        portee.postMessage({ type: 'panne', message: e instanceof Error ? e.message : String(e) } satisfies MessagePanne);
      }
      return;
    }
    if (m.type === 'calcul' || m.type === 'prechauffer') portee.postMessage(servir(calculs, m, options.prechauffage));
  };
}

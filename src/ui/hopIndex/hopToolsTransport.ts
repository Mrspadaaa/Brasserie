/**
 * Côté page du worker persistant des outils houblons v4 (#171). Un `ServeurCalculs` (contrat de
 * `src/domain/hopIndex/v4/client.ts`) qui envoie chaque requête au worker par postMessage et rend sa réponse au même
 * identifiant. Les écrans ne changent pas : ils parlent au client, qui parle à ce serveur.
 *
 * Règles (contraintes de #171, décision du pilote, options a puis b) :
 * - un seul worker pour la session, alimenté une fois par les données du moteur (`alimenter`), puis à chaque changement ;
 * - le worker sert les préchauffages et les recalculs ; une PREMIÈRE ouverture sans résultat préchauffé est servie sur le
 *   fil principal (`servirSurPlace`, le repli synchrone) : aucun écran ne naît vide, aucun état d'attente n'apparaît ;
 * - si le worker ne démarre pas (page `file://`, navigateur sans worker, script introuvable) ou tombe en panne, tout
 *   passe sur le fil principal (repli) : les requêtes en vol y sont reservies, rien n'est perdu ni affiché deux fois.
 */
import type { Calculs, ReponseCalcul, RequeteCalcul, ServeurCalculs } from '../../domain/hopIndex/v4/client';
import type { MessageDonnees, MessagePanne } from './hopTools.worker';

/** Ce que le transport lit d'un Worker (de quoi le tester sans worker). */
export type WorkerOutils = Pick<Worker, 'postMessage' | 'terminate'> & {
  onmessage: ((evenement: { data: unknown }) => void) | null;
  onerror: ((evenement: { preventDefault?: () => void; message?: string }) => void) | null;
  onmessageerror: ((evenement: unknown) => void) | null;
};

export interface OptionsTransport<C extends Calculs> {
  /** Crée le worker ; une exception = pas de worker (repli). */
  creer: () => WorkerOutils;
  /** Le serveur du fil principal (servirSurFilPrincipal de la même table) : repli et première ouverture. */
  repli: ServeurCalculs<C> & { servirTout: NonNullable<ServeurCalculs<C>['servirTout']> };
  /** Les données du moteur, clonables (premier message du worker). null : données non clonables, pas de worker. */
  donnees?: () => unknown | null;
  /** Prévenu au passage au repli (journal, contrôles). */
  surRepli?: (raison: string) => void;
}

export type EtatTransport = 'worker' | 'repli';

export interface ServeurWorker<C extends Calculs> extends ServeurCalculs<C> {
  /** 'worker' tant que le worker sert ; 'repli' ensuite (définitif pour la session). */
  readonly etat: EtatTransport;
  /** Pourquoi le repli (null en mode worker). */
  readonly raison: string | null;
  /** Renvoie les données au worker (elles ont changé). null : non clonables, passage au repli. */
  alimenter(donnees: unknown | null): void;
}

export function servirParWorker<C extends Calculs>(o: OptionsTransport<C>): ServeurWorker<C> {
  let worker: WorkerOutils | null = null;
  let raison: string | null = null;
  const enAttente = new Map<number, { requete: RequeteCalcul<C>; rendre: (r: ReponseCalcul<C>) => void }>();

  const passerAuRepli = (pourquoi: string) => {
    if (raison) return;
    raison = pourquoi;
    if (worker) {
      worker.onmessage = null; worker.onerror = null; worker.onmessageerror = null;
      try { worker.terminate(); } catch { /* déjà arrêté */ }
      worker = null;
    }
    // Les requêtes en vol sont servies sur le fil principal, dans leur ordre d'envoi.
    const restantes = [...enAttente.values()];
    enAttente.clear();
    for (const x of restantes) void o.repli.envoyer(x.requete).then(x.rendre);
    o.surRepli?.(pourquoi);
  };

  const alimenter = (d: unknown | null) => {
    if (raison || !worker) return;
    if (d === null) { passerAuRepli('données du moteur non clonables'); return; }
    try { worker.postMessage({ type: 'donnees', donnees: d } satisfies MessageDonnees); } catch (e) {
      passerAuRepli(`données refusées par postMessage : ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  try {
    const d = o.donnees ? o.donnees() : undefined;
    if (d === null) throw new Error('données du moteur non clonables');
    worker = o.creer();
    worker.onmessage = (evenement) => {
      const m = evenement.data as ReponseCalcul<C> | MessagePanne | null;
      if (!m || typeof m !== 'object') return;
      if (m.type === 'panne') { passerAuRepli(`panne du worker : ${m.message}`); return; }
      const x = enAttente.get(m.id);
      if (!x) return;
      enAttente.delete(m.id);
      x.rendre(m);
    };
    worker.onerror = (evenement) => { evenement.preventDefault?.(); passerAuRepli(`worker en erreur${evenement.message ? ` : ${evenement.message}` : ''}`); };
    worker.onmessageerror = () => passerAuRepli('message illisible du worker');
    if (d !== undefined) alimenter(d);
  } catch (e) {
    passerAuRepli(`worker indisponible : ${e instanceof Error ? e.message : String(e)}`);
  }

  return {
    get etat() { return raison ? 'repli' : 'worker'; },
    get raison() { return raison; },
    alimenter,
    envoyer(requete) {
      if (raison || !worker) return o.repli.envoyer(requete);
      const w = worker;
      return new Promise<ReponseCalcul<C>>((rendre) => {
        enAttente.set(requete.id, { requete, rendre });
        try { w.postMessage(requete); } catch (e) {
          passerAuRepli(`requête refusée par postMessage : ${e instanceof Error ? e.message : String(e)}`);
        }
      });
    },
    // Première ouverture sans résultat gardé : le fil principal, comme avant le worker (option b).
    servirSurPlace: (requete) => o.repli.servirTout(requete),
    fermer() {
      if (worker) { worker.onmessage = null; worker.onerror = null; worker.onmessageerror = null; worker.terminate(); worker = null; }
      if (!raison) raison = 'fermé';
    },
  };
}

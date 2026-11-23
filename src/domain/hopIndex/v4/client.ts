// Interface asynchrone des calculs lourds du moteur v4 (#165, D65 § Recommandation 2, second temps).
// Les écrans demandent un calcul lourd (proposer, suggerer, remplacants, substitutes, préchauffage) par un CLIENT ; un
// SERVEUR le rend. Le contrat est un échange de messages, comme src/ui/hopIndex/hopSolverMessages.ts : une requête typée
// porte un identifiant, la réponse porte le même. Aujourd'hui le serveur tourne sur le fil principal
// (servirSurFilPrincipal) ; un worker persistant (T7, #171, seulement si le banc échoue) le remplacera en recevant les
// mêmes requêtes par postMessage et en rendant les mêmes réponses, sans toucher aux écrans. Le worker (T7) :
// src/ui/hopIndex/hopToolsTransport.ts (côté page) et hopTools.worker.ts (côté worker).
// `lireBiere` (0,27 ms chaud) reste synchrone, sous le doigt : il n'entre pas ici.
//
// Règles du client :
// - un canal par usage (un écran, une liste) : seule la réponse de sa requête la plus récente est rendue ; une réponse
//   périmée (le doigt a bougé entre-temps) est ignorée, jamais affichée ;
// - `lire` rend un résultat tout de suite quand c'est possible (serveur du fil principal, ou réponse déjà reçue, par
//   exemple préchauffée) : un écran n'a alors aucun état d'attente. Sinon il garde son dernier résultat (useCalcul de
//   l'adaptateur) ; aucun écran ne montre de roue ni de « chargement » (ses maquettes n'en ont pas, D65 angles morts) ;
// - les arguments et les résultats sont des données simples (clonables par postMessage) : ni fonction, ni classe.
import { Lru } from './lru';

/** Une table de calculs : nom → fonction pure et synchrone (côté serveur). */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Calculs = Record<string, (...args: any[]) => unknown>;
export type NomCalcul<C extends Calculs> = keyof C & string;
export type ArgsDe<C extends Calculs, N extends NomCalcul<C>> = Parameters<C[N]>;
export type ResultatDe<C extends Calculs, N extends NomCalcul<C>> = ReturnType<C[N]>;

/** Les calculs lourds que le contrat doit servir (D65) : un serveur qui en manque un est refusé par `verifierCalculs`. */
export const CALCULS_LOURDS = ['proposer', 'suggerer', 'remplacants', 'substitutes'] as const;
export type NomLourd = (typeof CALCULS_LOURDS)[number];

// ---------- Le contrat de messages ----------
/** Requête du client au serveur. `calcul` attend une réponse ; `prechauffer` calcule au repos et rend la valeur, que le
 * client garde pour un `lire` ultérieur (un écran ouvert d'un toucher la trouve sans attendre). */
export type RequeteCalcul<C extends Calculs> = {
  [N in NomCalcul<C>]: { id: number; type: 'calcul' | 'prechauffer'; nom: N; args: ArgsDe<C, N> };
}[NomCalcul<C>];
/** Réponse du serveur, au même identifiant que sa requête. */
export type ReponseCalcul<C extends Calculs> =
  | { [N in NomCalcul<C>]: { id: number; type: 'resultat'; nom: N; valeur: ResultatDe<C, N> } }[NomCalcul<C>]
  | { id: number; type: 'erreur'; nom: NomCalcul<C>; message: string };

/** Ce qu'un serveur offre au client. Un worker n'a que `envoyer` (postMessage, puis la réponse au même id). */
export interface ServeurCalculs<C extends Calculs> {
  envoyer(requete: RequeteCalcul<C>): Promise<ReponseCalcul<C>>;
  /** Fil principal seulement : la réponse tout de suite (synchrone). Absent d'un worker et du mode différé. */
  servirTout?: (requete: RequeteCalcul<C>) => ReponseCalcul<C>;
  /** Repli synchrone d'un worker (#171, option b) : la réponse calculée sur le fil principal, pour une PREMIÈRE ouverture
   * qui n'a ni résultat préchauffé ni résultat précédent à garder (sans lui, l'écran naîtrait vide). Absent du mode
   * différé, qui éprouve justement un écran sans réponse immédiate. */
  servirSurPlace?: (requete: RequeteCalcul<C>) => ReponseCalcul<C>;
  fermer?: () => void;
}

/** Sert une requête par la table : la réponse, ou l'erreur en message (jamais une exception qui traverse le contrat). */
export function servir<C extends Calculs>(calculs: C, requete: RequeteCalcul<C>, prechauffage?: <T>(f: () => T) => T): ReponseCalcul<C> {
  const f = calculs[requete.nom];
  if (typeof f !== 'function') return { id: requete.id, type: 'erreur', nom: requete.nom, message: `calcul inconnu : ${requete.nom}` };
  try {
    const run = () => f(...(requete.args as unknown[]));
    const valeur = requete.type === 'prechauffer' && prechauffage ? prechauffage(run) : run();
    return { id: requete.id, type: 'resultat', nom: requete.nom, valeur } as ReponseCalcul<C>;
  } catch (e) {
    return { id: requete.id, type: 'erreur', nom: requete.nom, message: e instanceof Error ? e.message : String(e) };
  }
}

export interface OptionsFilPrincipal {
  /** true : chaque requête est servie dans une tâche suivante (setTimeout 0), comme un worker la rendrait ; pas de
   * `servirTout`. Sert aux tests et à éprouver les écrans sans réponse immédiate. Défaut : false. */
  differer?: boolean;
  /** Enveloppe des requêtes `prechauffer` (journal de l'adaptateur : « prechauffage:<nom> »). */
  prechauffage?: <T>(f: () => T) => T;
}

/** Le serveur du fil principal : la table appelée dans le même fil (premier temps de D65). */
export function servirSurFilPrincipal<C extends Calculs>(calculs: C, options: OptionsFilPrincipal = {}): ServeurCalculs<C> {
  const un = (r: RequeteCalcul<C>) => servir(calculs, r, options.prechauffage);
  if (options.differer) {
    return { envoyer: (r) => new Promise((ok) => { setTimeout(() => ok(un(r)), 0); }) };
  }
  return { envoyer: (r) => Promise.resolve(un(r)), servirTout: un };
}

/** Les calculs lourds absents d'une table (vide : le contrat est tenu). */
export const verifierCalculs = (calculs: Calculs): NomLourd[] => CALCULS_LOURDS.filter((n) => typeof calculs[n] !== 'function');

// ---------- Le client ----------
/** Un résultat et les arguments qui l'ont produit (un résultat gardé peut venir d'une requête plus ancienne). */
export interface Recu<C extends Calculs, N extends NomCalcul<C>> { valeur: ResultatDe<C, N>; args: ArgsDe<C, N> }

/** Un canal : seule la réponse de sa requête la plus récente est rendue. */
export interface Canal<C extends Calculs, N extends NomCalcul<C>> {
  /** Envoie la requête. La promesse rend le résultat, ou `undefined` si une requête plus récente du canal l'a rendue
   * périmée, ou si le canal est fermé. Rejetée sur une erreur du calcul (requête la plus récente seulement). */
  demander(...args: ArgsDe<C, N>): Promise<Recu<C, N> | undefined>;
  /** Plus aucune réponse rendue (écran démonté). */
  fermer(): void;
}

export type MethodesAsynchrones<C extends Calculs> = { [N in NomCalcul<C>]: (...args: ArgsDe<C, N>) => Promise<ResultatDe<C, N>> };

export interface ClientCalculs<C extends Calculs> {
  /** Toutes les fonctions de la table, en asynchrone : client.proposer(recette, direction) → Promise. */
  readonly calculs: MethodesAsynchrones<C>;
  demander<N extends NomCalcul<C>>(nom: N, ...args: ArgsDe<C, N>): Promise<ResultatDe<C, N>>;
  /** Le résultat tout de suite si le serveur le peut (fil principal) ou s'il a déjà été reçu ; sinon, d'un worker, le
   * repli synchrone du fil principal (servirSurPlace, première ouverture) ; sinon undefined (mode différé). */
  lire<N extends NomCalcul<C>>(nom: N, ...args: ArgsDe<C, N>): ResultatDe<C, N> | undefined;
  /** Comme lire, sans le repli synchrone : un écran qui a déjà un résultat le garde et demande au worker (recalcul). */
  lireGarde<N extends NomCalcul<C>>(nom: N, ...args: ArgsDe<C, N>): ResultatDe<C, N> | undefined;
  /** Calcule au repos et garde la réponse pour `lire` ; les erreurs sont tues (l'écran refera le calcul et dira la sienne). */
  prechauffer<N extends NomCalcul<C>>(nom: N, ...args: ArgsDe<C, N>): Promise<void>;
  canal<N extends NomCalcul<C>>(nom: N): Canal<C, N>;
  /** La clé d'une requête (contenu, jamais l'identité d'un objet). */
  cle<N extends NomCalcul<C>>(nom: N, args: ArgsDe<C, N>): string;
  /** Oublie les réponses gardées (les données injectées ont changé). */
  vider(): void;
  /** true si `lire` répond toujours tout de suite (serveur du fil principal). */
  readonly immediat: boolean;
}

export interface OptionsClient<C extends Calculs> {
  /** Clé par calcul ; défaut JSON.stringify(args). */
  cles?: { [N in NomCalcul<C>]?: (...args: ArgsDe<C, N>) => string };
  /** Réponses gardées pour `lire` (préchauffées ou reçues d'un worker), au plus ce nombre. Défaut 256. */
  borne?: number;
}

export function creerClient<C extends Calculs>(serveur: ServeurCalculs<C>, options: OptionsClient<C> = {}): ClientCalculs<C> {
  let suivant = 0;
  const gardees = new Lru<unknown>(Math.max(2, options.borne ?? 256));
  // Génération des données : une réponse partie avant vider() n'est plus gardée (elle vient des données d'avant).
  let generation = 0;
  // Préchauffages en vol, par clé : un toucher qui demande la même chose attend leur réponse au lieu d'en refaire une.
  const enVol = new Map<string, Promise<ReponseCalcul<C>>>();
  const cle = <N extends NomCalcul<C>>(nom: N, args: ArgsDe<C, N>): string => {
    const f = options.cles?.[nom];
    return nom + '\u001f' + (f ? f(...args) : JSON.stringify(args));
  };
  const requete = <N extends NomCalcul<C>>(type: 'calcul' | 'prechauffer', nom: N, args: ArgsDe<C, N>) =>
    ({ id: ++suivant, type, nom, args }) as RequeteCalcul<C>;
  const valeurDe = <N extends NomCalcul<C>>(r: ReponseCalcul<C>): ResultatDe<C, N> => {
    if (r.type === 'erreur') throw new Error(r.message);
    return r.valeur as ResultatDe<C, N>;
  };
  const garder = (k: string, g: number, v: unknown) => { if (!serveur.servirTout && g === generation) gardees.set(k, v); };
  async function demander<N extends NomCalcul<C>>(nom: N, ...args: ArgsDe<C, N>): Promise<ResultatDe<C, N>> {
    const k = cle(nom, args), g = generation;
    const v = valeurDe<N>(await (enVol.get(k) ?? serveur.envoyer(requete('calcul', nom, args))));
    // Un serveur sans réponse immédiate (worker) : la réponse est gardée pour un `lire` suivant.
    garder(k, g, v);
    return v;
  }
  const lireGarde = <N extends NomCalcul<C>>(nom: N, args: ArgsDe<C, N>): ResultatDe<C, N> | undefined => {
    if (serveur.servirTout) return valeurDe(serveur.servirTout(requete('calcul', nom, args)));
    const k = cle(nom, args);
    return gardees.has(k) ? (gardees.get(k) as ResultatDe<C, N>) : undefined;
  };
  const calculs = new Proxy({} as MethodesAsynchrones<C>, {
    get: (_c, nom) => (typeof nom === 'string' ? (...args: unknown[]) => demander(nom as NomCalcul<C>, ...(args as ArgsDe<C, NomCalcul<C>>)) : undefined),
  });
  return {
    calculs,
    demander,
    immediat: !!serveur.servirTout,
    cle,
    lire(nom, ...args) {
      const v = lireGarde(nom, args);
      if (v !== undefined || !serveur.servirSurPlace) return v;
      const k = cle(nom, args), g = generation;
      const r = valeurDe<typeof nom>(serveur.servirSurPlace(requete('calcul', nom, args)));
      garder(k, g, r);
      return r;
    },
    lireGarde: (nom, ...args) => lireGarde(nom, args),
    async prechauffer(nom, ...args) {
      const k = cle(nom, args), g = generation;
      if (!serveur.servirTout && (gardees.has(k) || enVol.has(k))) return;
      const p = serveur.envoyer(requete('prechauffer', nom, args));
      if (!serveur.servirTout) enVol.set(k, p);
      try {
        garder(k, g, valeurDe(await p));
      } catch { /* rien : l'écran refera le calcul */ } finally { if (enVol.get(k) === p) enVol.delete(k); }
    },
    canal<N extends NomCalcul<C>>(nom: N): Canal<C, N> {
      let derniere = 0;
      let ferme = false;
      return {
        async demander(...args: ArgsDe<C, N>) {
          const id = ++derniere;
          let v: ResultatDe<C, N>;
          try { v = await demander(nom, ...args); } catch (e) {
            if (ferme || id !== derniere) return undefined;
            throw e;
          }
          // Périmée : une requête plus récente est partie depuis (le doigt a bougé), ou l'écran est fermé.
          if (ferme || id !== derniere) return undefined;
          return { valeur: v, args };
        },
        fermer() { ferme = true; },
      };
    },
    vider() { generation += 1; gardees.clear(); enVol.clear(); },
  };
}

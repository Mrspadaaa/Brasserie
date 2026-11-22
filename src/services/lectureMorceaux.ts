// D380, D381 : lire une longue pièce morceau par morceau, puis la recoller côté serveur (tâche `assemblerLecture`, aucune IA).
// « On peut pas se permettre de perdre ou "gagner" de l'information » : un morceau qui n'a pas été lu après sa nouvelle tentative ne donne JAMAIS une
// lecture partielle — l'erreur est levée et rien n'est assemblé. Chaque coupe intérieure a en plus une bande de contrôle, lue à part dans la même file :
// elle ne change aucune ligne, elle sert à lever une alerte à l'assemblage ; une bande non lue est simplement absente (« non recoupée »), jamais bloquante.
import { AiClient, type AiRequest, type AiResponse } from './aiClient';
import type { JonctionPiece, Partie } from './decoupe';

/** Combien d'appels (morceaux et bandes de contrôle) partent en même temps : le temps total est celui du plus lent. */
export const MORCEAUX_PARALLELES = 10;

export type Appeler = (req: AiRequest) => Promise<AiResponse>;
export interface OptionsLecture {
  /** Appelé à chaque morceau lu : `lus` sur `n` (les bandes de contrôle ne comptent pas). */
  onProgres?: (lus: number, n: number) => void;
  /** Levé quand la feuille se ferme : plus aucun appel ne part. */
  signal?: AbortSignal;
  /** Les coupes intérieures : une bande de contrôle à lire, ou un saut de page (transmis tel quel, rien à lire). */
  jonctions?: JonctionPiece[];
}

/** L'image, en `Blob` JPEG : `AiClient` envoie un fichier (le même chemin que toute pièce), il en refait la base 64. */
function blobDe(fichier: { data: string; mimeType: string }): Blob {
  const binaire = atob(fichier.data), octets = new Uint8Array(binaire.length);
  for (let i = 0; i < binaire.length; i++) octets[i] = binaire.charCodeAt(i);
  return new Blob([octets], { type: fichier.mimeType });
}

const lu = (reponse: AiResponse | undefined): reponse is AiResponse & { data: any } => !!reponse && reponse.ok === true && !!reponse.data && typeof reponse.data === 'object';

/**
 * Lit les morceaux et les bandes de contrôle dans la même file (10 à la fois, chacun réessayé UNE fois), puis demande l'assemblage avec les parties dans
 * l'ordre. Rend la réponse de l'assemblage (même forme qu'un `scanInvoice`, plus `morceaux: n`) ; sa durée est celle de toute la lecture.
 * Lève si un morceau reste en échec, sans assembler. Une bande en échec est absente de `context.jonctions`.
 */
export async function lireEnMorceaux(parties: Partie[], run: Appeler = req => AiClient.run(req), options: OptionsLecture = {}): Promise<AiResponse> {
  const n = parties.length, debut = Date.now();
  if (n < 1) throw new Error('Lecture en morceaux : aucun morceau à lire.');
  const lectures: Array<AiResponse & { data: any }> = new Array(n);
  const sauts = (options.jonctions ?? []).filter((j): j is { k: number; sautDePage: true } => 'sautDePage' in j);
  const bandes = (options.jonctions ?? []).filter((j): j is Exclude<JonctionPiece, { sautDePage: true }> => 'jonction' in j);
  const lecturesBandes = new Map<number, any[]>();
  const echecs: number[] = [];
  let lus = 0;

  /** Un appel, réessayé une fois. Rend la réponse lue, ou `null` après deux échecs (réponse non ok, données vides, exception). */
  const lireAvecEssai = async (requete: AiRequest): Promise<(AiResponse & { data: any }) | null> => {
    for (let essai = 0; essai < 2; essai++) {
      let reponse: AiResponse | undefined;
      try { reponse = await run(requete); } catch { reponse = undefined; }
      if (lu(reponse)) return reponse;
    }
    return null;
  };

  // Les morceaux d'abord (leur échec arrête tout), puis les bandes de contrôle.
  const taches: Array<() => Promise<void>> = [
    ...parties.map((partie, i) => async () => {
      const reponse = await lireAvecEssai({ task: 'scanInvoice', tier: 'fast', file: blobDe(partie.file), morceau: { k: i + 1, n } });
      if (reponse) { lectures[i] = reponse; options.onProgres?.(++lus, n); } else echecs.push(i + 1);
    }),
    ...bandes.map(bande => async () => {
      const reponse = await lireAvecEssai({ task: 'scanInvoice', tier: 'fast', file: blobDe(bande.file), jonction: bande.jonction });
      if (reponse) lecturesBandes.set(bande.jonction.k, Array.isArray(reponse.data.items) ? reponse.data.items : []);
    }),
  ];
  let prochain = 0;
  const ouvrier = async () => {
    // Un morceau en échec arrête les départs : lire la suite coûterait des appels pour une lecture qui ne sera pas assemblée.
    while (prochain < taches.length && echecs.length === 0 && !options.signal?.aborted) await taches[prochain++]();
  };
  await Promise.all(Array.from({ length: Math.min(MORCEAUX_PARALLELES, taches.length) }, ouvrier));

  if (options.signal?.aborted && lus < n) throw new Error('Lecture interrompue.');
  if (echecs.length) throw new Error(`Lecture en morceaux incomplète : la partie ${Math.min(...echecs)} sur ${n} n'a pas été lue. Réessaie.`);

  const jonctions = [
    ...[...lecturesBandes.entries()].map(([k, items]) => ({ k, items })),
    ...sauts.map(s => ({ k: s.k, sautDePage: true })),
  ].sort((a, b) => a.k - b.k);
  const reponse = await run({
    task: 'assemblerLecture', tier: 'fast',
    context: { parties: lectures.map((l, i) => ({ ...l.data, morceau: { k: i + 1, n }, coupeForcee: parties[i].coupeForcee === true })), jonctions },
  });
  if (!reponse?.ok || !reponse.data) return { ...(reponse ?? {}), ok: false, error: reponse?.error || 'Assemblage impossible. Réessaie.' } as AiResponse;
  return { ...reponse, elapsedMs: Date.now() - debut, cached: lectures.every(l => l.cached === true), model: lectures[0].model ?? reponse.model };
}

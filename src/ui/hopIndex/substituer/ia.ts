// L'IA dans Substituer (voie i2, son choix D du 26.10 : « C + IA », accord D80 : Flash-Lite, ~0,003 CHF par recherche).
// Le moteur v2 range, l'écran le montre tout de suite ; l'IA ne fait que reclasser ses 20 premiers (callable `hopReclasserIA`,
// functions/src/hopReclasserIA.ts) et dire une phrase par choix. Elle ne donne aucun score : ceux de l'écran restent ceux du moteur.
//
// Règles (VOIE i2) :
//  - l'appel part à l'ouverture, en ligne seulement ; hors ligne, ou si l'appel échoue : l'ordre du moteur, rien au premier plan ;
//  - réponse en moins de 3 s ET liste pas encore touchée : l'ordre de l'IA la remplace, une seule fois ; la puce « classé par l'IA »
//    apparaît et un toucher dessus rend l'ordre du moteur ;
//  - réponse plus tardive, ou après un toucher : la liste ne bouge pas ; la puce dit « ordre IA prêt » et un toucher l'applique ;
//  - une réponse invalide (hors liste, doublon, trop courte) est ignorée : jamais un ordre inventé.
import { useCallback, useEffect, useRef, useState } from 'react';
import { ficheDeCatalogue, type EntreeReclassement, type MomentIA } from '../../../../functions/src/hopReclassCore';
import { hopRef } from '../parcours/v4';
import type { Quand } from '../parcours/types';

/** Au-delà, la liste a déjà été lue : l'ordre de l'IA attend un toucher sur la puce. */
export const FENETRE_MS = 3000;
const TAILLE_REPONSE = 10;

export interface ReponseIA { ok: boolean; ordre?: string[]; phrases?: Record<string, string>; model?: string; error?: string }
export type TransportIA = (demande: EntreeReclassement) => Promise<ReponseIA>;

/** L'appel réel : le callable, par la Cloud Function (jamais une clé dans le navigateur). Importé à la demande : hors ligne ou
 * en test, Firebase n'est même pas chargé. */
const transportFirebase: TransportIA = async (demande) => {
  const [{ httpsCallable }, { functions }] = await Promise.all([import('firebase/functions'), import('../../../services/firebase')]);
  const r = await httpsCallable<EntreeReclassement, ReponseIA>(functions, 'hopReclasserIA', { timeout: 8000 })(demande);
  return r.data;
};
/** Sous Vitest, aucun transport par défaut : un écran monté dans un test n'appelle jamais le callable (ni Firebase, ni Gemini).
 * Un test qui veut la réponse de l'IA installe son transport simulé. */
const PAR_DEFAUT: TransportIA | null = import.meta.env.MODE === 'test' ? null : transportFirebase;
let transport: TransportIA | null = PAR_DEFAUT;
/** Pour les tests et le banc : un autre transport (null : celui par défaut). */
export function installerTransportIA(t: TransportIA | null): void { transport = t ?? PAR_DEFAUT; resultats.clear(); }

// Une réponse par demande, gardée pour la séance : revenir à un moment déjà lu, ou le double montage du mode strict, ne refacture pas.
const resultats = new Map<string, Promise<ReponseIA | null>>();

const momentDe = (q: Quand): MomentIA => (q.type === 'ebullition' ? { type: 'ebullition', minutes: q.minutes } : q.type === 'dryhop' ? { type: 'dryhop' } : { type: q.type });

/** La demande au callable : l'original, le moment et les 20 premiers du moteur avec leurs fiches courtes. null : rien à demander
 * (moins de 10 candidats, ou une fiche manque : on n'envoie rien d'inventé). */
export function demandeIA(hopKey: string, q: Quand, pool: readonly string[]): EntreeReclassement | null {
  const fiche = (k: string) => { const c = hopRef(k)?.catalogue; return c ? ficheDeCatalogue(c) : null; };
  const original = fiche(hopKey);
  if (!original) return null;
  const candidats = pool.flatMap((id) => { const f = fiche(id); return f ? [{ id, fiche: f }] : []; });
  return candidats.length >= TAILLE_REPONSE ? { moment: momentDe(q), original, candidats } : null;
}
export const cleDemande = (d: EntreeReclassement): string => `${d.original.nom}|${JSON.stringify(d.moment)}|${d.candidats.map((c) => c.id).join(',')}`;

/** Un ordre est reçu s'il est fait de 10 clés distinctes, toutes de la demande, chacune avec sa phrase. */
export function ordreValide(r: ReponseIA | null | undefined, d: EntreeReclassement): r is ReponseIA & { ordre: string[]; phrases: Record<string, string> } {
  if (!r?.ok || !Array.isArray(r.ordre) || !r.phrases || r.ordre.length !== TAILLE_REPONSE) return false;
  const permis = new Set(d.candidats.map((c) => c.id));
  return new Set(r.ordre).size === TAILLE_REPONSE && r.ordre.every((k) => permis.has(k) && typeof r.phrases![k] === 'string' && r.phrases![k].trim() !== '');
}

function demander(d: EntreeReclassement): Promise<ReponseIA | null> {
  const cle = cleDemande(d);
  let p = resultats.get(cle);
  if (!p) {
    p = Promise.resolve().then(() => (transport ? transport(d) : null)).then((r) => (ordreValide(r, d) ? r : null)).catch(() => null);
    // Un échec ne reste pas en mémoire : le prochain moment ou la prochaine ouverture réessaie.
    void p.then((r) => { if (!r && resultats.get(cle) === p) resultats.delete(cle); });
    resultats.set(cle, p);
  }
  return p;
}

export interface ClassementIA {
  /** Les clés rangées par l'IA, dans son ordre : à passer à la lecture de la liste quand `appliquee`. null : pas d'ordre. */
  ordre: readonly string[] | null;
  /** Une phrase par clé, affichée là où l'écran montre déjà le détail d'un remplaçant. Seulement quand l'ordre est appliqué. */
  phrases: Readonly<Record<string, string>>;
  /** Il y a un ordre de l'IA (la puce existe). */
  disponible: boolean;
  /** L'ordre de l'IA est celui de la liste. */
  appliquee: boolean;
  /** Un toucher sur la puce : applique l'ordre de l'IA, ou rend celui du moteur. */
  basculer: () => void;
  /** Le brasseur a touché la liste : une réponse tardive ne la fera plus bouger. */
  marquerTouche: () => void;
}
const VIDE: Readonly<Record<string, string>> = {};

/** `demande` null : rien à demander (hors ligne, pas de fiches). Une autre demande (un autre moment) repart de zéro. */
export function useClassementIA(demande: EntreeReclassement | null): ClassementIA {
  const cle = demande ? cleDemande(demande) : null;
  const [recu, setRecu] = useState<{ cle: string; reponse: ReponseIA & { ordre: string[]; phrases: Record<string, string> } } | null>(null);
  const [appliquee, setAppliquee] = useState(false);
  const touche = useRef(false);
  useEffect(() => {
    // Une nouvelle liste : le toucher d'avant ne compte plus, et rien n'est gardé de l'ordre d'avant.
    touche.current = false; setRecu(null); setAppliquee(false);
    if (!demande || (typeof navigator !== 'undefined' && navigator.onLine === false)) return;
    let vivant = true;
    const debut = Date.now();
    void demander(demande).then((r) => {
      if (!vivant || !r) return;
      setRecu({ cle: cle!, reponse: r as ReponseIA & { ordre: string[]; phrases: Record<string, string> } });
      // Une seule fois, et seulement si la réponse est vite là et que la liste n'a pas été touchée.
      if (Date.now() - debut < FENETRE_MS && !touche.current) setAppliquee(true);
    });
    return () => { vivant = false; };
  }, [cle]); // eslint-disable-line react-hooks/exhaustive-deps
  const courant = recu && recu.cle === cle ? recu.reponse : null;
  const basculer = useCallback(() => setAppliquee((a) => !a), []);
  const marquerTouche = useCallback(() => { touche.current = true; }, []);
  return { ordre: courant?.ordre ?? null, phrases: courant && appliquee ? courant.phrases : VIDE, disponible: !!courant, appliquee: !!courant && appliquee, basculer, marquerTouche };
}

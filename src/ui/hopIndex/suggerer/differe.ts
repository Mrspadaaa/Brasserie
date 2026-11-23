// D106 (coût de Suggérer) : un calcul lourd demandé APRÈS le premier affichage, au repos du navigateur.
// Suggérer s'ouvre sur `proposerRapide` (sans les remplacements « à IBU égal ») ; le calcul complet (`proposer`) est lancé ici, une fois l'écran peint, et ses remplacements arrivent
// ensuite. Rien n'est inventé en attendant : tant que la réponse manque, le hook rend undefined et l'écran garde ce qu'il montre (aucune roue, aucun « chargement », D65).
import { useEffect, useState } from 'react';
import type { ArgsDe, NomCalcul, Recu } from '../../../domain/hopIndex/v4/client';
import { calcul, type CalculsParcours } from '../parcours/calcul';
import { useCalcul } from '../parcours/useCalcul';
import { siDonneesChangent } from '../parcours/donnees';

type C = CalculsParcours;

/** Programme `f` au repos (requestIdleCallback, sinon une tâche suivante) ; rend l'annulation. Sans fenêtre (tests de domaine) : tout de suite. */
export function auReposDuNavigateur(f: () => void, delaiMs = 0): () => void {
  if (typeof window === 'undefined') { f(); return () => {}; }
  const w = window as Window & { requestIdleCallback?: (cb: () => void, o?: { timeout: number }) => number; cancelIdleCallback?: (n: number) => void };
  if (w.requestIdleCallback) { const n = w.requestIdleCallback(f, { timeout: 1500 }); return () => w.cancelIdleCallback?.(n); }
  const t = window.setTimeout(f, delaiMs);
  return () => window.clearTimeout(t);
}

/** D108, D111 : la place réservée au groupe « Remplacer … » (px, 390 de large : un titre et une ligne, 42 px mesurés en f6), à l'endroit où q2b le montre, avant le dry hop et la levure. Elle ne sert
 * que lorsque Suggérer s'ouvre SANS préchauffe (ouverture directe à froid : premier affichage rapide, appel complet différé) : le groupe, s'il arrive, prend cette place sans rien pousser. Après
 * préchauffe, l'appel complet est lu d'emblée (suggerer/index.tsx) : aucune arrivée, aucune réserve, aucun vide. Limite : un groupe de plus d'une ligne dépasse la réserve et pousse la suite du surplus. */
export const PLACE_REMPLACER_PX = 42;

// Les requêtes déjà autorisées dans cette session : un deuxième affichage de la même recette et de la même visée lit tout de suite le calcul complet (déjà gardé : aucun coût, aucune arrivée).
// Un changement des données du brasseur (stock, dégustation) vide le client : les autorisations tombent avec, sinon la réponse manquante serait recalculée à l'ouverture, sur le fil principal.
const dejaAutorisees = new Set<string>();
siDonneesChangent(() => dejaAutorisees.clear());
/** Oublie les autorisations (tests). */
export const oublierAutorisations = (): void => { dejaAutorisees.clear(); };

/** Comme `useCalcul`, mais la requête ne part qu'après le premier affichage de ces arguments. Le résultat rendu est toujours celui des arguments COURANTS : un résultat d'avant (la recette ou
 * la visée a changé) n'est jamais montré comme celui d'aujourd'hui. Une requête déjà autorisée plus tôt dans la session part tout de suite (sa réponse est gardée). */
export function useCalculApres<N extends NomCalcul<C>>(nom: N, args: ArgsDe<C, N> | null): Recu<C, N> | undefined {
  const client = calcul();
  const cle = args ? client.cle(nom, args) : null;
  const [autorisee, setAutorisee] = useState<string | null>(null);
  useEffect(() => {
    if (!cle) return;
    return auReposDuNavigateur(() => { dejaAutorisees.add(cle); setAutorisee(cle); });
  }, [cle]);
  const permise = !!cle && (autorisee === cle || dejaAutorisees.has(cle));
  const recu = useCalcul(nom, args && permise ? args : null);
  return recu && cle && permise && client.cle(nom, recu.args) === cle ? recu : undefined;
}

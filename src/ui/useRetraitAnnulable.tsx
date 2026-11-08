import React, { useCallback, useEffect, useRef, useState } from 'react';

/**
 * Retrait d'une ligne d'une liste, qui ne se perd pas et ne se double pas (BR-30, banc du 08.11).
 *
 * ⚠️ Pourquoi : la corbeille d'un palier ou d'une phase retirait par RANG (`items.filter((_, j) => j !== i)`) et la liste
 * est rendue avec `key={i}`. Au premier toucher, la liste raccourcit et la page remonte ; le second toucher d'un double
 * toucher tombe sur la même corbeille, qui est devenue celle du palier suivant, ou sur le réglage qui a pris sa place
 * (le rinçage passait à « Aucun »). Deux retraits, aucun message.
 *
 * Ce que fait la mécanique :
 *   - UN toucher = UN retrait : pendant `DELAI_VERROU_MS` après un retrait, un nouveau retrait est ignoré ; `verrou` est
 *     vrai, pour que la zone ne reçoive plus de toucher (classe `pointer-events-none` sur le conteneur) ;
 *   - l'état courant est lu dans une référence : deux appels dans le même rendu ne repartent pas de la même liste ;
 *   - « Annuler » rend la ligne retirée à son rang, tant qu'aucun autre retrait ne l'a remplacée (10 s).
 */
export const DELAI_VERROU_MS = 450;
const DELAI_AVIS_MS = 10_000;

export interface Retrait<T> { item: T; index: number; nom: string }

export function useRetraitAnnulable<T>(items: T[], setItems: (next: T[]) => void, nomDe: (item: T) => string) {
  const courant = useRef(items);
  courant.current = items;
  const dernierRetrait = useRef(Number.NEGATIVE_INFINITY);
  const [dernier, setDernier] = useState<Retrait<T> | null>(null);
  const [verrou, setVerrou] = useState(false);
  const minuteurVerrou = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const minuteurAvis = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => { clearTimeout(minuteurVerrou.current); clearTimeout(minuteurAvis.current); }, []);

  const retirer = useCallback((index: number) => {
    const liste = courant.current;
    if (Date.now() - dernierRetrait.current < DELAI_VERROU_MS) return;
    if (!Number.isInteger(index) || index < 0 || index >= liste.length) return;
    dernierRetrait.current = Date.now();
    const item = liste[index];
    const suite = liste.filter((_, j) => j !== index);
    courant.current = suite;
    setItems(suite);
    setDernier({ item, index, nom: nomDe(item) });
    setVerrou(true);
    clearTimeout(minuteurVerrou.current);
    minuteurVerrou.current = setTimeout(() => setVerrou(false), DELAI_VERROU_MS);
    clearTimeout(minuteurAvis.current);
    minuteurAvis.current = setTimeout(() => setDernier(null), DELAI_AVIS_MS);
  }, [setItems, nomDe]);

  const annuler = useCallback(() => {
    if (!dernier) return;
    const liste = [...courant.current];
    liste.splice(Math.min(dernier.index, liste.length), 0, dernier.item);
    courant.current = liste;
    setItems(liste);
    setDernier(null);
    clearTimeout(minuteurAvis.current);
  }, [dernier, setItems]);

  return { retirer, annuler, dernier, verrou };
}

/** La ligne « « Maturation » retiré. Annuler » sous la liste : dit ce qui est parti et le rend d'un toucher. */
export function AvisRetrait<T>({ dernier, onAnnuler }: { dernier: Retrait<T> | null; onAnnuler: () => void }) {
  if (!dernier) return null;
  return (
    <p role="status" className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-cave-200" data-booster="retrait-annulable">
      <span className="min-w-0 break-words">« {dernier.nom} » retiré.</span>
      <button type="button" onClick={onAnnuler} aria-label={`Annuler le retrait de ${dernier.nom}`}
        className="min-h-8 rounded-control border border-cave-600 px-2.5 text-sm font-medium text-cave-50 hover:bg-cave-850">
        Annuler
      </button>
    </p>
  );
}

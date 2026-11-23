import { useCallback, useSyncExternalStore } from 'react';
import { StorageService } from '../../services/storage';
import { REGLAGES_VIDES, reglagesValides, type ReglagesFournisseurs } from '../../domain/fournisseurs';

/**
 * Les noms réunis, les raisons gardées et les « plus tard » des fiches fournisseur : propres à l'appareil, sans schéma Firestore
 * (comme l'horizon du Stocks). Un petit magasin externe garde la liste et la fiche d'accord.
 */
const CLE = 'fournisseurs_reglages';
const ecouteurs = new Set<() => void>();
let vu: { brut: unknown; valeur: ReglagesFournisseurs } = { brut: undefined, valeur: REGLAGES_VIDES };

/** Même objet tant que le stockage ne change pas : `useSyncExternalStore` compare par identité. */
const lire = (): ReglagesFournisseurs => {
  const brut = StorageService.getUiState<unknown>(CLE, null);
  if (brut !== vu.brut) vu = { brut, valeur: reglagesValides(brut) };
  return vu.valeur;
};
const abonner = (cb: () => void) => { ecouteurs.add(cb); return () => { ecouteurs.delete(cb); }; };

export function useReglagesFournisseurs(): [ReglagesFournisseurs, (r: ReglagesFournisseurs) => void] {
  const reglages = useSyncExternalStore(abonner, lire, () => REGLAGES_VIDES);
  const regler = useCallback((r: ReglagesFournisseurs) => {
    StorageService.setUiState(CLE, r);
    ecouteurs.forEach(cb => cb());
  }, []);
  return [reglages, regler];
}

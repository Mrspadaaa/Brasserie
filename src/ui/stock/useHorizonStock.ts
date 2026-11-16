import { useCallback, useSyncExternalStore } from 'react';
import { StorageService } from '../../services/storage';
import { horizonValide, type Horizon } from '../../domain/stock/horizon';

/**
 * L'horizon commun « S49 · 6 sem. · Tout » (pastille C) : un seul réglage, propre à l'appareil, lu par le chiffre clé du Stocks
 * ET par la pastille de l'onglet (deux composants éloignés : un petit magasin externe les garde ensemble).
 * Par défaut : « avant le prochain brassin ».
 */
const CLE = 'stocks_horizon';
const ecouteurs = new Set<() => void>();

const lire = (): Horizon => {
  const v = StorageService.getUiState<unknown>(CLE, 'brassin');
  return horizonValide(v) ? v : 'brassin';
};
const abonner = (cb: () => void) => { ecouteurs.add(cb); return () => { ecouteurs.delete(cb); }; };

export function useHorizonStock(): [Horizon, (h: Horizon) => void] {
  const horizon = useSyncExternalStore(abonner, lire, () => 'brassin' as Horizon);
  const regler = useCallback((h: Horizon) => {
    StorageService.setUiState(CLE, h);
    ecouteurs.forEach((cb) => cb());
  }, []);
  return [horizon, regler];
}

/** « AAAA-MM-JJ » du jour, à l'heure locale (la semaine du brasseur ne passe pas à minuit UTC). */
export function aujourdhuiLocal(): string {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

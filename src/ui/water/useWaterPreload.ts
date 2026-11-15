import { useEffect, useRef } from 'react';
import { ACIDS } from '../../domain/water';
import { recallPreloadedWaterAnalysis, rememberPreloadedWaterAnalysis } from './waterAnalysisCache';
import { waterAnalysisKey, waterAnalysisSnapshot } from './waterAnalysisProtocol';
import { WaterAnalysisTransport } from './waterAnalysisTransport';
import { useWaterAnalysisInputs, type WaterAnalysisInputsProps } from './useWaterAnalysisInputs';

/** Pause après la dernière modification de la recette avant de lancer l'analyse : une frappe sur un malt ne la relance pas à chaque touche. */
export const WATER_PRELOAD_DELAY_MS = 300;

/**
 * Préchargement (15.11) : l'assistant connaît la recette bien avant l'ouverture de l'onglet Eau. Dès qu'elle est connue
 * (volumes d'eau posés) et que l'onglet n'est pas ouvert, on pose la même question que l'onglet (`useWaterAnalysisInputs` :
 * même entrée, même clé, même fonction `computeWaterAnalysis` dans le worker) ; la réponse est gardée sous sa clé et l'onglet la
 * lit dès son premier rendu, sans rien demander. Le calcul tourne dans le worker, jamais dans le tour de rendu ni de frappe.
 * Sans Worker (vieux navigateur, tests) ou pour une recette sans eau : rien, l'onglet calcule comme avant.
 */
export function useWaterPreload(props: WaterAnalysisInputsProps, enabled: boolean): void {
  // Le préchargement ne doit jamais faire tomber l'assistant : un état d'eau sans acide connu (brouillon ancien, test) ne se précalcule pas,
  // et l'onglet Eau reste seul à en répondre, comme avant.
  const acidKnown = !!ACIDS[props.state.acidId];
  const { solveInput, dilutionInput } = useWaterAnalysisInputs(acidKnown ? props : { ...props, state: { ...props.state, acidId: 'lactique' } });
  const usable = enabled && acidKnown && typeof Worker !== 'undefined' && props.state.mashWaterL > 0;
  const input = usable ? { solve: solveInput, dilution: dilutionInput } : undefined;
  const key = input ? waterAnalysisKey(input) : undefined;
  const latest = useRef<typeof input>(undefined);
  latest.current = input;
  const transport = useRef<WaterAnalysisTransport | undefined>(undefined);

  useEffect(() => {
    if (!key || recallPreloadedWaterAnalysis(key)) return;
    const timer = setTimeout(() => {
      const snapshot = latest.current && waterAnalysisSnapshot(latest.current);
      if (!snapshot) return;
      transport.current ??= new WaterAnalysisTransport(
        () => new Worker(new URL('./waterAnalysis.worker.ts', import.meta.url), { type: 'module' }),
        outcome => { if (outcome.result) rememberPreloadedWaterAnalysis(outcome.key, outcome.result); },
        { race: false },
      );
      transport.current.request(key, snapshot);
    }, WATER_PRELOAD_DELAY_MS);
    return () => clearTimeout(timer);
  }, [key]);

  // Un seul worker pour toute la vie de l'assistant ; on le rend quand l'onglet Eau s'ouvre (il crée alors le sien) ou au démontage.
  useEffect(() => {
    if (usable) return;
    transport.current?.dispose();
    transport.current = undefined;
  }, [usable]);
  useEffect(() => () => { transport.current?.dispose(); transport.current = undefined; }, []);
}

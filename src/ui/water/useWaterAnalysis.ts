import { useEffect, useMemo, useRef, useState } from 'react';
import { computeWaterAnalysis } from './computeWaterAnalysis';
import { recallPreloadedWaterAnalysis } from './waterAnalysisCache';
import { waterAnalysisKey, waterAnalysisSnapshot } from './waterAnalysisProtocol';
import type { WaterAnalysisInput, WaterAnalysisResult } from './waterAnalysisProtocol';
import { WaterAnalysisTransport } from './waterAnalysisTransport';
import type { WaterAnalysisOutcome } from './waterAnalysisTransport';

export type { WaterAnalysisInput, WaterAnalysisResult } from './waterAnalysisProtocol';

/** Advice runs away from typing and immediate treatment arithmetic. A result
 * belongs only to the exact current numeric snapshot, including manual acid. */
export function useWaterAnalysis(input: WaterAnalysisInput): { result: WaterAnalysisResult | undefined; pending: boolean } {
  const key = waterAnalysisKey(input);
  const snapshot = useMemo(() => waterAnalysisSnapshot(input), [key]);
  const hasWorker = typeof Worker !== 'undefined';
  // Préchargement : l'assistant a pu poser cette même question à l'étape d'avant ; la réponse est alors là dès le premier rendu.
  const preloaded = recallPreloadedWaterAnalysis(key);
  const synchronous = useMemo(() => hasWorker ? undefined : preloaded ?? computeWaterAnalysis(snapshot), [hasWorker, snapshot, preloaded]);
  const transport = useRef<WaterAnalysisTransport | undefined>(undefined);
  const [outcome, setOutcome] = useState<WaterAnalysisOutcome | undefined>(undefined);

  useEffect(() => {
    if (!hasWorker) return;
    const active = new WaterAnalysisTransport(
      () => new Worker(new URL('./waterAnalysis.worker.ts', import.meta.url), { type: 'module' }),
      setOutcome
    );
    transport.current = active;
    return () => { active.dispose(); transport.current = undefined; };
  }, [hasWorker]);

  // Réponse préchargée : rien à demander au worker (ni calcul sur place qui bloquerait le rendu qui suit).
  useEffect(() => { if (!preloaded) transport.current?.request(key, snapshot); }, [hasWorker, key, snapshot, preloaded]);

  if (!hasWorker) return { result: synchronous, pending: false };
  const current = outcome?.key === key ? outcome : undefined;
  if (current?.error) throw current.error;
  return { result: current?.result ?? preloaded, pending: !current && !preloaded };
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { computeWaterAnalysis } from './computeWaterAnalysis';
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
  const synchronous = useMemo(() => hasWorker ? undefined : computeWaterAnalysis(snapshot), [hasWorker, snapshot]);
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

  useEffect(() => { transport.current?.request(key, snapshot); }, [hasWorker, key, snapshot]);

  if (!hasWorker) return { result: synchronous, pending: false };
  const current = outcome?.key === key ? outcome : undefined;
  if (current?.error) throw current.error;
  return { result: current?.result, pending: !current };
}

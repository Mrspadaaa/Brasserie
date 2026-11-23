import { createWaterAnalysisComputer } from './computeWaterAnalysis';
import type { WaterAnalysisRequest, WaterAnalysisResponse } from './waterAnalysisProtocol';

// Keep worker typing local: adding the WebWorker lib globally conflicts with DOM.
const worker = self as unknown as {
  onmessage: (event: MessageEvent<WaterAnalysisRequest>) => void;
  postMessage: (response: WaterAnalysisResponse) => void;
};
const computeWaterAnalysis = createWaterAnalysisComputer();

worker.onmessage = ({ data: { id, key, input } }) => {
  let response: WaterAnalysisResponse;
  try {
    response = { kind: 'result', id, key, result: computeWaterAnalysis(input) };
  } catch (cause) {
    const error = cause instanceof Error ? cause : new Error(String(cause));
    response = { kind: 'error', id, key, error: { name: error.name, message: error.message, stack: error.stack } };
  }
  worker.postMessage(response);
};

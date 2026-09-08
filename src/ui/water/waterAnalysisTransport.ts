import { computeWaterAnalysis } from './computeWaterAnalysis';
import type { WaterAnalysisInput, WaterAnalysisRequest, WaterAnalysisResponse, WaterAnalysisResult } from './waterAnalysisProtocol';

type AnalysisWorker = Pick<Worker, 'postMessage' | 'terminate' | 'onmessage' | 'onerror' | 'onmessageerror'>;
export type WaterAnalysisOutcome = { key: string; result: WaterAnalysisResult; error?: never }
  | { key: string; error: Error; result?: never };

/** One running job and one replaceable latest request. A slow solve therefore
 * cannot create a backlog proportional to the number of acid-field keystrokes. */
export class WaterAnalysisTransport {
  private worker: AnalysisWorker | undefined;
  private latest: { key: string; input: WaterAnalysisInput } | undefined;
  private running: WaterAnalysisRequest | undefined;
  private settledKey: string | undefined;
  private nextId = 0;
  private disposed = false;

  constructor(createWorker: () => AnalysisWorker, private readonly publish: (outcome: WaterAnalysisOutcome) => void) {
    try {
      this.worker = createWorker();
      this.worker.onmessage = event => this.receive(event.data);
      this.worker.onerror = event => { event.preventDefault(); this.fallback(); };
      this.worker.onmessageerror = () => this.fallback();
    } catch {
      // Some browsers expose Worker but block construction (CSP, private mode).
      this.stopWorker();
    }
  }

  request(key: string, input: WaterAnalysisInput): void {
    if (this.disposed) return;
    this.latest = { key, input };
    this.pump();
  }

  dispose(): void {
    this.disposed = true;
    this.latest = undefined;
    this.running = undefined;
    this.stopWorker();
  }

  private pump(): void {
    if (this.disposed || this.running || !this.latest || this.latest.key === this.settledKey) return;
    const request = { ...this.latest, id: ++this.nextId };
    this.running = request;
    if (this.worker) {
      try { this.worker.postMessage(request); }
      catch { this.fallback(); }
      return;
    }
    let outcome: WaterAnalysisOutcome;
    try { outcome = { key: request.key, result: computeWaterAnalysis(request.input) }; }
    catch (cause) { outcome = { key: request.key, error: cause instanceof Error ? cause : new Error(String(cause)) }; }
    this.running = undefined;
    this.settledKey = request.key;
    this.publish(outcome);
  }

  private receive(response: WaterAnalysisResponse): void {
    if (this.disposed || !this.running || response?.id !== this.running.id || response.key !== this.running.key) return;
    if (response.kind !== 'result' && response.kind !== 'error') { this.fallback(); return; }
    this.running = undefined;
    if (response.key === this.latest?.key) {
      this.settledKey = response.key;
      if (response.kind === 'result') this.publish({ key: response.key, result: response.result });
      else {
        const error = new Error(response.error.message);
        error.name = response.error.name;
        if (response.error.stack) error.stack = response.error.stack;
        this.publish({ key: response.key, error });
      }
    }
    this.pump();
  }

  private stopWorker(): void {
    if (!this.worker) return;
    this.worker.onmessage = null;
    this.worker.onerror = null;
    this.worker.onmessageerror = null;
    this.worker.terminate();
    this.worker = undefined;
  }

  private fallback(): void {
    if (this.disposed) return;
    this.stopWorker();
    this.running = undefined;
    this.pump();
  }
}

import { computeWaterAnalysis } from './computeWaterAnalysis';
import type { WaterAnalysisInput, WaterAnalysisRequest, WaterAnalysisResponse, WaterAnalysisResult } from './waterAnalysisProtocol';

type AnalysisWorker = Pick<Worker, 'postMessage' | 'terminate' | 'onmessage' | 'onerror' | 'onmessageerror'>;
/** Délai de la première réponse du worker avant le repli sur place. Mesure à froid (22.10 et 15.11) : calcul 50 ms, worker en dev 110 ms. */
export const WORKER_FIRST_ANSWER_MS = 1500;
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
  /** Vrai dès que le worker a répondu une fois : il est alors vivant, et une réponse lente reste légitime. */
  private answered = false;
  private watchdog: ReturnType<typeof setTimeout> | undefined;
  private raceTimer: ReturnType<typeof setTimeout> | undefined;

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
    this.raceInPlace();
  }

  dispose(): void {
    this.disposed = true;
    this.latest = undefined;
    this.running = undefined;
    if (this.raceTimer !== undefined) clearTimeout(this.raceTimer);
    this.raceTimer = undefined;
    this.stopWorker();
  }

  /**
   * Course (15.11) : un worker froid met 100 ms et plus à répondre (démarrage, chargement du script ; plus long sur un téléphone, jamais s'il est
   * bloqué), alors que le calcul du minimum d'osmosée coûte 20 ms. Tant que le worker n'a jamais répondu, la demande la plus récente se calcule
   * donc aussi sur place, juste après le premier affichage (minuterie à 0, jamais dans le même tour que l'écriture de l'utilisateur) ; la première
   * réponse publiée gagne, l'autre est ignorée (`settledKey`). Une fois le worker éveillé, il reste seul maître : une frappe ne bloque plus l'écran.
   */
  private raceInPlace(): void {
    if (this.disposed || !this.worker || this.answered) return;
    if (this.raceTimer !== undefined) clearTimeout(this.raceTimer);
    this.raceTimer = setTimeout(() => {
      this.raceTimer = undefined;
      if (this.disposed || !this.worker || this.answered || !this.latest || this.latest.key === this.settledKey) return;
      const { key, input } = this.latest;
      let outcome: WaterAnalysisOutcome;
      try { outcome = { key, result: computeWaterAnalysis(input) }; }
      catch (cause) { outcome = { key, error: cause instanceof Error ? cause : new Error(String(cause)) }; }
      this.settledKey = key;
      this.publish(outcome);
    }, 0);
  }

  private pump(): void {
    if (this.disposed || this.running || !this.latest || this.latest.key === this.settledKey) return;
    const request = { ...this.latest, id: ++this.nextId };
    this.running = request;
    if (this.worker) {
      try { this.worker.postMessage(request); }
      catch { this.fallback(); return; }
      // RC-1 : un worker qui ne répond jamais (script bloqué, requête retenue) laissait « — » au bouton « Minimum trouvé d'osmosée » pour toujours.
      // Sans première réponse en 1,5 s, le calcul se fait sur place (50 ms mesurés, même fonction, même résultat).
      if (!this.answered && this.watchdog === undefined) {
        this.watchdog = setTimeout(() => { this.watchdog = undefined; if (!this.answered) this.fallback(); }, WORKER_FIRST_ANSWER_MS);
      }
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
    this.answered = true;
    this.clearWatchdog();
    this.running = undefined;
    // La course a pu publier cette clé avant le worker : même fonction, même résultat, rien à republier.
    if (response.key === this.latest?.key && response.key !== this.settledKey) {
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

  private clearWatchdog(): void {
    if (this.watchdog !== undefined) clearTimeout(this.watchdog);
    this.watchdog = undefined;
  }

  private stopWorker(): void {
    this.clearWatchdog();
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

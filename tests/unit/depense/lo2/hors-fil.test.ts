// LO-2 : la préparation d'une photo (plan de découpe, QR) part dans un Worker ; sans Worker, la page fait le même calcul. Aucun vrai Worker ici (les vraies
// photos, un vrai Chrome et le fil principal mesuré : work/missions/2026-11-08-lecture-en-ligne/lo2/) : un Worker simulé qui répond, se trompe ou se tait.
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { lireQrDuFichier, type CodeLu, type MoteursQr } from '../../../../src/services/qrLecture';

type Reponse = (message: any, repondre: (m: any) => void) => void;
class FauxWorker {
  static comportement: Reponse = () => {};
  static crees = 0;
  onmessage: ((e: { data: any }) => void) | null = null;
  onerror: (() => void) | null = null;
  onmessageerror: (() => void) | null = null;
  terminated = false;
  constructor() { FauxWorker.crees++; }
  postMessage(message: any) { FauxWorker.comportement(message, m => queueMicrotask(() => this.onmessage?.({ data: m }))); }
  terminate() { this.terminated = true; }
  erreur() { this.onerror?.(); }
}

const photo = () => new File([new Uint8Array([1, 2, 3])], 'photo.jpg', { type: 'image/jpeg' });
let dernier: FauxWorker | null = null;

beforeEach(() => {
  FauxWorker.crees = 0; FauxWorker.comportement = () => {};
  vi.stubGlobal('Worker', class extends FauxWorker { constructor() { super(); dernier = this; } });
  vi.stubGlobal('OffscreenCanvas', class {});
  vi.stubGlobal('createImageBitmap', vi.fn());
  vi.resetModules();
});
afterEach(() => { vi.unstubAllGlobals(); vi.useRealTimers(); });

describe('LO-2 : le plan de découpe dans un Worker (decoupeTravail)', () => {
  it('rend le plan calculé par le Worker, sans le recalculer', async () => {
    FauxWorker.comportement = (m, repondre) => repondre({ id: m.id, plan: { finale: 'plan-du-worker' } });
    const { planifierHorsFil } = await import('../../../../src/services/decoupeTravail');
    await expect(planifierHorsFil(photo(), false)).resolves.toEqual({ finale: 'plan-du-worker' });
    expect(FauxWorker.crees).toBe(1);
  });

  it('rend null quand le Worker dit « rien à découper » (distinct de undefined : la page ne recalcule pas)', async () => {
    FauxWorker.comportement = (m, repondre) => repondre({ id: m.id, plan: null });
    const { planifierHorsFil } = await import('../../../../src/services/decoupeTravail');
    await expect(planifierHorsFil(photo(), false)).resolves.toBeNull();
  });

  it('envoie le fichier et force au Worker, et réutilise le même Worker', async () => {
    const vus: any[] = [];
    FauxWorker.comportement = (m, repondre) => { vus.push(m); repondre({ id: m.id, plan: null }); };
    const { planifierHorsFil } = await import('../../../../src/services/decoupeTravail');
    const f = photo();
    await planifierHorsFil(f, true); await planifierHorsFil(f, false);
    expect(vus.map(v => [v.fichier === f, v.force])).toEqual([[true, true], [true, false]]);
    expect(new Set(vus.map(v => v.id)).size).toBe(2);
    expect(FauxWorker.crees).toBe(1);
  });

  it('une erreur du Worker (canevas, image) : undefined, la page recalcule', async () => {
    FauxWorker.comportement = (m, repondre) => repondre({ id: m.id, erreur: 'canevas indisponible' });
    const { planifierHorsFil } = await import('../../../../src/services/decoupeTravail');
    await expect(planifierHorsFil(photo(), false)).resolves.toBeUndefined();
  });

  it('un Worker qui plante (fichier absent hors ligne, CSP) : undefined, puis il n\'est plus essayé', async () => {
    FauxWorker.comportement = () => { queueMicrotask(() => dernier?.erreur()); };
    const { planifierHorsFil, travailleurPossible } = await import('../../../../src/services/decoupeTravail');
    await expect(planifierHorsFil(photo(), false)).resolves.toBeUndefined();
    expect(dernier?.terminated).toBe(true);
    expect(travailleurPossible()).toBe(false);
    await expect(planifierHorsFil(photo(), false)).resolves.toBeUndefined();
    expect(FauxWorker.crees).toBe(1);
  });

  it('un Worker muet : abandonné après le délai, undefined', async () => {
    vi.useFakeTimers();
    const { planifierHorsFil, DELAI_WORKER_MS } = await import('../../../../src/services/decoupeTravail');
    const attente = planifierHorsFil(photo(), false);
    await vi.advanceTimersByTimeAsync(DELAI_WORKER_MS + 1);
    await expect(attente).resolves.toBeUndefined();
    expect(dernier?.terminated).toBe(true);
  });

  it('sans Worker ou sans OffscreenCanvas (vieux Safari) : undefined, aucun Worker créé', async () => {
    vi.stubGlobal('OffscreenCanvas', undefined);
    const { planifierHorsFil } = await import('../../../../src/services/decoupeTravail');
    await expect(planifierHorsFil(photo(), false)).resolves.toBeUndefined();
    expect(FauxWorker.crees).toBe(0);
  });
});

describe('LO-2 : decouperPiece et le plan hors du fil', () => {
  it('« rien à découper » du Worker : l\'image n\'est même pas décodée sur la page', async () => {
    const { brancherPlanificateur, decouperPiece } = await import('../../../../src/services/decoupe');
    brancherPlanificateur(async () => null);
    await expect(decouperPiece(photo())).resolves.toBeNull();
    expect(createImageBitmap).not.toHaveBeenCalled();
  });

  it('planificateur absent ou en échec : la page calcule elle-même (elle décode l\'image)', async () => {
    const { brancherPlanificateur, decouperPiece } = await import('../../../../src/services/decoupe');
    (createImageBitmap as any).mockRejectedValue(new Error('décodage sur la page'));
    brancherPlanificateur(async () => undefined);
    await expect(decouperPiece(photo())).rejects.toThrow('décodage sur la page');
    brancherPlanificateur(async () => { throw new Error('Worker mort'); });
    await expect(decouperPiece(photo())).rejects.toThrow('décodage sur la page');
    brancherPlanificateur(null);
    await expect(decouperPiece(photo())).rejects.toThrow('décodage sur la page');
    expect(createImageBitmap).toHaveBeenCalledTimes(3);
  });
});

describe('LO-2 : la seconde passe du QR (qrLecture)', () => {
  const illisible: CodeLu[] = [{ texte: '', decode: false }];
  const moteurs = (extra: Partial<MoteursQr>): MoteursQr & { agrandir: ReturnType<typeof vi.fn>; lireCodes: ReturnType<typeof vi.fn> } => ({
    lireCodes: vi.fn(async () => [] as CodeLu[]),
    pagesPdf: async function* () { /* aucune page */ },
    agrandir: vi.fn(async () => null),
    ...extra,
  }) as any;

  it('lireAgrandie rend des codes : c\'est la seconde passe, la page n\'agrandit rien', async () => {
    const m = moteurs({ lireAgrandie: async () => illisible });
    await expect(lireQrDuFichier(photo(), m)).resolves.toEqual({ statut: 'illisible' });
    expect(m.agrandir).not.toHaveBeenCalled();
    expect(m.lireCodes).toHaveBeenCalledTimes(1);
  });

  it('lireAgrandie rend null (image déjà grande) : pas de seconde passe, « sans »', async () => {
    const m = moteurs({ lireAgrandie: async () => null });
    await expect(lireQrDuFichier(photo(), m)).resolves.toEqual({ statut: 'sans' });
    expect(m.agrandir).not.toHaveBeenCalled();
  });

  it('lireAgrandie rend undefined (pas de Worker) : agrandir puis lireCodes, comme avant', async () => {
    const grande = {} as ImageData;
    const m = moteurs({ lireAgrandie: async () => undefined, agrandir: vi.fn(async () => grande) as any });
    m.lireCodes.mockResolvedValueOnce([]).mockResolvedValueOnce(illisible);
    await expect(lireQrDuFichier(photo(), m)).resolves.toEqual({ statut: 'illisible' });
    expect(m.agrandir).toHaveBeenCalledTimes(1);
    expect(m.lireCodes).toHaveBeenLastCalledWith(grande);
  });

  it('un moteur sans lireAgrandie (les tests existants) : inchangé', async () => {
    const m = moteurs({});
    await expect(lireQrDuFichier(photo(), m)).resolves.toEqual({ statut: 'sans' });
    expect(m.agrandir).toHaveBeenCalledTimes(1);
  });
});

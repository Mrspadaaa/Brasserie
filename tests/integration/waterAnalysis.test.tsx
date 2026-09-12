import { StrictMode } from 'react';
import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useWaterAnalysis } from '../../src/ui/water/useWaterAnalysis';
import { WaterAnalysisTransport } from '../../src/ui/water/waterAnalysisTransport';
import { waterAnalysisKey, waterAnalysisSnapshot } from '../../src/ui/water/waterAnalysisProtocol';
import type { WaterAnalysisInput, WaterAnalysisRequest, WaterAnalysisResponse, WaterAnalysisResult } from '../../src/ui/water/waterAnalysisProtocol';

const { compute } = vi.hoisted(() => ({ compute: vi.fn() }));
vi.mock('../../src/ui/water/computeWaterAnalysis', () => ({ computeWaterAnalysis: compute }));

const ions = { ca: 85, mg: 14, na: 8, so4: 28, cl: 22, hco3: 250 };
const ranges = Object.fromEntries(Object.keys(ions).map(ion => [ion, { min: 0, max: 300 }])) as WaterAnalysisInput['solve']['ranges'];
function input(value: number): WaterAnalysisInput {
  return {
    solve: { start: { ...ions }, target: { ...ions }, ranges, totalWaterL: 32.3, mashWaterL: 10.8, ratio: value },
    dilution: {
      source: { ...ions }, target: { ...ions }, ranges, totalWaterL: 32.3, mashWaterL: 10.8, spargeWaterL: 21.5,
      targetRa: { min: -60, max: 0 }, acid: 'lactique', beerVolumeL: 24, acidOverride: { mash: 0, sparge: value }
    }
  };
}
function resultFor(value: number): WaterAnalysisResult {
  return {
    solution: { doses: { gypsum: value }, achievedMash: ions, achievedSparge: ions, achievedWort: ions, unreachable: [] },
    justEnough: { feasible: true, pct: value, reasons: [], acid: { mash: 0, sparge: value, unit: 'mL', name: 'Lactique', hco3Left: 20 } }
  };
}

class FakeWorker {
  static instances: FakeWorker[] = [];
  onmessage: ((event: MessageEvent<WaterAnalysisResponse>) => void) | null = null;
  onerror: ((event: ErrorEvent) => void) | null = null;
  onmessageerror: (() => void) | null = null;
  requests: WaterAnalysisRequest[] = [];
  terminate = vi.fn();
  postMessage = vi.fn((request: WaterAnalysisRequest) => { this.requests.push(waterAnalysisSnapshot(request)); });
  constructor() { FakeWorker.instances.push(this); }
  reply(index = this.requests.length - 1) {
    const request = this.requests[index];
    this.onmessage?.({ data: { kind: 'result', id: request.id, key: request.key, result: resultFor(request.input.solve.ratio!) } } as MessageEvent<WaterAnalysisResponse>);
  }
  fail() {
    const preventDefault = vi.fn();
    this.onerror?.({ preventDefault } as unknown as ErrorEvent);
    return preventDefault;
  }
}

beforeEach(() => {
  FakeWorker.instances = [];
  vi.stubGlobal('Worker', FakeWorker);
  compute.mockReset().mockImplementation((snapshot: WaterAnalysisInput) => resultFor(snapshot.solve.ratio!));
});
afterEach(() => { cleanup(); vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('Water advice worker lifecycle and current-input contract', () => {
  it('does not run expensive advice on the rendering thread and exposes only a matching response', () => {
    const view = renderHook(useWaterAnalysis, { initialProps: input(1) });
    const worker = FakeWorker.instances[0];
    expect(compute).not.toHaveBeenCalled();
    expect(worker.requests).toHaveLength(1);
    expect(view.result.current).toEqual({ result: undefined, pending: true });
    act(() => worker.reply());
    expect(view.result.current).toEqual({ result: resultFor(1), pending: false });
    view.rerender(input(2));
    expect(view.result.current).toEqual({ result: undefined, pending: true });
    act(() => worker.reply());
    expect(view.result.current).toEqual({ result: resultFor(2), pending: false });
  });

  it('coalesces rapid acid changes into the latest pending snapshot, with at most one job in flight', () => {
    const view = renderHook(useWaterAnalysis, { initialProps: input(1) });
    const worker = FakeWorker.instances[0];
    view.rerender(input(2));
    view.rerender(input(3));
    view.rerender(input(4));
    expect(worker.requests).toHaveLength(1);
    act(() => worker.reply(0));
    expect(worker.requests.map(request => request.input.dilution.acidOverride?.sparge)).toEqual([1, 4]);
    expect(view.result.current).toEqual({ result: undefined, pending: true });
    // A duplicated/out-of-order reply must not settle the latest request.
    act(() => worker.reply(0));
    expect(worker.requests).toHaveLength(2);
    expect(view.result.current.pending).toBe(true);
    act(() => worker.reply(1));
    expect(view.result.current.result).toEqual(resultFor(4));
    expect(compute).not.toHaveBeenCalled();
  });

  it('accepts the original in-flight A when the user changes A → B → A', () => {
    const view = renderHook(useWaterAnalysis, { initialProps: input(1) });
    const worker = FakeWorker.instances[0];
    view.rerender(input(2));
    view.rerender(input(1));
    act(() => worker.reply(0));
    expect(view.result.current).toEqual({ result: resultFor(1), pending: false });
    expect(worker.requests).toHaveLength(1);
  });

  it('reuses the exact settled A after A → B → A and ignores the obsolete B', () => {
    const view = renderHook(useWaterAnalysis, { initialProps: input(1) });
    const worker = FakeWorker.instances[0];
    act(() => worker.reply());
    const settled = view.result.current.result;
    view.rerender(input(2));
    view.rerender(input(1));
    expect(view.result.current.result).toBe(settled);
    act(() => worker.reply(1));
    expect(view.result.current.result).toBe(settled);
    expect(worker.requests).toHaveLength(2);
  });

  it('does not invalidate advice when rerenders create equivalent objects or reorder their properties', () => {
    const view = renderHook(useWaterAnalysis, { initialProps: input(1) });
    const worker = FakeWorker.instances[0];
    act(() => worker.reply());
    const settled = view.result.current.result;
    const same = input(1);
    same.solve = Object.fromEntries(Object.entries(same.solve).reverse()) as WaterAnalysisInput['solve'];
    same.solve.disabled = undefined;
    view.rerender({ dilution: same.dilution, solve: same.solve });
    expect(view.result.current.result).toBe(settled);
    expect(worker.requests).toHaveLength(1);
    expect(FakeWorker.instances).toHaveLength(1);
  });

  it('snapshots queued values so later mutation cannot change what a keyed request means', () => {
    const view = renderHook(useWaterAnalysis, { initialProps: input(1) });
    const next = input(2);
    view.rerender(next);
    next.solve.ratio = 9;
    next.dilution.acidOverride!.sparge = 9;
    const worker = FakeWorker.instances[0];
    act(() => worker.reply(0));
    expect(worker.requests[1].input.solve.ratio).toBe(2);
    expect(worker.requests[1].input.dilution.acidOverride?.sparge).toBe(2);
  });

  it('terminates on unmount and ignores even an already captured late response handler', () => {
    const publish = vi.fn();
    const worker = new FakeWorker();
    const transport = new WaterAnalysisTransport(() => worker as unknown as Worker, publish);
    transport.request(waterAnalysisKey(input(1)), input(1));
    const lateMessage = worker.onmessage!;
    const request = worker.requests[0];
    transport.dispose();
    lateMessage({ data: { kind: 'result', id: request.id, key: request.key, result: resultFor(1) } } as MessageEvent<WaterAnalysisResponse>);
    transport.request(waterAnalysisKey(input(2)), input(2));
    expect(publish).not.toHaveBeenCalled();
    expect(worker.terminate).toHaveBeenCalledOnce();
    expect(worker.onmessage).toBeNull();
    expect(worker.requests).toHaveLength(1);

    const view = renderHook(useWaterAnalysis, { initialProps: input(3) });
    const mountedWorker = FakeWorker.instances[1];
    view.unmount();
    expect(mountedWorker.terminate).toHaveBeenCalledOnce();
  });

  it('survives StrictMode effect remounts without accepting a destroyed worker response', () => {
    const view = renderHook(useWaterAnalysis, { initialProps: input(1), wrapper: StrictMode });
    expect(FakeWorker.instances).toHaveLength(2);
    expect(FakeWorker.instances[0].terminate).toHaveBeenCalledOnce();
    act(() => FakeWorker.instances[1].reply());
    expect(view.result.current).toEqual({ result: resultFor(1), pending: false });
  });
});

describe('Compatibility and failure behavior', () => {
  it('returns a synchronous, memoized result when Worker is unavailable', () => {
    vi.stubGlobal('Worker', undefined);
    const view = renderHook(useWaterAnalysis, { initialProps: input(1) });
    expect(view.result.current).toEqual({ result: resultFor(1), pending: false });
    view.rerender(input(1));
    expect(compute).toHaveBeenCalledOnce();
    view.rerender(input(2));
    expect(view.result.current.result).toEqual(resultFor(2));
    expect(compute).toHaveBeenCalledTimes(2);
  });

  it('falls back when construction is blocked, then computes subsequent inputs correctly', () => {
    vi.stubGlobal('Worker', class { constructor() { throw new Error('Worker blocked by browser'); } });
    const view = renderHook(useWaterAnalysis, { initialProps: input(1) });
    expect(view.result.current).toEqual({ result: resultFor(1), pending: false });
    view.rerender(input(2));
    expect(view.result.current).toEqual({ result: resultFor(2), pending: false });
    expect(compute.mock.calls.map(([snapshot]) => snapshot.solve.ratio)).toEqual([1, 2]);
  });

  it('recovers a worker runtime failure using only the latest requested acid values', () => {
    const view = renderHook(useWaterAnalysis, { initialProps: input(1) });
    const worker = FakeWorker.instances[0];
    view.rerender(input(2));
    view.rerender(input(3));
    act(() => { expect(worker.fail()).toHaveBeenCalledOnce(); });
    expect(worker.terminate).toHaveBeenCalledOnce();
    expect(compute.mock.calls.map(([snapshot]) => snapshot.solve.ratio)).toEqual([3]);
    expect(view.result.current).toEqual({ result: resultFor(3), pending: false });
    view.rerender(input(4));
    expect(view.result.current.result).toEqual(resultFor(4));
    expect(FakeWorker.instances).toHaveLength(1);
  });

  it('recovers message decoding and posting failures through the same latest-input fallback', () => {
    const view = renderHook(useWaterAnalysis, { initialProps: input(1) });
    view.rerender(input(2));
    act(() => FakeWorker.instances[0].onmessageerror?.());
    expect(view.result.current.result).toEqual(resultFor(2));
    const publish = vi.fn();
    const worker = new FakeWorker();
    worker.postMessage.mockImplementation(() => { throw new Error('Post failed'); });
    const transport = new WaterAnalysisTransport(() => worker as unknown as Worker, publish);
    transport.request(waterAnalysisKey(input(3)), input(3));
    expect(publish).toHaveBeenCalledWith({ key: waterAnalysisKey(input(3)), result: resultFor(3) });
    transport.dispose();
  });

  it('surfaces a current domain error instead of quietly retrying it as a transport failure', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    renderHook(useWaterAnalysis, { initialProps: input(1) });
    const worker = FakeWorker.instances[0];
    const request = worker.requests[0];
    expect(() => act(() => worker.onmessage?.({ data: {
      kind: 'error', id: request.id, key: request.key, error: { name: 'RangeError', message: 'Invalid water input' }
    } } as MessageEvent<WaterAnalysisResponse>))).toThrow('Invalid water input');
    expect(compute).not.toHaveBeenCalled();
  });

  it('preserves a domain error from fallback arithmetic', () => {
    compute.mockImplementation(() => { throw new RangeError('Invalid fallback input'); });
    const publish = vi.fn();
    const transport = new WaterAnalysisTransport(() => { throw new Error('Worker blocked'); }, publish);
    transport.request('current', input(1));
    expect(publish).toHaveBeenCalledWith({ key: 'current', error: expect.objectContaining({ name: 'RangeError', message: 'Invalid fallback input' }) });
    transport.dispose();
  });

  it('distinguishes infinite, null and NaN bounds while preserving them in a snapshot', () => {
    const infinity = { max: Infinity, min: -Infinity };
    expect(waterAnalysisSnapshot(infinity)).toEqual(infinity);
    expect(new Set([Infinity, -Infinity, NaN, null].map(max => waterAnalysisKey({ max }))).size).toBe(4);
    expect(waterAnalysisKey({ a: 1, b: 2 })).toBe(waterAnalysisKey({ b: 2, a: 1 }));
  });
});

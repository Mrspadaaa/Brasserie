import { act, cleanup, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { BrewAlarm } from '../../src/domain/brewCompanion';
import { useBrewSound } from '../../src/ui/useBrewSound';
import { playBrewAlarm, stopBrewAlarm } from '../../src/services/brewTimer';

vi.mock('../../src/services/brewTimer', () => ({
  playBrewAlarm: vi.fn(() => true),
  stopBrewAlarm: vi.fn()
}));
const alarm = (id: string, at = 1000): BrewAlarm => ({
  id,
  at,
  stepId: 'mash-0',
  title: 'Fin du palier',
  body: 'Vérifier la cuve'
});
beforeEach(() => {
  vi.useFakeTimers();
  vi.clearAllMocks();
});
afterEach(() => {
  cleanup();
  vi.useRealTimers();
});

describe('Sonnerie de brassage', () => {
  it('regroupe deux échéances simultanées en une sonnerie de trente secondes', () => {
    const due = [alarm('timer-mash-0'), alarm('add-a')];
    const view = renderHook(({ due }) => useBrewSound(due, true), { initialProps: { due } });
    expect(playBrewAlarm).toHaveBeenCalledTimes(1);
    expect(view.result.current.ringing).toBe(true);
    view.rerender({ due: [...due] });
    act(() => vi.advanceTimersByTime(29000));
    expect(view.result.current.ringing).toBe(true);
    act(() => vi.advanceTimersByTime(1200));
    expect(view.result.current.ringing).toBe(false);
    expect(playBrewAlarm).toHaveBeenCalledTimes(1);
  });

  it('arrête immédiatement sans acquitter le geste de brassage ni faire taire la prochaine échéance', () => {
    const first = alarm('timer-mash-0');
    const view = renderHook(({ due }) => useBrewSound(due, true), {
      initialProps: { due: [first] }
    });
    act(() => view.result.current.stop());
    expect(stopBrewAlarm).toHaveBeenCalled();
    expect(view.result.current.ringing).toBe(false);
    view.rerender({ due: [first] });
    expect(playBrewAlarm).toHaveBeenCalledTimes(1);
    view.rerender({ due: [first, alarm('add-b', 2000)] });
    expect(playBrewAlarm).toHaveBeenCalledTimes(2);
    view.rerender({ due: [first] });
    expect(view.result.current.ringing).toBe(false);
    expect(first).toEqual(alarm('timer-mash-0'));
  });

  it('cocher un des ajouts simultanés ne relance pas trente secondes de son', () => {
    const view = renderHook(({ due }) => useBrewSound(due, true), {
      initialProps: { due: [alarm('add-a-b')] }
    });
    view.rerender({ due: [alarm('add-b')] });
    expect(playBrewAlarm).toHaveBeenCalledTimes(1);
    view.rerender({ due: [] });
    expect(view.result.current.ringing).toBe(false);
    expect(stopBrewAlarm).toHaveBeenCalled();
  });

  it('couper le son interrompt la sonnerie et une échéance reçue en mode muet reste disponible à la réactivation', () => {
    const view = renderHook(({ enabled }) => useBrewSound([alarm('timer-mash-0')], enabled), {
      initialProps: { enabled: false }
    });
    expect(playBrewAlarm).not.toHaveBeenCalled();
    view.rerender({ enabled: true });
    expect(view.result.current.ringing).toBe(true);
    view.rerender({ enabled: false });
    expect(view.result.current.ringing).toBe(false);
    expect(stopBrewAlarm).toHaveBeenCalled();
  });

  it('quitter le compagnon coupe aussi un test sonore en cours', () => {
    const view = renderHook(() => useBrewSound([], true));
    act(() => view.result.current.test());
    expect(view.result.current.ringing).toBe(true);
    view.unmount();
    expect(stopBrewAlarm).toHaveBeenCalled();
    expect(vi.getTimerCount()).toBe(0);
  });
});

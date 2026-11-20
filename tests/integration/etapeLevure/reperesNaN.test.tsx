// Monkey, graine 3 (20.11) : « Volume en fermenteur : r » laisse volumeL = NaN ; Suggérer affichait « NaN L ». Un repère sans valeur n'est pas transmis aux vues.
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { EtapeLevure } from '../../../src/ui/etapeLevure/EtapeLevure';
import { recetteApercuEtapeLevure } from '../../../src/ui/etapeLevure/apercuDev';
import type { PropsVue } from '../../../src/ui/etapeLevure/props';
import type { TrialRecipe } from '../../../src/domain/hopIndex/trials';

const vues = vi.hoisted(() => ({ suggerer: undefined as PropsVue | undefined }));
vi.mock('../../../src/hooks/useLiveData', () => ({ useStorageValue: () => [] }));
vi.mock('../../../src/ui/etapeLevure/Chercher', () => ({ Chercher: () => <p>vue Chercher</p> }));
vi.mock('../../../src/ui/etapeLevure/Comparer', () => ({ Comparer: () => <p>vue Comparer</p> }));
vi.mock('../../../src/ui/etapeLevure/Suggerer', () => ({ Suggerer: (p: PropsVue) => { vues.suggerer = p; return <p>vue Suggérer</p>; } }));
afterEach(() => { cleanup(); });

describe('repères sans valeur (monkey, graine 3)', () => {
  it('volume, OG visée et température NaN : absents des repères, jamais « NaN »', () => {
    const r = recetteApercuEtapeLevure() as unknown as TrialRecipe;
    const recipe = { ...r, volumeL: Number.NaN, ogTarget: Number.NaN, fermentation: (r.fermentation ?? []).map(p => ({ ...p, tempC: Number.NaN })) } as TrialRecipe;
    render(<EtapeLevure recipe={recipe} vue="suggerer" onVue={vi.fn()} comparees={[]} onComparees={vi.fn()} onChoisir={vi.fn()} onChange={n => n}
      stockItems={[]} onStock={vi.fn()} onRetirer={vi.fn()} yeastChange={undefined} onYeastChange={vi.fn()}
      identityEditor={<p />} factsEditor={<p />} aiEditor={<p />} quantityEditor={<p />} atelier={() => <p />} />);
    const rep = vues.suggerer!.reperes as unknown as Record<string, unknown>;
    for (const k of ['volumeL', 'ogVisee', 'temperatureC', 'abvVise']) expect(Number.isNaN(rep[k] as number), k).toBe(false);
    expect(document.body.textContent).not.toMatch(/NaN/);
  });
});

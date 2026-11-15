// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { batchEntries } from '../../src/domain/productionCatalog';
import {
  lignesBilan,
  moisBilan,
  houblonsBilan,
  pastillesBilan,
  scoreBilan,
  titreBilan,
  positionSur,
  resumeNote
} from '../../src/ui/production/bilan/bilanModel';
import { CatalogAnalysis } from '../../src/ui/production/CatalogAnalysis';
import type { Batch } from '../../src/types';

afterEach(cleanup);

const snap = (extra: Record<string, unknown> = {}) =>
  ({
    name: 'x',
    style: 'Pilsner',
    volumeL: 24,
    ogTarget: 1.05,
    fgTarget: 1.01,
    abvTarget: 5.2,
    hops: [{ name: 'ZZ Citra', alpha: 12, weightG: 60, stage: 'boil' }],
    ...extra
  }) as never;
const lot = (id: string, extra: Partial<Batch> & Record<string, unknown>): Batch =>
  ({ id, name: `ZZ ${id}`, style: 'Pilsner', volumeL: 24, status: 'termine', brewDate: '2026-09-10', recipeSnapshot: snap(), ...extra }) as Batch;

const LOTS: Batch[] = [
  lot('A', { og: '1,050', fg: '1,010', abv: '5,2', volumeBrewedL: 24, volumePackagedL: 21, bottlingDate: '2026-10-01' }),
  lot('B', { og: '1,046', fg: '1,013', volumeBrewedL: 23, volumePackagedL: 20, brewDate: '2026-10-05' }),
  lot('C', {
    status: 'fermentation',
    og: '1,052',
    volumeBrewedL: 24,
    brewDate: '2026-11-01',
    gravityLog: [{ date: '2026-11-03', sg: 1.018 }]
  }),
  lot('D', { status: 'planifie', og: undefined, brewDate: '' })
];
const entries = batchEntries(LOTS);

describe('bilan : règles', () => {
  it('OG : écart en unités de densité et verdict selon la tolérance proposée ±0,002', () => {
    const l = lignesBilan(entries, 'og');
    expect(l.map((x) => [x.entry.id, x.diff, x.verdict])).toEqual([
      ['A', 0, 'ok'],
      ['B', -0.004, 'sous'],
      ['C', 0.002, 'ok']
    ]);
    expect(scoreBilan(l)).toMatchObject({ ok: 2, n: 3, ton: 'sous' });
    expect(titreBilan('og', scoreBilan(l), l.length)).toBe('2 brassins sur 3 dans la cible');
  });

  it('FG : le lot en fermentation se lit sur le dernier relevé et ne compte pas', () => {
    const l = lignesBilan(entries, 'fg');
    const c = l.find((x) => x.entry.id === 'C')!;
    expect(c.actual).toBe(1.018);
    expect(c.verdict).toBe('cours');
    const s = scoreBilan(l);
    expect(s.n).toBe(2);
    expect(titreBilan('fg', s, l.length)).toBe('1 stable sur 2 dans la bande');
    expect(pastillesBilan('fg', l, Date.parse('2026-11-06T12:00:00')).some((p) => p.ton === 'cours' && /1,018/.test(p.texte))).toBe(true);
  });

  it('un lot sans mesure n\'est jamais compté à zéro, un lot planifié reste hors bilan', () => {
    expect(lignesBilan(entries, 'abv').map((x) => x.entry.id)).toEqual(['A', 'B']); // B : alcool tiré de OG et FG mesurées, jamais saisi
    expect(lignesBilan(entries, 'og').some((x) => x.entry.id === 'D')).toBe(false);
    expect(titreBilan('abv', scoreBilan([]), 0)).toBe('Pas encore de comparaison possible');
  });

  it('le point reste dans l\'échelle', () => {
    expect(positionSur('og', 0)).toBe(50);
    expect(positionSur('og', 0.05)).toBe(100);
    expect(positionSur('og', -0.003)).toBe(25);
  });

  it('mois, houblons en grammes, résumé de note', () => {
    const m = moisBilan(entries);
    expect(m.mois.map((x) => [x.mois, x.brewed, x.packaged])).toEqual([
      ['2026-09', 24, 21],
      ['2026-10', 23, 20],
      ['2026-11', 24, 0]
    ]);
    expect(houblonsBilan(entries.filter((e) => e.batch!.status !== 'planifie'))[0]).toMatchObject({ nom: 'ZZ Citra', grammes: 180, fiches: 3 });
    expect(resumeNote('Sèche, poivrée, belle mousse. À refaire avec un peu plus de houblon.', 30).endsWith('…')).toBe(true);
  });
});

describe('bilan : écran', () => {
  const montrer = (props: Partial<React.ComponentProps<typeof CatalogAnalysis>> = {}) => {
    const onOpenBatch = vi.fn();
    const onFilter = vi.fn();
    render(<CatalogAnalysis kind="batches" entries={entries} onFilter={onFilter} onOpenBatch={onOpenBatch} {...props} />);
    return { onOpenBatch, onFilter };
  };

  it('répond d\'abord : la phrase, les quatre mesures avec leur compte, puis les lignes', () => {
    montrer();
    expect(screen.getByRole('heading', { name: '2 brassins sur 3 dans la cible' })).toBeTruthy();
    const seg = screen.getByRole('group', { name: 'Mesure à comparer' });
    expect(within(seg).getAllByRole('button').map((b) => b.textContent)).toEqual(['OG2/3', 'FG1/2', 'Alcool1/2', 'Volume2/3']);
  });

  it('changer de mesure change la phrase ; une ligne ouvre les mesures du brassin', () => {
    const { onOpenBatch } = montrer();
    fireEvent.click(screen.getByRole('button', { name: /Comparer densité finale/ }));
    expect(screen.getByRole('heading', { name: '1 stable sur 2 dans la bande' })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Mesures du brassin B' }));
    expect(onOpenBatch).toHaveBeenCalledWith(expect.objectContaining({ id: 'B' }), 'measurements');
  });

  it('les puces filtrent la liste ; le lot planifié est dit hors bilan', () => {
    const { onFilter } = montrer();
    fireEvent.click(screen.getByRole('button', { name: /Filtrer : Pilsner prévu/ }));
    expect(onFilter).toHaveBeenCalledWith('status', 'planifie');
    fireEvent.click(screen.getByRole('button', { name: 'Filtrer : ZZ Citra' }));
    expect(onFilter).toHaveBeenCalledWith('hop', 'ZZ Citra');
    expect(screen.getByText(/hors bilan/)).toBeTruthy();
  });

  it('Archives : actif même sans archive (p6, comme la maquette), sinon retire les lots archivés du bilan', () => {
    montrer();
    expect((screen.getByRole('button', { name: /^Archives/ }) as HTMLButtonElement).disabled).toBe(false);
    cleanup();
    const avecArchive = batchEntries(LOTS.map((b) => (b.id === 'B' ? { ...b, archivedAt: '2026-11-01' } : b)));
    montrer({ entries: avecArchive });
    const bascule = screen.getByRole('button', { name: /^Archives/ });
    expect((bascule as HTMLButtonElement).disabled).toBe(false);
    expect(screen.getByRole('heading', { name: '2 brassins sur 3 dans la cible' })).toBeTruthy();
    fireEvent.click(bascule);
    expect(screen.getByRole('heading', { name: /Les 2 brassins sont dans la cible/ })).toBeTruthy();
  });
});

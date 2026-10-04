import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import { YeastRecipeDossier } from '../../src/ui/YeastRecipeDossier';
import type { YeastSpec } from '../../src/types';
import type { YeastTechnicalFact } from '../../functions/src/yeastTechnicalFacts';

const knowledge = vi.hoisted(() => []);
vi.mock('../../src/hooks/useLiveData', () => ({ useStorageValue: () => knowledge }));
vi.mock('../../src/services/storage', () => ({ StorageService: { getHopKnowledge: () => knowledge } }));
afterEach(cleanup);

describe('Provenance du champ de floculation repris du stock', () => {
  const oldFact: YeastTechnicalFact = { key: 'flocculation', reported: 'Low', origin: 'ai', source: 'Ancienne fiche',
    sourceUrl: 'https://example.test/old', retrievedAt: '2026-09-01', context: 'Beer' };
  const acceptedFact: YeastTechnicalFact = { key: 'flocculation', reported: 'Low', origin: 'ai', source: 'Notice fabricant citée',
    sourceUrl: 'https://example.test/current-flocculation', retrievedAt: '2026-09-28',
    context: 'Beer · flocculation recommandée', acceptedScalarFields: ['yeastFlocculation'] };
  const stockItem = () => ({ ref: 'US05-LOT-A', name: 'SafAle US-05', yeastFlocculation: 'Low', yeastTechnicalFacts: [oldFact, acceptedFact] });
  const yeastCopiedFromStock = (stock: ReturnType<typeof stockItem>): YeastSpec => ({ name: stock.name, stockItemRef: stock.ref,
    flocculation: stock.yeastFlocculation, technicalFacts: structuredClone(stock.yeastTechnicalFacts) });

  it('montre la source, origine, date et contexte du compagnon accepté après copie puis réouverture JSON', () => {
    const stock = stockItem();
    const savedAndReopened = JSON.parse(JSON.stringify(yeastCopiedFromStock(stock))) as YeastSpec;
    render(<YeastRecipeDossier yeast={savedAndReopened} reference={null} onChange={vi.fn()} />);

    const row = screen.getByRole('group', { name: 'Floculation' });
    expect(within(row).getByText('Low')).toBeVisible();
    expect(within(row).getByText(/Recherche IA/)).toBeVisible();
    expect(within(row).getByRole('link', { name: 'Notice fabricant citée' })).toHaveAttribute('href', acceptedFact.sourceUrl);
    expect(row).toHaveTextContent('28.09.2026');
    expect(row).toHaveTextContent(acceptedFact.context!);
    expect(row).not.toHaveTextContent('Ancienne fiche');
  });

  it('ne donne pas la source d’un fait non lié à un ancien scalaire identique', () => {
    const legacy = yeastCopiedFromStock({ ...stockItem(), yeastTechnicalFacts: [oldFact] });
    render(<YeastRecipeDossier yeast={legacy} reference={null} onChange={vi.fn()} />);
    const row = screen.getByRole('group', { name: 'Floculation' });
    expect(within(row).getByText('Low')).toBeVisible();
    expect(row).not.toHaveTextContent('Recherche IA');
    expect(row).not.toHaveTextContent('Ancienne fiche');
    expect(within(row).queryByRole('link')).not.toBeInTheDocument();
  });
});

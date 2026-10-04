import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen, within } from '@testing-library/react';
import type { YeastTechnicalFact } from '../../functions/src/yeastTechnicalFacts';
import { YeastObservationList } from '../../src/ui/YeastRecipeDossier';

afterEach(cleanup);

describe('Observations documentaires d’une même valeur', () => {
  it('nomme les deux fiches et leurs contextes au lieu de rendre deux lignes semblables, sans perdre la troisième source', () => {
    const pdf = 'https://docs.example.invalid/M20.pdf';
    const base: YeastTechnicalFact = { key: 'temperature', reported: '18–30 °C',
      range: { min: 18, max: 30 }, unit: '°C', qualifier: 'range', origin: 'manufacturer', sourceUrl: pdf };
    const facts: YeastTechnicalFact[] = [
      { ...base, source: 'Craft Series — Brewers Yeasts, M20' },
      { ...base, source: 'Yeast Range, version 10', context: 'Beer' },
      { ...base, reported: '18–28 °C', range: { min: 18, max: 28 }, origin: 'ai', source: 'Réponse IA QA', sourceUrl: 'https://example.invalid/m20' }
    ];
    render(<YeastObservationList facts={facts} />);
    const rows = screen.getAllByText(/Fermentation :/).map(label => label.closest('[data-observation="temperature"]')!);
    expect(rows).toHaveLength(3);
    expect(rows[0]).toHaveTextContent('Source associée : Craft Series — Brewers Yeasts, M20 · contexte non indiqué');
    expect(rows[1]).toHaveTextContent('Source associée : Yeast Range, version 10 · contexte Beer');
    expect(rows[2]).not.toHaveTextContent('Source associée :');
    expect(rows[2]).toHaveTextContent('18–28 °C');
    const citations = screen.getByText('Sources').parentElement!;
    expect(within(citations).getAllByRole('link')).toHaveLength(2); // PDF commun + réponse IA distincte
  });
});

// @vitest-environment jsdom
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
/**
 * Voie f4-malts (D302) : « Compléter avec l'IA » reçoit la forme réelle d'un malt (plage et extrait, pas de point) et montre l'EBC et le PPG
 * déduits avec leur règle, dans le vrai composant. Gemini jamais appelé : le callable `aiTask` est simulé.
 */
const mocked = vi.hoisted(() => ({ call: vi.fn() }));
vi.mock('firebase/functions', () => ({ httpsCallable: () => mocked.call }));
vi.mock('../../../../src/services/firebase', () => ({ functions: {} }));
import { AiAssist } from '../../../../src/ui/AiAssist';

afterEach(() => { cleanup(); mocked.call.mockReset(); });

const BEST = { found: true, name: 'BEST Red X', source: 'BESTMALZ — Fiche technique BEST Red X®', sourceUrl: 'https://bestmalz.de', colorEbcMin: 28, colorEbcMax: 32, extractPct: 79 };

describe('Compléter avec l’IA : un malt publié en plage et en extrait', () => {
  it('montre 30 EBC et 36.3 PPG, dit leur règle (plage, extrait), et reprend ces deux valeurs', async () => {
    mocked.call.mockResolvedValue({ data: { ok: true, model: 'rejeu', tier: 'fast', data: BEST } });
    const onApply = vi.fn();
    render(<AiAssist kind="malt" name="BEST Red X" missing={['couleur EBC', 'potentiel PPG']} onApply={onApply} />);
    fireEvent.click(screen.getByRole('button', { name: /Compléter avec l’IA/ }));
    expect(await screen.findByText('30 EBC')).toBeTruthy();
    expect(screen.getByText('36.3 PPG')).toBeTruthy();
    expect(screen.getByText(/EBC déduit : milieu de la plage publiée 28 à 32 EBC ; PPG déduit : extrait publié 79 % × 0,46/)).toBeTruthy();
    expect(mocked.call.mock.calls[0][0]).toMatchObject({ task: 'lookupIngredient', context: { kind: 'malt', name: 'BEST Red X' } });
    fireEvent.click(screen.getByRole('button', { name: /Reprendre ces valeurs/ }));
    expect(onApply).toHaveBeenCalledTimes(1);
    expect(onApply.mock.calls[0][0]).toMatchObject({ colorEbc: 30, potentialPpg: 36.3 });
  });

  it('une plage incohérente et sans point : « Aucune caractéristique exploitable », rien de proposé', async () => {
    mocked.call.mockResolvedValue({ data: { ok: true, model: 'rejeu', tier: 'fast', data: { ...BEST, colorEbcMin: 32, colorEbcMax: 28, extractPct: undefined } } });
    render(<AiAssist kind="malt" name="BEST Red X" missing={['couleur EBC', 'potentiel PPG']} onApply={vi.fn()} />);
    fireEvent.click(screen.getByRole('button', { name: /Compléter avec l’IA/ }));
    expect(await screen.findByText(/Aucune caractéristique exploitable/)).toBeTruthy();
    expect(screen.queryByText(/EBC$/)).toBeNull();
  });
});

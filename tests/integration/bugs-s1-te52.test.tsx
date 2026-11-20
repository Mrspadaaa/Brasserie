/* TE-52 : « Sources et modèles » parle en mots de brasseur. Plus de « conventions initiales », « Documenter un modèle »,
   « références d'amertume à cru », « axes, plages, seuils et pondérations enregistrés dans l'index » (vocabulaire de développeur). */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
vi.mock('../../src/services/storage', () => ({ StorageService: {
  getHopVarieties: () => [], getHopLots: () => [], getHopKnowledge: () => [], getHopPredictions: () => [], getHopTastings: () => [],
  isReady: () => true, importHopIndex: vi.fn(async () => 0), subscribe: () => () => {}, saveHopVariety: vi.fn(), saveHopLot: vi.fn(), saveHopKnowledge: vi.fn(),
} }));
import { HopKnowledgePanel } from '../../src/ui/hopIndex/HopKnowledgePanel';

afterEach(cleanup);

describe('TE-52 — Sources et modèles sans vocabulaire de développeur', () => {
  it('aucun des termes rejetés au premier plan ; les quatre gestes restent là (sous « Gérer »)', () => {
    render(<HopKnowledgePanel />);
    const texte = document.body.textContent ?? '';
    for (const mot of [/conventions initiales/i, /Documenter un modèle/, /amertume à cru/i, /pondérations/i, /enregistrés dans l[’']index/i]) expect(texte).not.toMatch(mot);
    // T3B-4 (k2, point 5) : à toutes les largeurs, les quatre gestes sont sous « Gérer les sources et les modèles », monté à l’ouverture.
    const d = ([...document.querySelectorAll('summary')].find(x => /Gérer les sources/.test(x.textContent ?? ''))!).parentElement as HTMLDetailsElement;
    d.open = true; fireEvent(d, new Event('toggle'));
    for (const nom of [/^Ajouter les repères de base$/, /^Ajouter une levure$/, /^Ajouter un modèle$/, /^Ajouter les amertumes du houblon cru$/]) expect(screen.getByRole('button', { name: nom })).toBeInTheDocument();
  });
});

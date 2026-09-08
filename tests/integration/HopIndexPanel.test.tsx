import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { hopTestLot, hopTestVariety } from '../fixtures/hopIndex';
const state = vi.hoisted(() => ({ varieties: [] as any[], lots: [] as any[], listeners: new Set<() => void>(), ai: vi.fn() }));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: state.ai } }));
vi.mock('../../src/services/storage', async () => {
  const { assertHopDocument } = await import('../../functions/src/hopIndexSchema');
  return { StorageService: {
    getHopVarieties: () => state.varieties, getHopLots: () => state.lots,
    getHopKnowledge: () => [], isReady: () => true, importHopIndex: vi.fn(),
    subscribe: (cb: () => void) => { state.listeners.add(cb); return () => state.listeners.delete(cb); },
    saveHopVariety: (v: any) => { assertHopDocument('hopVarieties', v); state.varieties = [...state.varieties.filter(x => x.id !== v.id), v]; state.listeners.forEach(cb => cb()); },
    saveHopLot: (v: any) => { assertHopDocument('hopLots', v); state.lots = [...state.lots.filter(x => x.id !== v.id), v]; state.listeners.forEach(cb => cb()); }
  } };
});
import { HopIndexPanel } from '../../src/ui/hopIndex/HopIndexPanel';
beforeEach(() => { state.varieties = [hopTestVariety()]; state.lots = [hopTestLot()]; state.listeners.clear(); state.ai.mockReset(); });

describe('Parcours index houblon sans appel IA réel', () => {
  it('identifie un échantillon public et rend visibles ses limites', () => {
    state.lots[0].referenceOnly = true; state.lots[0].notes = 'Incertitude analytique non publiée.';
    render(<HopIndexPanel />); fireEvent.click(screen.getByRole('button', { name: /Variété témoin/ }));
    fireEvent.change(screen.getByLabelText('Lot à consulter'), { target: { value: 'test-lot' } });
    expect(screen.getByText('Échantillon publié')).toBeInTheDocument();
    expect(screen.getByText('Incertitude analytique non publiée.')).toBeInTheDocument();
  });
  it('crée une variété entièrement manuelle sans inventer de mesure', () => {
    render(<HopIndexPanel />);
    fireEvent.click(screen.getByRole('button', { name: 'Nouvelle variété' }));
    fireEvent.change(screen.getByLabelText('Nom de la variété'), { target: { value: 'Nouvelle' } });
    fireEvent.change(screen.getByLabelText('Alias (séparés par des virgules)'), { target: { value: 'Premier, Deuxième' } });
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la fiche' }));
    expect(state.varieties.find(v => v.name === 'Nouvelle')).toMatchObject({ aliases: ['Premier', 'Deuxième'], analysis: [], form: 'unknown' });
    expect(state.ai).not.toHaveBeenCalled();
  });
  it('affiche côte à côte le COA partiel et les références variétales', () => {
    render(<HopIndexPanel />);
    fireEvent.click(screen.getByRole('button', { name: /Variété témoin/ }));
    fireEvent.change(screen.getByLabelText('Lot à consulter'), { target: { value: 'test-lot' } });
    expect(screen.getByText('COA du lot')).toBeInTheDocument();
    expect(screen.getByText('Référence variété', { selector: 'span' })).toBeInTheDocument();
    expect(screen.getAllByText('Inconnu').length).toBeGreaterThan(0);
  });
  it('une panne IA laisse la saisie manuelle disponible', async () => {
    state.ai.mockResolvedValue({ ok: false, error: 'Hors ligne' });
    render(<HopIndexPanel />);
    fireEvent.change(screen.getByLabelText('Rechercher une variété ou un arôme documenté'), { target: { value: 'Recherche' } });
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Rechercher une fiche publiée' })));
    expect(screen.getByRole('alert')).toHaveTextContent('Hors ligne');
    fireEvent.click(screen.getByRole('button', { name: 'Nouvelle variété' }));
    expect(screen.getByLabelText('Nom de la variété')).toHaveValue('Recherche');
  });
  it('relit une recherche sourcée sans enregistrer les métadonnées de réponse comme champs métier', async () => {
    const { id: _id, ...reference } = hopTestVariety();
    state.ai.mockResolvedValue({ ok: true, data: { ...reference, name: 'Fiche trouvée', found: true,
      source: 'Fabricant témoin — https://example.test/hops' } });
    render(<HopIndexPanel />);
    fireEvent.change(screen.getByLabelText('Rechercher une variété ou un arôme documenté'), { target: { value: 'Fiche trouvée' } });
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Rechercher une fiche publiée' })));
    expect(screen.getByLabelText('Nom de la variété')).toHaveValue('Fiche trouvée');
    expect(screen.getByText(/Source de la recherche : Fabricant témoin/)).toBeInTheDocument();
    expect(state.varieties).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la fiche' }));
    const saved = state.varieties.find(v => v.name === 'Fiche trouvée');
    expect(saved).toMatchObject({ analysis: reference.analysis, descriptions: reference.descriptions });
    expect(saved).not.toHaveProperty('source');
    expect(saved).not.toHaveProperty('found');
  });
  it('relit une proposition de COA avant de compléter les champs absents', async () => {
    const extra = hopTestVariety().analysis[1];
    state.ai.mockResolvedValue({ ok: true, data: { found: true, analysis: [...hopTestLot().analysis.map(m => ({ ...m, value: 99, range: { min: 98, max: 100 } })), extra] } });
    render(<HopIndexPanel />);
    fireEvent.click(screen.getByRole('button', { name: /Variété témoin/ }));
    fireEvent.change(screen.getByLabelText('Lot à consulter'), { target: { value: 'test-lot' } });
    fireEvent.click(screen.getByRole('button', { name: 'Modifier le lot' }));
    await act(async () => fireEvent.change(screen.getByLabelText('COA à lire'), { target: { files: [new File(['fixture'], 'coa.pdf', { type: 'application/pdf' })] } }));
    expect(state.lots[0].analysis).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Compléter les champs absents avec la transcription' }));
    await act(async () => fireEvent.click(screen.getByRole('button', { name: 'Enregistrer la fiche' })));
    expect(state.lots[0].analysis).toHaveLength(2);
    expect(state.lots[0].analysis[0].value).toBe(7);
  });
});

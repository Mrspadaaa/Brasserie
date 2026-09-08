import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { fullRecipe } from '../fixtures/fullRecipe';
const memory = vi.hoisted(() => ({
  docs: new Map<string, any>(), listeners: new Set<() => void>(),
  writes: vi.fn(), attempts: vi.fn(), failure: null as Error | null, delay: null as Promise<void> | null,
}));
vi.mock('../../src/services/firestoreRepo', () => ({ FirestoreRepo: {
  all: (name: string) => [...memory.docs.entries()].filter(([key]) => key.startsWith(name + '/'))
    .map(([key, value]) => ({ ...structuredClone(value), __docId: key.split('/')[1] })),
  isReady: () => true,
  subscribe: (callback: () => void) => { memory.listeners.add(callback); return () => memory.listeners.delete(callback); },
  put: (name: string, id: string, value: any) => {
    if (memory.failure) throw memory.failure;
    memory.writes(name, id, value); memory.docs.set(`${name}/${id}`, structuredClone(value));
    memory.listeners.forEach(callback => callback());
  },
  bulkWrite: async (entries: any[]) => {
    memory.attempts(entries);
    if (memory.delay) await memory.delay;
    if (memory.failure) throw memory.failure;
    for (const { name, id, data } of entries) {
      memory.writes(name, id, data); memory.docs.set(`${name}/${id}`, structuredClone(data));
    }
    memory.listeners.forEach(callback => callback());
  },
} }));

import { FermentationWorkshop, FermentationRecipeSummary } from '../../src/ui/FermentationWorkshop';
import { guideFermentations } from '../../src/ui/hopIndex/guideData';
beforeEach(() => { memory.docs.clear(); memory.listeners.clear(); memory.writes.mockClear(); memory.attempts.mockClear(); memory.delay = null; memory.failure = null; });
afterEach(cleanup);
const recipe = () => ({ ...structuredClone(fullRecipe), yeast: { name: 'US-05', form: 'sèche' as const, qty: 1, unit: 'sachet' } });
const apply = () => fireEvent.click(screen.getByRole('button', { name: 'Appliquer cette levure et ces paliers' }));

describe('Atelier de levure dans une recette', () => {
  it('propose un objectif depuis pêche puis permet de comparer les souches et leur chimie sans écriture', () => {
    const onChange = vi.fn(); render(<FermentationWorkshop recipe={recipe()} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Arôme ou style recherché'), { target: { value: 'pêche' } });
    fireEvent.click(screen.getByRole('button', { name: 'Fruits et esters' }));
    expect(screen.getByLabelText('Objectif de fermentation')).toHaveValue('fruit');
    fireEvent.click(screen.getByRole('button', { name: /LalBrew Pomona/ }));
    expect(screen.getByRole('region', { name: 'Programme de levure proposé' })).toHaveTextContent('Pêche');
    expect(screen.getByText('Chimie des arômes et sous-produits')).toBeInTheDocument();
    expect(memory.writes).not.toHaveBeenCalled(); expect(onChange).not.toHaveBeenCalled();
  });
  it('montre les bornes du laboratoire et refuse une combinaison hors domaine sans toucher la recette', async () => {
    const onChange = vi.fn(); render(<FermentationWorkshop recipe={recipe()} onChange={onChange} />);
    const lab = screen.getByText('Calcul expérimental des phénols · étude DM303').closest('details')!;
    fireEvent(lab, new Event('toggle'));
    await act(async () => { lab.open = true; lab.dispatchEvent(new Event('toggle')); });
    fireEvent.click(await screen.findByLabelText('Simuler le protocole complet de l’étude avec DM303'));
    expect(screen.getByRole('region', { name: 'Laboratoire expérimental DM303' })).toHaveTextContent('2,16–2,51 mg/L');
    const change = (label: string, value: string) => { const el=screen.getByLabelText(label); fireEvent.change(el,{target:{value}});fireEvent.blur(el); };
    change('Blé (%)','40');change('Ébullition (min)','70');change('Fermentation (°C)','16');
    expect(screen.getByRole('region', { name: 'Laboratoire expérimental DM303' })).toHaveTextContent('Hors de l’enveloppe');
    expect(memory.writes).not.toHaveBeenCalled();expect(onChange).not.toHaveBeenCalled();
  });
  it('ne modifie rien en consultation ou après une écriture refusée, puis permet de réessayer', async () => {
    const onChange = vi.fn(), r = recipe(); render(<FermentationWorkshop recipe={r} onChange={onChange} />);
    expect(memory.writes).not.toHaveBeenCalled(); expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('figure', { name: 'Calendrier des températures de fermentation' })).toBeInTheDocument();
    memory.failure = Error('Écriture refusée'); apply();
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('Écriture refusée'));
    expect(onChange).not.toHaveBeenCalled(); expect(memory.writes).not.toHaveBeenCalled();
    memory.failure = null; apply();
    await waitFor(() => expect(onChange).toHaveBeenCalledOnce());
    expect(onChange.mock.calls[0][0].yeast.hopIndexId).toBe('lallemand-munich-classic');
    expect(onChange.mock.calls[0][0].hops).toEqual(r.hops);
  });
  it('détecte un changement de recette pendant la persistance et conserve les nouvelles données', async () => {
    const onChange = vi.fn(), r = recipe(); const host = render(<FermentationWorkshop recipe={r} onChange={onChange} />);
    let release!: () => void; memory.delay = new Promise<void>(resolve => { release = resolve; });
    apply(); await waitFor(() => expect(memory.attempts).toHaveBeenCalledOnce());
    host.rerender(<FermentationWorkshop recipe={{ ...r, volumeL: 80 }} onChange={onChange} />);
    await act(async () => { release(); await memory.delay; });
    await waitFor(() => expect(screen.getByRole('alert')).toHaveTextContent('La recette a changé'));
    expect(onChange).not.toHaveBeenCalled();
  });
  it('respecte les guides désactivés et ne rétablit pas leur proposition initiale', () => {
    const guides = guideFermentations([]);
    for (const g of guides) memory.docs.set('hopKnowledge/' + g.id, { ...g, enabled: false });
    render(<FermentationWorkshop recipe={recipe()} onChange={vi.fn()} />);
    expect(screen.getByRole('status')).toHaveTextContent('Aucune conduite active');
    expect(screen.queryByRole('button', { name: 'Appliquer cette levure et ces paliers' })).not.toBeInTheDocument();
    expect(memory.writes).not.toHaveBeenCalled();
  });
  it('garde les températures et jours manquants inconnus, et laisse la sélection de souche disponible', () => {
    render(<FermentationWorkshop recipe={recipe()} onChange={vi.fn()} />);
    fireEvent.change(screen.getByLabelText('Durée du palier 1 (jours)'), { target: { value: '' } });
    fireEvent.blur(screen.getByLabelText('Durée du palier 1 (jours)'));
    expect(screen.getByRole('button', { name: 'Appliquer cette levure et ces paliers' })).toBeDisabled();
    expect(screen.getByRole('button', { name: 'Choisir la levure seulement' })).toBeEnabled();
    expect(screen.queryByRole('figure')).not.toBeInTheDocument();
    expect(memory.writes).not.toHaveBeenCalled();
  });
  it('relit le programme figé sans écriture et expose les changements de température', async () => {
    const onChange = vi.fn(); const host = render(<FermentationWorkshop recipe={recipe()} onChange={onChange} />);
    apply(); await waitFor(() => expect(onChange).toHaveBeenCalledOnce());
    const adopted = onChange.mock.calls[0][0]; host.unmount(); memory.writes.mockClear();
    const view = render(<FermentationRecipeSummary recipe={adopted} />);
    expect(view.container.querySelector('input,textarea,select')).toBeNull();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
    view.rerender(<FermentationRecipeSummary recipe={{ ...adopted, yeast: { ...adopted.yeast, pitchTempC: 27 } }} />);
    expect(screen.getByRole('status')).toHaveTextContent('La recette diffère');
    expect(memory.writes).not.toHaveBeenCalled();
  });
});

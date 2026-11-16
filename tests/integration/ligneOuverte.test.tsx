import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { IdeesBieres, IdeesPrix } from '../../src/ui/atelier/LigneOuverte';
import type { CreativeItem } from '../../src/types';

afterEach(cleanup);
const biere = (id: string, title: string, extra: object = {}): CreativeItem => ({ id, type: 'recipe-idea', title, status: 'idea', ...extra } as CreativeItem);

describe('kb3 · Bières : la ligne s’ouvre sur place', () => {
  const props = () => ({ ajout: false, onAjout: vi.fn(), onCreer: vi.fn(), onMaj: vi.fn(), onPasser: vi.fn(), onFiche: vi.fn() });
  it('compte À essayer et En recette, ouvre une ligne sans fenêtre, voisines visibles ; « Passer » appelle le geste de l’app', () => {
    const p = props();
    const idees = [biere('a', 'NEIPA Motueka'), biere('b', 'Pils d’été'), biere('c', 'Brune d’hiver')];
    render(<IdeesBieres idees={idees} recettes={[{ id: 'R1', name: 'Brune d’hiver' }]} {...p} />);
    expect(screen.getByRole('button', { name: /À essayer 2/ })).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('button', { name: /En recette 1/ })).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /NEIPA Motueka/ }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByText('Pils d’été')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Passer dans mes recettes' }));
    expect(p.onPasser).toHaveBeenCalledWith(idees[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Ambrée' }));
    expect(p.onMaj).toHaveBeenCalledWith(expect.objectContaining({ id: 'a', couleur: 'ambre' }));
    fireEvent.click(screen.getByRole('button', { name: /En recette 1/ }));
    fireEvent.click(screen.getByRole('button', { name: /Brune d’hiver/ }));
    expect(screen.getByRole('status')).toHaveTextContent('En recette');
    expect(screen.queryByRole('button', { name: 'Ouvrir la recette' })).not.toBeInTheDocument();
  });
  it('vide : la première ligne s’écrit sur place ; « Garder l’idée » n’écrit qu’avec un titre', () => {
    const p = props();
    render(<IdeesBieres idees={[]} recettes={[]} {...p} />);
    expect(screen.getByText(/Aucune idée de bière encore/)).toBeInTheDocument();
    const garder = screen.getByRole('button', { name: 'Garder l’idée' });
    expect(garder).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Une idée de bière'), { target: { value: 'Stout au café' } });
    fireEvent.click(screen.getByRole('button', { name: 'Stout' }));
    fireEvent.click(garder);
    expect(p.onCreer).toHaveBeenCalledWith(expect.objectContaining({ type: 'recipe-idea', title: 'Stout au café', style: 'Stout', status: 'idea' }));
  });
});

describe('kb3 · Tarifs : l’idée de prix s’ouvre sur place', () => {
  const idee: CreativeItem = { id: 'p', type: 'pricing-test', title: 'Fût 20 L pour Bistrot Démo', status: 'idea', targetPrice: 140, contactName: 'Bistrot Démo', format: 'fut' } as CreativeItem;
  it('prix − / + au pas du format, « soit 7,00 le litre », coût « à poser » tant qu’il est inconnu', () => {
    const onMaj = vi.fn();
    render(<IdeesPrix idees={[idee, { ...idee, id: 'q', title: 'Bouteille 33 cl', targetPrice: undefined, format: '33cl' } as CreativeItem]} ajout={false} onAjout={vi.fn()} onCreer={vi.fn()} onMaj={onMaj} onFiche={vi.fn()} />);
    expect(screen.getByText('à estimer')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: /Fût 20 L pour Bistrot Démo/ }));
    expect(screen.getByRole('status')).toHaveTextContent('soit 7,00 le litre · pas de 5');
    expect(screen.getByLabelText('Coût en CHF')).toHaveAttribute('placeholder', 'à poser');
    expect(screen.getByText('· marge sans chiffre')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Plus 5,00' }));
    expect(onMaj).toHaveBeenCalledWith(expect.objectContaining({ id: 'p', targetPrice: 145 }));
    const fmt = screen.getByRole('group', { name: 'Format' });
    expect(within(fmt).getByRole('button', { name: 'Fût' })).toHaveAttribute('aria-pressed', 'true');
  });
  it('vide : la première idée de prix s’écrit sur place', () => {
    const onCreer = vi.fn();
    render(<IdeesPrix idees={[]} ajout={false} onAjout={vi.fn()} onCreer={onCreer} onMaj={vi.fn()} onFiche={vi.fn()} />);
    expect(screen.getByText(/Aucune idée de prix encore/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Garder l’idée' })).toBeDisabled();
    fireEvent.click(screen.getByRole('button', { name: 'Growler' }));
    fireEvent.change(screen.getByLabelText('Prix visé en CHF HT'), { target: { value: '18' } });
    fireEvent.blur(screen.getByLabelText('Prix visé en CHF HT'));
    fireEvent.click(screen.getByRole('button', { name: 'Garder l’idée' }));
    expect(onCreer).toHaveBeenCalledWith(expect.objectContaining({ type: 'pricing-test', format: 'growler', targetPrice: 18 }));
  });
});

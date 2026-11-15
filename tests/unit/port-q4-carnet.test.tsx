// @vitest-environment jsdom
// Voie q4 : Atelier R&D, e9na « le carnet que l'IA range ». Le geste, le curseur, la note : sur les composants du port.
import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CreativeItem } from '../../src/types';
import { Ecrire } from '../../src/ui/atelier/Ecrire';
import { EssaiPrix } from '../../src/ui/atelier/EssaiPrix';
import { NoteCarte } from '../../src/ui/atelier/NoteCarte';

afterEach(cleanup);
const NOTE = 'Lager au miel du voisin pour l’été. Demander au Café du Midi son prix pour un fût.';

describe('Atelier e9na : Noter en vrac', () => {
  it('Noter propose le rangement, retirer une ligne, Ranger ainsi livre ce qui reste', () => {
    const onRanger = vi.fn();
    render(<Ecrire primaire amorce={null} onReflechir={() => {}} onRanger={onRanger} />);
    fireEvent.change(screen.getByLabelText('Ta note'), { target: { value: NOTE } });
    fireEvent.click(screen.getByRole('button', { name: 'Noter' }));
    expect(screen.getByText(/ta note en 2 lignes/)).toBeTruthy();
    expect((screen.getByLabelText('Ta note') as HTMLTextAreaElement).value).toBe('');
    fireEvent.click(screen.getAllByRole('button', { name: 'Retirer' })[1]);
    fireEvent.click(screen.getByRole('button', { name: 'Ranger ainsi' }));
    expect(onRanger).toHaveBeenCalledTimes(1);
    expect(onRanger.mock.calls[0][0].map((l: { genre: string }) => l.genre)).toEqual(['biere']);
    expect(screen.queryByText(/Rangement proposé/)).toBeNull();
  });

  it('Corriger change le tiroir d’une ligne', () => {
    const onRanger = vi.fn();
    render(<Ecrire primaire amorce={null} onReflechir={() => {}} onRanger={onRanger} />);
    fireEvent.change(screen.getByLabelText('Ta note'), { target: { value: NOTE } });
    fireEvent.click(screen.getByRole('button', { name: 'Noter' }));
    fireEvent.click(screen.getByRole('button', { name: 'Corriger' }));
    fireEvent.click(screen.getAllByRole('button', { name: /Tiroir : Bière/ })[0]);
    fireEvent.click(screen.getByRole('button', { name: 'Ranger ainsi' }));
    expect(onRanger.mock.calls[0][0][0].genre).toBe('tarif');
  });

  it('une note vide ne propose rien', () => {
    render(<Ecrire primaire amorce={null} onReflechir={() => {}} onRanger={() => {}} />);
    fireEvent.click(screen.getByRole('button', { name: 'Noter' }));
    expect(screen.queryByText(/Rangement proposé/)).toBeNull();
  });
});

describe('Atelier e9na : Essayer un prix', () => {
  it('rien n’est inventé : prix et coût « non saisis », marge inconnue, tarif impossible à garder', () => {
    const onGarder = vi.fn();
    render(<EssaiPrix tva={0} onGarder={onGarder} />);
    expect(screen.getAllByText('non saisi')).toHaveLength(2);
    expect(screen.getByText('saisis le prix et le coût')).toBeTruthy();
    expect((screen.getByRole('button', { name: /Garder ce tarif/ }) as HTMLButtonElement).disabled).toBe(true);
  });

  it('au curseur, la marge sort à la virgule et le tarif se garde avec son format', () => {
    const onGarder = vi.fn();
    const { container } = render(<EssaiPrix tva={0} onGarder={onGarder} />);
    fireEvent.change(screen.getByLabelText(/Prix de vente \(33 cl\)/), { target: { value: '6' } });
    fireEvent.change(screen.getByLabelText(/Coût de revient \(33 cl\)/), { target: { value: '2.1' } });
    expect(screen.getByText('3,90')).toBeTruthy();
    expect(screen.getByText('6,00 CHF')).toBeTruthy();
    expect(container.querySelector('input[type="number"]')).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Garder ce tarif/ }));
    expect(onGarder).toHaveBeenCalledWith({ format: '33 cl', prix: 6, cout: 2.1 });
  });

  it('un prix gardé sans coût reste sans coût', () => {
    const onGarder = vi.fn();
    render(<EssaiPrix tva={0} onGarder={onGarder} />);
    fireEvent.click(screen.getByRole('button', { name: 'Fût 20 L' }));
    fireEvent.change(screen.getByLabelText(/Prix de vente \(Fût 20 L\)/), { target: { value: '150' } });
    expect(screen.getByText('saisis le coût')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Garder ce tarif/ }));
    expect(onGarder).toHaveBeenCalledWith({ format: 'Fût 20 L', prix: 150, cout: undefined });
  });
});

describe('Atelier e9na : la note', () => {
  const base: CreativeItem = { id: 'CR-001', type: 'prospect', title: 'Café du Midi', status: 'idea' };
  const noop = () => {};

  it('un contact sans numéro n’offre pas « Appeler » ; avec un numéro, un lien tel:', () => {
    const { rerender } = render(<NoteCarte item={base} tva={0} onOuvrir={noop} onCocher={noop} onEnRecette={noop} />);
    expect(screen.queryByText('Appeler')).toBeNull();
    expect(screen.getByText('pas de numéro noté')).toBeTruthy();
    rerender(<NoteCarte item={{ ...base, contactPhone: '026 408 33 33' }} tva={0} onOuvrir={noop} onCocher={noop} onEnRecette={noop} />);
    expect(screen.getByText('Appeler').closest('a')?.getAttribute('href')).toBe('tel:0264083333');
  });

  it('une ancienne note sans instant n’affiche aucune date', () => {
    render(<NoteCarte item={{ ...base, type: 'recipe-idea', title: 'Stout' }} tva={0} onOuvrir={noop} onCocher={noop} onEnRecette={noop} />);
    expect(screen.queryByText(/^\d\d\.\d\d$/)).toBeNull();
  });

  it('une tâche se coche (case de 44 px par pseudo-élément) et une tarif sans coût le dit', () => {
    const onCocher = vi.fn();
    render(<NoteCarte item={{ id: 'CR-2', type: 'event', title: 'Commander', status: 'todo' }} tva={0} onOuvrir={noop} onCocher={onCocher} onEnRecette={noop} />);
    fireEvent.click(screen.getByRole('checkbox', { name: 'Cocher' }));
    expect(onCocher).toHaveBeenCalledTimes(1);
    cleanup();
    render(<NoteCarte item={{ id: 'CR-3', type: 'pricing-test', title: 'Fût à 150', description: 'Fût 20 L', status: 'idea', targetPrice: 150 }} tva={0} onOuvrir={noop} onCocher={noop} onEnRecette={noop} />);
    expect(screen.getByText('coût non saisi')).toBeTruthy();
    expect(screen.getByText(/Fût 20 L · 150,00/)).toBeTruthy();
  });
});

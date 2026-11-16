// @vitest-environment jsdom
// Fusion lot 8 : la note rangée par l'IA (ks4) rebranchée dans « Noter en vrac » (e9na). Réponse SIMULÉE seulement : jamais d'appel réel.
import React from 'react';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { CreativeItem, PricingItem } from '../../src/types';
import { Ecrire } from '../../src/ui/atelier/Ecrire';
import { bieresConnues, demanderRangement, lignesDePropositions } from '../../src/ui/atelier/rangerIA';
import { modeDe } from '../../src/config/rangerNoteIA';

afterEach(cleanup);
const SAISIE = new Date(2026, 10, 16, 10);
const CARNOTZET: CreativeItem = { id: 'CR-1', type: 'prospect', status: 'idea', title: 'Le Carnotzet Gourmand' };
const FUT20 = { id: 'T-1', biere: 'NEIPA', priceHT: 140, format: { id: 'fut', volumeL: 20 } } as unknown as PricingItem;
const CTX = { contacts: [CARNOTZET], tarifs: [FUT20], bieres: ['NEIPA'] };
const NOTE = '2 fûts de 20 L pour le Carnotzet, à livrer avant le 12 déc.';

describe('rangement IA dans e9na', () => {
  it('les bières connues : recettes et tarifs, sans doublon ni blanc', () => {
    expect(bieresConnues(['Stout', 'NEIPA', ' '], [FUT20, { ...FUT20, biere: undefined } as unknown as PricingItem])).toEqual(['NEIPA', 'Stout']);
  });

  it('une réponse simulée devient des lignes : tâche liée au contact connu, prix deviné dans Tarifs, aucun contact recréé', async () => {
    const r = await demanderRangement(NOTE, 'simule', 'fast', CTX, SAISIE);
    expect(r.panne).toBe(false);
    expect(r.lignes).toHaveLength(1);
    expect(r.lignes![0]).toMatchObject({ genre: 'faire', titre: 'Livrer 2 fûts de 20 L', date: '12.12.2026', contactName: 'Le Carnotzet Gourmand' });
    expect(r.lignes![0].targetPrice).toBe(280); // 2 × 140 CHF : le seul prix du fût de 20 L dans Tarifs ; deux prix possibles, rien ne serait deviné
  });

  it('un contact inconnu est noté ; une idée de bière garde le texte de la note', () => {
    const l = lignesDePropositions([
      { cle: 'a', sorte: 'noter-contact', lieu: 'Café du Midi', personne: 'Lucie', coche: true },
      { cle: 'b', sorte: 'idee', titre: 'Pils d’été', texte: 'Pils au Nelson Sauvin', coche: true },
      { cle: 'c', sorte: 'tache', titre: 'Rappeler', coche: false }
    ], []);
    expect(l).toEqual([{ genre: 'contact', titre: 'Café du Midi', contactName: 'Lucie' }, { genre: 'biere', titre: 'Pils d’été', description: 'Pils au Nelson Sauvin' }]);
  });

  it('IA éteinte : aucune réponse, la lecture locale reste (jamais un appel réel)', async () => {
    expect(await demanderRangement(NOTE, 'eteint', 'fast', CTX, SAISIE)).toEqual({ lignes: null, panne: false });
    expect(modeDe(undefined, true, false)).toBe('eteint');
    expect(modeDe('production', true, true)).toBe('simule');
  });

  it('l’écran : éteint, la lecture locale propose tout de suite ; simulé, « exemple » et le « + » paraissent', async () => {
    const onRanger = vi.fn();
    const { unmount } = render(<Ecrire primaire amorce={null} onReflechir={() => {}} onRanger={onRanger} mode="eteint" contexte={CTX} />);
    fireEvent.change(screen.getByLabelText('Ta note'), { target: { value: 'Rappeler Lucie du Café du Midi' } });
    fireEvent.click(screen.getByRole('button', { name: 'Noter' }));
    expect(screen.getByText(/Rangement proposé : ta note en une ligne/)).toBeTruthy();
    expect(screen.queryByText('exemple')).toBeNull();
    expect(screen.queryByLabelText('Relancer avec le modèle plus précis')).toBeNull();
    unmount();

    render(<Ecrire primaire amorce={null} onReflechir={() => {}} onRanger={onRanger} mode="simule" contexte={CTX} />);
    fireEvent.change(screen.getByLabelText('Ta note'), { target: { value: NOTE } });
    fireEvent.click(screen.getByRole('button', { name: 'Noter' }));
    expect(screen.getByText(/L’IA range ta note/)).toBeTruthy();
    await waitFor(() => expect(screen.getByText('exemple')).toBeTruthy(), { timeout: 2000 });
    expect(screen.getByLabelText('Relancer avec le modèle plus précis')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: 'Ranger ainsi' }));
    expect(onRanger).toHaveBeenCalledTimes(1);
    expect(onRanger.mock.calls[0][0][0]).toMatchObject({ genre: 'faire', titre: 'Livrer 2 fûts de 20 L', contactName: 'Le Carnotzet Gourmand' });
  });

  it('simulé mais muet : la lecture locale prend le relais, et le dit', async () => {
    render(<Ecrire primaire amorce={null} onReflechir={() => {}} onRanger={() => {}} mode="simule" contexte={CTX} />);
    fireEvent.change(screen.getByLabelText('Ta note'), { target: { value: 'Rappeler Lucie du Café du Midi' } });
    fireEvent.click(screen.getByRole('button', { name: 'Noter' }));
    await waitFor(() => expect(screen.getByText(/L’IA n’a rien proposé : lecture simple/)).toBeTruthy(), { timeout: 2000 });
    expect(screen.getByText(/Rangement proposé : ta note en une ligne/)).toBeTruthy();
  });
});

// @vitest-environment jsdom
// VI-7 (rejeu b47cd90b n° 7) : « 1 valeur à corriger avant enregistrement » ne disait ni laquelle ni où. Le bandeau écrit chaque valeur et mène à son champ.
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { RecapEtat } from '../../src/ui/RecapEtat';
import type { RecipeFieldIssue, RecipeReadiness } from '../../src/domain/recipeValidation';

afterEach(cleanup);
const issue: RecipeFieldIssue = { field: 'wz-boil', step: 'identite', message: 'Durée d’ébullition de 999 min : au-delà de 240 min, erreur de saisie probable.', live: true };
const lecture = (over: Partial<RecipeReadiness>): RecipeReadiness => ({ status: 'ready', invalid: [], missing: [], ...over });

describe('bandeau d’état du récapitulatif', () => {
  it('une valeur invalide : le compte, sa phrase et un bouton vers son étape', () => {
    const corriger = vi.fn();
    render(<RecapEtat readiness={lecture({ status: 'invalid', invalid: [issue] })} etape={() => 'Identité'} onCorriger={corriger} />);
    const bandeau = screen.getByRole('status', { name: 'État de la recette' });
    expect(bandeau).toHaveTextContent('1 valeur à corriger avant enregistrement');
    expect(bandeau).toHaveTextContent('Durée d’ébullition de 999 min');
    fireEvent.click(screen.getByRole('button', { name: /Corriger · Identité/ }));
    expect(corriger).toHaveBeenCalledWith(issue);
  });
  it('deux valeurs : deux lignes, deux boutons', () => {
    render(<RecapEtat readiness={lecture({ status: 'invalid', invalid: [issue, { ...issue, field: 'wz-og', message: 'Densité illisible.' }] })} etape={() => 'Identité'} onCorriger={() => {}} />);
    expect(screen.getByRole('status')).toHaveTextContent('2 valeurs à corriger');
    expect(screen.getAllByRole('button')).toHaveLength(2);
  });
  it('incomplète : chaque repère que le lancement refuserait est écrit, avec son bouton (WFR-4) ; prête : ni liste ni bouton', () => {
    const onCorriger = vi.fn();
    render(<RecapEtat readiness={lecture({ status: 'incomplete', missing: [issue] })} etape={() => 'Identité'} onCorriger={onCorriger} />);
    expect(screen.getByRole('status')).toHaveTextContent('À compléter · 1 repère avant brassin · enregistrement possible');
    expect(screen.getByRole('status')).toHaveTextContent(issue.message);
    fireEvent.click(screen.getByRole('button', { name: /Compléter · Identité/ }));
    expect(onCorriger).toHaveBeenCalledWith(issue);
    cleanup();
    const refus = 'Le volume prévu atteint ou dépasse la capacité physique du fermenteur.';
    render(<RecapEtat readiness={lecture({})} etape={() => ''} onCorriger={onCorriger} installation={[refus]} />);
    expect(screen.getByRole('status')).toHaveTextContent(refus);
    expect(screen.getByRole('status')).not.toHaveTextContent('Données prêtes pour le brassin');
    fireEvent.click(screen.getByRole('button', { name: /Régler · Identité/ }));
    expect(onCorriger).toHaveBeenLastCalledWith(expect.objectContaining({ step: 'identite', message: refus }));
    cleanup();
    render(<RecapEtat readiness={lecture({})} etape={() => ''} onCorriger={() => {}} />);
    expect(screen.queryByRole('button')).toBeNull();
    cleanup();
    render(<RecapEtat readiness={lecture({})} etape={() => ''} onCorriger={() => {}} />);
    expect(screen.getByRole('status')).toHaveTextContent('Données prêtes pour le brassin');
  });
});

import React from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { Header } from '../../src/components/Header';
import { BrewerActivity } from '../../src/ui/BrewerActivity';
import { defaultConfig } from '../../src/services/storage';

afterEach(() => cleanup());

// V-a (verdict final, 09.11) : à 390, un élément qui défile sous l'en-tête restait visible à travers lui (fantôme gris flou sous « L'Affinée »,
// dans Finances, Clients, Stocks). Un en-tête collant est opaque : ni fond à 95 %, ni flou d'arrière-plan.
describe('En-tête de l’app : opaque, rien ne se voit à travers', () => {
  it('le fond n’a pas de transparence et l’arrière-plan n’est pas flouté', () => {
    const { container } = render(
      <Header config={defaultConfig} globalTimeFilter="all" onChangeGlobalTimeFilter={() => {}} onOpenSettings={() => {}} onOpenAuditLogs={() => {}}
        onNavigateToBrewAssistant={() => {}} onNavigateToCreativeLab={() => {}} onOpenSearch={() => {}} onGoHome={() => {}} />
    );
    const entete = container.querySelector('header')!;
    expect(entete.className).toMatch(/\bbg-cave-950\b(?!\/)/);
    expect(entete.className).not.toMatch(/bg-cave-950\/\d+/);
    expect(entete.className).not.toMatch(/backdrop-blur/);
  });

  // La vraie cause du fantôme gris (dev-local) : la pastille « Compagnon hors connexion · mode local » est fixe à 4 px du haut, au même z-index que
  // l'en-tête mais montée avant lui : l'en-tête la recouvrait et seul son bas dépassait, gris, sous « L'Affinée ». Elle passe en bas de l'écran, au-dessus de la barre, sur une ligne : rien sous l'en-tête.
  it('la pastille hors connexion ne se place plus sous l’en-tête : en bas, sur une ligne', () => {
    window.history.replaceState({}, '', '/?dev-local');
    render(<BrewerActivity localOnly />);
    const pastille = screen.getByRole('status');
    expect(pastille.className).toMatch(/bottom-/);
    expect(pastille.className).not.toMatch(/top-/);
    expect(pastille.className).not.toMatch(/z-40/);
    expect(pastille.className).toMatch(/whitespace-nowrap/);
  });
});

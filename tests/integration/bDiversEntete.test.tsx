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

  // La vraie cause du fantôme gris (dev-local) : la pastille « Compagnon hors connexion · mode local » était fixe à 4 px du haut, sous l'en-tête qui la recouvrait.
  // Elle est passée en bas de l'écran, puis (b1r) a quitté l'écran : « hors connexion » se lit dans l'entrée Compagnon du + et au pied du rail.
  // L'exigence reste : aucune pastille flottante, donc rien sous l'en-tête ni au-dessus de la barre.
  it('hors connexion, aucune pastille flottante : ni sous l’en-tête ni en bas (b1r)', () => {
    window.history.replaceState({}, '', '/?dev-local');
    const { container } = render(<BrewerActivity localOnly />);
    expect(screen.queryByRole('status')).toBeNull();
    expect(container.querySelector('.fixed')).toBeNull();
    expect(container).toBeEmptyDOMElement();
  });

});

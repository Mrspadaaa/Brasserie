// @vitest-environment jsdom
/**
 * Voie v3, T3-4 : « Plein écran refusé par le navigateur (iPhone Safari, iframe) : en paysage, aucun effet ni message ».
 * Refusé = l'API est absente (iPhone) ou la demande est rejetée (iframe sans `allow="fullscreen"`). Hors téléphone tenu droit (où l'invitation
 * « Tourne le téléphone » reste la réponse), le brasseur lit un message, jamais un bouton muet. Aucun réseau, aucune donnée réelle.
 */
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { EnTeteCalendrier, type ModeleEnTete } from '../../src/ui/calendrier/entete/EnTete';
import { periodeDeFenetre } from '../../src/ui/calendrier/entete/Fenetre';
import { semainesDe } from '../../src/domain/calendrier';
import { demanderPleinEcran } from '../../src/ui/calendrier/pleinEcran';

const LUNDI0 = '2026-11-16';
const REFUS = 'Plein écran refusé par ce navigateur';
const largeurFenetre = (px: number) => Object.defineProperty(window, 'innerWidth', { value: px, configurable: true, writable: true });
const modele = (): ModeleEnTete => ({ semaines: semainesDe(LUNDI0, 52), courbe: null, creux: null, retards: [], sansDate: [], icones: [], choses: [], hypotheses: [] } as unknown as ModeleEnTete);
const fenetre = { du: LUNDI0, semaines: 6 };

function poser(requestFullscreen: unknown) {
  if (requestFullscreen === undefined) delete (document.documentElement as unknown as Record<string, unknown>).requestFullscreen;
  else Object.defineProperty(document.documentElement, 'requestFullscreen', { value: requestFullscreen, configurable: true });
}
afterEach(() => {
  cleanup(); vi.restoreAllMocks(); largeurFenetre(1024); poser(undefined);
  delete (window.screen as unknown as Record<string, unknown>).orientation;
});

describe('demanderPleinEcran : « refusé » se lit, il ne se devine pas', () => {
  it('API absente (iPhone) : refusé', async () => {
    poser(undefined);
    expect((await demanderPleinEcran(document.documentElement)).refuse).toBe(true);
  });
  it('demande rejetée (iframe sans permission) : refusé', async () => {
    poser(vi.fn().mockRejectedValue(new TypeError('Permissions check failed')));
    expect((await demanderPleinEcran(document.documentElement)).refuse).toBe(true);
  });
  it('demande acceptée : pas refusé', async () => {
    poser(vi.fn().mockResolvedValue(undefined));
    expect((await demanderPleinEcran(document.documentElement)).refuse).toBe(false);
  });
});

describe('T3-4 : le bouton « Plein écran » ne reste jamais muet', () => {
  const rendre = (orientation: 'portrait' | 'paysage', onMessage = vi.fn()) => {
    render(<EnTeteCalendrier modele={modele()} fenetre={fenetre} onFenetre={() => undefined} periode={periodeDeFenetre({ du: LUNDI0, semaines: 6 })} onPeriode={() => undefined}
      vue="semaines" onVue={() => undefined} mouvements={false} onMouvements={() => undefined} orientation={orientation} largeurColonne={65} onMessage={onMessage} />);
    return onMessage;
  };

  it('844×340 (paysage), demande rejetée : un message dit le refus', async () => {
    largeurFenetre(844);
    poser(vi.fn().mockRejectedValue(new TypeError('Permissions check failed')));
    const onMessage = rendre('paysage');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Plein écran' })); });
    await vi.waitFor(() => expect(onMessage).toHaveBeenCalledWith({ genre: 'refus', texte: REFUS }));
  });

  it('844×340, API absente (iPhone en paysage) : le même message', async () => {
    largeurFenetre(844);
    const onMessage = rendre('paysage');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Plein écran' })); });
    await vi.waitFor(() => expect(onMessage).toHaveBeenCalledWith({ genre: 'refus', texte: REFUS }));
  });

  it('390 tenu droit, API absente : l’invitation à tourner reste la réponse (acquis), pas le refus', async () => {
    largeurFenetre(390);
    const onMessage = rendre('portrait');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Plein écran' })); });
    await vi.waitFor(() => expect(onMessage).toHaveBeenCalledWith({ genre: 'invite', texte: 'Tourne le téléphone : 13 semaines' }));
    expect(onMessage).not.toHaveBeenCalledWith({ genre: 'refus', texte: REFUS });
  });

  it('1280, demande acceptée : aucun message', async () => {
    largeurFenetre(1280);
    poser(vi.fn().mockResolvedValue(undefined));
    const onMessage = rendre('portrait');
    await act(async () => { fireEvent.click(screen.getByRole('button', { name: 'Plein écran' })); await new Promise(r => setTimeout(r, 20)); });
    expect(onMessage).not.toHaveBeenCalled();
  });
});

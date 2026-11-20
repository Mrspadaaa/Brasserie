import React, { useState } from 'react';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DetailChose } from '../../src/ui/calendrier/frise/DetailChose';
import { EVENEMENT_CALENDRIER, LienSection, lireSection } from '../../src/ui/calendrier/LienSection';
import { useRetourEcran } from '../../src/ui/calendrier/useRetour';
import type { ChoseCalendrier } from '../../src/domain/calendrier';

/* CAL-PASSE (voie R, audit des vues n° 4, 5 et § 3, 20.11) : les renvois du Calendrier n'ouvrent jamais l'ancien Atelier ; chaque section a son
   calendrier ; le retour ramène à l'écran d'origine. La preuve au doigt est dans scripts/parcours (parcours-r) ; ces tests tiennent les règles. */
afterEach(() => { cleanup(); window.history.replaceState({}, '', '/'); });

const fete = (): ChoseCalendrier => ({
  id: 'creatif-F1', rangee: 'fetes', titre: 'Marché de Noël', debut: '2026-12-12', fin: '2026-12-12',
  source: { genre: 'creative', id: 'F1', type: 'event' } as ChoseCalendrier['source'], ouvre: { ecran: 'agenda', id: 'F1' }, deplacable: true
} as ChoseCalendrier);

const noms = () => [...screen.getByRole('region').querySelectorAll('.cal-det-bt button')].map(b => b.textContent?.trim());

describe('une fête ou une activité : sa feuille, jamais « Ouvrir dans l’agenda »', () => {
  it('avec Modifier : le bouton principal ouvre la feuille de l’objet (onModifier), sans renvoi ni doublon', () => {
    const onModifier = vi.fn(); const onOuvrir = vi.fn();
    render(<DetailChose chose={fete()} onFermer={() => {}} onOuvrir={onOuvrir} onModifier={onModifier} />);
    expect(noms().some(n => /Ouvrir dans l.(agenda|atelier)/.test(n ?? ''))).toBe(false);
    expect(noms().filter(n => n === 'Modifier')).toHaveLength(1);
    fireEvent.click(screen.getByRole('button', { name: 'Modifier' }));
    expect(onModifier).toHaveBeenCalledTimes(1);
    expect(onOuvrir).not.toHaveBeenCalled();
  });

  it('une activité (ouvre l’atelier) : pareil', () => {
    const c = { ...fete(), rangee: 'activites', ouvre: { ecran: 'atelier', id: 'F1' } } as ChoseCalendrier;
    render(<DetailChose chose={c} onFermer={() => {}} onOuvrir={() => {}} onModifier={() => {}} />);
    expect(noms().some(n => /Ouvrir dans l.(agenda|atelier)/.test(n ?? ''))).toBe(false);
  });

  it('un brassin garde « Ouvrir le brassin » et son Modifier absent : rien n’est changé hors fêtes et activités', () => {
    const b = { id: 'brassin-L', rangee: 'brassins', titre: 'Stout', debut: '2026-11-23', fin: '2026-12-21', source: { genre: 'batch', id: 'L' }, ouvre: { ecran: 'brassin', id: 'L' }, deplacable: true } as ChoseCalendrier;
    render(<DetailChose chose={b} onFermer={() => {}} onOuvrir={() => {}} onModifier={() => {}} />);
    expect(noms()).toContain('Ouvrir le brassin');
    expect(noms()).toContain('Modifier');
  });
});

describe('le lien d’une section', () => {
  it('un toucher envoie la section à l’App ; une section inconnue n’est pas lue', () => {
    const recu: unknown[] = [];
    const ecoute = (e: Event) => recu.push(lireSection(e));
    window.addEventListener(EVENEMENT_CALENDRIER, ecoute);
    render(<LienSection section="brassins" />);
    fireEvent.click(screen.getByRole('button', { name: /Calendrier des brassins/ }));
    window.dispatchEvent(new CustomEvent(EVENEMENT_CALENDRIER, { detail: { section: 'inconnue' } }));
    window.removeEventListener(EVENEMENT_CALENDRIER, ecoute);
    expect(recu).toEqual(['brassins', null]);
  });
});

describe('le retour ramène à l’écran d’origine', () => {
  function Hote() {
    const [tab, setTab] = useState('calendrier');
    const poser = useRetourEcran<string>(tab, setTab);
    return (<div><span data-testid="tab">{tab}</span>
      <button onClick={() => { poser('calendrier'); setTab('stocks'); }}>renvoi</button>
      <button onClick={() => setTab('finances')}>autre</button></div>);
  }

  it('renvoi puis retour du navigateur : on revient au Calendrier', () => {
    render(<Hote />);
    fireEvent.click(screen.getByText('renvoi'));
    expect(screen.getByTestId('tab').textContent).toBe('stocks');
    act(() => { window.dispatchEvent(new PopStateEvent('popstate')); });
    expect(screen.getByTestId('tab').textContent).toBe('calendrier');
  });

  it('on quitte la destination par la barre : un retour plus tard ne saute pas au Calendrier', () => {
    const back = vi.spyOn(window.history, 'back').mockImplementation(() => {});
    render(<Hote />);
    fireEvent.click(screen.getByText('renvoi'));
    fireEvent.click(screen.getByText('autre'));
    expect(back).toHaveBeenCalledTimes(1);
    act(() => { window.dispatchEvent(new PopStateEvent('popstate')); });
    expect(screen.getByTestId('tab').textContent).toBe('finances');
    back.mockRestore();
  });
});

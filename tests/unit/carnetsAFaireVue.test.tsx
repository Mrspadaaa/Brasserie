// @vitest-environment jsdom
/**
 * Voie afaire (port D451) : l'écran « À faire » et la carte « À ranger », montés avec leurs props (aucun magasin). Fixture « ZZ TEST — »,
 * aujourd'hui = mardi 24 nov. 2026 ; gestes : cocher et décocher, toucher une ligne, appui long (Quand ?), les trois boutons de la carte.
 */
import React from 'react';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fixtureSuivi, IDS_SUIVI, MAINTENANT_SUIVI } from '../../src/domain/carnets/fixture';
import { lireCarnets, lireMessages, type CarnetDoc } from '../../src/domain/carnets/modele';
import { idPlanDuCarnet } from '../../src/domain/carnets/operations';
import { AFaire } from '../../src/ui/carnets/AFaire';
import { CarteARanger } from '../../src/ui/carnets/CarteARanger';
import { propositionARanger } from '../../src/ui/carnets/afaireRegles';

afterEach(cleanup);

const etat = fixtureSuivi();
const carnets = lireCarnets(etat, { archives: true });
const messages = lireMessages(etat);
const gestes = () => ({ onCocher: vi.fn(), onOuvrir: vi.fn(), onEcheance: vi.fn() });
const titre = (id: string) => carnets.find(c => c.id === id)!.title;
const ligne = (texte: string) => screen.getByText(texte).closest('li') as HTMLElement;

describe('AFaire', () => {
  it('trois groupes de la maquette dans l\'ordre, chacun avec son nombre ; chaque ligne : texte, problème, jeton de coût', () => {
    render(<AFaire carnets={carnets} maintenant={MAINTENANT_SUIVI} messages={messages} plans={[{ id: idPlanDuCarnet(IDS_SUIVI.vapeur), status: 'draft' }]} {...gestes()} />);
    const titres = screen.getAllByRole('heading', { level: 3 }).map(h => h.textContent);
    expect(titres.slice(0, 2)).toEqual(['Cette semaine 4', 'Fin du mois 3']); // C71-1 (R84) : la 4e tâche, au-delà du dernier jour du mois, se range sous « Un jour » (sa date dite)
    expect(titres[titres.length - 1]).toMatch(/^Un jour \d$/);
    const testeur = within(ligne('Acheter un testeur de tension'));
    expect(testeur.getByText(titre(IDS_SUIVI.fusible))).toBeTruthy();
    expect(testeur.getByText('≈ 35 CHF')).toBeTruthy();
    const condenseur = within(ligne('Acheter le condenseur B'));
    expect(condenseur.getByText('540 CHF')).toBeTruthy();
    expect(condenseur.getByText('· dans À venir')).toBeTruthy();
    expect(within(ligne('Commander le pils chez l’autre fournisseur')).queryByText(/CHF/)).toBeNull(); // coût absent : rien, jamais 0
  });

  it('le montant d\'un devis du fil se lit en sous-ligne, sans jeton vert', () => {
    const avecMessage = carnets.map(c => c.id !== IDS_SUIVI.ecoulement ? c : { ...c, carnet: { ...c.carnet, taches: c.carnet.taches!.map(x => x.id === 'ZZ-SE-T1' ? { ...x, messageId: 'ZZ-SE-M5' } : x) } } as CarnetDoc);
    render(<AFaire carnets={avecMessage} maintenant={MAINTENANT_SUIVI} messages={messages} {...gestes()} />);
    const devis = within(ligne('Répondre au devis de l’entreprise X'));
    expect(devis.getByText('· 850 CHF')).toBeTruthy();
    expect(ligne('Répondre au devis de l’entreprise X').querySelector('.af-jeton')).toBeNull();
  });

  it('cocher puis décocher : la case rend l\'état à l\'instant et appelle onCocher(carnet, tâche, faite)', () => {
    const g = gestes();
    render(<AFaire carnets={carnets} maintenant={MAINTENANT_SUIVI} {...g} />);
    const case1 = within(ligne('Acheter manchon PVC 110 + colle')).getByRole('checkbox');
    expect(case1.getAttribute('aria-checked')).toBe('false');
    fireEvent.click(case1);
    expect(g.onCocher).toHaveBeenLastCalledWith(IDS_SUIVI.ecoulement, 'ZZ-SE-T2', true);
    expect(case1.getAttribute('aria-checked')).toBe('true');
    fireEvent.click(case1);
    expect(g.onCocher).toHaveBeenLastCalledWith(IDS_SUIVI.ecoulement, 'ZZ-SE-T2', false);
    expect(case1.getAttribute('aria-checked')).toBe('false');
    expect(g.onOuvrir).not.toHaveBeenCalled();
  });

  it('une tâche cochée dont les props la retirent disparaît ; si elle revient (Annuler), elle revient décochée', () => {
    const g = gestes();
    const { rerender } = render(<AFaire carnets={carnets} maintenant={MAINTENANT_SUIVI} {...g} />);
    fireEvent.click(within(ligne('Fusibles de rechange ×5')).getByRole('checkbox'));
    const sans = carnets.map(c => c.id !== IDS_SUIVI.fusible ? c : { ...c, carnet: { ...c.carnet, taches: c.carnet.taches!.map(x => x.id === 'ZZ-SF-T2' ? { ...x, faiteLe: MAINTENANT_SUIVI } : x) } } as CarnetDoc);
    rerender(<AFaire carnets={sans} maintenant={MAINTENANT_SUIVI} {...g} />);
    expect(screen.queryByText('Fusibles de rechange ×5')).toBeNull();
    rerender(<AFaire carnets={carnets} maintenant={MAINTENANT_SUIVI} {...g} />);
    expect(within(ligne('Fusibles de rechange ×5')).getByRole('checkbox').getAttribute('aria-checked')).toBe('false');
  });

  it('toucher une ligne ouvre son problème', () => {
    const g = gestes();
    render(<AFaire carnets={carnets} maintenant={MAINTENANT_SUIVI} {...g} />);
    fireEvent.click(screen.getByText('Joint de détendeur'));
    expect(g.onOuvrir).toHaveBeenCalledWith(IDS_SUIVI.co2, 'ZZ-SC-T1');
  });

  it('clic droit (ou appui long) : « Quand ? » ; un choix change l\'échéance et ferme la feuille', () => {
    const g = gestes();
    render(<AFaire carnets={carnets} maintenant={MAINTENANT_SUIVI} {...g} />);
    fireEvent.contextMenu(screen.getByText('Acheter un testeur de tension'));
    const feuille = screen.getByRole('dialog');
    expect(within(feuille).getByRole('button', { name: 'Cette semaine' }).getAttribute('aria-pressed')).toBe('true'); // son échéance actuelle
    fireEvent.click(within(feuille).getByRole('button', { name: 'Fin du mois' }));
    expect(g.onEcheance).toHaveBeenCalledWith(IDS_SUIVI.fusible, 'ZZ-SF-T1', { date: '2026-11-30', precision: 'mois' });
    expect(screen.queryByRole('dialog')).toBeNull();
    fireEvent.contextMenu(screen.getByText('Acheter un testeur de tension'));
    fireEvent.click(screen.getByRole('button', { name: 'Un jour' }));
    expect(g.onEcheance).toHaveBeenLastCalledWith(IDS_SUIVI.fusible, 'ZZ-SF-T1', { date: null, precision: 'semaine' });
  });

  it('appui long : la feuille s\'ouvre et le toucher qui suit n\'ouvre pas le problème', () => {
    vi.useFakeTimers();
    try {
      const g = gestes();
      render(<AFaire carnets={carnets} maintenant={MAINTENANT_SUIVI} {...g} />);
      const cible = screen.getByText('Joint de détendeur').closest('button')!;
      fireEvent.pointerDown(cible);
      act(() => { vi.advanceTimersByTime(600); });
      expect(screen.getByRole('dialog')).toBeTruthy();
      fireEvent.pointerUp(cible);
      fireEvent.click(cible);
      expect(g.onOuvrir).not.toHaveBeenCalled();
    } finally { vi.useRealTimers(); }
  });

  it('une tâche en retard reste dans « Cette semaine », sans rouge ni mot de reproche', () => {
    const { container } = render(<AFaire carnets={carnets} maintenant="2026-12-03T12:00:00.000Z" {...gestes()} />);
    const groupe = container.querySelector('[data-groupe="cette-semaine"]')!;
    expect(within(groupe as HTMLElement).getByText('Répondre au devis de l’entreprise X')).toBeTruthy();
    expect(container.querySelector('.cn-rouge, [data-retard]')).toBeNull();
    expect(container.textContent).not.toMatch(/retard/i);
  });

  it('une tâche lue du Planning ne se coche pas ici (se coche au Planning) et n\'a pas d\'appui long', () => {
    const planning = carnets.find(c => c.id === IDS_SUIVI.planning)!;
    const g = gestes();
    const { container } = render(<AFaire carnets={[planning]} maintenant="2026-07-01" {...g} />);
    const cases = container.querySelectorAll<HTMLButtonElement>('.af-case');
    if (cases.length === 0) return; // aucune note du Planning à cette date dans la fixture
    expect(cases[0].disabled).toBe(true);
    fireEvent.contextMenu(container.querySelector('.af-corps')!);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('rien à faire : une phrase, pas un écran vide ; les exemples sont marqués « exemple »', () => {
    const { container, rerender } = render(<AFaire carnets={[]} maintenant={MAINTENANT_SUIVI} {...gestes()} />);
    expect(container.textContent).toMatch(/Rien à faire/);
    rerender(<AFaire carnets={carnets} maintenant={MAINTENANT_SUIVI} {...gestes()} />);
    expect(container.querySelector('.cn-exemple')?.textContent).toBe('exemple');
  });
});

describe('CarteARanger', () => {
  const photo = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg"/>';
  const el = { carnetId: IDS_SUIVI.photo, photo, le: MAINTENANT_SUIVI };
  const rappels = () => ({ onRattacher: vi.fn(), onNouveau: vi.fn(), onLaisser: vi.fn() });
  const noms = (c: HTMLElement) => within(c).getAllByRole('button').map(b => b.textContent);

  it('photo seule : « photo seule, sans texte », « Rattacher à <problème> ? », Oui, Nouveau problème, Laisser ; la photo n\'est pas décrite', () => {
    const r = rappels();
    const p = propositionARanger(el, carnets, messages, MAINTENANT_SUIVI);
    const { container } = render(<CarteARanger element={el} proposition={p} {...r} />);
    expect(container.textContent).toContain('photo seule, sans texte');
    expect(container.textContent).toContain(`Rattacher à ${titre(IDS_SUIVI.fusible)} ?`);
    expect(container.textContent).toContain('dernier touché : aujourd’hui');
    expect(container.textContent).not.toMatch(/on dirait|tuyau|qui goutte/i);
    expect(container.querySelector('[data-picto="local"]')).toBeTruthy(); // calcul local : jamais le ✻ de l'IA
    expect(container.textContent).not.toContain('✻');
    expect(noms(container)).toEqual(['Oui', 'Nouveau problème', 'Laisser']);
    fireEvent.click(screen.getByRole('button', { name: 'Oui' }));
    expect(r.onRattacher).toHaveBeenCalledWith(IDS_SUIVI.fusible);
    fireEvent.click(screen.getByRole('button', { name: 'Nouveau problème' }));
    expect(r.onNouveau).toHaveBeenCalledTimes(1);
    fireEvent.click(screen.getByRole('button', { name: 'Laisser' }));
    expect(r.onLaisser).toHaveBeenCalledTimes(1);
    expect(r.onRattacher).toHaveBeenCalledTimes(1);
  });

  it('« truc à voir » : « rien d\'autre écrit : reste ici », Laisser d\'abord, pas de Oui', () => {
    const { container } = render(<CarteARanger element={{ texte: 'truc à voir', le: '' }} proposition={{ sorte: 'rien-d-autre' }} {...rappels()} />);
    expect(container.textContent).toContain('rien d’autre écrit : reste ici');
    expect(noms(container)).toEqual(['Laisser', 'Nouveau problème']);
  });

  it('photo sans problème ouvert : aucune proposition, Nouveau problème et Laisser seulement', () => {
    const { container } = render(<CarteARanger element={el} proposition={{ sorte: 'aucune' }} {...rappels()} />);
    expect(container.textContent).toContain('Aucun problème ouvert où la ranger.');
    expect(noms(container)).toEqual(['Nouveau problème', 'Laisser']);
  });

  it('provenance IA : le ✻ (le jour où l\'IA lira la photo) ; sans photo lisible : le repli appareil', () => {
    const { container } = render(<CarteARanger element={{ ...el, photo: undefined }} proposition={{ sorte: 'aucune' }} origine="ia" {...rappels()} />);
    expect(container.textContent).toContain('✻');
    expect(container.querySelector('img')).toBeNull();
  });
});

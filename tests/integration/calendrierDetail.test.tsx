import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { BancCalendrier } from '../../src/design/CalendrierPreview';
import { DetailChose, sansLaDate } from '../../src/ui/calendrier/frise/DetailChose';
import { VueListe } from '../../src/ui/calendrier/frise/VueListe';
import { StorageService } from '../../src/services/storage';
import type { ChoseCalendrier } from '../../src/domain/calendrier';

/*
 * CRITIQUE-4 n° 1 (D-191, E30, f4-b) : le détail d'un brassin montre « Commander » dès qu'il a des courses (ou un manque), pas seulement un
 * manque ; le bouton ouvre les Courses (`onOpenCourses`). L'ordre de f4-b : Ouvrir le brassin, Commander, Budget ›.
 */
const JOUR = '2026-11-16';
beforeEach(() => { localStorage.clear(); for (const cle of ['calendrier_epingles', 'calendrier_etoiles', 'calendrier_masquees', 'calendrier_ordre']) StorageService.setUiState(cle, []); });
afterEach(() => cleanup());

const brassin = (extra: Partial<ChoseCalendrier> = {}): ChoseCalendrier => ({
  id: 'brassin-LOT-STOUT', rangee: 'brassins', titre: 'Stout maison', debut: '2026-11-23', fin: '2026-12-21', centimes: -14200,
  source: { genre: 'batch', id: 'LOT-STOUT' }, ouvre: { ecran: 'brassin', id: 'LOT-STOUT' }, deplacable: true,
  courses: 'Malt pale ale, Orge torréfiée le 18 nov. · −73', ...extra
} as ChoseCalendrier);

describe('n° 1 : « Commander » dans le détail d’un brassin (f4-b)', () => {
  it('un brassin avec des courses, sans manque : « Commander » est là ; un toucher appelle onOpenCourses une fois', () => {
    const onCommander = vi.fn();
    render(<DetailChose chose={brassin()} onFermer={() => {}} onOuvrir={() => {}} onCommander={onCommander} onBudget={() => {}} />);
    const det = within(screen.getByRole('region', { name: 'Détail : Stout maison' }));
    expect(det.queryByText(/Il manque/)).toBeNull();
    fireEvent.click(det.getByRole('button', { name: /Commander/ }));
    expect(onCommander).toHaveBeenCalledTimes(1);
  });

  it('l’ordre de f4-b : Ouvrir le brassin, Commander, Budget ›', () => {
    render(<DetailChose chose={brassin()} onFermer={() => {}} onOuvrir={() => {}} onCommander={() => {}} onBudget={() => {}} />);
    const noms = [...screen.getByRole('region').querySelectorAll('.cal-det-bt button')].map(b => b.textContent?.trim());
    expect(noms).toEqual(['Ouvrir le brassin', 'Commander', 'Budget ›']);
  });

  it('un brassin sans courses ni manque : pas de « Commander » (rien à commander)', () => {
    render(<DetailChose chose={brassin({ courses: undefined })} onFermer={() => {}} onOuvrir={() => {}} onCommander={() => {}} onBudget={() => {}} />);
    expect(screen.queryByRole('button', { name: /Commander/ })).toBeNull();
  });

  it('sur le banc : toucher le Stout maison, puis « Commander », ouvre les Courses (onOpenCourses, 1 appel)', () => {
    const onOpenCourses = vi.fn();
    render(<BancCalendrier aujourdhui={JOUR} sansChrome callbacks={{ onOpenCourses }} />);
    const stout = screen.getAllByRole('button', { name: /^Stout maison/ })[0];
    fireEvent.pointerDown(stout, { clientX: 10, clientY: 10, pointerId: 1, button: 0 });
    fireEvent.pointerUp(stout, { clientX: 10, clientY: 10, pointerId: 1 });
    const det = within(screen.getByRole('region', { name: /^Détail : Stout maison/ }));
    expect(det.getByText(/^Courses :/)).toBeInTheDocument();
    const noms = [...screen.getByRole('region', { name: /^Détail : Stout maison/ }).querySelectorAll('.cal-det-bt button')].map(b => b.textContent?.trim());
    expect(noms.slice(0, 3)).toEqual(['Ouvrir le brassin', 'Commander', 'Budget ›']);
    fireEvent.click(det.getByRole('button', { name: /Commander/ }));
    expect(onOpenCourses).toHaveBeenCalledTimes(1);
  });
});

/* ---------- CRITIQUE-5 : la vue Liste (n° 4, 21, 22) et la fiche de vente (n° 31) ---------- */

const chose = (extra: Partial<ChoseCalendrier> & Record<string, unknown>): ChoseCalendrier => ({
  id: 'x', rangee: 'fetes', titre: 'X', debut: '2026-11-23', fin: '2026-11-23',
  source: { genre: 'creative', id: 'x' }, ouvre: { ecran: 'agenda', id: 'x' }, deplacable: true, ...extra
} as unknown as ChoseCalendrier);
const JOUR_17 = '2026-11-17';
const liste = (choses: ChoseCalendrier[]) => render(<VueListe choses={choses} sansDate={[]} aujourdhui={JOUR_17} onChose={() => {}} />);
const lignes = () => [...document.querySelectorAll('[data-liste-chose]')].map(l => ({ id: l.getAttribute('data-liste-chose'), texte: l.textContent ?? '' }));

describe('CRITIQUE-5 n° 4, 21, 22 : la vue Liste (E40, D-19, D-204, E47 c)', () => {
  const facture = chose({
    id: 'facture-hopfen', rangee: 'papiers', titre: 'Hopfen · Hallertau Blanc', debut: JOUR_17, fin: JOUR_17, centimes: -26000,
    source: { genre: 'invoice', id: 'F-1' }, ouvre: { ecran: 'piece', id: 'F-1' }, echeance: '2026-11-10', enRetard: true
  });
  const marche = chose({ id: 'fete', titre: 'Marché de Noël', debut: '2026-11-20', fin: '2026-11-20', centimes: 118000 });
  const blonde = chose({ id: 'blonde', rangee: 'brassins', titre: 'Blonde d’automne', debut: '2026-11-09', fin: '2026-12-07', source: { genre: 'batch', id: 'B' }, ouvre: { ecran: 'brassin', id: 'B' } });

  it('n° 4 : une facture due le 10 nov., vue le 17 nov., garde « 10 nov. » (jamais « 17 nov. »), dit « en retard » et passe en tête de « En cours »', () => {
    liste([marche, blonde, facture]);
    const l = lignes();
    const f = l.find(x => x.id === 'facture-hopfen')!;
    expect(f.texte).toContain('10 nov. · S46');
    expect(f.texte).not.toContain('17 nov.');
    expect(f.texte).toMatch(/en retard/);
    expect(l[0].id).toBe('facture-hopfen');
    const enCours = screen.getByRole('region', { name: 'En cours' });
    expect(within(enCours).getAllByRole('listitem')[0]).toHaveAttribute('data-liste-chose', 'facture-hopfen');
  });

  it('n° 22 : la Saison « pas brassée » va avec les retards, en tête, et sa date ne se lit qu’une fois', () => {
    const saison = chose({
      id: 'saison', rangee: 'brassins', titre: 'Saison de ferme', debut: '2026-11-10', fin: '2026-12-08', pasBrassee: true,
      source: { genre: 'batch', id: 'S' }, ouvre: { ecran: 'brassin', id: 'S' }, detail: 'pas brassée · brassage prévu le 10 nov.'
    });
    liste([marche, blonde, saison]);
    const l = lignes();
    expect(l[0].id).toBe('saison');
    expect(l[0].texte).toMatch(/Saison de ferme.*pas brassée · prévue le 10 nov\. · S46/);
    expect(l[0].texte.split('10 nov.').length - 1).toBe(1);
  });

  it('n° 21 : « Loyer du local · à payer », jamais « · proposé », pour une échéance récurrente', () => {
    const loyer = chose({ id: 'loyer', rangee: 'papiers', titre: 'Loyer du local', debut: '2026-11-26', fin: '2026-11-26', centimes: -40000, proposition: 'echeance', source: { genre: 'plan', id: 'P', origine: 'recurring' } });
    liste([loyer]);
    const t = lignes()[0].texte;
    expect(t).toContain('Loyer du local · à payer');
    expect(t).not.toMatch(/proposé/);
  });
});

describe('CRITIQUE-5 n° 31 : la fiche de vente dit sa date une fois', () => {
  it('« Date 10 déc. » une fois ; le morceau « le 10 déc. » du détail ne se répète pas, le reste du détail reste', () => {
    const vente = chose({
      id: 'vente', rangee: 'ventes', titre: 'Épicerie du Bourg, 2 cartons', debut: '2026-12-10', fin: '2026-12-10', centimes: 18000,
      source: { genre: 'plan', id: 'P-EPI', origine: 'manual' }, ouvre: { ecran: 'plan', id: 'P-EPI' }, detail: 'le 10 déc. · à livrer au magasin'
    });
    render(<DetailChose chose={vente} onFermer={() => {}} onOuvrir={() => {}} />);
    const det = screen.getByRole('region', { name: 'Détail : Épicerie du Bourg, 2 cartons' });
    expect((det.textContent ?? '').split('10 déc.').length - 1).toBe(1);
    expect(det.textContent).toContain('à livrer au magasin');
    expect(sansLaDate('le 10 déc.', '2026-12-10')).toBeUndefined();
  });
});

describe('CRITIQUE-6, doutes : la fiche d’une vente rouverte', () => {
  const vente = (extra: Partial<ChoseCalendrier> = {}): ChoseCalendrier => ({
    id: 'plan-EPI', rangee: 'ventes', titre: 'Épicerie du Bourg, 2 cartons', debut: '2026-12-10', fin: '2026-12-10', centimes: 18000, detail: 'le 10 déc.',
    source: { genre: 'plan', id: 'P-EPI', origine: 'manual', statut: 'active' }, ouvre: { ecran: 'finances' }, deplacable: true, ...extra
  } as ChoseCalendrier);

  it('la date se lit une fois ; le lien qui répète le titre ne fait pas une ligne de plus ; un lien vers un brassin garde ce qu’il ajoute', () => {
    render(<DetailChose chose={vente({ lie: { texte: 'lié à Épicerie du Bourg', apercu: 'Épicerie du Bourg · client', client: 'Épicerie du Bourg' } })} onFermer={() => {}} onOuvrir={() => {}} />);
    const det = screen.getByRole('region', { name: 'Détail : Épicerie du Bourg, 2 cartons' });
    expect((det.textContent ?? '').match(/10 déc\./g)).toHaveLength(1);
    expect(det.querySelector('[data-apercu-lien]')).toBeNull();
    expect((det.textContent ?? '').match(/Épicerie du Bourg/g)).toHaveLength(1);
    cleanup();
    render(<DetailChose chose={vente({ titre: '3 fûts La Cigogne', lie: { texte: 'lié à Blonde d’automne', apercu: 'La Cigogne · client ; Blonde d’automne · prête 21 déc.' } })} onFermer={() => {}} onOuvrir={() => {}} />);
    const lien = screen.getByRole('region', { name: 'Détail : 3 fûts La Cigogne' }).querySelector('[data-apercu-lien]');
    expect(lien?.textContent).toContain('lié à Blonde d’automne');
    expect(lien?.textContent).toContain('prête 21 déc.');
  });
});

import React from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EquipmentList } from '../../src/ui/EquipmentList';
import { pictoKindOf } from '../../src/ui/equipment/ListPictos';
import type { EquipmentItem } from '../../src/types';

/** za3 : le fil du matériel. Jour fixé au 14.11.2026, comme la maquette ; aucune donnée réelle. */
const TODAY = '2026-11-14';
const e = (over: Partial<EquipmentItem> & Pick<EquipmentItem, 'ref' | 'name'>): EquipmentItem => ({ id: over.ref, category: 'Brassage', state: 'Bon', ...over });
const parc: EquipmentItem[] = [
  e({ ref: 'EQ-1', name: 'pH-mètre', category: 'Mesure', rhythm: { every: 1, unit: 'mois' }, lastDone: '2026-10-11', history: [{ date: '2026-10-11', kind: 'etalonnage' }] }),
  e({ ref: 'EQ-2', name: 'Pompe de recirculation', brokenSince: '2026-11-05', brokenNote: 'fuit au raccord', state: 'À réparer' }),
  e({ ref: 'EQ-3', name: 'Densimètre + éprouvette', category: 'Mesure' }),
  e({ ref: 'EQ-4', name: 'Déshumidificateur', task: 'Nettoyer le filtre', rhythm: { every: 1, unit: 'mois' }, lastDone: '2026-11-01', purchasePrice: 239 }),
  e({ ref: 'EQ-5', name: 'Moulin à malt' }),
  e({ ref: 'EQ-6', name: 'Refroidisseur à plaques', task: 'Détartrer', rhythm: { every: 5, unit: 'brassin' }, purchaseDate: '2026-01-01' }),
];
const brassins = Array.from({ length: 6 }, (_, i) => ({ brewDate: `2026-0${i + 2}-15` }));

const monter = (over: Partial<React.ComponentProps<typeof EquipmentList>> = {}) => {
  const props = { equipment: parc, batches: brassins, today: TODAY, onOpen: vi.fn(), onWrite: vi.fn(), onAdd: vi.fn(), onBuy: vi.fn(), onProjects: vi.fn(), ...over };
  return { props, ...render(<EquipmentList {...props} />) };
};
afterEach(() => { cleanup(); vi.useRealTimers(); });

describe('le parc du matériel (d8a)', () => {
  it('met la panne d’abord, puis le dû, avec leurs sous-lignes en ton d’attention ; « prix à saisir » quand le prix manque', () => {
    monter();
    const lignes = screen.getAllByRole('button', { name: /^Ouvrir / }).map(b => b.getAttribute('aria-label'));
    expect(lignes.slice(0, 4)).toEqual(['Ouvrir Pompe de recirculation', 'Ouvrir pH-mètre', 'Ouvrir Refroidisseur à plaques', 'Ouvrir Densimètre + éprouvette']);
    expect(screen.getByRole('button', { name: 'Ouvrir Pompe de recirculation' })).toHaveTextContent(/fuit au raccord.*depuis le 05.11/);
    expect(screen.getByRole('button', { name: 'Ouvrir pH-mètre' })).toHaveTextContent(/étalonner.*prévu le 11.11/);
    expect(screen.getByRole('button', { name: 'Ouvrir Refroidisseur à plaques' })).toHaveTextContent(/détartrer.*après 5 brassins/);
    expect(screen.getByRole('button', { name: 'Ouvrir Densimètre + éprouvette' })).toHaveTextContent('pas encore étalonné');
    expect(screen.getByRole('button', { name: 'Ouvrir Pompe de recirculation' }).querySelector('.mp-sl')).toHaveClass('mp-alerte');
    expect(screen.getByRole('button', { name: 'Ouvrir pH-mètre' }).querySelector('.mp-sl')).toHaveClass('mp-attention');
    // l'avenir : le verbe et la date, jamais « dans N j »
    const avenir = screen.getByRole('button', { name: 'Ouvrir Déshumidificateur' });
    expect(avenir).toHaveTextContent('nettoyer le filtre');
    expect(avenir).toHaveTextContent('01.12');
    expect(document.body.textContent).not.toMatch(/dans \d+ ?j/);
    // sans prix : « prix à saisir » et « ? » en pointillé, jamais 0
    const moulin = screen.getByRole('button', { name: 'Ouvrir Moulin à malt' });
    expect(moulin).toHaveTextContent('prix à saisir');
    expect(moulin.querySelector('[data-prix="inconnu"]')).not.toBeNull();
    expect(moulin).not.toHaveTextContent(/0 CHF/);
  });

  it('plus de frise ni de gestes dans la liste : Réparée, Fait et Étalonner vivent dans la fiche', () => {
    const { props } = monter();
    expect(screen.queryByRole('button', { name: /^(Réparée|Fait|Étalonner) :/ })).toBeNull();
    expect(screen.queryByRole('radio', { name: /À traiter/ })).toBeNull();
    expect(document.body.textContent).not.toMatch(/aujourd'hui/);
    fireEvent.click(screen.getByRole('button', { name: 'Ouvrir Densimètre + éprouvette' }));
    expect(props.onOpen).toHaveBeenLastCalledWith(parc[2]);
  });

  it('l’en-tête dit le total des prix connus et « + N ? » pour les autres ; la réf. automatique ne s’affiche jamais (TE-46)', () => {
    monter({ equipment: [e({ ref: 'EQ-6c0b6340-dcdb-4e5c-bb04-355931fc1d2e-0', name: 'Cuve de fermentation' }), ...parc] });
    expect(document.body.textContent).not.toMatch(/EQ-6c0b6340/);
    const tete = document.querySelector('.mp-h')!;
    expect(tete).toHaveTextContent(/^Parc239 CHF\+ 6 \?/);
    expect(tete.querySelector('.mp-plus')).toHaveAttribute('data-sans-prix', '6');
  });

  it('« À venir » sous le parc : une ligne par projet, prix inconnu = « ? », un toucher ouvre À venir', () => {
    const onAvenir = vi.fn();
    monter({ onAvenir, avenir: [{ id: 'p1', titre: 'Chambre froide', sousLigne: 'carnet · 3 façons', prixCents: 335000 }, { id: 'p2', titre: 'Tireuse', sousLigne: 'idée', prixCents: null }] });
    const ch = screen.getByRole('button', { name: 'À venir : Chambre froide' });
    expect(ch).toHaveTextContent('carnet · 3 façons');
    expect(ch).toHaveTextContent(/3\s350 CHF/);
    expect(screen.getByRole('button', { name: 'À venir : Tireuse' }).querySelector('[data-prix="inconnu"]')).not.toBeNull();
    fireEvent.click(ch);
    expect(onAvenir).toHaveBeenCalled();
  });

  it('parc vide : « Aucun matériel » et les deux chemins d’ajout', () => {
    const vide = monter({ equipment: [] });
    expect(screen.getByText('Aucun matériel')).toBeVisible();
    fireEvent.click(screen.getAllByRole('button', { name: 'Enregistrer un achat' })[0]);
    expect(vide.props.onBuy).toHaveBeenCalled();
    expect(screen.getByRole('button', { name: /Projets d'équipement/ })).toBeVisible();
    expect(screen.queryByRole('button', { name: 'Chercher un équipement' })).toBeNull();
  });

  it('un picto par nom d’appareil, la clé à molette quand rien ne correspond', () => {
    expect(pictoKindOf('Réfractomètre')).toBe('refr');
    expect(pictoKindOf('pH-mètre')).toBe('ph');
    expect(pictoKindOf('Cuve fermentation 100L')).toBe('ferm');
    expect(pictoKindOf('Cuve d’ébullition 100L')).toBe('cuve');
    expect(pictoKindOf('Machine inconnue')).toBe('cle');
  });
});

describe('c1 — corrections du test d’écran (P5, P8, P10, P11, P12)', () => {
  it('P5 : le fil de l’ajout porte la petite réglette de za3 devant « prochain le … », plus longue pour 3 mois que pour 1 mois', () => {
    monter();
    fireEvent.click(screen.getByRole('button', { name: /Déjà possédé/ }));
    fireEvent.click(screen.getByRole('radio', { name: 'Entretien : mois' }));
    const x1 = Number(screen.getByRole('img', { name: /prochain/ }).querySelector('[data-prochain]')!.getAttribute('cx'));
    fireEvent.click(screen.getByRole('radio', { name: 'Entretien : 3 mois' }));
    const regle = screen.getByRole('img', { name: /prochain/ });
    const x3 = Number(regle.querySelector('[data-prochain]')!.getAttribute('cx'));
    expect(x3).toBeGreaterThan(x1);
    expect(regle.querySelector('[data-dernier]')).not.toBeNull();
    expect(screen.getByText(/prochain le/)).toBeVisible();
  });

  it('P10 : le total du parc se lit « 1 739 CHF » (espace, jamais l’apostrophe)', () => {
    monter({ equipment: [...parc, e({ ref: 'EQ-9', name: 'Cuve', purchasePrice: 1500 })] });
    expect(document.querySelector('.mp-tot')!.textContent).toMatch(/^1\s739 CHF$/);
  });

  it('P12 : un appareil au rythme en brassins garde son picto et son nom ; le compte de brassins reste dans la fiche', () => {
    monter({ equipment: [e({ ref: 'EQ-6', name: 'Refroidisseur à plaques', task: 'Détartrer', rhythm: { every: 5, unit: 'brassin' }, lastDone: '2026-07-01' }), e({ ref: 'EQ-5', name: 'Moulin à malt' })], batches: [{ brewDate: '2026-08-15' }] });
    const ligne = screen.getByRole('button', { name: 'Ouvrir Refroidisseur à plaques' });
    expect(ligne.querySelector('svg')).not.toBeNull();
    expect(ligne).not.toHaveTextContent(/encore/);
  });

  it('P11 : « Nouveau matériel » a un titre de feuille gras et un × dans un rond de 44 px', () => {
    monter();
    fireEvent.click(screen.getByRole('button', { name: /Déjà possédé/ }));
    expect(screen.getByText('Nouveau matériel', { selector: '.mt-feuille-titre' })).toBeVisible();
    expect(screen.getByRole('heading', { name: 'Nouveau matériel' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Fermer' })).toHaveClass('mt-feuille-x');
  });
});

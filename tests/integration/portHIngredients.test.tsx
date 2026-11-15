import React, { useState } from 'react';
import { afterEach, describe, expect, it } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import {
  BrewIngredients,
  doseAlphaEquivalente,
  estSaute,
  remplacerAjout,
  sauterAjout
} from '../../src/ui/BrewIngredients';
import { brewAlarms, brewIngredients } from '../../src/domain/brewCompanion';
import type { BrewDayState, RecipeSnapshot, StockItem } from '../../src/types';

/**
 * Voie port-H (12.11) : les ajouts de p2c (« La journée en frise »), état E2 de 16 h 19 :
 * « 60′ Magnum 10 g · 15 h 20 ✓ », « 5′ Citra 25 g · en retard de 4 min · Fait » (ligne rose, case rouge),
 * « 0′ Amarillo 43 g · coupure du feu · dans 1 min ». Plus : Remplacer pour un houblon (A04, G1e) et Sauter (A06).
 */
const heure = (h: number, m: number) => new Date(2026, 9, 12, h, m, 0, 0).getTime();
const DEBUT = heure(15, 20);
const MAINTENANT = heure(16, 19) + 20_000;

const recipe = {
  name: 'neipa v3',
  volumeL: 24,
  boilMin: 60,
  hops: [
    { name: 'Magnum', stage: 'boil', weightG: 10, alpha: 12, timeMin: 60 },
    { name: 'Citra', stage: 'boil', weightG: 25, alpha: 12, timeMin: 5 },
    { name: 'Amarillo', stage: 'boil', weightG: 43, alpha: 8, timeMin: 0 }
  ],
  fermentables: []
} as unknown as RecipeSnapshot;

const stock = [
  { id: 's1', ref: 'MP-1', name: 'Mosaic', category: 'Houblon', unit: 'g', currentStock: 200, minStock: 0, reorder: false, alphaPct: 10 },
  { id: 's2', ref: 'MP-2', name: 'Galaxy', category: 'Houblon', unit: 'g', currentStock: 0, minStock: 0, reorder: false, alphaPct: 14 },
  { id: 's3', ref: 'MP-3', name: 'Pale Ale', category: 'Malt', unit: 'kg', currentStock: 20, minStock: 0, reorder: false }
] as unknown as StockItem[];

const etatInitial = (): BrewDayState =>
  ({
    currentIndex: 1,
    startedAt: DEBUT - 3_600_000,
    steps: [{ id: 'boil-60', label: 'Ébullition', durationMin: 60, startedAt: DEBUT }],
    readings: [],
    boilStartedAt: DEBUT,
    boilDurationMin: 60,
    additions: { 'hop-0': { amount: 10, doneAt: DEBUT } }
  }) as unknown as BrewDayState;

function Banc({ initial = etatInitial(), onState }: { initial?: BrewDayState; onState?: (s: BrewDayState) => void }) {
  const [state, setState] = useState(initial);
  onState?.(state);
  return (
    <BrewIngredients
      recipe={recipe}
      state={state}
      stock={stock}
      area="boil"
      stepId="boil-60"
      now={MAINTENANT}
      update={(f) => setState((s) => f(s))}
    />
  );
}

afterEach(cleanup);

const ligne = (nom: string) => screen.getByText(nom, { selector: 'strong' }).closest('.bz-row') as HTMLElement;

describe('port-H · ajouts de p2c : mots exacts', () => {
  it('Ajouts, minutes, doses, heure faite, coupure du feu, retard', () => {
    render(<Banc />);
    const region = within(screen.getByRole('region', { name: 'Ingrédients à ajouter' }));
    expect(region.getByRole('heading', { name: 'Ajouts' })).toBeTruthy();
    expect(region.getByText('1/3')).toBeTruthy();
    expect(ligne('Magnum').textContent).toContain('60′');
    expect(ligne('Magnum').textContent).toContain('15 h 20');
    expect(ligne('Citra').textContent).toContain('5′');
    expect(ligne('Citra').textContent).toContain('25');
    expect(ligne('Citra').textContent).toContain('en retard de 4 min');
    expect(ligne('Amarillo').textContent).toContain('coupure du feu');
  });

  it('la ligne en retard est rose et sa case dit « Fait » (rouge) ; les autres non', () => {
    render(<Banc />);
    const citra = ligne('Citra');
    expect(citra.hasAttribute('data-du')).toBe(true);
    expect(within(citra).getByText('Fait', { selector: '.bz-case-fait' })).toBeTruthy();
    expect(citra.textContent).toContain('prévu à 16 h 15');
    expect(within(ligne('Amarillo')).queryByText('Fait')).toBeNull();
    expect(within(ligne('Magnum')).queryByText('Fait')).toBeNull();
  });

  it('toucher la case « Fait » coche et retire le rouge ; la ligne prend l’heure du toucher', () => {
    render(<Banc />);
    fireEvent.click(within(ligne('Citra')).getByRole('checkbox', { name: 'Ajouté : Citra' }));
    const citra = ligne('Citra');
    expect(citra.hasAttribute('data-fait')).toBe(true);
    expect(citra.hasAttribute('data-du')).toBe(false);
    expect(within(citra).queryByText('Fait', { selector: '.bz-case-fait' })).toBeNull();
    // Amarillo (16 h 20) n'est pas encore échu à 16 h 19 : il devient le prochain, sans rose.
    expect(ligne('Amarillo').hasAttribute('data-prochain')).toBe(true);
    expect(ligne('Amarillo').hasAttribute('data-du')).toBe(false);
  });
});

describe('port-H · Remplacer pour un houblon (A04, G1e)', () => {
  it('le geste existe pour un houblon : « Pas de Citra ? », le stock en houblons, une saisie libre', () => {
    render(<Banc />);
    fireEvent.click(within(ligne('Citra')).getByRole('button', { name: /Modifier la quantité de Citra/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Remplacer ce houblon' }));
    expect(screen.getByText('Pas de Citra ?')).toBeTruthy();
    expect(screen.getByRole('button', { name: /^Mosaic/ })).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Galaxy/ })).toBeNull(); // stock à 0 : pas proposé
    expect(screen.queryByRole('button', { name: /Pale Ale/ })).toBeNull(); // un malt n'est pas un houblon
    expect(screen.getByLabelText('Autre houblon utilisé')).toBeTruthy();
  });

  it('un remplacement garde la dose et le moment', () => {
    let dernier!: BrewDayState;
    render(<Banc onState={(s) => { dernier = s; }} />);
    fireEvent.click(within(ligne('Citra')).getByRole('button', { name: /Modifier la quantité de Citra/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Remplacer ce houblon' }));
    fireEvent.click(screen.getByRole('button', { name: /^Mosaic/ }));
    expect(dernier.additions?.['hop-1']?.replacement?.name).toBe('Mosaic');
    expect(dernier.additions?.['hop-1']?.amount).toBe(25);
    expect(dernier.additions?.['hop-1']?.doneAt).toBeUndefined();
    expect(ligne('Mosaic').textContent).toContain('5′');
    expect(ligne('Mosaic').textContent).toContain('en retard de 4 min');
  });

  it('remplacerAjout (pur) : α inconnu ne propose aucune dose équivalente, jamais 0', () => {
    const item = brewIngredients(recipe)[1];
    const s = remplacerAjout(etatInitial(), item, { name: 'Mosaic' });
    expect(s.additions?.['hop-1']).toEqual({ amount: 25, replacement: { name: 'Mosaic' } });
    expect(doseAlphaEquivalente(25, 12, undefined, 'g')).toBeNull();
    expect(doseAlphaEquivalente(25, 12, 0, 'g')).toBeNull();
    expect(doseAlphaEquivalente(25, undefined, 10, 'g')).toBeNull();
    expect(doseAlphaEquivalente(25, 12, 10, 'g')).toBe(30);
  });

  it('un remplacement saisi à la main garde la dose, sans α inventé', () => {
    let dernier!: BrewDayState;
    render(<Banc onState={(s) => { dernier = s; }} />);
    fireEvent.click(within(ligne('Citra')).getByRole('button', { name: /Modifier la quantité de Citra/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Remplacer ce houblon' }));
    fireEvent.change(screen.getByLabelText('Autre houblon utilisé'), { target: { value: 'Simcoe' } });
    fireEvent.click(screen.getByRole('button', { name: 'Utiliser' }));
    expect(dernier.additions?.['hop-1']?.replacement).toEqual({ name: 'Simcoe' });
    expect(dernier.additions?.['hop-1']?.amount).toBe(25);
  });
});

describe('port-H · Sauter (A06)', () => {
  it('sauterAjout : dose 0 posée, non cochée, journalisée « non versé » ; elle ne sonne plus', () => {
    const items = brewIngredients(recipe);
    const avant = brewAlarms(etatInitial(), recipe).map((a) => a.id);
    expect(avant.some((id) => id.includes('hop-1'))).toBe(true);
    const s = sauterAjout(etatInitial(), items[1], MAINTENANT);
    expect(s.additions?.['hop-1']).toEqual({ amount: 0 });
    expect(estSaute(s, 'hop-1')).toBe(true);
    expect(s.notes?.[s.notes.length - 1]).toMatchObject({ at: MAINTENANT, text: 'Citra 25 g · non versé' });
    expect(brewAlarms(s, recipe).some((a) => a.id.includes('hop-1'))).toBe(false);
    // les autres ajouts sonnent toujours
    expect(brewAlarms(s, recipe).some((a) => a.id.includes('hop-2'))).toBe(true);
  });

  it('sauter deux fois n’écrit qu’une ligne de journal', () => {
    const items = brewIngredients(recipe);
    const une = sauterAjout(etatInitial(), items[1], MAINTENANT);
    const deux = sauterAjout(une, items[1], MAINTENANT + 1000);
    expect(deux.notes?.filter((n) => /non versé/.test(n.text))).toHaveLength(1);
  });

  it('au rendu : « Sauter » passe la ligne en « non versé », le prochain devient Amarillo, le compte baisse', () => {
    render(<Banc />);
    fireEvent.click(within(ligne('Citra')).getByRole('button', { name: /Modifier la quantité de Citra/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Sauter' }));
    const citra = ligne('Citra');
    expect(citra.textContent).toContain('non versé');
    expect(citra.hasAttribute('data-du')).toBe(false);
    expect(citra.hasAttribute('data-saute')).toBe(true);
    expect(ligne('Amarillo').hasAttribute('data-prochain')).toBe(true);
    expect(screen.getByText('1/2')).toBeTruthy();
    // retour arrière : « Remettre » rend la dose prévue
    fireEvent.click(within(citra).getByRole('button', { name: /Modifier la quantité de Citra/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Remettre cet ajout' }));
    expect(ligne('Citra').hasAttribute('data-saute')).toBe(false);
    expect(ligne('Citra').textContent).toContain('en retard de 4 min');
  });

  it('cocher une ligne sautée rend la dose prévue avant de consigner l’ajout', () => {
    let dernier!: BrewDayState;
    render(<Banc initial={sauterAjout(etatInitial(), brewIngredients(recipe)[1], MAINTENANT)} onState={(s) => { dernier = s; }} />);
    fireEvent.click(within(ligne('Citra')).getByRole('checkbox', { name: 'Ajouté : Citra' }));
    expect(dernier.additions?.['hop-1']?.amount).toBe(25);
    expect(dernier.additions?.['hop-1']?.doneAt).toBeTypeOf('number');
  });
});

// @vitest-environment jsdom
// Voie a1 du 19.11 : défauts ouverts de l'étape Malts/sucres (PI-1, M-4, MV-7, MV-8, SU-NOTE-2, BR-11).
// Fixtures simulées (stock de la maquette s1), aucune donnée du brasseur.
import React, { useState } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import type { Fermentable, FermentableKind, StockItem } from '../../src/types';
import { EtapeFermentescibles } from '../../src/ui/fermentescibles/EtapeFermentescibles';
import type { DefFamille } from '../../src/ui/fermentescibles/Ajout';
import { stockApercu } from '../../src/ui/fermentescibles/apercuDev';

const DEFS: Record<FermentableKind, DefFamille> = {
  grain: { label: 'Grain', use: 'empatage', fermentability: 100, stock: ['Malt', 'Céréale'], newCat: 'Malt' },
  sucre: { label: 'Sucre', use: 'ebullition', fermentability: 100, ppg: 46, stock: ['Sucre'], newCat: 'Sucre' },
  lactose: { label: 'Lactose', use: 'ebullition', fermentability: 0, ppg: 35, stock: ['Sucre'], newCat: 'Sucre' },
  fruit: { label: 'Fruit', use: 'fermentation', fermentability: 90, ppg: 8, stock: ['Fruit', 'Additif'], newCat: 'Sucre' },
  extrait: { label: 'Extrait', use: 'ebullition', fermentability: 75, ppg: 36, stock: ['Extrait', 'Sucre'], newCat: 'Sucre' },
};

let courant: Fermentable[] = [];
const creations: Array<[string, string, string]> = [];

const pale: Fermentable = { name: 'Pale Ale Malz', kind: 'grain', use: 'empatage', weightKg: 5, potentialPpg: 37, colorEbc: 6.5 };
const pilsFerm: Fermentable = { name: 'Pilsner Malz', kind: 'grain', use: 'fermentation', weightKg: 1.8, dayOffset: 4, potentialPpg: 37, colorEbc: 3.5 };

function Banc({ depart = [pale], teinte = null, famille0 = 'grain' }: { depart?: Fermentable[]; teinte?: { ebc: number; label: string } | null; famille0?: FermentableKind }) {
  const [l, setL] = useState<Fermentable[]>(depart);
  const [stock] = useState<StockItem[]>(() => stockApercu());
  const [famille, setFamille] = useState<FermentableKind>(famille0);
  courant = l;
  return (
    <EtapeFermentescibles
      fermentables={l} onFermentables={setL} stockItems={stock} famille={famille} onFamille={setFamille} defs={DEFS}
      onCreateStockItem={(n, c, u) => { creations.push([n, c, u]); return { id: 'neuf', ref: 'NEUF-1', name: n, category: c, unit: u, currentStock: 0, minStock: 0, reorder: false } as StockItem; }}
      onLearnIngredient={() => {}} nolo={false} og={null} teinteBiere={teinte} rendementPct={75} rendementDeclare={false} erreur={() => undefined}
    />
  );
}

beforeEach(() => { creations.length = 0; });
afterEach(cleanup);

const champ = () => screen.getByRole('combobox', { name: /Ajouter un fermentescible/ }) as HTMLInputElement;
const alertes = () => document.querySelector('[data-role="alertes"]')!.textContent ?? '';

describe('PI-1 — la pastille d’un grain mal placé ne promet pas un cycle', () => {
  it('une seule direction : pas de flèche de cycle (.fer-tour), le nom du geste est « remettre »', () => {
    render(<Banc depart={[pale, pilsFerm]} />);
    const pastille = document.querySelectorAll<HTMLElement>('[data-sel]')[1].querySelector<HTMLElement>('[data-role="moment-ligne"]')!;
    expect(pastille.getAttribute('data-hors')).toBe('moment');
    expect(pastille.querySelector('.fer-tour')).toBeNull();
    expect(pastille.getAttribute('aria-label')).toMatch(/remettre à l’empâtage/i);
  });
  it('un sucre bien placé garde sa flèche de cycle', () => {
    render(<Banc depart={[pale, { name: 'Dextrose', kind: 'sucre', use: 'ebullition', weightKg: 0.4, potentialPpg: 46 }]} />);
    const p = document.querySelectorAll<HTMLElement>('[data-sel]')[1].querySelector<HTMLElement>('[data-role="moment-ligne"]')!;
    expect(p.querySelector('.fer-tour')).not.toBeNull();
  });
});

describe('M-4 — une teinte absurde est une alerte, pas un simple repère au bord', () => {
  it('267 EBC : l’alerte dit la valeur, le plafond du métier (stouts : 40 SRM ≈ 79 EBC) et quoi vérifier', () => {
    render(<Banc teinte={{ ebc: 267.2, label: 'Noire' }} />);
    expect(alertes()).toMatch(/267,2 EBC/);
    expect(alertes()).toMatch(/79 EBC/);
    expect(alertes()).toMatch(/malts? (colorés|torréfiés)|masses/);
  });
  it('une stout noire à 60 EBC ne déclenche rien ; une teinte inconnue (null) non plus', () => {
    const { unmount } = render(<Banc teinte={{ ebc: 60, label: 'Noire' }} />);
    expect(alertes()).not.toMatch(/EBC/);
    unmount();
    render(<Banc teinte={null} />);
    expect(alertes()).not.toMatch(/EBC/);
  });
});

describe('MV-7 — « Miel » tapé dans Grain n’est pas un grain d’empâtage', () => {
  it('Entrée crée un sucre (à l’ébullition), dans le rayon Sucre du stock', async () => {
    const u = userEvent.setup();
    render(<Banc />);
    await u.click(champ());
    await u.type(champ(), 'Miel 0,5{Enter}');
    expect(courant[1]).toMatchObject({ name: 'Miel', kind: 'sucre', use: 'ebullition', weightKg: 0.5 });
    expect(creations[0]).toEqual(['Miel', 'Sucre', 'kg']);
  });
  it('le bouton « Créer » dit la famille avant le geste', async () => {
    const u = userEvent.setup();
    render(<Banc />);
    await u.click(champ());
    await u.type(champ(), 'Miel');
    expect(screen.getByRole('option', { name: /Créer « Miel »/ }).textContent).toMatch(/sucre/i);
  });
  it('« Mangue 20 » dans Grain : un fruit de 20 kg (la règle de masse suit la famille devinée)', async () => {
    const u = userEvent.setup();
    render(<Banc />);
    await u.click(champ());
    await u.type(champ(), 'Mangue 20{Enter}');
    expect(courant[1]).toMatchObject({ name: 'Mangue', kind: 'fruit', use: 'fermentation', weightKg: 20 });
  });
  it('un nom de malt inconnu reste un grain', async () => {
    const u = userEvent.setup();
    render(<Banc />);
    await u.click(champ());
    await u.type(champ(), 'Malt du voisin{Enter}');
    expect(courant[1]).toMatchObject({ name: 'Malt du voisin', kind: 'grain', use: 'empatage' });
  });
  it('la famille que le brasseur a choisie à la bascule n’est jamais écrasée par le nom', async () => {
    const u = userEvent.setup();
    render(<Banc famille0="lactose" />);
    await u.click(champ());
    await u.type(champ(), 'Mangue{Enter}');
    expect(courant[1]).toMatchObject({ name: 'Mangue', kind: 'lactose' });
  });
});

describe('MV-8 — une épice n’est pas un fermentescible', () => {
  it('« Coriandre » créée : l’écran dit où elle va (additifs, en grammes) au lieu d’un « 1 % du grain » muet', async () => {
    const u = userEvent.setup();
    render(<Banc depart={[pale, { name: 'Coriandre', kind: 'grain', use: 'empatage', weightKg: 0.05, potentialPpg: 37 }]} />);
    expect(alertes()).toMatch(/Coriandre/);
    expect(alertes()).toMatch(/additif/i);
    void u;
  });
});

describe('SU-NOTE-2 — « 0,2 » Entrée juste après une création est sa masse', () => {
  it('Entrée crée la ligne, le curseur va dans sa masse, « 0,2 » Entrée la pose, puis le champ d’ajout reprend', async () => {
    const u = userEvent.setup();
    render(<Banc />);
    await u.click(champ());
    await u.type(champ(), 'Truc inconnu{Enter}');
    const m = document.querySelector<HTMLInputElement>('[data-kl="1"]')!;
    expect(document.activeElement).toBe(m);
    await u.keyboard('0,2{Enter}');
    expect(courant[1].weightKg).toBeCloseTo(0.2, 3);
    expect(document.activeElement).toBe(champ());
  });
});

describe('BR-11 — « dext » : l’ordre des propositions', () => {
  it('Dextrose (début de son nom) n’est pas derrière un malt qui ne la porte qu’en surnom', async () => {
    const u = userEvent.setup();
    render(<Banc />);
    await u.click(champ());
    await u.type(champ(), 'dext');
    const noms = screen.getAllByRole('option').map((o) => o.getAttribute('data-nom'));
    expect(noms.indexOf('Dextrose')).toBeLessThan(noms.indexOf('Carapils') < 0 ? 99 : noms.indexOf('Carapils'));
  });
});

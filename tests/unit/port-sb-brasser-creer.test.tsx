// @vitest-environment jsdom
// Ports de d1b (feuille « Brasser », trois semaines de cuve) et de c2a (« Créer un brassin », état « après »).
// Fixtures FICTIVES (préfixe ZZ). Aujourd'hui = sam. 14.11.2026 ; la cuve : 30 L ; chaque brassin : 24 L.
import React from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import type { Batch, Recipe, StockItem } from '../../src/types';

const effacer = vi.fn();
vi.mock('../../src/services/storage', () => ({
  StorageService: {
    deleteBatch: (id: string) => effacer(id),
    getConfig: () => ({ brewhouses: [{ id: 'b', efficiencyPct: 75 }], activeBrewhouseId: 'b' }),
    getUiState: (_k: string, d: unknown) => d,
    setUiState: () => undefined,
    subscribe: () => () => undefined,
    getStocks: () => ({ rawMaterials: [], cleaning: [] })
  }
}));
import { FeuilleBrasser } from '../../src/ui/production/brasser/FeuilleBrasser';
import { etatCuve, evenements, occupations, premierLibre, raisonDe, type Contexte } from '../../src/ui/production/brasser/cuveModel';
import { ListeCreer } from '../../src/ui/production/creer/ListeCreer';
import { CarteApres } from '../../src/ui/production/creer/CarteApres';
import { cartesCreer, effetsDe } from '../../src/ui/production/creer/creerModel';

afterEach(() => { cleanup(); effacer.mockClear(); });

const NOW = new Date(2026, 10, 14, 10).getTime(); // sam. 14.11
const J = (jour: number) => new Date(2026, 10, jour).getTime();
const article = (ref: string, name: string, category: string, currentStock: number, unit = 'g'): StockItem =>
  ({ id: ref, ref, name, category, unit, currentStock, minStock: 0, reorder: false }) as StockItem;

const recette = (id: string, nom: string, extra: Partial<Recipe> = {}): Recipe => ({
  id, name: nom, style: 'Pilsner', volumeL: 24, ogTarget: null, abvTarget: null,
  fermentables: [{ name: 'ZZ Pils', stockItemRef: 'ZZ-PILS', weightKg: 5 }],
  hops: [{ name: 'ZZ Saaz', stockItemRef: 'ZZ-SAAZ', weightG: 50, stage: 'boil' }],
  yeast: { name: 'ZZ US-05', stockItemRef: 'ZZ-US05', qty: 1, unit: 'sachet' }, adjuncts: [], ...extra
}) as unknown as Recipe;

const STOCK = [article('ZZ-PILS', 'ZZ Pils', 'Malt', 25, 'kg'), article('ZZ-SAAZ', 'ZZ Saaz', 'Houblon', 250), article('ZZ-US05', 'ZZ US-05', 'Levure', 3, 'sachet')];

/** La Pils en cuve depuis le 27.10 (plan 21 j), mise en bouteille datée mar. 17.11 ; la NEIPA en cuve depuis le 09.11 avec dry hop au jour 6 (dim. 15). */
const lot = (id: string, nom: string, extra: Partial<Batch>): Batch => ({
  id, name: nom, style: 'x', brewDate: '', status: 'fermentation', volumeL: 24, gravityLog: [], recipeSnapshot: { name: nom }, ...extra
}) as unknown as Batch;
const PILS = lot('ZZ-017', 'ZZ Pils', { brewDate: '2026-10-27', bottlingDate: '17.11.2026', brewDay: { pitchedAt: new Date(2026, 9, 27, 12).getTime() } as Batch['brewDay'] });
const NEIPA = lot('ZZ-019', 'ZZ NEIPA', {
  brewDate: '2026-11-09', bottlingDate: '', brewDay: { pitchedAt: new Date(2026, 10, 9, 12).getTime() } as Batch['brewDay'],
  recipeSnapshot: { name: 'ZZ NEIPA', hops: [{ name: 'Citra', weightG: 100, stage: 'dryHop', dayOffset: 6 }], fermentation: [{ kind: 'primaire', name: 'p', tempC: 21, days: 10 }] } as never
});

/** Une troisième cuve occupée : la brasserie du brasseur a trois fermenteurs de 30 L (capacité totale 72 L pour 24 L par brassin). */
const PALE = lot('ZZ-020', 'ZZ Pale Ale', { brewDay: { pitchedAt: new Date(2026, 10, 10, 12).getTime() } as Batch['brewDay'], bottlingDate: '20.11.2026' });
const ctx = (batches: Batch[], capaciteL: number | undefined): Contexte => ({ occ: occupations(batches), evts: evenements(batches), capaciteL, volumeL: 24, aujourdhui: J(14) });

describe('la cuve, jour par jour (cuveModel)', () => {
  it('pleine tant que la Pils y est (jusqu\'au 17), libre dès le 18', () => {
    const c = ctx([PILS], 30);
    expect(etatCuve(c.occ, J(15), 30, 24).etat).toBe('pleine');
    expect(etatCuve(c.occ, J(17), 30, 24).etat).toBe('pleine');
    expect(etatCuve(c.occ, J(18), 30, 24).etat).toBe('libre');
  });
  it('une capacité inconnue n\'est jamais « libre »', () => {
    expect(etatCuve(ctx([PILS], undefined).occ, J(25), undefined, 24).etat).toBe('inconnu');
    expect(premierLibre(ctx([], undefined))).toBeUndefined();
  });
  it('le premier jour libre saute le dry hop de la NEIPA (dim. 15)', () => {
    const c = ctx([NEIPA], 60);
    expect(evenements([NEIPA]).some((e) => e.genre === 'houblon' && e.jour === J(15))).toBe(true);
    expect(premierLibre(c)).toBeDefined();
  });
  it('conflit : cuve pleine dite avec sa raison, et le dry hop ; le premier libre est proposé', () => {
    const c = ctx([PILS, NEIPA, PALE], 72);
    const r = raisonDe(c, J(15));
    expect(r.conflit).toBe(true);
    expect(r.gras).toBe('La cuve est encore pleine');
    expect(r.reste).toContain('ZZ Pils');
    expect(r.reste).toContain('dry hop');
    expect(r.alternative).toBe(J(18));
  });
  it('mise en bouteille non datée : dit en mots, jamais inventée', () => {
    const sansDate = lot('ZZ-X', 'ZZ Stout', { brewDay: { pitchedAt: new Date(2026, 10, 1).getTime() } as Batch['brewDay'] });
    const c = ctx([sansDate], 30);
    expect(etatCuve(c.occ, J(30), 30, 24).etat).toBe('pleine');
    expect(raisonDe(c, J(30)).reste).toContain('pas de mise en bouteille datée');
  });
  it('un jour au-delà de la semaine : « Dans 14 jours. » sans autre écran', () => {
    const r = raisonDe(ctx([PILS], 30), J(28));
    expect(r.loin).toBe(true);
    expect(r.gras).toBe('Dans 14 jours.');
    expect(r.reste).toContain('libre depuis le 18');
  });
});

describe('corrections de la critique ksb', () => {
  it('loin : la raison dit ce qui se passe à la cave (garde en cours), pas seulement la cuve', () => {
    const garde = lot('ZZ-030', 'ZZ NEIPA', {
      brewDate: '2026-11-09', brewDay: { pitchedAt: new Date(2026, 10, 9, 12).getTime() } as Batch['brewDay'],
      recipeSnapshot: { name: 'ZZ NEIPA', fermentation: [{ kind: 'primaire', name: 'p', tempC: 21, days: 10 }, { kind: 'garde', name: 'g', tempC: 2, days: 14 }] } as never
    });
    const r = raisonDe(ctx([garde], 72), J(28));
    expect(r.reste).toContain('ZZ NEIPA est en garde depuis le 19');
  });
  it('stock replié : les malts se regroupent, la levure garde son nom', () => {
    const deux = recette('r1', 'ZZ Blonde', { fermentables: [{ name: 'ZZ Pils', stockItemRef: 'ZZ-PILS', weightKg: 5 }, { name: 'ZZ Munich', stockItemRef: 'ZZ-MUN', weightKg: 1 }] } as Partial<Recipe>);
    feuille([PILS], { recipe: deux, stock: [...STOCK, article('ZZ-MUN', 'ZZ Munich', 'Malt', 5, 'kg')] });
    const texte = screen.getByRole('button', { name: /Tout est en stock/ }).textContent ?? '';
    expect(texte).toContain('malts, ZZ Saaz, ZZ US-05');
    expect(texte).not.toContain('ZZ Munich');
  });
  it('c2a : le style est une pastille de couleur sur chaque carte', () => {
    render(<ListeCreer recipes={[recette('r1', 'ZZ Blonde')]} batches={[]} stock={STOCK} capaciteL={30} maintenant={NOW} onBrasser={() => undefined} onOuvrirBrassin={() => undefined} onNouvelleRecette={() => undefined} />);
    const p = screen.getByText('Pilsner');
    expect(p.className).toMatch(/bg-/);
    expect(p.className).not.toContain('bg-cave-700');
  });
  it('c2a vide : aucun ↶ promis dans l’aperçu', () => {
    const { container } = render(<ListeCreer recipes={[]} batches={[]} stock={[]} onBrasser={() => undefined} onOuvrirBrassin={() => undefined} onNouvelleRecette={() => undefined} />);
    expect(container.querySelector('.c2a-fant svg.lucide-undo-2')).toBeNull();
  });
  it('après : levure au nom seul, sans quantité qui se coupe', () => {
    const neuf = lot('ZZ-021', 'ZZ Blonde', { status: 'planifie', plannedBrewDate: '18.11.2026', recipeRef: 'r1' });
    const e = effetsDe(neuf, recette('r1', 'ZZ Blonde'), [neuf], STOCK);
    expect(e.find((x) => x.cle === 'stock')?.titre).toBe('ZZ Pils 5 kg, ZZ Saaz 50 g, ZZ US-05');
  });
});

const feuille = (batches: Batch[], over: Partial<React.ComponentProps<typeof FeuilleBrasser>> = {}) => {
  const onPlanifier = vi.fn(), onAnnuler = vi.fn();
  render(<FeuilleBrasser recipe={recette('r1', 'ZZ Blonde')} batches={batches} stock={STOCK} capaciteL={30} maintenant={NOW} onPlanifier={onPlanifier} onAnnuler={onAnnuler} {...over} />);
  return { onPlanifier, onAnnuler };
};

describe('la feuille Brasser (d1b)', () => {
  it('repos : le premier libre (mer. 18) est choisi, avec sa raison ; Planifier le dit', () => {
    const { onPlanifier } = feuille([PILS]);
    expect(screen.getByText('Le premier jour où la cuve est libre')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Planifier mer\. 18\.11/ }));
    expect(onPlanifier).toHaveBeenCalledWith('18.11.2026');
  });
  it('brassin déjà écrit, confirmation non reçue : le jour est figé, le bouton dit « Confirmer l\'enregistrement » et rejoue le même jour', () => {
    const { onPlanifier } = feuille([PILS], { jourFige: '18.11.2026' });
    const jour21 = screen.getByRole('button', { name: /samedi 21 novembre/ }) as HTMLButtonElement;
    expect(jour21.disabled).toBe(true);
    fireEvent.click(jour21);
    expect(screen.getByText(/déjà écrit pour mercredi 18 novembre/)).toBeTruthy();
    expect(screen.queryByRole('button', { name: /Planifier/ })).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: 'Confirmer l\'enregistrement' }));
    expect(onPlanifier).toHaveBeenCalledWith('18.11.2026');
  });
  it('stock replié « Tout est en stock », déplié d\'un toucher', () => {
    feuille([PILS]);
    const bouton = screen.getByRole('button', { name: /Tout est en stock/ });
    expect(bouton.getAttribute('aria-expanded')).toBe('false');
    fireEvent.click(bouton);
    expect(screen.getByText('250 g libres')).toBeTruthy();
  });
  it('le manque est dit à la place', () => {
    feuille([PILS], { stock: [article('ZZ-PILS', 'ZZ Pils', 'Malt', 25, 'kg'), article('ZZ-SAAZ', 'ZZ Saaz', 'Houblon', 20), article('ZZ-US05', 'ZZ US-05', 'Levure', 3, 'sachet')] });
    expect(screen.getByText(/Il manque ZZ Saaz/)).toBeTruthy();
  });
  it('geste : un jour touché devient le jour choisi et se redit', () => {
    const { onPlanifier } = feuille([PILS]);
    fireEvent.click(screen.getByRole('button', { name: /^samedi 21 novembre/ }));
    expect(screen.getByText(/La cuve est libre depuis le 18/)).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Planifier sam\. 21\.11/ }));
    expect(onPlanifier).toHaveBeenCalledWith('21.11.2026');
  });
  it('loin : le 28 se choisit sans autre écran', () => {
    const { onPlanifier } = feuille([PILS]);
    fireEvent.click(screen.getByRole('button', { name: /^samedi 28 novembre/ }));
    expect(screen.getByText('Dans 14 jours.')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Planifier sam\. 28\.11/ }));
    expect(onPlanifier).toHaveBeenCalledWith('28.11.2026');
  });
  it('conflit : cuve pleine et dry hop dits, « Planifier quand même », jamais de choix silencieux', () => {
    const { onPlanifier } = feuille([PILS, NEIPA, PALE], { capaciteL: 72 });
    fireEvent.click(screen.getByRole('button', { name: /^dimanche 15 novembre/ }));
    expect(screen.getByText('La cuve est encore pleine')).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /Prendre mer\. 18\.11, le premier libre/ }));
    expect(screen.getByRole('button', { name: /Planifier mer\. 18\.11/ })).toBeTruthy();
    fireEvent.click(screen.getByRole('button', { name: /^dimanche 15 novembre/ }));
    fireEvent.click(screen.getByRole('button', { name: 'Planifier quand même' }));
    expect(onPlanifier).toHaveBeenCalledWith('15.11.2026');
  });
  it('les jours passés sont inertes ; Annuler appelle onAnnuler', () => {
    const { onAnnuler } = feuille([]);
    expect((screen.getByRole('button', { name: /^jeudi 12 novembre, passé/ }) as HTMLButtonElement).disabled).toBe(true);
    fireEvent.click(screen.getByRole('button', { name: 'Annuler' }));
    expect(onAnnuler).toHaveBeenCalled();
  });
  it('la cuve inconnue : aucune case n\'est dite libre ou pleine', () => {
    feuille([], { capaciteL: undefined });
    expect(screen.queryByRole('button', { name: /cuve libre/ })).toBeNull();
    expect(screen.getByText(/capacité de la cuve n.est pas connue/)).toBeTruthy();
  });
});

describe('la liste Créer (c2a)', () => {
  const manquante = recette('r2', 'ZZ Pils II', { yeast: { name: 'ZZ Lager', stockItemRef: 'ZZ-LAGER', qty: 2, unit: 'sachet' } } as Partial<Recipe>);
  const stock = [...STOCK, article('ZZ-LAGER', 'ZZ Lager', 'Levure', 0, 'sachet')];
  it('titre « n prêtes / n à compléter » et tri « Prêtes d\'abord »', () => {
    const { cartes, pretes, acompleter } = cartesCreer([manquante, recette('r1', 'ZZ Blonde')], [], stock);
    expect(pretes).toBe(1);
    expect(acompleter).toBe(1);
    expect(cartes.map((c) => c.nom)).toEqual(['ZZ Blonde', 'ZZ Pils II']);
  });
  it('la pastille : trois traits (malts, houblons, levure) et un mot', () => {
    const { cartes } = cartesCreer([manquante, recette('r1', 'ZZ Blonde')], [], stock);
    expect(cartes[0].traits).toEqual(['ok', 'ok', 'ok']);
    expect(cartes[0].mot).toBe('prête');
    expect(cartes[1].traits).toEqual(['ok', 'ok', 'manque']);
    expect(cartes[1].mot).toBe('levure');
    expect(cartes[1].levureManque).toBe(true);
  });
  it('rendu : une carte par recette, Brasser appelle onBrasser ; un brassin déjà prévu porte « Brasser LOT » et ouvre ce brassin', () => {
    const prevu = lot('ZZ-020', 'ZZ Blonde', { status: 'planifie', plannedBrewDate: '08.11.2026', recipeRef: 'r1' });
    const onBrasser = vi.fn(), onOuvrir = vi.fn();
    render(<ListeCreer recipes={[recette('r1', 'ZZ Blonde'), recette('r3', 'ZZ Saison')]} batches={[prevu]} stock={STOCK} capaciteL={30} maintenant={NOW}
      onBrasser={onBrasser} onOuvrirBrassin={onOuvrir} onNouvelleRecette={() => undefined} />);
    fireEvent.click(within(screen.getByText('ZZ Saison').closest('article')!).getByRole('button', { name: /Brasser/ }));
    expect(onBrasser).toHaveBeenCalledWith('r3');
    fireEvent.click(screen.getByRole('button', { name: /Brasser ZZ-020/ }));
    expect(onOuvrir).toHaveBeenCalledWith(prevu);
  });
  it('bascule de tri : « Dernière brassée »', () => {
    render(<ListeCreer recipes={[recette('r1', 'ZZ Blonde')]} batches={[]} stock={STOCK} onBrasser={() => undefined} onOuvrirBrassin={() => undefined} onNouvelleRecette={() => undefined} />);
    const tri = screen.getByRole('button', { name: 'Dernière brassée' });
    fireEvent.click(tri);
    expect(tri.getAttribute('aria-pressed')).toBe('true');
  });
  it('le vide : « Aucune recette », trois entrées en icône vers l\'assistant', () => {
    const onNouvelle = vi.fn();
    render(<ListeCreer recipes={[]} batches={[]} stock={[]} onBrasser={() => undefined} onOuvrirBrassin={() => undefined} onNouvelleRecette={onNouvelle} />);
    expect(screen.getByText('Aucune recette')).toBeTruthy();
    ['Importer une recette', 'Écrire une recette', "Partir d'une idée de l'Atelier"].forEach((nom) => fireEvent.click(screen.getByRole('button', { name: nom })));
    expect(onNouvelle).toHaveBeenCalledTimes(3);
  });
});

describe('l\'état « après » (c2a)', () => {
  const neuf = lot('ZZ-021', 'ZZ Blonde', { status: 'planifie', plannedBrewDate: '18.11.2026', recipeRef: 'r1' });
  it('effets : date, réservation, achats (le stock se compare sans le brassin neuf)', () => {
    const court = [article('ZZ-PILS', 'ZZ Pils', 'Malt', 25, 'kg'), article('ZZ-SAAZ', 'ZZ Saaz', 'Houblon', 20), article('ZZ-US05', 'ZZ US-05', 'Levure', 3, 'sachet')];
    const e = effetsDe(neuf, recette('r1', 'ZZ Blonde'), [neuf], court);
    expect(e.map((x) => x.cle)).toEqual(['date', 'stock', 'achats']);
    expect(e[0].titre).toContain('mercredi 18 novembre');
    expect(e[2].titre).toContain('ZZ Saaz');
  });
  it('« Défaire » appelle la suppression ; « Ouvrir » ouvre le brassin ; aucun effet inventé', () => {
    const onDefaire = vi.fn(), onOuvrir = vi.fn();
    render(<CarteApres batch={neuf} recipe={recette('r1', 'ZZ Blonde')} batches={[neuf]} stock={STOCK} onDefaire={onDefaire} onOuvrir={onOuvrir} />);
    expect(screen.getByText('Brassin créé')).toBeTruthy();
    expect(screen.getByText('ZZ-021')).toBeTruthy();
    expect(screen.queryByText(/aux achats/)).toBeNull();
    fireEvent.click(screen.getByRole('button', { name: /Défaire/ }));
    expect(onDefaire).toHaveBeenCalled();
    fireEvent.click(screen.getByRole('button', { name: /Ouvrir ZZ-021/ }));
    expect(onOuvrir).toHaveBeenCalled();
  });
});

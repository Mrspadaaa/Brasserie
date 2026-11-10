// @vitest-environment jsdom
import React, { useState } from 'react';
import { act, cleanup, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Fermentable, FermentableKind, StockItem } from '../../../src/types';
import { EtapeFermentescibles } from '../../../src/ui/fermentescibles/EtapeFermentescibles';
import type { DefFamille } from '../../../src/ui/fermentescibles/Ajout';
import { fermentablesApercu, stockApercu } from '../../../src/ui/fermentescibles/apercuDev';

// Les rayons et les moments de KIND_DEF (BrewWizard), recopiés pour le test : si l'un change, le test le dit.
const DEFS: Record<FermentableKind, DefFamille> = {
  grain: { label: 'Grain', use: 'empatage', fermentability: 100, stock: ['Malt', 'Céréale'], newCat: 'Malt' },
  sucre: { label: 'Sucre', use: 'ebullition', fermentability: 100, ppg: 46, stock: ['Sucre'], newCat: 'Sucre' },
  lactose: { label: 'Lactose', use: 'ebullition', fermentability: 0, ppg: 35, stock: ['Sucre'], newCat: 'Sucre' },
  fruit: { label: 'Fruit', use: 'fermentation', fermentability: 90, ppg: 8, stock: ['Fruit', 'Additif'], newCat: 'Sucre' },
  extrait: { label: 'Extrait', use: 'ebullition', fermentability: 75, ppg: 36, stock: ['Extrait', 'Sucre'], newCat: 'Sucre' },
};

function pointeur(grossier: boolean) {
  window.matchMedia = ((query: string) => ({
    matches: query.includes('pointer: coarse') ? grossier : false, media: query, onchange: null,
    addEventListener: () => {}, removeEventListener: () => {}, addListener: () => {}, removeListener: () => {}, dispatchEvent: () => false,
  })) as unknown as typeof window.matchMedia;
}
const original = window.matchMedia;

let courant: Fermentable[] = [];
const creations: Array<[string, string, string]> = [];

function Banc({ depart = '' }: { depart?: string }) {
  const [l, setL] = useState<Fermentable[]>(() => fermentablesApercu(depart));
  const [stock] = useState<StockItem[]>(() => stockApercu());
  const [famille, setFamille] = useState<FermentableKind>('grain');
  courant = l;
  return (
    <EtapeFermentescibles
      fermentables={l} onFermentables={setL} stockItems={stock} famille={famille} onFamille={setFamille} defs={DEFS}
      onCreateStockItem={(n, c, u) => { creations.push([n, c, u]); return { id: 'neuf', ref: 'NEUF-1', name: n, category: c, unit: u, currentStock: 0, minStock: 0, reorder: false } as StockItem; }}
      onLearnIngredient={() => {}} nolo={false} og={null} teinteBiere={null} rendementPct={75} rendementDeclare={false}
      ogPlage={{ min: 1.06, max: 1.085 }} ebcPlage={{ min: 6, max: 14 }} styleCode="21C" ebcVise={10} erreur={() => undefined}
    />
  );
}

beforeEach(() => { pointeur(false); creations.length = 0; });
afterEach(() => { cleanup(); window.matchMedia = original; });

const lignes = () => [...document.querySelectorAll<HTMLElement>('[data-sel]')];
const champ = () => screen.getByRole('combobox', { name: /Ajouter un fermentescible/ }) as HTMLInputElement;
const masse = (i: number) => document.querySelector<HTMLInputElement>(`[data-kl="${i}"]`)!;

describe('l\'étape Malts/sucres (s1)', () => {
  it('au repos : le ticket, le plateau sur la première ligne, les trois « ? »', () => {
    render(<Banc />);
    expect(lignes().map((li) => li.querySelector('[data-role="nom"]')!.textContent)).toEqual(['Pilsner Malz', 'Weizenmalz hell', 'Haferflocken']);
    expect(lignes()[0].getAttribute('aria-current')).toBe('true');
    expect(lignes()[1].getAttribute('aria-current')).toBeNull();
    expect(document.querySelector('[data-role="bal"]')).not.toBeNull();
    expect(screen.getByText(/couleurs à renseigner/).textContent).toContain('3');
    expect(lignes()[0].textContent).toContain('63');
    expect(lignes()[0].querySelector('[data-role="masse-curseur"]')?.getAttribute('role')).toBe('slider');
  });

  it('aucun champ n\'est type="number"', () => {
    render(<Banc />);
    expect(document.querySelectorAll('input[type="number"]')).toHaveLength(0);
  });

  it('« Munich », Entrée : Münchner Malz, à 0, avec sa teinte du stock, et le curseur va dans sa masse', async () => {
    const u = userEvent.setup();
    render(<Banc />);
    await u.click(champ());
    await u.type(champ(), 'Munich');
    expect(screen.getByRole('option', { name: /Ajouter Münchner Malz/ })).toBeTruthy();
    expect(document.querySelector('[data-role="apercu"]')!.textContent).toContain('Münchner');
    await u.keyboard('{Enter}');
    expect(courant).toHaveLength(4);
    expect(courant[3]).toMatchObject({ name: 'Münchner Malz', weightKg: 0, colorEbc: 15, kind: 'grain', use: 'empatage', stockItemRef: 'APERCU-3' });
    expect(document.activeElement).toBe(masse(3));
    expect(champ().value).toBe('');
  });

  it('au toucher comme à la souris (s1 : versMasse, D230), sans masse tapée le focus va dans la masse de la ligne ajoutée ; le plateau garde son + et son −', async () => {
    pointeur(true);
    const u = userEvent.setup();
    render(<Banc />);
    await u.click(champ());
    await u.type(champ(), 'Munich');
    await u.keyboard('{Enter}');
    expect(courant[3]).toMatchObject({ name: 'Münchner Malz', weightKg: 0 });
    expect(lignes()[3].getAttribute('aria-current')).toBe('true');
    expect(document.querySelector('[data-role="bal"]')!.textContent).toContain('Münchner Malz');
    expect(document.activeElement).toBe(masse(3));
    const bal = document.querySelector<HTMLElement>('[data-role="bal"]')!;
    expect(bal.querySelector('[data-pas="1"]')).not.toBeNull();
    expect(bal.querySelector('[data-pas="-1"]')).not.toBeNull();
  });

  it('une masse tapée avec le nom (« cara 0,3 ») : le focus revient au champ d\u2019ajout, au toucher aussi', async () => {
    pointeur(true);
    const u = userEvent.setup();
    render(<Banc />);
    await u.click(champ());
    await u.type(champ(), 'cara 0,3');
    await u.keyboard('{Enter}');
    expect(courant[3]).toMatchObject({ name: 'Carapils', weightKg: 0.3 });
    await waitFor(() => expect(document.activeElement).toBe(champ()));
  });

  it('une masse vidée puis quittée vaut 0 (D228) ; quittée sans rien taper, elle garde sa valeur', async () => {
    const u = userEvent.setup();
    render(<Banc />);
    await u.click(masse(1));
    await u.tab();
    expect(courant[1].weightKg).toBe(1.5);
    await u.clear(masse(1));
    await u.tab();
    expect(courant[1].weightKg).toBe(0);
    expect(masse(1).value).toBe('0');
  });

  // VI-2 (rejeu b47cd90b n° 2) : la masse effacée, pas encore quittée, affichait « 0 » (le repère du champ) alors que la recette comptait encore la masse
  // d'avant (« 63 % du grain », « Grain 8 kg », « 5,0 kg » au plateau) : trois chiffres pour une masse. Le repère est la valeur d'avant, jamais un 0 inventé.
  it('une masse effacée, pas encore quittée, montre la valeur qui compte encore (placeholder), jamais un « 0 » inventé', async () => {
    const u = userEvent.setup();
    render(<Banc />);
    await u.click(masse(1));
    await u.clear(masse(1));
    expect(masse(1).value).toBe('');
    expect(masse(1).placeholder).toBe('1,5');
    expect(courant[1].weightKg).toBe(1.5);
    // Taper rend la main à la saisie ; Échap rend la valeur d'avant.
    await u.type(masse(1), '2');
    expect(courant[1].weightKg).toBe(2);
  });

  it('« pils » dit « déjà 5,0 kg » et Entrée ne crée pas de doublon', async () => {
    const u = userEvent.setup();
    render(<Banc />);
    await u.click(champ());
    await u.type(champ(), 'pils');
    const deja = document.querySelector<HTMLElement>('[data-deja]')!;
    expect(deja.textContent).toContain('déjà 5,0 kg');
    expect(deja.textContent).toContain('18 kg en stock');
    await u.keyboard('{Enter}');
    expect(courant).toHaveLength(3);
    expect(document.activeElement).toBe(masse(0));
  });

  it('un nom inconnu : « Créer … (stock à zéro) », l\'article est créé par l\'app puis la ligne ajoutée', async () => {
    const u = userEvent.setup();
    render(<Banc />);
    await u.click(champ());
    await u.type(champ(), 'Abbey Malt');
    expect(screen.getByRole('option', { name: /Créer « Abbey Malt » \(stock à zéro\)/ })).toBeTruthy();
    await u.keyboard('{Enter}');
    expect(creations).toEqual([['Abbey Malt', 'Malt', 'kg']]);
    expect(courant[3]).toMatchObject({ name: 'Abbey Malt', stockItemRef: 'NEUF-1', weightKg: 0, kind: 'grain' });
  });

  it('« cara 0,3 », Entrée : Carapils à 0,3 kg', async () => {
    const u = userEvent.setup();
    render(<Banc />);
    await u.click(champ());
    await u.type(champ(), 'cara 0,3');
    await u.keyboard('{Enter}');
    expect(courant[3]).toMatchObject({ name: 'Carapils', weightKg: 0.3 });
    expect(masse(3).value).toBe('0,30');
  });

  it('à l\'ouverture, sans frappe : des tuiles avec le stock et la teinte, jamais celles déjà dans la recette', async () => {
    const u = userEvent.setup();
    render(<Banc />);
    await u.click(champ());
    await waitFor(() => expect(document.querySelectorAll('[data-role="resultat"]').length).toBeGreaterThan(0));
    const tuiles = [...document.querySelectorAll<HTMLElement>('[data-role="resultat"]')];
    expect(tuiles.length).toBeGreaterThanOrEqual(3);
    expect(tuiles.some((t) => /Pilsner|Weizen|Hafer/.test(t.dataset.nom ?? ''))).toBe(false);
    expect(tuiles.every((t) => /en stock|stock épuisé/.test(t.textContent ?? ''))).toBe(true);
    const pale = tuiles.find((t) => t.dataset.nom === 'Pale Ale Malz')!;
    expect(pale.textContent).toContain('12,5 kg en stock');
    expect(pale.querySelector('[aria-label="épinglé"]')).not.toBeNull();
    expect(pale.textContent).toContain('6,5');
    const mun = tuiles.find((t) => t.dataset.nom === 'Münchner Malz');
    if (mun) expect(mun.textContent).toContain('stock épuisé');
  });

  it('la masse se tape sur la ligne : Entrée valide, Échap rend la masse d\'avant', async () => {
    const u = userEvent.setup();
    render(<Banc />);
    await u.click(masse(1));
    expect(masse(1).value).toBe('1,5'); // la valeur d'avant, lisible (grise) et sélectionnée : la frappe la remplace
    await u.keyboard('2,5{Enter}');
    expect(courant[1].weightKg).toBe(2.5);
    await u.click(masse(1));
    await u.keyboard('4');
    expect(courant[1].weightKg).toBe(4);
    await u.keyboard('{Escape}');
    expect(courant[1].weightKg).toBe(2.5);
  });

  it('le curseur de la barre : ← → d\'un cran', async () => {
    const u = userEvent.setup();
    render(<Banc />);
    const cur = lignes()[2].querySelector<HTMLElement>('[data-role="masse-curseur"]')!;
    cur.focus();
    await u.keyboard('{ArrowRight}');
    expect(courant[2].weightKg).toBeCloseTo(1.6, 6);
    await u.keyboard('{Shift>}{ArrowLeft}{/Shift}');
    // dix crans : 1,6 → 1,0 par 100 g (six), puis 0,8 par 50 g (quatre)
    expect(courant[2].weightKg).toBeCloseTo(0.8, 6);
  });

  it('retirer sans dialogue, « Annuler » rend la ligne à sa place', async () => {
    const u = userEvent.setup();
    render(<Banc />);
    await u.click(lignes()[1].querySelector('[data-role="retirer"]')!);
    expect(courant.map((f) => f.name)).toEqual(['Pilsner Malz', 'Haferflocken']);
    expect(document.querySelector('[role="dialog"]')).toBeNull();
    await u.click(document.querySelector('[data-role="annuler"]')!);
    expect(courant.map((f) => f.name)).toEqual(['Pilsner Malz', 'Weizenmalz hell', 'Haferflocken']);
    expect(lignes()[1].querySelector('[data-role="retirer"]')).not.toBeNull();
  });

  // Audit métier du 08.11 (AM 1 et 2) : le moment tourne dans ceux que la famille permet. Un sucre : ébullition ⇄ fermentation ; un grain : l'empâtage seul.
  it('le moment d\'un sucre tourne d\'un toucher, J+3 en fermentation, et « Annuler » rend celui d\'avant ; un grain reste à l\'empâtage', async () => {
    const u = userEvent.setup();
    render(<Banc depart="sucre" />);
    const moment = (i = 3) => lignes()[i].querySelector<HTMLElement>('[data-role="moment-ligne"]')!;
    expect(moment().textContent).toBe('ébullition');
    await u.click(moment());
    expect(courant[3].use).toBe('fermentation');
    expect(courant[3].dayOffset).toBe(3);
    expect(moment().textContent).toBe('J+');
    const jour = lignes()[3].querySelector<HTMLInputElement>('[data-role="jour-ligne"]')!;
    expect(jour.value).toBe('3');
    await u.click(lignes()[3].querySelector('[data-role="annuler-moment"]')!);
    expect(courant[3].use).toBe('ebullition');
    expect(lignes()[3].querySelector('[data-role="annuler-moment"]')).toBeNull();
    await u.click(moment(1));
    expect(courant[1].use).toBe('empatage');
    expect(moment(1).tagName).toBe('SPAN');
    expect(lignes()[1].querySelector('[data-role="annuler-moment"]')).toBeNull();
  });

  it('la couleur « ? » se tape sur la ligne, Entrée passe au suivant quand la saisie vient du compte', async () => {
    const u = userEvent.setup();
    render(<Banc />);
    await u.click(screen.getByRole('button', { name: /3 couleurs à renseigner/ }));
    await u.keyboard('3,5{Enter}');
    expect(courant[0].colorEbc).toBe(3.5);
    expect(document.activeElement?.getAttribute('data-ebcl')).toBe('1');
    await u.keyboard('{Escape}');
    expect(courant[1].colorEbc).toBeUndefined();
    expect(screen.getByRole('button', { name: /2 couleurs à renseigner/ })).toBeTruthy();
  });

  it('la bascule de famille change les tuiles (rayon Sucre) et le moment de la ligne ajoutée', async () => {
    const u = userEvent.setup();
    render(<Banc />);
    await u.click(screen.getByRole('button', { name: /Famille de l’ajout : Grain/ }));
    await u.click(champ());
    await waitFor(() => expect(document.querySelectorAll('[data-role="resultat"]').length).toBeGreaterThan(0));
    const noms = [...document.querySelectorAll<HTMLElement>('[data-role="resultat"]')].map((t) => t.dataset.nom);
    expect(noms).toEqual(expect.arrayContaining(['Dextrose', 'Sucre candi']));
    expect(noms).not.toContain('Carapils');
    await u.type(champ(), 'dext{Enter}');
    expect(courant[3]).toMatchObject({ name: 'Dextrose', kind: 'sucre', use: 'ebullition', fermentabilityPct: 100 });
    expect(within(lignes()[3]).getByText('Sucre')).toBeTruthy();
  });

  it('au toucher, la masse est un champ protégé d\'une ligne (textarea), jamais type="number"', () => {
    pointeur(true);
    render(<Banc />);
    expect(masse(0).tagName).toBe('TEXTAREA');
    expect(masse(0).getAttribute('inputmode')).toBe('decimal');
  });

  it('la fiche technique est une ligne du plateau : « PPG — · fiche › », un toucher l’ouvre, le PPG se tape depuis la recette', async () => {
    const u = userEvent.setup();
    render(<Banc />);
    const bal = document.querySelector<HTMLElement>('[data-role="bal"]')!;
    const bt = within(bal).getByRole('button', { name: /Fiche technique de Pilsner Malz : PPG —/ });
    expect(bt.textContent).toContain('PPG');
    expect(bt.textContent).toContain('fiche');
    expect(document.body.textContent).not.toContain('Données de fiche à compléter');
    expect(screen.queryByRole('textbox', { name: /Potentiel de Pilsner Malz/ })).toBeNull();
    await u.click(bt);
    const ppg = screen.getByRole('textbox', { name: /Potentiel de Pilsner Malz en PPG/ });
    await u.type(ppg, '37');
    await u.tab();
    expect(courant[0].potentialPpg).toBe(37);
    expect(bt.textContent).toContain('37');
  });

  it('un ajout réel : la ligne ajoutée est entourée et le plateau la montre', async () => {
    const u = userEvent.setup();
    render(<Banc />);
    await u.click(champ());
    await u.type(champ(), 'Munich{Enter}');
    const bal = document.querySelector<HTMLElement>('[data-role="bal"]')!;
    expect(bal.textContent).toContain('Münchner Malz');
    expect(lignes()[3].getAttribute('aria-current')).toBe('true');
    expect(lignes()[0].getAttribute('aria-current')).toBeNull();
  });

  it('l’avertissement du lactose est la phrase de la maquette, mot pour mot', () => {
    render(<Banc depart="huit" />);
    expect(document.querySelector('[data-role="alertes"]')!.textContent).toBe('Lactose : non fermentescible, il remonte la densité finale.');
  });

  it('une recette vide : « Rien encore. », pas de plateau, pas de repères', () => {
    render(<Banc depart="vide" />);
    expect(screen.getByText('Rien encore.')).toBeTruthy();
    expect(document.querySelector('[data-role="bal"]')!.hasAttribute('hidden')).toBe(true);
    expect(document.querySelector('[data-role="reps"]')).toBeNull();
    vi.useRealTimers();
    act(() => {});
  });
});

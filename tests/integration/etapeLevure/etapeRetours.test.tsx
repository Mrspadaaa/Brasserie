// Les retours du brasseur du 09.11 sur « Ma levure » (mission 2026-11-09-levure-retours, voie r1) :
//  « la recherche de base doit se faire sur le premier écran, comme pour malt et sucre, pas de renvoi, je choisis la recherche avancée par moi même » ;
//  « la conduite de palier fonctionne infiniment mieux sur celle de base ».
// Ces tests échouent sur la version rejetée (le champ renvoyait vers Chercher ; la nouvelle conduite était montée).
import { useContext, useState } from 'react';
import { NomLibreInitial } from '../../../src/ui/nomLibreLevure';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { EtapeLevure } from '../../../src/ui/etapeLevure/EtapeLevure';
import { recetteApercuEtapeLevure, recetteApercuSansLevure } from '../../../src/ui/etapeLevure/apercuDev';
import type { VueLevure } from '../../../src/ui/etapeLevure/props';
import type { TrialRecipe } from '../../../src/domain/hopIndex/trials';
import type { StockItem } from '../../../src/types';

vi.mock('../../../src/hooks/useLiveData', () => ({ useStorageValue: () => [] }));
// Chercher (recherche avancée) est jouée par ses propres tests ; ici elle prouve seulement qu'on n'y est PAS renvoyé.
vi.mock('../../../src/ui/etapeLevure/Chercher', () => ({ Chercher: () => <p data-testid="vue-chercher">vue Chercher</p> }));
vi.mock('../../../src/ui/etapeLevure/Comparer', () => ({ Comparer: () => <p>vue Comparer</p> }));
vi.mock('../../../src/ui/etapeLevure/Suggerer', () => ({ Suggerer: () => <p>vue Suggérer</p> }));
beforeEach(() => { window.localStorage.clear(); });
afterEach(() => { cleanup(); window.localStorage.clear(); });

const recette = () => recetteApercuEtapeLevure() as unknown as TrialRecipe;
const sacMaison = { ref: 'Y-1', name: 'Ma souche maison', category: 'Levure', currentStock: 2, unit: 'sachet', favorite: false } as unknown as StockItem;

function Banc({ depart = recette(), onChoisir = vi.fn(), onStock = vi.fn(), stockItems = [] as StockItem[], changes = [] as TrialRecipe[], applique = false }) {
  const [recipe, setRecipe] = useState<TrialRecipe>(depart);
  const [vue, setVue] = useState<VueLevure>('ma-levure');
  return <EtapeLevure recipe={recipe} vue={vue} onVue={setVue} comparees={[]} onComparees={vi.fn()}
    onChoisir={l => { onChoisir(l); if (applique) setRecipe(r => ({ ...r, yeast: { name: l.name, hopIndexId: l.id, form: l.form } } as TrialRecipe)); }} onChange={next => { changes.push(next); setRecipe(next); return next; }}
    stockItems={stockItems} onStock={onStock} onRetirer={vi.fn()} yeastChange={undefined} onYeastChange={vi.fn()}
    identityEditor={<EditeurStock />} factsEditor={<p>éditeur fiche (test)</p>} aiEditor={<p>recherche IA (test)</p>} quantityEditor={<p>éditeur dose (test)</p>}
    atelier={() => <p>ancien atelier (test)</p>} />;
}
/** L'éditeur du wizard lit le nom tapé (YeastIngredientPicker l'ouvre en saisie hors catalogue). */
function EditeurStock() { const nom = useContext(NomLibreInitial); return <p data-testid="editeur-stock">éditeur stock (test){nom ? ` · ${nom}` : ''}</p>; }
const champ = () => screen.getByRole('combobox', { name: /Changer de levure/ });
const taper = (texte: string) => fireEvent.change(champ(), { target: { value: texte } });
const vueCourante = () => document.querySelector('[data-lv="etape"]')!.getAttribute('data-vue');

describe('Ma levure : la recherche de base se fait sur place', () => {
  it('taper dans « Changer de levure » montre les résultats sous le champ, sans changer de vue ni ouvrir Chercher', () => {
    render(<Banc />);
    expect(document.querySelector('[data-lv="resultats"]')).toBeNull();            // au repos : les puces, pas de liste
    taper('verdant');
    const liste = document.querySelector('[data-lv="resultats"]')!;
    expect(liste).toBeTruthy();
    const noms = within(liste as HTMLElement).getAllByRole('option').map(o => o.getAttribute('data-nom'));
    expect(noms.some(n => /verdant/i.test(n ?? ''))).toBe(true);
    expect(vueCourante()).toBe('ma-levure');
    expect(screen.queryByTestId('vue-chercher')).toBeNull();
    expect(screen.getByRole('tab', { name: 'Ma levure' }).getAttribute('aria-selected')).toBe('true');
    expect(document.querySelector('.lv-puces')).toBeNull();                         // les résultats remplacent les puces
  });

  it('toucher un résultat choisit la levure et on reste sur Ma levure', () => {
    const onChoisir = vi.fn();
    render(<Banc onChoisir={onChoisir} />);
    taper('verdant');
    const option = within(document.querySelector('[data-lv="resultats"]') as HTMLElement).getAllByRole('option').find(o => /verdant/i.test(o.getAttribute('data-nom') ?? ''))!;
    fireEvent.click(option);
    expect(onChoisir).toHaveBeenCalledWith(expect.objectContaining({ name: expect.stringMatching(/verdant/i) }));
    expect(vueCourante()).toBe('ma-levure');
    expect((champ() as HTMLInputElement).value).toBe('');                           // le champ est vidé, les puces reviennent
    expect(document.querySelector('.lv-puces')).toBeTruthy();
  });

  it('flèches puis Entrée choisissent ; Échap vide le champ', () => {
    const onChoisir = vi.fn();
    render(<Banc onChoisir={onChoisir} />);
    taper('verdant');
    const total = within(document.querySelector('[data-lv="resultats"]') as HTMLElement).getAllByRole('option').length;
    expect(total).toBeGreaterThan(0);
    fireEvent.keyDown(champ(), { key: 'ArrowDown' });
    const choisi = within(document.querySelector('[data-lv="resultats"]') as HTMLElement).getAllByRole('option').find(o => o.getAttribute('aria-selected') === 'true')!;
    fireEvent.keyDown(champ(), { key: 'Enter' });
    expect(onChoisir).toHaveBeenCalledOnce();
    expect(onChoisir.mock.calls[0][0].name).toBe(choisi.getAttribute('data-nom'));                // Entrée choisit la tuile visée
    taper('nottingham');
    fireEvent.keyDown(champ(), { key: 'Escape' });
    expect((champ() as HTMLInputElement).value).toBe('');
  });

  it('une tuile dit le fabricant une fois (dessous), jamais en tête du nom ni en parenthèse', () => {
    render(<Banc />);
    taper('lal');
    const options = within(document.querySelector('[data-lv="resultats"]') as HTMLElement).getAllByRole('option');
    expect(options.length).toBeGreaterThan(1);
    for (const o of options) {
      expect(o.getAttribute('data-nom')).not.toMatch(/^Lallemand Brewing\s*·/);
      expect(o.getAttribute('data-nom')).not.toMatch(/\([^)]*\)\s*$/);
      expect(o.textContent).toContain('Lallemand Brewing');
    }
    expect(options.some(o => o.getAttribute('data-nom') === 'LalBrew NovaLager™ Brewers Yeast')).toBe(true);
  });

  it('les levures du stock viennent en premier, avec leur icône ; toucher la tuile choisit le sac du stock', () => {
    const onStock = vi.fn();
    render(<Banc stockItems={[sacMaison]} onStock={onStock} />);
    taper('maison');
    const options = within(document.querySelector('[data-lv="resultats"]') as HTMLElement).getAllByRole('option');
    expect(options[0].getAttribute('data-resultat')).toBe('stock');
    expect(options[0].textContent).toContain('Ma souche maison');
    expect(options[0].querySelector('.lv-st')).toBeTruthy();
    fireEvent.click(options[0]);
    expect(onStock).toHaveBeenCalledWith(expect.objectContaining({ ref: 'Y-1' }));
  });

  it('sans résultat : « Mon stock ou saisie libre » s’offre avec le texte tapé et s’ouvre, sur place', () => {
    render(<Banc />);
    taper('zzqxjw');
    const libre = screen.getByRole('option', { name: /Mon stock ou saisie libre/ });
    expect(libre.textContent).toContain('zzqxjw');
    fireEvent.click(libre);
    expect((document.querySelector('[data-repli="stock"]') as HTMLDetailsElement).open).toBe(true);
    expect(screen.getByTestId('editeur-stock').textContent).toContain('zzqxjw');
    expect(vueCourante()).toBe('ma-levure');
  });

  it('recette sans levure : le champ dit « Chercher une levure » et cherche aussi sur place', () => {
    render(<Banc depart={recetteApercuSansLevure() as unknown as TrialRecipe} />);
    fireEvent.change(screen.getByRole('combobox', { name: /Chercher une levure/ }), { target: { value: 'verdant' } });
    expect(document.querySelector('[data-lv="resultats"]')).toBeTruthy();
    expect(vueCourante()).toBe('ma-levure');
  });

  it('l’onglet « Chercher » reste la recherche avancée : il l’ouvre lui-même, rien dans Ma levure n’y renvoie', () => {
    render(<Banc />);
    expect(screen.queryByTestId('vue-chercher')).toBeNull();
    fireEvent.click(screen.getByRole('tab', { name: 'Chercher' }));
    expect(screen.getByTestId('vue-chercher')).toBeTruthy();
  });
});

describe('Ma levure : la conduite de base revient', () => {
  it('la station « Conduite · température × jours » de l’app est montée, ouverte, la nouvelle conduite ne l’est plus', () => {
    render(<Banc />);
    expect(document.querySelector('[data-lv="conduite-base"]')).toBeTruthy();
    expect(screen.getByText('Conduite · température × jours')).toBeTruthy();
    expect(document.body.textContent).toContain('conduite actuelle');
    expect(document.body.textContent).toContain('Jours de bascule et légende');
    expect(document.querySelector('[data-station-toggle="conduct"]')!.getAttribute('aria-expanded')).toBe('true');
    // La nouvelle conduite (Conduite.tsx) : ni sa section, ni ses « + » et × posés sur le graphe.
    expect(document.querySelector('[data-lv="conduite"]')).toBeNull();
    expect(document.querySelector('.lv-plus, .lv-moins, .lv-cond')).toBeNull();
  });

  it('un autre choix de levure remonte la station à neuf, et elle s’ouvre de nouveau', () => {
    render(<Banc applique />);
    const entete = () => document.querySelector('[data-station-toggle="conduct"]')!;
    expect(entete().getAttribute('aria-expanded')).toBe('true');
    taper('verdant');
    fireEvent.click(within(document.querySelector('[data-lv="resultats"]') as HTMLElement).getAllByRole('option')[0]);
    expect(screen.getByText('LalBrew Verdant IPA')).toBeTruthy();
    expect(entete().getAttribute('aria-expanded')).toBe('true');
    expect(document.body.textContent).toContain('conduite actuelle');
  });

  it('toucher un palier donne la consigne de la station de l’app (↕ température, ↔ fin du palier) ; rien n’est écrit sans « Appliquer »', () => {
    const changes: TrialRecipe[] = [];
    render(<Banc changes={changes} />);
    fireEvent.click(document.querySelector('[data-phase-select="1"]')!);
    expect(document.body.textContent).toMatch(/Palier 2\s*:\s*↕ température/);
    expect(document.body.textContent).toContain('fin du palier');
    expect(changes).toHaveLength(0);
  });

  it('l’atelier complet ouvert porte sa conduite : la conduite de base se masque, sans se démonter', () => {
    render(<Banc />);
    const base = document.querySelector('[data-lv="conduite-base"]') as HTMLElement;
    expect(base.hidden).toBe(false);
    const atelier = document.querySelector('[data-repli="atelier"]') as HTMLDetailsElement;
    atelier.open = true; fireEvent(atelier, new Event('toggle'));
    expect((document.querySelector('[data-lv="conduite-base"]') as HTMLElement).hidden).toBe(true);
    expect(document.querySelector('[data-lv="conduite-base"]')).toBe(base);          // le même nœud : l'essai en cours n'est pas perdu
    atelier.open = false; fireEvent(atelier, new Event('toggle'));
    expect((document.querySelector('[data-lv="conduite-base"]') as HTMLElement).hidden).toBe(false);
  });

  it('recette sans levure ni palier : pas de conduite à montrer', () => {
    render(<Banc depart={recetteApercuSansLevure() as unknown as TrialRecipe} />);
    expect(document.querySelector('[data-lv="conduite-base"]')).toBeNull();
    expect(screen.getByText('Levure · choisir')).toBeTruthy();
  });
});

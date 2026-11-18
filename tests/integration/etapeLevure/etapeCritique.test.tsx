// Voie r3 (mission 2026-11-09-levure-retours) : les constats du critique sur Ma levure.
//  1. « Je tape, je touche, il se passe rien » : la saisie libre s'ouvre sous le champ, vient à l'écran et prend le focus.
//  5. Carte de la levure choisie : « LalBrew Verdant IPA » sur deux lignes, fabricant sur deux lignes.
// Ces tests échouent sur la version rejetée (le repli s'ouvrait tout en bas, sans défilement ni focus).
import { useContext, useEffect, useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { NomLibreInitial } from '../../../src/ui/nomLibreLevure';
import { EtapeLevure } from '../../../src/ui/etapeLevure/EtapeLevure';
import { nomDeCarte } from '../../../src/ui/etapeLevure/MaLevure';
import { recetteApercuEtapeLevure, recetteApercuSansLevure } from '../../../src/ui/etapeLevure/apercuDev';
import type { VueLevure } from '../../../src/ui/etapeLevure/props';
import type { TrialRecipe } from '../../../src/domain/hopIndex/trials';

vi.mock('../../../src/hooks/useLiveData', () => ({ useStorageValue: () => [] }));
vi.mock('../../../src/ui/etapeLevure/Chercher', () => ({ Chercher: () => <p>vue Chercher</p> }));
vi.mock('../../../src/ui/etapeLevure/Comparer', () => ({ Comparer: () => <p>vue Comparer</p> }));
vi.mock('../../../src/ui/etapeLevure/Suggerer', () => ({ Suggerer: () => <p>vue Suggérer</p> }));
beforeEach(() => { window.localStorage.clear(); Element.prototype.scrollIntoView = vi.fn(); });
afterEach(() => { cleanup(); window.localStorage.clear(); });

/** Comme YeastIngredientPicker : chargé à la demande (le champ arrive après le premier rendu), pré-rempli avec le nom tapé. */
function EditeurStock() {
  const nom = useContext(NomLibreInitial);
  const [pret, setPret] = useState(false);
  useEffect(() => { const t = setTimeout(() => setPret(true), 30); return () => clearTimeout(t); }, []);
  return <div data-testid="editeur-stock">{pret && nom !== undefined && <input aria-label="Nom de la levure personnelle" defaultValue={nom} />}</div>;
}
function Banc({ depart }: { depart: TrialRecipe }) {
  const [vue, setVue] = useState<VueLevure>('ma-levure');
  return <EtapeLevure recipe={depart} vue={vue} onVue={setVue} comparees={[]} onComparees={vi.fn()} onChoisir={vi.fn()} onChange={() => undefined}
    stockItems={[]} onStock={vi.fn()} onRetirer={vi.fn()} yeastChange={undefined} onYeastChange={vi.fn()}
    identityEditor={<EditeurStock />} factsEditor={<p>fiche</p>} aiEditor={<p>ia</p>} quantityEditor={<p>dose</p>} atelier={() => <p>atelier</p>} />;
}
const champ = () => screen.getByRole('combobox', { name: /(Changer de|Chercher une) levure/ });

describe('Ma levure : la saisie libre aboutit sous les yeux', () => {
  it('« zzqxjw » puis la tuile libre : la saisie s’ouvre juste sous le champ, pré-remplie, le focus dedans', async () => {
    render(<Banc depart={recetteApercuEtapeLevure() as unknown as TrialRecipe} />);
    fireEvent.change(champ(), { target: { value: 'zzqxjw' } });
    fireEvent.click(screen.getByRole('option', { name: /saisie libre/ }));
    const repli = document.querySelector('[data-repli="stock"]') as HTMLDetailsElement;
    expect(repli.open).toBe(true);
    // sous le champ de recherche (dans le bloc d'ajout), pas dans la liste des replis tout en bas
    expect(repli.closest('[data-lv="ajout"]')).not.toBeNull();
    expect(repli.closest('[data-lv="replis"]')).toBeNull();
    const saisie = await screen.findByLabelText('Nom de la levure personnelle') as HTMLInputElement;
    expect(saisie.value).toBe('zzqxjw');
    await waitFor(() => expect(document.activeElement).toBe(saisie));
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('« Hors catalogue » sans texte : la saisie s’ouvre aussi, champ vide, focus dedans', async () => {
    render(<Banc depart={recetteApercuEtapeLevure() as unknown as TrialRecipe} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hors catalogue' }));
    const saisie = await screen.findByLabelText('Nom de la levure personnelle') as HTMLInputElement;
    expect(saisie.value).toBe('');
    await waitFor(() => expect(document.activeElement).toBe(saisie));
  });

  it('sans levure dans la recette : même geste, même arrivée', async () => {
    render(<Banc depart={recetteApercuSansLevure() as unknown as TrialRecipe} />);
    fireEvent.change(champ(), { target: { value: 'zzqxjw' } });
    fireEvent.click(screen.getByRole('option', { name: /saisie libre/ }));
    const saisie = await screen.findByLabelText('Nom de la levure personnelle') as HTMLInputElement;
    await waitFor(() => expect(document.activeElement).toBe(saisie));
    expect(saisie.closest('[data-lv="ajout"]')).not.toBeNull();
  });

  it('fermée, la saisie retourne dans la liste des replis', async () => {
    render(<Banc depart={recetteApercuEtapeLevure() as unknown as TrialRecipe} />);
    fireEvent.click(screen.getByRole('button', { name: 'Hors catalogue' }));
    await screen.findByLabelText('Nom de la levure personnelle');
    const repli = document.querySelector('[data-repli="stock"]') as HTMLDetailsElement;
    repli.open = false; fireEvent(repli, new Event('toggle'));
    await waitFor(() => expect(document.querySelector('[data-lv="replis"] [data-repli="stock"]')).not.toBeNull());
  });
});

describe('La carte de la levure : un en-tête court', () => {
  it('le nom perd la marque de gamme quand le fabricant est dessous et que le nom est long ; un nom d’usage court reste entier', () => {
    expect(nomDeCarte('LalBrew Verdant IPA', true)).toBe('Verdant IPA');
    expect(nomDeCarte('SafAle US-05', true)).toBe('SafAle US-05');
    expect(nomDeCarte('LalBrew Verdant IPA', false)).toBe('LalBrew Verdant IPA');
    expect(nomDeCarte('LalBrew', true)).toBe('LalBrew');
  });
});

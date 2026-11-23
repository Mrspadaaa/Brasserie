// @vitest-environment jsdom
// Voie b-assistant, suite (09.11) : bugs des fichiers partagés. Écrits AVANT le correctif (L13) : rouges sur le code d'alors.
import React, { useState } from 'react';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { DilutionField } from '../../src/ui/DilutionField';
import { RecipeInstallationChoice } from '../../src/ui/RecipeInstallationChoice';
import { RecipeTextExport } from '../../src/ui/RecipeTextExport';
import { BrewSheet, type BrewSheetProps } from '../../src/ui/BrewSheet';
import { RECIPE_REIMPORT_MARKER } from '../../src/domain/recipeTransfer';

vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));
afterEach(cleanup);

const taperEtSortir = (champ: HTMLElement, valeur: string) => {
  fireEvent.focus(champ);
  fireEvent.change(champ, { target: { value: valeur } });
  fireEvent.blur(champ);
};
const alerteDe = () => screen.queryAllByRole('alert').map((a) => a.textContent ?? '').join(' | ');

describe('BR-78 · part d’osmosée hors de 0–100 % : refusée et dite', () => {
  function Banc() {
    const [pct, setPct] = useState(50);
    return <DilutionField label="Osmosée — empâtage" value={pct} onChange={setPct} volumeL={20} />;
  }
  // Même parti que le curseur voisin (SliderField) : la borne est retenue ET dite (« 100 % retenu »).
  for (const [mauvais, retenu] of [['-1', '0'], ['99999', '20']]) {
    it(`« ${mauvais} » litres : ${retenu} L retenus, une phrase le dit`, () => {
      render(<Banc />);
      const champ = screen.getByLabelText('Litres d’osmosée (Osmosée — empâtage)') as HTMLInputElement;
      taperEtSortir(champ, mauvais);
      expect(champ.value).toBe(retenu);
      const dit = screen.queryAllByRole('status').map((s) => s.textContent ?? '').join(' | ');
      expect(dit).toContain(`hors bornes : de 0 à 20 L. ${retenu} L retenu.`);
    });
  }
});

describe('BR-64 · espace libre : borne dite, jamais « 99999 » → 99 % en silence', () => {
  const equipement = { fermenterCapacityL: 30, kettleCapacityL: 40, kettleWorkingL: 35, fermenterHeadspacePct: 20 } as never;
  function Banc() {
    const [recette, setRecette] = useState({ volumeL: 20, brewhouse: { name: 'Essai', equipment: equipement }, installation: { fermenterHeadspacePct: 20 } } as never);
    return <RecipeInstallationChoice recipe={recette} onChange={setRecette} />;
  }
  for (const mauvais of ['99999', '-1']) {
    it(`« ${mauvais} » : 20 % gardés, phrase affichée`, () => {
      render(<Banc />);
      const champ = screen.getByLabelText('Espace libre choisi pour cette recette (%)') as HTMLInputElement;
      taperEtSortir(champ, mauvais);
      expect(champ.value).toBe('20');
      expect(alerteDe()).toMatch(/conservée/);
    });
  }
});

describe('BR-24 · le texte complet n’étale pas le bloc JSON de réimport', () => {
  const texte = `Ma recette\nVolume 20 L\n${RECIPE_REIMPORT_MARKER}\n{"version":1,"nom":"Ma recette"}`;
  it('l’aperçu masque le bloc, la copie et le fichier .txt le gardent', async () => {
    const creer = vi.fn((_b: Blob) => 'blob:x');
    vi.stubGlobal('URL', class extends URL { static createObjectURL = creer; static revokeObjectURL = vi.fn(); });
    vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    render(<RecipeTextExport buildText={() => texte} />);
    fireEvent.click(screen.getByText('Texte complet et fichier .txt'));
    const zone = (await screen.findByLabelText('Texte complet de la recette')) as HTMLTextAreaElement;
    expect(zone.value).not.toContain(RECIPE_REIMPORT_MARKER);
    expect(zone.value).not.toContain('"version"');
    expect(zone.value).toContain('Volume 20 L');
    fireEvent.click(screen.getByRole('button', { name: 'Télécharger .txt' }));
    const blob = creer.mock.calls[0][0] as Blob;
    const contenu = await new Promise<string>((ok) => { const r = new FileReader(); r.onload = () => ok(String(r.result)); r.readAsText(blob); });
    expect(contenu).toBe(texte);
    vi.unstubAllGlobals();
  });
});

describe('BR-26 · la quantité de levure du récap a son étiquette', () => {
  const fiche = (): BrewSheetProps => ({
    name: 'Essai', onName: vi.fn(), style: 'NEIPA', onStyle: vi.fn(), volumeL: 20, onVolumeL: vi.fn(), boilMin: 60, onBoilMin: vi.fn(),
    carboTarget: '', onCarboTarget: vi.fn(), fermentables: [], onFermentables: vi.fn(), totalGristKg: 0, hops: [], onHops: vi.fn(), hopIbu: () => null,
    yeast: { name: 'SafAle US-05', form: 'sèche', qty: 11.5, unit: 'g' }, onYeast: vi.fn(),
    mashSteps: [], onMashSteps: vi.fn(), fermentation: [], onFermentation: vi.fn(), mashWaterL: 0, onMashWaterL: vi.fn(), spargeWaterL: 0, onSpargeWaterL: vi.fn(),
    notes: '', onNotes: vi.fn(), shortages: [],
  } as unknown as BrewSheetProps);
  it('une ligne « Quantité » visible, pas seulement un aria-label', () => {
    render(<BrewSheet {...fiche()} />);
    expect(screen.getAllByText('Quantité').length).toBeGreaterThan(0);
  });
});

describe('BR-25 · « Fermentation prim… » n’est plus coupé dans les lignes du récap', () => {
  it('le nom d’une phase passe à la ligne (pas de `truncate`) et garde son texte entier', () => {
    const base = {
      name: 'Essai', onName: vi.fn(), style: 'NEIPA', onStyle: vi.fn(), volumeL: 20, onVolumeL: vi.fn(), boilMin: 60, onBoilMin: vi.fn(),
      carboTarget: '', onCarboTarget: vi.fn(), fermentables: [], onFermentables: vi.fn(), totalGristKg: 0, hops: [], onHops: vi.fn(), hopIbu: () => null,
      yeast: { name: 'SafAle US-05', form: 'sèche', qty: 11.5, unit: 'g' }, onYeast: vi.fn(),
      mashSteps: [], onMashSteps: vi.fn(), fermentation: [{ name: 'Fermentation primaire', tempC: 19, days: 10 }], onFermentation: vi.fn(),
      mashWaterL: 0, onMashWaterL: vi.fn(), spargeWaterL: 0, onSpargeWaterL: vi.fn(), notes: '', onNotes: vi.fn(), shortages: [],
    } as unknown as BrewSheetProps;
    render(<BrewSheet {...base} />);
    const libelle = screen.getByText('Fermentation primaire');
    expect(libelle.className).not.toMatch(/\btruncate\b/);
  });
});

describe('TE-33 · la fermentation compte des phases, au récap comme à la fiche', () => {
  it('« Fermentation · 2 phases » (jamais « 2 paliers », qui sont ceux de l’empâtage)', () => {
    const base = {
      name: 'Essai', onName: vi.fn(), style: 'NEIPA', onStyle: vi.fn(), volumeL: 20, onVolumeL: vi.fn(), boilMin: 60, onBoilMin: vi.fn(),
      carboTarget: '', onCarboTarget: vi.fn(), fermentables: [], onFermentables: vi.fn(), totalGristKg: 0, hops: [], onHops: vi.fn(), hopIbu: () => null,
      yeast: { name: 'SafAle US-05', form: 'sèche', qty: 11.5, unit: 'g' }, onYeast: vi.fn(),
      mashSteps: [], onMashSteps: vi.fn(),
      fermentation: [{ name: 'Primaire', tempC: 19, days: 10 }, { name: 'Garde', tempC: 4, days: 7 }], onFermentation: vi.fn(),
      mashWaterL: 0, onMashWaterL: vi.fn(), spargeWaterL: 0, onSpargeWaterL: vi.fn(), notes: '', onNotes: vi.fn(), shortages: [],
    } as unknown as BrewSheetProps;
    render(<BrewSheet {...base} />);
    expect(screen.getByText('2 phases')).toBeTruthy();
    expect(screen.queryByText('2 paliers')).toBeNull();
  });
});

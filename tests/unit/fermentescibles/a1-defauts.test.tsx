// @vitest-environment jsdom
// Voie a1 (08.11) : défauts ouverts de l'étape Malts/sucres. Fixtures simulées (potentiels et couleurs de fiche typiques), aucune donnée réelle.
// MV-10, BR-18 (saisie), MV-11 (fiche), TE-18 et BR-10 (retrait annulable), AM-4 (moment de l'extrait), BR-15.
import React, { useState } from 'react';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it } from 'vitest';
import type { Fermentable, FermentableKind, StockItem } from '../../../src/types';
import { EtapeFermentescibles } from '../../../src/ui/fermentescibles/EtapeFermentescibles';
import type { DefFamille } from '../../../src/ui/fermentescibles/Ajout';
import { lireAjout, lit } from '../../../src/ui/fermentescibles/modele';
import { momentsPermis, messageMoment } from '../../../src/domain/fermentables/moments';

afterEach(cleanup);

const pale: Fermentable = { name: 'Pale Ale Malz', kind: 'grain', use: 'empatage', weightKg: 5, potentialPpg: 37, colorEbc: 6.5 };
const cara: Fermentable = { name: 'Caramünch Typ 2', kind: 'grain', use: 'empatage', weightKg: 1, potentialPpg: 34, colorEbc: 120 };
const fruit: Fermentable = { name: 'Mangue', kind: 'fruit', use: 'fermentation', dayOffset: 3, weightKg: 2, fermentabilityPct: 90 };

const DEFS: Record<FermentableKind, DefFamille> = {
  grain: { label: 'Grain', use: 'empatage', fermentability: 100, stock: ['Malt', 'Céréale'], newCat: 'Malt' },
  sucre: { label: 'Sucre', use: 'ebullition', fermentability: 100, ppg: 46, stock: ['Sucre'], newCat: 'Sucre' },
  lactose: { label: 'Sucre de lait', use: 'ebullition', fermentability: 0, ppg: 35, stock: ['Sucre'], newCat: 'Sucre' },
  fruit: { label: 'Fruit', use: 'fermentation', fermentability: 90, stock: ['Fruit', 'Additif'], newCat: 'Sucre' },
  extrait: { label: 'Extrait', use: 'ebullition', fermentability: 75, stock: ['Extrait', 'Sucre'], newCat: 'Sucre' },
};
let courant: Fermentable[] = [];
function Banc({ depart, famille0 = 'grain' }: { depart: Fermentable[]; famille0?: FermentableKind }) {
  const [l, setL] = useState<Fermentable[]>(depart);
  const [famille, setFamille] = useState<FermentableKind>(famille0);
  courant = l;
  return (
    <EtapeFermentescibles fermentables={l} onFermentables={setL} stockItems={[] as StockItem[]} famille={famille} onFamille={setFamille} defs={DEFS}
      onCreateStockItem={(n, c, u) => ({ id: 'n', ref: 'N', name: n, category: c, unit: u, currentStock: 0, minStock: 0, reorder: false })}
      onLearnIngredient={() => {}} nolo={false} og={null} teinteBiere={null} rendementPct={75} rendementDeclare={false} erreur={() => undefined} />
  );
}

describe('MV-10 — « Mangue 20 » est un fruit de 20 kg, pas un nom à 0 kg', () => {
  it('lireAjout : hors du grain, un petit entier au bout d’un nom neuf est une masse ; en grain, « Crystal 60 » reste un nom', () => {
    expect(lireAjout('Mangue 20', () => false, true)).toEqual({ nom: 'Mangue', kg: 20 });
    expect(lireAjout('Crystal 60', () => false, false)).toEqual({ nom: 'Crystal 60', kg: null });
  });
  it('au champ d’ajout en famille Fruit : Entrée crée « Mangue » à 20 kg', async () => {
    const u = userEvent.setup();
    render(<Banc depart={[pale]} famille0="fruit" />);
    await u.type(screen.getByRole('combobox'), 'Mangue 20{Enter}');
    const m = courant.find((f) => f.name === 'Mangue');
    expect(m).toBeDefined();
    expect(m!.weightKg).toBe(20);
    expect(m!.kind).toBe('fruit');
    // AM-6 : aucun potentiel inventé pour un fruit.
    expect(m!.potentialPpg).toBeUndefined();
  });
});

describe('BR-18 — un nombre tapé ne se lit pas dans du texte', () => {
  it('« Crystal 60 » n’est pas 60 ; les unités et le « J+ » s’acceptent', () => {
    expect(lit('Crystal 60')).toBeNull();
    expect(lit('abc')).toBeNull();
    expect(lit('2,5')).toBe(2.5);
    expect(lit('2.5 kg')).toBe(2.5);
    expect(lit('J+3')).toBe(3);
    expect(lit('120 EBC')).toBe(120);
    expect(lit('')).toBeNull();
  });
});

describe('MV-11 — un PPG hors bornes ne laisse pas son préfixe', () => {
  it('« 99 » passe par « 9 » : le PPG retenu reste celui d’avant (37), et la case se marque invalide', async () => {
    const u = userEvent.setup();
    render(<Banc depart={[pale]} />);
    await u.click(document.querySelector<HTMLElement>('[data-role="fiche"]')!);
    const champ = screen.getByLabelText(/Potentiel de Pale Ale Malz en PPG/);
    await u.clear(champ);
    await u.type(champ, '99');
    expect(courant[0].potentialPpg).toBe(37);
    expect(champ.getAttribute('aria-invalid')).toBe('true');
    await u.clear(champ);
    await u.type(champ, '38');
    expect(courant[0].potentialPpg).toBe(38);
  });
  it('un fruit a sa fiche : son PPG se renseigne (inconnu : « — », jamais 8)', async () => {
    const u = userEvent.setup();
    render(<Banc depart={[pale, fruit]} />);
    await u.click(document.querySelectorAll<HTMLElement>('[data-role="nom"]')[1]);
    const bouton = document.querySelector<HTMLElement>('[data-role="fiche"]')!;
    expect(bouton.textContent).toMatch(/PPG\s*—/);
    await u.click(bouton);
    await u.type(screen.getByLabelText(/Potentiel de Mangue en PPG/), '9');
    expect(courant[1].potentialPpg).toBe(9);
    expect(screen.queryByLabelText(/Couleur de Mangue/)).toBeNull();
  });
});

describe('TE-18, BR-10 — « Annuler » rend ce qui a été retiré', () => {
  it('un retrait : « Annuler » remet le malt à sa place avec sa masse', async () => {
    const u = userEvent.setup();
    render(<Banc depart={[pale, cara]} />);
    await u.click(screen.getByLabelText('Retirer Caramünch Typ 2'));
    expect(courant.map((f) => f.name)).toEqual(['Pale Ale Malz']);
    await u.click(document.querySelector<HTMLElement>('[data-role="annuler"]')!);
    expect(courant.map((f) => f.name)).toEqual(['Pale Ale Malz', 'Caramünch Typ 2']);
    expect(courant[1].weightKg).toBe(1);
  });
  it('deux retraits de suite (double toucher) : un seul « Annuler » rend les deux', async () => {
    const u = userEvent.setup();
    render(<Banc depart={[pale, cara]} />);
    await u.click(screen.getByLabelText('Retirer Caramünch Typ 2'));
    await u.click(screen.getByLabelText('Retirer Pale Ale Malz'));
    expect(courant).toHaveLength(0);
    await u.click(document.querySelector<HTMLElement>('[data-role="annuler"]')!);
    expect(courant.map((f) => f.name)).toEqual(['Pale Ale Malz', 'Caramünch Typ 2']);
  });
});

describe('AM-4 — un extrait se verse à l’ébullition seulement', () => {
  it('la table ne lui laisse que l’ébullition ; un extrait au fermenteur est signalé', () => {
    expect(momentsPermis('extrait')).toEqual(['ebullition']);
    expect(messageMoment({ name: 'Extrait de malt', kind: 'extrait', use: 'fermentation' })).toMatch(/se verse à l’ébullition/);
    expect(messageMoment({ name: 'Extrait de malt', kind: 'extrait', use: 'ebullition' })).toBeNull();
  });
});

describe('BR-12, BR-15 — la ligne touchée se choisit ; le cran du moins s’éteint à 0 kg', () => {
  it('le focus dans la masse d’une ligne la sélectionne (le plateau la suit)', async () => {
    const u = userEvent.setup();
    render(<Banc depart={[pale, cara]} />);
    expect(document.querySelector('[data-sel="0"]')!.getAttribute('aria-current')).toBe('true');
    await u.click(document.querySelector<HTMLElement>('[data-kl="1"]')!);
    expect(document.querySelector('[data-sel="1"]')!.getAttribute('aria-current')).toBe('true');
    expect(document.querySelector('#fer-bal')!.textContent).toMatch(/Caramünch Typ 2/);
  });
  it('« Retirer un cran » est désactivé à 0 kg', () => {
    render(<Banc depart={[{ ...pale, weightKg: 0 }]} />);
    expect((document.querySelector('[data-pas="-1"]') as HTMLButtonElement).disabled).toBe(true);
  });
});

describe('AM-8 — une maische sans malt de base est dite', () => {
  it('100 % caramel, torréfié ou flocons : message ; un malt de base, ou un grain sans couleur : rien', async () => {
    const { messageSansMaltDeBase, estMaltDeBase } = await import('../../../src/domain/fermentables/base');
    const flocons: Fermentable = { name: 'Haferflocken', kind: 'grain', use: 'empatage', weightKg: 2, potentialPpg: 33, colorEbc: 2 };
    expect(messageSansMaltDeBase([cara])).toMatch(/Aucun malt de base/);
    expect(messageSansMaltDeBase([flocons])).toMatch(/Aucun malt de base/);
    expect(messageSansMaltDeBase([cara, flocons])).toMatch(/Aucun malt de base/);
    expect(messageSansMaltDeBase([pale, cara])).toBeNull();
    expect(messageSansMaltDeBase([{ ...cara, colorEbc: undefined }])).toBeNull();
    expect(messageSansMaltDeBase([])).toBeNull();
    expect(estMaltDeBase({ name: 'Münchner Malz', colorEbc: 15 })).toBe(true);
  });
  it('l’étape le dit, et la validation le range parmi ce qui reste à corriger avant de brasser', async () => {
    render(<Banc depart={[cara]} />);
    expect(document.querySelector('[data-role="alertes"]')!.textContent).toMatch(/Aucun malt de base/);
    const { recipeReadiness } = await import('../../../src/domain/recipeValidation');
    const r = recipeReadiness({ id: 'R', name: 'Cara', volumeL: 20, boilMin: 60, fermentables: [cara], hops: [] } as never);
    expect(r.missing.map((m) => m.message).join(' ')).toMatch(/Aucun malt de base/);
    expect(r.invalid.map((m) => m.message).join(' ')).not.toMatch(/Aucun malt de base/);
  });
});

describe('AM-7 — le rapport eau/grain ne compte que le grain empâté', () => {
  it('un grain à l’ébullition ne change pas les litres d’empâtage tirés du rapport', async () => {
    const { reconcileRecipeWater } = await import('../../../src/domain/recipeWater');
    const { DEFAULT_WATER_SOURCE } = await import('../../../src/domain/water');
    const base = (ferm: Fermentable[]) => ({
      id: 'R', name: 'T', volumeL: 20, boilMin: 60, fermentables: ferm, hops: [], mash: { steps: [], ratioLPerKg: 3 },
      waterPlan: { sourceId: DEFAULT_WATER_SOURCE.id, sourceSnapshot: DEFAULT_WATER_SOURCE, mashWaterL: 10, spargeWaterL: 20, treatmentVersion: 2, diRatioPct: 0, allSaltsInMash: true, mash: {}, sparge: {} },
    }) as never;
    const seul = reconcileRecipeWater(base([pale]), ['mash.ratioLPerKg']);
    const avec = reconcileRecipeWater(base([pale, { ...cara, use: 'ebullition' }]), ['mash.ratioLPerKg']);
    expect(avec.waterPlan!.mashWaterL).toBeCloseTo(seul.waterPlan!.mashWaterL, 6);
    expect(seul.waterPlan!.mashWaterL).toBeCloseTo(15, 6);
  });
});

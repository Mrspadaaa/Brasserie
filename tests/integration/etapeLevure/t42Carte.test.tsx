// T4-2 (passe 5, 20.11) : la carte Ma levure de LalBrew Windsor disait « pas de conseil · fiche absente » alors que sa fiche (même carte : « fiche · conduite
// 15–25 · 19 °C ») donne « 50-100 g/hL ». Cause : la dose du fabricant ne dépend que du volume, mais `besoinDeLaLevure` rendait tout `undefined` quand la
// densité du moût manquait (recette sans DI ni potentiels, comme la Milk Stout dont les malts n'ont pas de couleur : T4-5) ; la carte perdait aussi la dose du fabricant.
import React, { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { EtapeLevure } from '../../../src/ui/etapeLevure/EtapeLevure';
import type { VueLevure } from '../../../src/ui/etapeLevure/props';
import type { TrialRecipe } from '../../../src/domain/hopIndex/trials';

vi.mock('../../../src/hooks/useLiveData', () => ({ useStorageValue: () => [] }));
vi.mock('../../../src/ui/etapeLevure/Chercher', () => ({ Chercher: () => <p>vue Chercher</p> }));
vi.mock('../../../src/ui/etapeLevure/Comparer', () => ({ Comparer: () => <p>vue Comparer</p> }));
vi.mock('../../../src/ui/etapeLevure/Suggerer', () => ({ Suggerer: () => <p>vue Suggérer</p> }));
beforeEach(() => { window.localStorage.clear(); });
afterEach(() => { cleanup(); window.localStorage.clear(); });

/** Une recette sans densité : ni DI visée, ni potentiel de malt (couleur et potentiel manquants). Fixture, aucune donnée réelle. */
const sansDensite = (yeast: object): TrialRecipe => ({
  id: 'zz-t42', name: 'ZZ TEST — Stout', style: '16A', volumeL: 30, boilMin: 60, efficiencyPct: 75,
  fermentables: [{ name: 'Caramünch Typ 2', weightKg: 0.4, kind: 'grain', use: 'empatage' }],
  hops: [{ name: 'Target', alpha: 10, weightG: 40, stage: 'boil', timeMin: 60 }],
  yeast, fermentation: [{ name: 'Fermentation principale', kind: 'primaire', tempC: 19, days: 10 }],
} as unknown as TrialRecipe);

function Banc({ depart }: { depart: TrialRecipe }) {
  const [recipe, setRecipe] = useState<TrialRecipe>(depart);
  const [vue, setVue] = useState<VueLevure>('ma-levure');
  return <EtapeLevure recipe={recipe} vue={vue} onVue={setVue} comparees={[]} onComparees={vi.fn()} onChoisir={vi.fn()}
    onChange={next => { setRecipe(next); return next; }}
    stockItems={[]} onStock={vi.fn()} onRetirer={vi.fn()} yeastChange={undefined} onYeastChange={vi.fn()}
    identityEditor={<p>éditeur stock (test)</p>} factsEditor={<p>éditeur fiche (test)</p>} aiEditor={<p>recherche IA (test)</p>} quantityEditor={<p>éditeur dose (test)</p>}
    atelier={() => <p>ancien atelier (test)</p>} />;
}
const dose = () => document.querySelector('[data-lv="bande-dose"]')!.textContent!;

describe('T4-2 : la dose du fabricant de Windsor ne dépend pas de la densité du moût', () => {
  it('Windsor du catalogue, recette sans DI : le fabricant (15–30 g à 30 L) est dit, jamais « fiche absente »', () => {
    render(<Banc depart={sansDensite({ name: 'LalBrew Windsor™ Yeast', hopIndexId: 'lalbrew-windsor', form: 'sèche', lab: 'Lallemand Brewing' })} />);
    expect(dose()).not.toMatch(/fiche absente/);
    expect(dose()).toMatch(/15–30 g/);
  });
  it('Windsor du stock (nom seul, sans identifiant de fiche) : relié à la fiche, même dose du fabricant', () => {
    render(<Banc depart={sansDensite({ name: 'LalBrew Windsor', form: 'sèche' })} />);
    expect(dose()).not.toMatch(/fiche absente/);
    expect(dose()).toMatch(/15–30 g/);
  });
  it('une saisie libre sans fiche garde « pas de conseil · fiche absente » (l’inconnu ne s’invente pas)', () => {
    render(<Banc depart={sansDensite({ name: 'ZZ TEST — levure hors catalogue', form: 'sèche' })} />);
    expect(dose()).toMatch(/fiche absente/);
  });
});

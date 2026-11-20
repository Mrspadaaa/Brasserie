// Ma levure, critique du 20.11 (port/CRITIQUE.md, problèmes 1 à 6) : chaque test échouait sur a96d810ca, la version jugée.
import React, { useState } from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { EtapeLevure } from '../../../src/ui/etapeLevure/EtapeLevure';
import { recetteApercuEtapeLevure } from '../../../src/ui/etapeLevure/apercuDev';
import { yeastReferences } from '../../../src/domain/yeastReferences';
import type { VueLevure } from '../../../src/ui/etapeLevure/props';
import type { TrialRecipe } from '../../../src/domain/hopIndex/trials';
import type { YeastChoiceChange } from '../../../src/ui/YeastRecipeChoice';

vi.mock('../../../src/hooks/useLiveData', () => ({ useStorageValue: () => [] }));
vi.mock('../../../src/ui/etapeLevure/Chercher', () => ({ Chercher: () => <p>vue Chercher</p> }));
vi.mock('../../../src/ui/etapeLevure/Comparer', () => ({ Comparer: () => <p>vue Comparer</p> }));
vi.mock('../../../src/ui/etapeLevure/Suggerer', () => ({ Suggerer: () => <p>vue Suggérer</p> }));
beforeEach(() => { window.localStorage.clear(); });
afterEach(() => { cleanup(); window.localStorage.clear(); });

const refs = yeastReferences([]);
/** US-05, 30 L, OG 1,066 (la recette de l'aperçu ; fixture, aucune donnée réelle). */
const us05 = (yeast: Partial<TrialRecipe['yeast']> = {}): TrialRecipe => {
  const r = recetteApercuEtapeLevure() as unknown as TrialRecipe;
  return { ...r, yeast: { ...r.yeast, ...yeast } };
};
const changement = (avant: TrialRecipe['yeast'], apres: TrialRecipe['yeast']): YeastChoiceChange =>
  ({ source: 'catalogue' as never, startedAt: Date.now(), from: { yeast: avant } as never, to: { yeast: structuredClone(apres) } as never });

function Banc({ depart, changes = [] as TrialRecipe[], change }: { depart: TrialRecipe; changes?: TrialRecipe[]; change?: YeastChoiceChange }) {
  const [recipe, setRecipe] = useState<TrialRecipe>(depart);
  const [vue, setVue] = useState<VueLevure>('ma-levure');
  return <EtapeLevure recipe={recipe} vue={vue} onVue={setVue} comparees={[]} onComparees={vi.fn()} onChoisir={vi.fn()}
    onChange={next => { changes.push(next); setRecipe(next); return next; }}
    stockItems={[]} onStock={vi.fn()} onRetirer={vi.fn()} yeastChange={change} onYeastChange={vi.fn()}
    identityEditor={<p>éditeur stock (test)</p>} factsEditor={<p>éditeur fiche (test)</p>} aiEditor={<p>recherche IA (test)</p>} quantityEditor={<p>éditeur dose (test)</p>}
    atelier={() => <p>ancien atelier (test)</p>} />;
}
const bande = () => document.querySelector('[data-lv="bande-dose"]')!;

describe('1 · le besoin de la recette ne dit pas « manque » comme la puce du stock', () => {
  it('2 sachets pour un besoin de 2,4 : « sous le besoin », « manque » reste au stock seul', () => {
    render(<Banc depart={us05({ qty: 2, unit: 'sachet' })} />);
    expect(bande().getAttribute('data-etat')).toBe('repos');
    const mot = bande().querySelector('.ml-partmot')!;
    expect(mot.textContent).toMatch(/^sous le besoin, \+0,\d sachet$/);
    expect(mot.textContent).not.toMatch(/manque/);
    expect(bande().querySelector('[data-lv="manque"]')!.textContent).toMatch(/^manque \d+$/);
  });
});

describe('2 · « Annuler le changement » : la barre noire de r3 v05 (e4)', () => {
  it('un seul bouton pleine largeur, l’ancienne levure à droite, sans « Avant : … · non enregistré »', () => {
    const andechs = refs.find(r => r.name === 'Brewing Science Institute · Andechs Lager')!;
    const depart = us05();
    const changes: TrialRecipe[] = [];
    render(<Banc depart={depart} changes={changes} change={changement({ name: andechs.name, hopIndexId: andechs.id } as never, depart.yeast)} />);
    const barre = document.querySelector('[data-lv="annuler"]')!;
    expect(barre.tagName).toBe('BUTTON');
    expect(barre.classList.contains('lv-barre-annuler')).toBe(true);
    expect(barre.querySelector('b')!.textContent).toBe('Annuler le changement');
    expect(barre.querySelector('.lv-barre-nom')!.textContent).toBe('Andechs Lager');
    expect(barre.textContent).not.toMatch(/Avant|non enregistré/);
    fireEvent.click(barre);
    expect(changes.at(-1)?.yeast.name).toBe(andechs.name);
  });
});

describe('3 · + / − sur une levure sans fiche ouvrent le champ grammes dans la carte', () => {
  it('« Lager maison » hors catalogue : + ouvre le champ, 12 g s’écrit, la carte dit « 12 g »', () => {
    const changes: TrialRecipe[] = [];
    render(<Banc depart={us05({ name: 'Lager maison', hopIndexId: undefined, form: undefined, lab: undefined })} changes={changes} />);
    expect(bande().getAttribute('data-etat')).toBe('libre');
    fireEvent.click(bande().querySelector('[data-lv="plus"]')!);
    const champ = bande().querySelector<HTMLInputElement>('input[data-lv="grammes"]')!;
    expect(champ).not.toBeNull();
    expect(champ.getAttribute('inputmode')).toBe('decimal');
    expect(champ.getAttribute('type')).not.toBe('number');
    expect(document.activeElement).toBe(champ);
    fireEvent.change(champ, { target: { value: '12' } });
    fireEvent.submit(champ.form!);
    expect(changes.at(-1)?.yeast).toMatchObject({ qty: 12, unit: 'g' });
    expect(bande().querySelector('input[data-lv="grammes"]')).toBeNull();
    expect(bande().textContent).toMatch(/12 g/);
    expect(document.querySelectorAll('[data-repli]')).toHaveLength(0);             // aucun volet ouvert ailleurs
    // − rouvre le champ, prérempli ; dans le champ, + monte d'un gramme
    fireEvent.click(bande().querySelector('[data-lv="moins"]')!);
    const champ2 = bande().querySelector<HTMLInputElement>('input[data-lv="grammes"]')!;
    expect(champ2.value).toBe('12');
    fireEvent.click(bande().querySelector('[data-lv="plus"]')!);
    expect(champ2.value).toBe('13');
  });
});

describe('4 · Changer de levure : le code tapé et la fiche documentée d’abord', () => {
  it('« W-34/70 » : SafLager W-34/70 (Fermentis) en tête, rien sans le code', async () => {
    vi.useFakeTimers();
    try {
      render(<Banc depart={us05()} />);
      const champ = document.querySelector<HTMLInputElement>('input.lv-in')!;
      fireEvent.change(champ, { target: { value: 'W-34/70' } });
      await act(async () => { vi.advanceTimersByTime(50); });
      const options = [...document.querySelectorAll('[role="option"]')].map(o => o.textContent ?? '');
      expect(options.length).toBeGreaterThan(0);
      expect(options[0]).toMatch(/SafLager™? W.34\/70.*Fermentis/);   // U+2011 dans le nom de la fiche
      for (const o of options) expect(o).toMatch(/34\s?\/\s?70|3470/);
    } finally { vi.useRealTimers(); }
  });
});

describe('5 · après − / +, pas d’aplat or durable derrière « sachets » (r4 v02 : le pointillé seul)', () => {
  it('maLevure.css ne pose aucun fond sur .ml-qte[data-touche]', () => {
    const css = readFileSync('src/ui/etapeLevure/maLevure.css', 'utf8');
    expect(css).not.toMatch(/\.ml-qte\[data-touche\][^{]*\{[^}]*background/);
  });
});

describe('6 · au-dessus du haut du fabricant, la carte dit lequel compte', () => {
  it('3 sachets (34,5 g) pour un fabricant 15–24 g à OG 1,066 : « au-dessus du fabricant … l’OG 1,066 en demande plus »', () => {
    render(<Banc depart={us05({ qty: 3, unit: 'sachet' })} />);
    expect(bande().querySelector('.ml-partmot')!.textContent).toBe('couvre le besoin');
    expect(bande().querySelector('[data-lv="reperes"]')!.textContent).toMatch(/^au-dessus du fabricant 15–24 g : l’OG 1,066 en demande plus · taux ale/);
  });
  it('2 sachets (23 g) restent dans la plage : « fabricant 15–24 g » seul', () => {
    render(<Banc depart={us05({ qty: 2, unit: 'sachet' })} />);
    expect(bande().querySelector('[data-lv="reperes"]')!.textContent).toMatch(/^fabricant 15–24 g · taux ale/);
  });
});

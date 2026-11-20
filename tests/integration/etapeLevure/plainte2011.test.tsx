// Plainte du brasseur du 20.11 (4 captures à 390, port/plainte-20-11) : chaque test échoue sur b3af06b83, la version jugée.
// Munich Lager Yeast 500 g = une brique SÈCHE (décision du pilote : la donnée fait foi) : des grammes, avec le besoin lager en grammes.
import React, { useState } from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { EtapeLevure } from '../../../src/ui/etapeLevure/EtapeLevure';
import { recetteApercuEtapeLevure } from '../../../src/ui/etapeLevure/apercuDev';
import { besoinDeLaLevure, doseApresChoix, formeDuCatalogue } from '../../../src/ui/etapeLevure/dose';
import { yeastReferences } from '../../../src/domain/yeastReferences';
import { FermentationTemperatureChart } from '../../../src/ui/FermentationTemperatureChart';
import type { VueLevure } from '../../../src/ui/etapeLevure/props';
import type { TrialRecipe } from '../../../src/domain/hopIndex/trials';
import type { YeastSupply } from '../../../functions/src/yeastSupplySchema';

vi.mock('../../../src/hooks/useLiveData', () => ({ useStorageValue: () => [] }));
vi.mock('../../../src/ui/etapeLevure/Chercher', () => ({ Chercher: () => <p>vue Chercher</p> }));
vi.mock('../../../src/ui/etapeLevure/Comparer', () => ({ Comparer: () => <p>vue Comparer</p> }));
vi.mock('../../../src/ui/etapeLevure/Suggerer', () => ({ Suggerer: () => <p>vue Suggérer</p> }));
beforeEach(() => { window.localStorage.clear(); });
afterEach(() => { cleanup(); window.localStorage.clear(); });

const refs = yeastReferences([]);
const munich = refs.find(r => r.id === 'yeast-lallemand-brewing-18635-06-13')!;
const wyeast = refs.find(r => r.id === 'wyeast-1728')!;
const supply = { products: [] } as unknown as YeastSupply;
const base = (): TrialRecipe => recetteApercuEtapeLevure() as unknown as TrialRecipe;
/** La recette de la plainte : 29 L, OG 1,026 (malts sans potentiel : la DI de la recette fait foi). Fixture, aucune donnée réelle. */
const recette = (yeast: Partial<TrialRecipe['yeast']>, autre: Partial<TrialRecipe> = {}): TrialRecipe => {
  const r = base();
  return { ...r, volumeL: 29, ogTarget: 1.026, fermentables: [{ name: 'Pilsner', weightKg: 3, kind: 'grain', use: 'empatage', colorEbc: 4 }] as never,
    ...autre, yeast: { ...yeast } as TrialRecipe['yeast'] };
};
const munichRecette = (qty?: number) => recette({ name: munich.name, hopIndexId: munich.id, lab: 'Lallemand Brewing', ...(qty !== undefined ? { qty, unit: 'g' } : {}) });

function Banc({ depart, changes = [] as TrialRecipe[] }: { depart: TrialRecipe; changes?: TrialRecipe[] }) {
  const [recipe, setRecipe] = useState<TrialRecipe>(depart);
  const [vue, setVue] = useState<VueLevure>('ma-levure');
  return <EtapeLevure recipe={recipe} vue={vue} onVue={setVue} comparees={[]} onComparees={vi.fn()} onChoisir={vi.fn()}
    onChange={next => { changes.push(next); setRecipe(next); return next; }}
    stockItems={[]} onStock={vi.fn()} onRetirer={vi.fn()} onYeastChange={vi.fn()}
    identityEditor={<p>éditeur stock (test)</p>} factsEditor={<p>éditeur fiche (test)</p>} aiEditor={<p>recherche IA (test)</p>} quantityEditor={<p>éditeur dose (test)</p>}
    atelier={() => <p>ancien atelier (test)</p>} />;
}
const bande = () => document.querySelector('[data-lv="bande-dose"]')!;
/** L'en-tête de la carte, tel qu'il se lit (« 115 g ») : son nom accessible, avant « : régler… ». */
const entete = () => document.querySelector('[data-lv="dose"]')!.getAttribute('aria-label')!.split(' :')[0];

describe('A · la donnée : brique sèche de 500 g, besoin lager en grammes', () => {
  it('la forme se lit au catalogue : « 500g » → sèche ; Wyeast sans poids → liquide', () => {
    expect(formeDuCatalogue(munich)).toBe('sèche');
    expect(formeDuCatalogue(wyeast)).toBe('liquide');
  });
  it('Munich, 29 L à OG 1,026 : besoin lager ≈ 22 g', () => {
    const b = besoinDeLaLevure(munichRecette(112), supply, 1.026, munich)!;
    expect(b.regime).toBe('lager');
    expect(b.grammes).toBeGreaterThan(20);
    expect(b.grammes).toBeLessThan(24);
  });
  it('choisir Munich écrit le besoin en grammes (jamais vide)', () => {
    const r = doseApresChoix(munichRecette(), {} as never, supply, 1.026, munich);
    expect(r.yeast).toMatchObject({ unit: 'g' });
    expect(r.yeast.qty).toBeGreaterThanOrEqual(21);
    expect(r.yeast.qty).toBeLessThanOrEqual(23);
  });
  it('une liquide sans cellules documentées se compte en packs (≈ 100 Md, estimé)', () => {
    const b = besoinDeLaLevure(recette({ name: wyeast.name, hopIndexId: wyeast.id }), supply, 1.026, wyeast)!;
    expect(b.sachet).toMatchObject({ unite: 'pack', cellules: 100, estime: true });
  });
});

describe('B · C · la carte Munich 112 g (captures 3 et 4)', () => {
  it('1, 2, 4 : repère « besoin lager 22 g », un seul verdict, sur-dosage signalé avec remède', () => {
    const changes: TrialRecipe[] = [];
    render(<Banc depart={munichRecette(112)} changes={changes} />);
    expect(bande().getAttribute('data-etat')).toBe('repos');
    const t = bande().textContent!;
    expect(t).not.toMatch(/pas de repère/);
    expect(t).not.toMatch(/couvre le fabricant/);
    expect(t).toMatch(/besoin lager 2\d g/);
    expect(bande().querySelector('.ml-partmot')!.textContent).toMatch(/^sur-dosé · 5× le besoin$/);
    const remede = bande().querySelector<HTMLButtonElement>('[data-lv="remede"]')!;
    expect(remede.textContent).toMatch(/^→ 2\d g$/);
    fireEvent.click(remede);
    expect(changes.at(-1)!.yeast.unit).toBe('g');
    expect(changes.at(-1)!.yeast.qty).toBeLessThanOrEqual(23);
  });
  it('3 : + écrit tout de suite, en grammes (pas de 5 g au-dessus de 30 g) ; l’en-tête suit', () => {
    const changes: TrialRecipe[] = [];
    render(<Banc depart={munichRecette(112)} changes={changes} />);
    fireEvent.click(bande().querySelector('[data-lv="plus"]')!);
    expect(changes.at(-1)!.yeast).toMatchObject({ qty: 115, unit: 'g' });
    expect(bande().getAttribute('data-etat')).toBe('apres');
    expect(bande().textContent).toMatch(/\d+ %du besoin/);
    expect(entete()).toBe('115 g');
    fireEvent.click(bande().querySelector('[data-lv="moins"]')!);
    expect(changes.at(-1)!.yeast).toMatchObject({ qty: 110, unit: 'g' });
    expect(entete()).toBe('110 g');
  });
  it('une liquide écrite en grammes : « 112 g écrits · une liquide se compte en packs » et « Mettre N packs »', () => {
    const changes: TrialRecipe[] = [];
    render(<Banc depart={recette({ name: wyeast.name, hopIndexId: wyeast.id, qty: 112, unit: 'g' })} changes={changes} />);
    expect(bande().getAttribute('data-etat')).toBe('a-choisir');
    expect(bande().textContent).toMatch(/112 g écrits · une liquide se compte en packs/);
    const mettre = bande().querySelector<HTMLButtonElement>('[data-lv="mettre"]')!;
    expect(mettre.textContent).toMatch(/^Mettre \d+ packs?$/);
    fireEvent.click(mettre);
    expect(changes.at(-1)!.yeast.unit).toBe('pack');
  });
  it('3 (libre) : le champ ouvert, + écrit la valeur ; l’en-tête dit la même chose que le champ', () => {
    const changes: TrialRecipe[] = [];
    render(<Banc depart={recette({ name: 'Lager maison', qty: 112, unit: 'g' })} changes={changes} />);
    expect(bande().getAttribute('data-etat')).toBe('libre');
    fireEvent.click(bande().querySelector('[data-lv="plus"]')!);
    const champ = bande().querySelector<HTMLInputElement>('input[data-lv="grammes"]')!;
    expect(champ.value).toBe('112');
    fireEvent.click(bande().querySelector('[data-lv="plus"]')!);
    expect(champ.value).toBe('113');
    expect(changes.at(-1)!.yeast).toMatchObject({ qty: 113, unit: 'g' });
    expect(entete()).toBe('113 g');
  });
});

describe('D · la conduite (capture 1)', () => {
  const steps = [{ name: 'Fermentation principale', kind: 'primaire', tempC: 14.5, days: 34.5 }, { name: 'Garde froide', kind: 'garde', tempC: 4, days: 5 }];
  const brouillon = [{ name: 'Fermentation principale', kind: 'primaire', tempC: 19, days: 10 }, { name: 'Garde froide', kind: 'garde', tempC: 4, days: 5 }];
  const graphe = () => render(<FermentationTemperatureChart steps={steps as never} referenceSteps={brouillon as never} bands={[{ min: 18, max: 26 } as never, undefined]}
    selectedStepIndex={0} onSelectStep={vi.fn()} onStepsChange={vi.fn()} />);
  const svg = () => document.querySelector('svg[data-plot-bottom]')!;
  it('8 : le brouillon est un seul trait fin en marches, nommé à son bout ; plus de verticales pleine hauteur', () => {
    graphe();
    const top = Number(svg().getAttribute('data-plot-top')), bottom = Number(svg().getAttribute('data-plot-bottom'));
    const traits = svg().querySelectorAll('[data-reference-path]');
    expect(traits).toHaveLength(1);
    expect(Number(traits[0].getAttribute('stroke-width'))).toBeLessThanOrEqual(3);
    for (const l of svg().querySelectorAll('[data-reference-transition-day] line, [data-reference-programme-end-day] line'))
      expect(Math.abs(Number(l.getAttribute('y2')) - Number(l.getAttribute('y1')))).toBeLessThan((bottom - top) / 4);
    const nom = svg().querySelector<SVGTextElement>('[data-reference-label]')!;
    expect(nom.textContent).toBe('brouillon · fin J15');
    expect(nom.style.paintOrder).toBe('stroke');
  });
  it('9 : le guide ↔ ne traverse pas les étiquettes de jours', () => {
    graphe();
    const bottom = Number(svg().getAttribute('data-plot-bottom'));
    const lignes = svg().querySelectorAll('[data-duration-guide] line, line[data-duration-guide]');
    expect(lignes.length).toBeGreaterThan(0);
    for (const l of lignes) {
      const a = Math.min(Number(l.getAttribute('y1')), Number(l.getAttribute('y2'))), b = Math.max(Number(l.getAttribute('y1')), Number(l.getAttribute('y2')));
      expect(a < bottom + 32 && b > bottom + 2).toBe(false);
    }
  });
  it('10 : « plage levure 18–26 °C » porte un liseré', () => {
    graphe();
    const t = svg().querySelector<SVGTextElement>('[data-band-label]')!;
    expect(t.style.paintOrder).toBe('stroke');
  });
  it('11 : la consigne hors de sa plage se voit sur le graphe', () => {
    graphe();
    const ligne = svg().querySelector('[data-step="0"] [data-setpoint]')!;
    expect(ligne.getAttribute('data-hors-plage')).toBe('sous');
    expect(svg().querySelector('[data-setpoint-label="0"]')!.textContent).toBe('14,5 °C · sous la plage');
  });
  it('11 : la puce nomme le point à vérifier, en virgule décimale ; la mini-courbe relie ses paliers', () => {
    render(<Banc depart={{ ...base(), fermentation: [{ name: 'Fermentation principale', kind: 'primaire', tempC: 14.5, days: 10 }, { name: 'Garde froide', kind: 'garde', tempC: 4, days: 5 }] } as never} />);
    const puce = document.querySelector('.yc-chip[data-tone="warning"]')!;
    expect(puce.textContent).toMatch(/^À vérifier · Fermentation principale : 14,5 °C/);
    expect(document.body.textContent).not.toMatch(/14\.5/);
    expect(document.querySelector('.yc-spark path')!.getAttribute('d')).toMatch(/V/);
  });
});

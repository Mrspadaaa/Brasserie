// @vitest-environment jsdom
// Voie u3 (D113) : trois finitions de l'arôme interpolé de l'étape Houblons (recette « neipa v3 » : 22A, 24 L, OG 1,081, Lotus 84 g).
// 1. Marquage : une famille interpolée (ébullition entre 10′ et 60′) a un rond en pointillé ; la légende ajoute « interpolé »
//    seulement quand une famille l'est. 2. Raison au survol d'une barre hachurée : celle de l'ajout (« ébullition 5′ : … »,
//    « houblon absent des fiches »), le message générique seulement sans raison plus précise. 3. Whirlpool sans température :
//    simulé au préréglage de 80 °C, le survol dit « 80 °C supposé ».
import { cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Recipe } from '../../../src/types';

vi.mock('../../../src/services/storage', () => ({
  StorageService: {
    subscribe: () => () => {},
    getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] }),
    getBatches: () => [],
    getHopTastings: () => [],
  },
}));

import EtapeHoublons from '../../../src/ui/hopIndex/maBiere/EtapeHoublons';
import { chargerCataloguePlein } from '../../../src/domain/hopIndex/v4/data';
import { toHopRecipe } from '../../../src/domain/hopIndex/v4/recipeConversion';
import { FAMILIES } from '../../../src/domain/hopIndex/v4';
import { lireBiere } from '../../../src/ui/hopIndex/parcours/adaptateur';

type Etape = Record<string, unknown>;
const MALTS = [
  { name: 'Pilsner', weightKg: 6.6, kind: 'grain', use: 'empatage', colorEbc: 3.5, potentialPpg: 37 },
  { name: 'Flocons d\'avoine', weightKg: 2, kind: 'grain', use: 'empatage', colorEbc: 2, potentialPpg: 33 },
];
const neipa = (houblons: Etape[]): Recipe => ({
  id: 'REC-U3', name: 'neipa v3', style: 'Double IPA', styleRef: { styleId: 'double-ipa' }, volumeL: 24, boilMin: 60,
  ogTarget: 1.081, totalGristKg: 8.6, fermentables: MALTS, hops: houblons, yeast: { name: 'Verdant IPA', hopIndexId: 'lalbrew-verdant-ipa' },
} as unknown as Recipe);
const lotus = (etape: Etape): Etape => ({ name: 'Lotus', alpha: 15, weightG: 84, hopVarietyId: 'beermaverick-lotus', ...etape });
const ebullition = (m: number) => lotus({ stage: 'boil', timeMin: m });

async function monter(houblons: Etape[]) {
  const rendu = render(<EtapeHoublons recipe={neipa(houblons)} boilOg={1.081} draftId="REC-U3" onChange={() => {}} />);
  await waitFor(() => expect(rendu.container.querySelectorAll('[data-barre]').length).toBe(12));
  const barres = Array.from(rendu.container.querySelectorAll<HTMLElement>('[data-barre]'));
  const points = barres.map((b) => b.querySelector<HTMLElement>('[data-role="point"]')).filter((p): p is HTMLElement => !!p);
  const hachurees = barres.filter((b) => b.querySelector('.pq-hachure'));
  const legende = rendu.container.querySelector<HTMLElement>('#pq-ma-biere-legende-profil')!;
  return { ...rendu, barres, points, hachurees, legende };
}

beforeAll(async () => { await chargerCataloguePlein(); });
afterEach(cleanup);

describe('D113 1 : le marquage « interpolé »', () => {
  it('40′ : un rond en pointillé sur chaque famille située, et la puce « interpolé » dans la légende', async () => {
    const { points, legende } = await monter([ebullition(40)]);
    expect(points.length).toBe(4);
    for (const p of points) {
      expect(p.hasAttribute('data-interpole')).toBe(true);
      expect(p.className).toMatch(/border-dashed/);
    }
    const puce = legende.querySelector('[data-role="puce-interpole"]');
    expect(puce).not.toBeNull();
    expect(legende.textContent).toMatch(/interpolé/);
  });
  it('60′ : ronds pleins comme avant, et aucune puce « interpolé »', async () => {
    const { points, legende } = await monter([ebullition(60)]);
    expect(points.length).toBe(4);
    for (const p of points) { expect(p.hasAttribute('data-interpole')).toBe(false); expect(p.className).not.toMatch(/border-dashed/); }
    expect(legende.querySelector('[data-role="puce-interpole"]')).toBeNull();
    expect(legende.textContent).not.toMatch(/interpol/);
  });
});

describe('D113 2 : la raison au survol d\'une barre hachurée est celle de l\'ajout', () => {
  it('5′ (hors de 10′–60′) : les 12 barres disent « ébullition 5′ : … », pas le message générique', async () => {
    const { hachurees } = await monter([ebullition(5)]);
    expect(hachurees.length).toBe(12);
    for (const b of hachurees) {
      expect(b.title).toMatch(/ébullition 5′ : le moteur simule l'arôme de 10′ à 60′ seulement/);
      expect(b.title).not.toMatch(/non décrite par les fiches/);
    }
  });
  it('houblon hors des fiches : « houblon absent des fiches du moteur » sur chaque barre', async () => {
    const { hachurees } = await monter([{ name: 'Houblon inventé', alpha: 10, weightG: 30, stage: 'boil', timeMin: 40 }]);
    expect(hachurees.length).toBe(12);
    for (const b of hachurees) expect(b.title).toMatch(/houblon absent des fiches du moteur/);
  });
  it('sans raison propre à l\'ajout (famille que les fiches de Lotus ne décrivent pas) : le message de la famille reste', async () => {
    const { hachurees } = await monter([ebullition(60)]);
    expect(hachurees.length).toBe(8);
    for (const b of hachurees) { expect(b.title).not.toBe(''); expect(b.title).not.toMatch(/ébullition|absent des fiches/); }
  });
  it('mélange : un ajout simulé et un ajout non simulé, les deux raisons se disent', async () => {
    const { hachurees } = await monter([ebullition(60), lotus({ stage: 'boil', timeMin: 5 })]);
    expect(hachurees.length).toBe(8);
    for (const b of hachurees) expect(b.title).toMatch(/ébullition 5′/);
  });
});

describe('D113 3 : le whirlpool sans température est simulé au préréglage de 80 °C', () => {
  const wp = (extra: Etape = {}) => lotus({ stage: 'whirlpool', timeMin: 20, ...extra });
  it('n\'est plus hachuré : des familles situées, aucune raison « non simulé », et le survol dit « 80 °C supposé »', async () => {
    const { points, hachurees, barres } = await monter([wp()]);
    expect(points.length).toBeGreaterThan(0);
    expect(hachurees.length).toBeLessThan(12);
    for (const b of barres.filter((x) => x.querySelector('[data-role="point"]'))) expect(b.title).toBe('80 °C supposé');
    const biere = lireBiere(toHopRecipe(neipa([wp()]), { boilOg: 1.081 }).recette);
    expect(biere.nonSimules).toEqual([]);
    expect(FAMILIES.filter((f) => biere.profil[f].valeur).length).toBe(points.length);
  });
  it('avec sa température (80 °C saisis) : même arôme, rien de supposé au survol', async () => {
    const sans = await monter([wp()]);
    const centres = sans.points.map((p) => p.style.left);
    cleanup();
    const avec = await monter([wp({ tempC: 80 })]);
    expect(avec.points.map((p) => p.style.left)).toEqual(centres);
    for (const b of avec.barres.filter((x) => x.querySelector('[data-role="point"]'))) expect(b.title).toBe('');
  });
  it('sans durée non plus : reste non simulé, avec sa raison (rien d\'inventé)', async () => {
    const { hachurees } = await monter([lotus({ stage: 'whirlpool' })]);
    expect(hachurees.length).toBe(12);
    for (const b of hachurees) expect(b.title).toMatch(/durée de whirlpool inconnue/);
  });
});

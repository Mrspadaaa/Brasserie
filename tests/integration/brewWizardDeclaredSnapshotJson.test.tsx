// BK4-3 (relance r3, 20.11) : réécrit contre l'écran actuel. L'atelier Houblons V5.5 n'est plus monté dans l'étape Houblons (TE-27) ;
// ces tests lisaient le brouillon que le Wizard lui déclarait. La même Recipe, celle que construit `build()`, est ici lue à la sortie
// du Wizard (le brouillon qu'il donne à l'assistant, BrewerChat, observé sans rien changer), puis passée à la vraie projection canonique
// et à la vraie garde JSON du ticket (services/hopV55, conservés). Le test « ticket Wizard durable + émission » jouait l'atelier
// (champ « Question au brasseur », « Ouvrir un dossier assisté ») : retiré avec l'atelier ; l'écran qui le jouait n'existe plus.
// @vitest-environment jsdom
import React from 'react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, fireEvent, render } from '@testing-library/react';
import { BrewWizard } from '../../src/pages/BrewWizard';
import { defaultConfig } from '../../src/services/storage';
import { BrewingMath } from '../../src/services/brewingMath';
import { practicalBrewingPreferences, practicalEquipment } from '../../src/domain/brewEquipment';
import { DEFAULT_WATER_SOURCE } from '../../src/domain/water';
import type { BrewhouseProfile, Recipe } from '../../src/types';
import { canonicalizeHopV55RecipeDraft } from '../../src/services/hopV55/recipeStepContext';
import { HOP_V55_ASSISTED_ADVICE_WIZARD_TICKET_V1_FORMAT,
  readHopV55AssistedAdviceWizardTicketV1 } from '../../src/services/hopV55/assistedSemanticAdviceArchiveV2';
import { recipe as fixtureRecipe } from '../fixtures/brewCompanion';

/** Le brouillon que le Wizard déclare, lu à la sortie : le `draft` donné au compagnon est `build()`, sans retouche. */
const sortie = vi.hoisted(() => ({ drafts: [] as unknown[] }));
vi.mock('../../src/ui/BrewerChat', () => ({
  BrewerChat: (props: { draft?: unknown }) => { sortie.drafts.push(props.draft); return null; },
}));
vi.mock('../../src/services/aiClient', () => ({ AiClient: { run: vi.fn() } }));

const OWNER = 'owner:wizard-declared-snapshot';
/** Every refusal wording of the strict JSON guard of the archive codec. */
const JSON_REFUSAL = /n’est pas un snapshot JSON sérialisable|doit être un objet JSON simple|contient un nombre non fini|contient une référence cyclique/;
/** The Wizard ticket reader checks JSON first, then structure: reaching this message means the JSON guard accepted. */
const STRUCTURE_AFTER_JSON = /^Structure ou identité du ticket Wizard invalide/;
/** Fields that BrewWizard.build() can only take from the edited Recipe itself. */
const BASE_ONLY_OPTIONALS = ['version', 'parentRecipeId', 'favorite', 'archivedAt'] as const;

beforeEach(() => { localStorage.clear(); sortie.drafts.length = 0; });
afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); });

/** A valid saved Recipe without version, parent or other optional fields. */
function savedRecipe(): Recipe {
  const profile: BrewhouseProfile = { id: 'my-rig', name: 'Cuve personnelle', volumeL: 26, efficiencyPct: 75,
    boilOffRatePct: 10, deadSpaceL: 1, mashRatioLPerKg: 4.2, equipment: { ...practicalEquipment },
    preferences: { ...practicalBrewingPreferences } };
  const water = BrewingMath.waterVolumes(2.5, 26, profile, 'batch', 60, 0);
  const fixture = fixtureRecipe();
  return { ...fixture, id: 'recipe-wizard-declared-snapshot', name: 'Pale enregistrée', brewhouse: profile, volumeL: 26, totalGristKg: 2.5,
    installation: { manualWaterSplit: false, fermenterHeadspacePct: 10, spargeExceptionAccepted: false },
    hops: [], fermentables: [{ ...fixture.fermentables[0], weightKg: 2.5 }],
    mash: { steps: [{ name: 'Saccharification', tempC: 67, durationMin: 60 }], ratioLPerKg: water.mashWaterL / 2.5, spargeType: 'batch' },
    preBoilL: water.preBoilVolumeL, preBoilHotL: water.preBoilHotL,
    waterPlan: { ...fixture.waterPlan!, sourceId: DEFAULT_WATER_SOURCE.id, sourceSnapshot: DEFAULT_WATER_SOURCE,
      mashWaterL: water.mashWaterL, spargeWaterL: water.spargeWaterL },
    fermentation: [{ kind: 'primaire', name: 'Primaire', tempC: 20, days: 10 }] };
}

/** Monte le vrai Wizard (non local : l'assistant reçoit le brouillon) et rend la Recipe qu'il déclare. */
function declaredRecipe(seed: Recipe, edit?: () => void): Recipe {
  sortie.drafts.length = 0;
  const view = render(<BrewWizard seed={{ recipe: seed }}
    config={{ ...defaultConfig, brewhouses: [seed.brewhouse!], activeBrewhouseId: seed.brewhouse!.id }}
    stockItems={[]} knownStyles={['Pale Ale']} onClose={vi.fn()} onSave={vi.fn()}
    onCreateStockItem={vi.fn()} onLearnIngredient={vi.fn()} onSaveWaterSource={vi.fn()} />);
  edit?.();
  const declared = sortie.drafts.at(-1) as Recipe | undefined;
  view.unmount();
  if (!declared) throw new Error('Le Wizard n’a donné aucun brouillon à l’assistant.');
  return declared;
}

/** Wire draft exactly as the hop step forwarded it: the real canonical projection of the declared recipe. */
const wireDraftOf = (recipe: Recipe) => canonicalizeHopV55RecipeDraft({ ownerKey: OWNER, draftId: recipe.id, draft: recipe }).recipe;
const canonicalReferenceOf = (recipe: Recipe) => canonicalizeHopV55RecipeDraft({ ownerKey: OWNER, draftId: recipe.id, draft: recipe }).reference;

/** Verdict of the real strict JSON guard of the Wizard ticket reader, which runs before any structural check. */
function ticketJsonGuard(draft: unknown): string {
  const read = readHopV55AssistedAdviceWizardTicketV1({ format: HOP_V55_ASSISTED_ADVICE_WIZARD_TICKET_V1_FORMAT, wire: { draft } });
  return read.status === 'invalid' ? read.reason : `lecture ${read.status}`;
}

/** Every own property or array item holding `undefined` (holes are not items), as a readable path. */
function ownUndefinedPaths(value: unknown, path = 'recipe', ancestors: object[] = []): string[] {
  if (!value || typeof value !== 'object' || ancestors.includes(value)) return [];
  const prototype = Object.getPrototypeOf(value);
  if (!Array.isArray(value) && prototype !== Object.prototype && prototype !== null) return [];
  const nested = [...ancestors, value];
  const entries: Array<[string, unknown]> = Array.isArray(value)
    ? Object.keys(value).map(index => [`${path}[${index}]`, value[Number(index)]])
    : Object.entries(value).map(([key, child]) => [`${path}.${key}`, child]);
  return entries.flatMap(([childPath, child]) => child === undefined ? [childPath] : ownUndefinedPaths(child, childPath, nested));
}

const hasOwn = (value: unknown, key: string) => Object.prototype.hasOwnProperty.call(value, key);

describe('BrewWizard — brouillon déclaré JSON (Recipe de build())', () => {
  it('ne déclare aucune propriété propre undefined pour une Recipe sans version, parent ni optionnels, sentinelles comprises', () => {
    const seed = savedRecipe();
    for (const key of BASE_ONLY_OPTIONALS) expect(hasOwn(seed, key), `${key} absent de la Recipe de départ`).toBe(false);
    const before = structuredClone(seed);
    const declared = declaredRecipe(seed, () => {
      const boil = document.getElementById('wz-boil') as HTMLInputElement;
      fireEvent.change(boil, { target: { value: '' } });
      fireEvent.blur(boil);
    });

    expect(ownUndefinedPaths(declared), 'Un champ optionnel non renseigné reste absent, à toute profondeur.').toEqual([]);
    for (const key of BASE_ONLY_OPTIONALS) expect(hasOwn(declared, key), `${key} reste absent du brouillon déclaré`).toBe(false);
    // The wizard keeps its raw missing-number sentinel: no JSON round trip happens in the builder.
    expect(Number.isNaN(declared.boilMin)).toBe(true);
    const wire = wireDraftOf(declared);
    expect(wire.boilMin).toBeNull();
    const verdict = ticketJsonGuard(wire);
    expect(verdict).not.toMatch(JSON_REFUSAL);
    expect(verdict).toMatch(STRUCTURE_AFTER_JSON);
    // Same canonical reference as the JSON representation of this draft (saved and local copies are JSON).
    expect(canonicalReferenceOf(declared)).toBe(canonicalReferenceOf(JSON.parse(JSON.stringify(declared)) as Recipe));
    expect(seed).toStrictEqual(before);
  }, 60000);

  it('omet une version ou un parent propres undefined sans muter la Recipe source', () => {
    const seed = { ...savedRecipe(), version: undefined, parentRecipeId: undefined, favorite: undefined, archivedAt: undefined } as Recipe;
    const before = structuredClone(seed);
    const declared = declaredRecipe(seed);

    expect(ownUndefinedPaths(declared)).toEqual([]);
    for (const key of BASE_ONLY_OPTIONALS) expect(hasOwn(declared, key), `${key} undefined devient absent, sans valeur inventée`).toBe(false);
    expect(ticketJsonGuard(wireDraftOf(declared))).toMatch(STRUCTURE_AFTER_JSON);
    expect(seed).toStrictEqual(before);
    for (const key of BASE_ONLY_OPTIONALS) expect(hasOwn(seed, key), `${key} reste une propriété de la source`).toBe(true);
  }, 60000);

  it('garde exactement version 0, une version définie, les valeurs 0, false, null, chaîne vide et l’ordre des listes', () => {
    const base = savedRecipe();
    const hops = [
      { name: 'Zeta amérisant', alpha: 0, weightG: 12, stage: 'boil', timeMin: 60 },
      { name: 'Alpha à cru', alpha: 11, weightG: 30, stage: 'dryHop', aromaTiming: 'postFermentation', aromaContactHours: 0 },
    ] as Recipe['hops'];
    const zeroes = { ...base, version: 0, parentRecipeId: '', favorite: false, archivedAt: null, colorEbc: 0, notesCreation: '', hops,
      installation: { ...base.installation!, fermenterHeadspacePct: 0, spargeExceptionAccepted: false } } as unknown as Recipe;
    const before = structuredClone(zeroes);
    const declared = declaredRecipe(zeroes);

    expect(ownUndefinedPaths(declared)).toEqual([]);
    expect(declared).toMatchObject({ version: 0, parentRecipeId: '', favorite: false, archivedAt: null, colorEbc: 0, notesCreation: '' });
    expect(declared.hops).toStrictEqual(hops);
    expect(declared.installation).toMatchObject({ fermenterHeadspacePct: 0, spargeExceptionAccepted: false });
    expect(ticketJsonGuard(wireDraftOf(declared))).toMatch(STRUCTURE_AFTER_JSON);
    expect(zeroes).toStrictEqual(before);

    const versioned = { ...base, version: 7, parentRecipeId: 'recipe-parent-fixture' } as Recipe;
    const declaredVersion = declaredRecipe(versioned);
    expect(ownUndefinedPaths(declaredVersion)).toEqual([]);
    expect(declaredVersion).toMatchObject({ version: 7, parentRecipeId: 'recipe-parent-fixture' });
    expect(ticketJsonGuard(wireDraftOf(declaredVersion))).toMatch(STRUCTURE_AFTER_JSON);
  }, 60000);

  it('laisse les valeurs étrangères visibles, refusées par le premier lecteur strict : Date, élément undefined, trou, fonction, instance, infini', () => {
    const base = savedRecipe();
    const withForeign = (values: Record<string, unknown>) =>
      ({ ...base, installation: { ...base.installation!, ...values } }) as unknown as Recipe;

    // Date and undefined item pass the canonical projection; the strict ticket JSON guard is their first refusal.
    // No function shares this draft: the canonical reference would refuse it first and hide these assertions.
    const date = new Date('2026-10-06T08:00:00.000Z');
    const undefinedItem = ['avant', undefined, 'après'];
    const hole = ['avant', 'milieu', 'après'];
    delete hole[1];
    const declared = declaredRecipe(withForeign({ fixtureDate: date, fixtureUndefinedItem: undefinedItem, fixtureHole: hole }));

    // Nothing foreign is converted, filtered or filled by the producer: same references, same length, same hole.
    const installation = declared.installation as unknown as Record<string, unknown>;
    expect(installation.fixtureDate).toBe(date);
    expect(installation.fixtureUndefinedItem).toBe(undefinedItem);
    expect(installation.fixtureHole).toBe(hole);
    const wireInstallation = (wireDraftOf(declared) as unknown as { installation: Record<string, unknown> }).installation;
    expect(wireInstallation.fixtureDate).toBeInstanceOf(Date);
    expect(ticketJsonGuard({ installation: { fixtureDate: wireInstallation.fixtureDate } }))
      .toMatch(/^ticket Wizard\.wire\.draft\.installation\.fixtureDate doit être un objet JSON simple/);
    expect(ticketJsonGuard({ installation: { fixtureUndefinedItem: wireInstallation.fixtureUndefinedItem } }))
      .toMatch(/^ticket Wizard\.wire\.draft\.installation\.fixtureUndefinedItem\[1\] n’est pas un snapshot JSON sérialisable/);
    expect(ticketJsonGuard(wireDraftOf(declared))).toMatch(JSON_REFUSAL);
    // Documented guard limit: its forEach does not visit holes. The producer keeps the hole as a hole, nothing more.
    const wireHole = wireInstallation.fixtureHole as unknown[];
    expect(wireHole).toHaveLength(3);
    expect(1 in wireHole).toBe(false);

    // Function, class instance and Infinity never reach the ticket guard: the canonical projection of the hop step
    // refuses them first (reference serialization for a function, plain-object and finite-number checks otherwise).
    class FixtureForeign { readonly label = 'instance étrangère'; }
    const callback = () => 'fonction étrangère';
    const earlyRefusals: Array<[string, unknown, RegExp]> = [
      ['fonction', callback, /^Contenu de référence non sérialisable\.$/],
      ['instance', new FixtureForeign(), /^Objet non sérialisable dans le brouillon V5\.5 \(recipe\.installation\.fixtureValue\)\.$/],
      ['infini', Number.POSITIVE_INFINITY, /^Nombre infini interdit dans le brouillon V5\.5 \(recipe\.installation\.fixtureValue\); /],
    ];
    for (const [label, value, refusal] of earlyRefusals) {
      const declaredValue = declaredRecipe(withForeign({ fixtureValue: value }));
      expect((declaredValue.installation as unknown as Record<string, unknown>).fixtureValue, `${label} gardé par référence`).toBe(value);
      expect(() => wireDraftOf(declaredValue), `${label} refusé par la projection canonique`).toThrow(refusal);
    }
  }, 90000);
});

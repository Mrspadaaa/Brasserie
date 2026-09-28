import { describe, expect, it } from 'vitest';
import { completeFromStockReferences } from '../../src/domain/localStockFacts';
import { completeFromLocalReferences } from '../../src/domain/localIngredientFacts';
import { yeastReferences } from '../../src/domain/yeastReferences';
import { yeastRecipeCandidates, yeastSpecForCandidate } from '../../src/domain/yeastRecipeDesign';
import { extractYeastCandidateSheet } from '../../src/services/recipeDraft';
import type { Fermentable, HopIngredient, StockItem, YeastSpec } from '../../src/types';

const row = (ref: string, category: string, patch: Partial<StockItem>): StockItem => ({
  id: `doc-${ref}`, ref, name: 'Même nom', category, unit: category === 'Malt' ? 'kg' : 'g',
  currentStock: 10, minStock: 0, reorder: false, technicalSource: `Fiche ${ref}`, ...patch,
});
const reference = (id: string, name: string, manufacturer: string, code: string, aliases: string[]) => {
  const yeast = structuredClone(yeastReferences([]).find(item => item.id === 'lalbrew-diamond')!);
  yeast.id = id; yeast.name = name; yeast.catalogue!.manufacturer = manufacturer;
  yeast.catalogue!.productCode = code; yeast.catalogue!.aliases = aliases; yeast.catalogue!.facts = [];
  return yeast;
};

describe('Faits repris depuis une référence de stock', () => {
  it.each([completeFromStockReferences, (f: Fermentable[], h: HopIngredient[], y: YeastSpec, s: StockItem[]) => completeFromLocalReferences(f, h, y, s, [])])('utilise le lot choisi et laisse un nom ambigu sans déduction', complete => {
    const stock = [
      row('M-A', 'Malt', { colorEbc: 4, potentialPpg: 36 }),
      row('M-B', 'Malt', { colorEbc: 12, potentialPpg: 38 }),
      row('H-A', 'Houblon', { alphaPct: 5 }),
      row('H-B', 'Houblon', { alphaPct: 12 }),
      row('Y-A', 'Levure', { yeastAttenuationPct: 72 }),
      row('Y-B', 'Levure', { yeastAttenuationPct: 80 }),
    ];
    const grain: Fermentable = { name: 'Même nom', stockItemRef: 'M-B', kind: 'grain', use: 'empatage', weightKg: 2 };
    const hop: HopIngredient = { name: 'Même nom', stockItemRef: 'H-B', stage: 'boil', weightG: 20, alpha: 0, timeMin: 30 };
    const yeast: YeastSpec = { name: 'Même nom', stockItemRef: 'Y-B' };
    const selected = complete([grain], [hop], yeast, stock);
    expect(selected.fermentables[0]).toMatchObject({ colorEbc: 12, potentialPpg: 38, stockItemRef: 'M-B' });
    expect(selected.hops[0]).toMatchObject({ alpha: 12, stockItemRef: 'H-B' });
    expect(selected.yeast).toMatchObject({ attenuationPct: 80, stockItemRef: 'Y-B' });
    const ambiguous = complete([{ ...grain, stockItemRef: undefined }], [{ ...hop, stockItemRef: undefined }], { name: 'Même nom' }, stock);
    expect(ambiguous.fermentables[0].colorEbc).toBeUndefined();
    expect(ambiguous.hops[0].alpha).toBe(0);
    expect(ambiguous.yeast.attenuationPct).toBeUndefined();

    const unique = complete([{ ...grain, stockItemRef: undefined }], [{ ...hop, stockItemRef: undefined }], { name: 'Même nom' },
      [stock[0], stock[2], stock[4]]);
    expect(unique.fermentables[0].colorEbc).toBe(4);
    expect(unique.hops[0].alpha).toBe(5);
    expect(unique.yeast.attenuationPct).toBeUndefined();
  });

  it('ajoute les faits documentaires d’un alias unique sans absorber l’article, la quantité ni l’unité', () => {
    const documented = reference('fixture-unique', 'Culture documentée', 'Labo Nord Brewing', 'AB-12', ['Alias précis']);
    const unrelated = reference('fixture-unrelated', 'Autre culture', 'Labo Sud', 'CD-34', ['Autre alias']);
    const stock = [
      row('Y-A', 'Levure', { name: 'Alias précis', yeastLab: 'Labo Nord', yeastStrain: 'AB-12', yeastAttenuationPct: 78 }),
      row('Y-B', 'Levure', { name: 'Alias précis', yeastLab: 'Labo Nord', yeastStrain: 'AB12', yeastAttenuationPct: 81 }),
    ];
    const yeast: YeastSpec = { name: 'Alias précis', lab: 'Labo Nord', strain: 'AB 12', form: 'sèche', qty: 2, unit: 'g', stockItemRef: 'Y-B' };
    const result = completeFromLocalReferences([], [], yeast, stock, [documented, unrelated]);
    const permuted = completeFromLocalReferences([], [], yeast, [...stock].reverse(), [unrelated, documented]);
    expect(result.yeast).toMatchObject({ hopIndexId: 'fixture-unique', stockItemRef: 'Y-B', qty: 2, unit: 'g', lab: 'Labo Nord' });
    expect(permuted.yeast).toMatchObject({ hopIndexId: 'fixture-unique', stockItemRef: 'Y-B', qty: 2, unit: 'g', lab: 'Labo Nord' });
    expect(permuted.yeast.attenuationPct).toBe(result.yeast.attenuationPct);
    // The lot’s own observation remains authoritative when it differs from the generic catalogue.
    expect(result.yeast.attenuationPct).toBe(81);
    expect(yeast.hopIndexId).toBeUndefined();
  });

  it('keeps shared name/code and a conflicting maker unresolved under reference and stock permutations', () => {
    const alpha = reference('fixture-alpha', 'Culture Alpha', 'Labo Alpha', 'AB-12', ['Nom partagé']);
    const beta = reference('fixture-beta', 'Culture Bêta', 'Labo Bêta', 'AB12', ['Nom partagé']);
    const stock = [
      row('Y-A', 'Levure', { name: 'Nom partagé', technicalSource: 'Étiquette Y-A' }),
      row('Y-B', 'Levure', { name: 'Nom partagé', technicalSource: 'Étiquette Y-B' })
    ];
    const yeast: YeastSpec = { name: 'Nom partagé', strain: 'AB 12', stockItemRef: 'Y-B', qty: 2, unit: 'g' };
    const forward = completeFromLocalReferences([], [], yeast, stock, [alpha, beta]).yeast;
    const reversed = completeFromLocalReferences([], [], yeast, stock, [beta, alpha]).yeast;
    const bothReversed = completeFromLocalReferences([], [], yeast, [...stock].reverse(), [beta, alpha]).yeast;
    expect(forward).toMatchObject({ stockItemRef: 'Y-B', qty: 2, unit: 'g', technicalSource: 'Étiquette Y-B' });
    expect(forward.hopIndexId).toBeUndefined(); expect(reversed.hopIndexId).toBeUndefined();
    expect(reversed).toMatchObject({ stockItemRef: 'Y-B', qty: 2, unit: 'g', technicalSource: 'Étiquette Y-B' });
    expect(bothReversed).toMatchObject({ stockItemRef: 'Y-B', qty: 2, unit: 'g', technicalSource: 'Étiquette Y-B' });
    expect(bothReversed.hopIndexId).toBeUndefined();

    const conflict = completeFromLocalReferences([], [], { ...yeast, lab: 'Labo Gamma' }, stock, [alpha, beta]).yeast;
    expect(conflict.hopIndexId).toBeUndefined();
    expect(conflict.stockItemRef).toBe('Y-B'); expect(conflict.technicalSource).toBe('Étiquette Y-B');
  });

  it('ne complète pas une levure catalogue depuis un lot homonyme sans référence, mais reprend le lot explicitement choisi', () => {
    const m20 = yeastRecipeCandidates('weissbier', 'balanced', yeastReferences(), 20, { includeOtherStyles: true })
      .find(candidate => candidate.yeastId === 'yeast-mangrove-jacks-132040951')!;
    const lot = row('M20-LOT-1', 'Levure', {
      name: m20.label, technicalSource: 'LOT_SOURCE_SENTINEL', yeastNotes: 'LOT_NOTE_SENTINEL',
      yeastLab: 'Labo du lot homonyme', yeastStrain: 'LOT-S42', yeastForm: 'liquide',
      yeastAttenuationPct: 99, yeastTempMinC: 2, yeastTempMaxC: 8,
      yeastTechnicalFacts: [{ key: 'temperature', reported: '2–8 °C', range: { min: 2, max: 8 }, unit: '°C',
        qualifier: 'range', origin: 'personal', source: 'LOT_FACT_SENTINEL', context: 'beer' }],
    });
    const catalogChoice = yeastSpecForCandidate(m20);
    expect(catalogChoice).toMatchObject({ name: m20.label, hopIndexId: m20.yeastId, form: 'sèche' });

    const catalogueOnly = completeFromLocalReferences([], [], catalogChoice, [], []).yeast;
    const catalogCompleted = completeFromLocalReferences([], [], catalogChoice, [lot], []).yeast;
    expect(catalogCompleted).toEqual(catalogueOnly);
    const stockOnlyCatalog = completeFromStockReferences([], [], catalogChoice, [lot]).yeast;
    expect(stockOnlyCatalog).toEqual(catalogChoice);

    const restored = completeFromLocalReferences([], [], structuredClone(catalogChoice), [lot], []).yeast;
    expect(restored).toEqual(catalogueOnly);
    const restoredAgain = completeFromLocalReferences([], [], structuredClone(restored), [lot], []).yeast;
    expect(restoredAgain).toEqual(restored);
    expect(restoredAgain.notes).not.toBe('LOT_NOTE_SENTINEL');
    expect(JSON.stringify(restoredAgain)).not.toContain('LOT_FACT_SENTINEL');

    const selectedLot = completeFromLocalReferences([], [], {
      name: m20.label, stockItemRef: lot.ref, lab: 'Labo du lot homonyme', strain: 'LOT-S42', form: 'liquide', qty: 4, unit: 'g'
    }, [lot], []).yeast;
    expect(selectedLot).toMatchObject({ stockItemRef: lot.ref, lab: 'Labo du lot homonyme', strain: 'LOT-S42',
      form: 'liquide', qty: 4, unit: 'g', attenuationPct: 99, fermTempMinC: 2, fermTempMaxC: 8,
      technicalSource: 'LOT_SOURCE_SENTINEL', notes: 'LOT_NOTE_SENTINEL' });
    expect(selectedLot.hopIndexId).toBeUndefined();
    expect(JSON.stringify(selectedLot)).toContain('LOT_FACT_SENTINEL');
  });

  it('ne promeut pas une saisie libre locale vers un catalogue sur un nom ou alias partagé', () => {
    const label = 'Culture libre reconnue seulement par son nom';
    const catalogue = reference('fixture-free-alias', label, 'Labo du catalogue', 'AB-12', [label]);
    const localDocumentary = { version: 1 as const, documentary: { declaredAttenuationPct: 78, technicalSource: 'LOCAL_DOC_SOURCE' } };
    const free = { name: label, attenuationPct: 73, attenuationBasis: 'recipe' as const, localDocumentary } as unknown as YeastSpec;
    const legacyNameOnly = completeFromLocalReferences([], [], { name: label }, [], [catalogue]).yeast;
    expect(legacyNameOnly.hopIndexId).toBe(catalogue.id);
    const result = completeFromLocalReferences([], [], free, [], [catalogue]).yeast;
    expect(result).toEqual(free);
    expect(result.hopIndexId).toBeUndefined();
    expect((result as YeastSpec & { localDocumentary?: unknown }).localDocumentary).toEqual(localDocumentary);
  });

  it('n’exporte jamais une documentation locale vers le livre catalogue, même avec un ID connu', () => {
    const localDocumentary = { version: 1 as const, documentary: { declaredAttenuationPct: 78, technicalSource: 'LOCAL_SCOPE_SOURCE' } };
    expect(extractYeastCandidateSheet({ name: 'Culture locale', hopIndexId: 'catalogue-id-known', localDocumentary })).toBeUndefined();
    expect(extractYeastCandidateSheet({ name: 'Lot local', hopIndexId: 'catalogue-id-known', stockItemRef: 'LOT-1', localDocumentary })).toBeUndefined();
  });
});

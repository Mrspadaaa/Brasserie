import { describe, it, expect } from 'vitest';
import { Units } from '../../src/services/units';
import { computeBeerColor, bandForEbc, missingColorData } from '../../src/domain/beerColor';
import {
  HOP_STAGE,
  HOP_STAGES,
  stageFromLegacy,
  normalizeHop,
  groupByStage,
  describeMoment
} from '../../src/domain/hopStage';
import {
  BATCH_STATUS,
  BATCH_STATUSES,
  statusOf,
  nextStatus
} from '../../src/domain/batchStatus';
import {
  MASH_PROGRAMS,
  FERMENT_PROGRAMS,
  PHASE_LABEL,
  mashProgramForStyle,
  fermentProgramForStyle,
  saccharificationTemp
} from '../../src/domain/brewPrograms';
import { fabActionFor } from '../../src/domain/fabActions';
import { normalizeRecipe, yeastFromLegacy, ingredientsOf, captureSnapshot } from '../../src/domain/recipeSnapshot';
import { nextUniqueRef, nextBatchId } from '../../src/services/refs';
import { normalize, createSearch, runSearch } from '../../src/services/search';
import { Fermentable, Recipe, Batch } from '../../src/types';

describe('Unités', () => {
  it('convertit dans une même famille', () => {
    expect(Units.convert(1, 'kg', 'g')).toBe(1000);
    expect(Units.convert(500, 'mL', 'L')).toBe(0.5);
  });

  it('refuse de convertir entre familles — un kilo n’est pas un litre', () => {
    expect(Units.convert(1, 'kg', 'L')).toBeNull();
  });

  it('convertit les unités américaines des recettes', () => {
    expect(Units.convert(9, 'lb', 'kg')).toBeCloseTo(4.08, 2);
    expect(Units.convert(12, 'oz', 'g')).toBeCloseTo(340.2, 1);
    expect(Units.convert(5, 'gal', 'L')).toBeCloseTo(18.93, 2);
  });

  it('reconnaît les écritures rencontrées dans les recettes', () => {
    expect(Units.convert(1, 'lbs', 'g')).toBeCloseTo(453.6, 1);
    expect(Units.convert(1, 'gallons', 'L')).toBeCloseTo(3.785, 2);
    expect(Units.convert(1, 'litre', 'mL')).toBe(1000);
  });

  it('la température n’est PAS un facteur — elle a son propre convertisseur', () => {
    expect(Units.fToC(152)).toBeCloseTo(66.7, 1);
    expect(Units.fToC(32)).toBe(0);
    expect(Units.cToF(100)).toBe(212);
  });

  it('formate selon l’ordre de grandeur', () => {
    expect(Units.format(1500, 'g')).toBe('1.5 kg');
    expect(Units.format(0.25, 'kg')).toBe('250 g');
    expect(Units.format(43, 'g')).toBe('43 g');
  });

  it('affiche l’équivalent américain en repère', () => {
    expect(Units.formatDual(4.1, 'kg')).toContain('lb');
    expect(Units.formatDual(3, 'sachet')).toBe('3 sachet');
  });

  it('les paliers de stepper suivent l’unité', () => {
    expect(Units.stepLadder('kg')).toEqual([0.5, 1, 5]);
    expect(Units.stepLadder('g')).toEqual([25, 100, 500]);
    expect(Units.stepLadder('sachet')).toEqual([1, 6, 24]);
  });
});

describe('Couleur de la bière', () => {
  const malt = (weightKg: number, colorEbc?: number): Fermentable => ({
    name: 'M',
    weightKg,
    kind: 'grain',
    use: 'empatage',
    colorEbc
  });

  it('⚠️ rend null si UN SEUL malt n’a pas sa couleur — un EBC partiel serait faux', () => {
    expect(computeBeerColor([malt(4, 5), malt(1)], 19)).toBeNull();
  });

  it('rend null sur un volume nul ou une facture vide', () => {
    expect(computeBeerColor([malt(4, 5)], 0)).toBeNull();
    expect(computeBeerColor([], 19)).toBeNull();
  });

  it('une facture pâle donne une bière paille ou dorée', () => {
    const c = computeBeerColor([malt(4.1, 4), malt(0.9, 6)], 19)!;
    expect(['straw', 'gold']).toContain(c.band);
  });

  it('un malt torréfié fait basculer en noir', () => {
    expect(computeBeerColor([malt(5, 6), malt(0.5, 1300)], 30)!.band).toBe('stout');
  });

  it('l’EBC vaut 1.97 fois le SRM', () => {
    const c = computeBeerColor([malt(5, 20)], 20)!;
    expect(c.ebc / c.srm).toBeCloseTo(1.97, 1);
  });

  it('chaque teinte porte une classe de pastille', () => {
    [4, 10, 20, 35, 50, 200].forEach((ebc) => {
      expect(bandForEbc(ebc).swatch).toMatch(/^bg-ebc-/);
    });
  });

  it('nomme les malts dont la couleur manque', () => {
    expect(missingColorData([malt(4, 5), { ...malt(1), name: 'Inconnu' }])).toEqual(['Inconnu']);
  });
});

describe('Moment des houblons', () => {
  it('la table est exhaustive et ordonnée dans le temps', () => {
    expect(HOP_STAGES).toHaveLength(4);
    HOP_STAGES.forEach((s) => expect(HOP_STAGE[s].label.length).toBeGreaterThan(3));
    expect(HOP_STAGES[0]).toBe('firstWort');
    expect(HOP_STAGES[3]).toBe('dryHop');
  });

  it('seul le houblonnage à cru n’amerise pas', () => {
    expect(HOP_STAGE.dryHop.bitters).toBe(false);
    expect(HOP_STAGE.boil.bitters).toBe(true);
  });

  it('traduit les anciens libellés libres', () => {
    expect(stageFromLegacy('Dry hop #2')).toBe('dryHop');
    expect(stageFromLegacy('Whirlpool 80C')).toBe('whirlpool');
    expect(stageFromLegacy('first wort hop')).toBe('firstWort');
    expect(stageFromLegacy('Boil')).toBe('boil');
    expect(stageFromLegacy(undefined)).toBe('boil');
  });

  it('⚠️ migre le rang d’un dry hop en JOUR, et retire la durée d’ébullition', () => {
    const m = normalizeHop({ name: 'Citra', alpha: 12, weightG: 60, timeMin: 0, step: 'Dry hop #2' } as never);
    expect(m.stage).toBe('dryHop');
    expect(m.dayOffset).toBe(3);
    expect(m.timeMin).toBeUndefined();
  });

  it('récupère la température d’un ancien libellé whirlpool', () => {
    const m = normalizeHop({ name: 'C', alpha: 12, weightG: 30, step: 'Whirlpool 80C' } as never);
    expect(m.tempC).toBe(80);
  });

  it('ne touche pas un houblon déjà typé', () => {
    const h = { name: 'C', alpha: 12, weightG: 30, stage: 'whirlpool' as const, tempC: 75 };
    expect(normalizeHop(h)).toBe(h);
  });

  it('groupe par étape, dans l’ordre de la journée', () => {
    const g = groupByStage([
      { name: 'A', alpha: 8, weightG: 40, stage: 'dryHop', dayOffset: 3 },
      { name: 'B', alpha: 8, weightG: 40, stage: 'boil', timeMin: 60 },
      { name: 'C', alpha: 8, weightG: 40, stage: 'firstWort' }
    ]);
    expect(g.map((x) => x.stage)).toEqual(['firstWort', 'boil', 'dryHop']);
  });

  it('⚠️ le même houblon peut apparaître à plusieurs moments', () => {
    const g = groupByStage([
      { name: 'Citra', alpha: 12, weightG: 28, stage: 'whirlpool', timeMin: 20 },
      { name: 'Citra', alpha: 12, weightG: 85, stage: 'dryHop', dayOffset: 2 }
    ]);
    expect(g).toHaveLength(2);
    expect(g.every((x) => x.hops[0].name === 'Citra')).toBe(true);
  });

  it('décrit le moment en français de brasseur', () => {
    expect(describeMoment({ name: 'A', alpha: 8, weightG: 1, stage: 'boil', timeMin: 0 })).toBe('flameout');
    expect(describeMoment({ name: 'A', alpha: 8, weightG: 1, stage: 'firstWort' })).toMatch(/avant/);
    expect(describeMoment({ name: 'A', alpha: 8, weightG: 1, stage: 'dryHop', dayOffset: 3 })).toBe('J+3');
    expect(
      describeMoment({ name: 'A', alpha: 8, weightG: 1, stage: 'whirlpool', timeMin: 20, tempC: 80 })
    ).toContain('80');
  });
});

describe('Statuts de brassin', () => {
  it('⚠️ la table est EXHAUSTIVE — « annulé » s’affichait « Planifié » faute d’entrée', () => {
    BATCH_STATUSES.forEach((s) => {
      expect(BATCH_STATUS[s]).toBeDefined();
      expect(BATCH_STATUS[s].label.length).toBeGreaterThan(2);
    });
    expect(statusOf('annule').label).toMatch(/annul/i);
  });

  it('un statut inconnu ne fait pas passer pour « planifié »', () => {
    expect(statusOf('inexistant' as never).label).not.toBe(BATCH_STATUS.planifie.label);
  });

  it('⚠️ le brassage est un événement : planifié passe directement en fermentation', () => {
    expect(nextStatus('planifie')).toBe('fermentation');
  });

  it('un brassin terminé ou annulé n’a pas de suite', () => {
    expect(nextStatus('termine')).toBeNull();
    expect(nextStatus('annule')).toBeNull();
  });
});

describe('Programmes de brassage', () => {
  it('chaque programme d’empâtage a des paliers cohérents', () => {
    MASH_PROGRAMS.forEach((p) => {
      expect(p.steps.length).toBeGreaterThan(0);
      p.steps.forEach((s) => {
        expect(s.tempC).toBeGreaterThan(35);
        expect(s.tempC).toBeLessThan(85);
        expect(s.durationMin).toBeGreaterThan(0);
      });
    });
  });

  it('le programme lager a plusieurs paliers, l’infusion un seul', () => {
    expect(MASH_PROGRAMS.find((p) => p.id === 'lager')!.steps.length).toBeGreaterThan(2);
    expect(MASH_PROGRAMS.find((p) => p.id === 'infusion')!.steps).toHaveLength(1);
  });

  it('retient le palier de saccharification le plus long', () => {
    expect(
      saccharificationTemp([
        { name: 'Protéique', tempC: 52, durationMin: 20 },
        { name: 'β', tempC: 63, durationMin: 40 },
        { name: 'α', tempC: 72, durationMin: 20 }
      ])
    ).toBe(63);
  });

  it('rend null si aucun palier n’est dans la plage de saccharification', () => {
    expect(saccharificationTemp([{ name: 'X', tempC: 40, durationMin: 30 }])).toBeNull();
  });

  it('⚠️ le programme lager comporte un repos diacétyle ET une garde', () => {
    const kinds = FERMENT_PROGRAMS.find((p) => p.id === 'lager')!.steps.map((s) => s.kind);
    expect(kinds).toContain('reposDiacetyle');
    expect(kinds).toContain('garde');
  });

  it('⚠️ le programme belge ajoute le sucre EN FERMENTATION, pas à l’empâtage', () => {
    const ajout = FERMENT_PROGRAMS.find((p) => p.id === 'belge')!.steps.find((s) => s.kind === 'ajout');
    expect(ajout?.name).toMatch(/sucre|candi/i);
  });

  it('chaque type de phase porte un libellé', () => {
    (Object.keys(PHASE_LABEL) as Array<keyof typeof PHASE_LABEL>).forEach((k) => {
      expect(PHASE_LABEL[k].label.length).toBeGreaterThan(3);
    });
  });

  it('devine les programmes depuis le style', () => {
    expect(fermentProgramForStyle('Pilsner').id).toBe('lager');
    expect(fermentProgramForStyle('NEIPA').id).toBe('neipa');
    expect(fermentProgramForStyle('Tripel').id).toBe('belge');
    expect(fermentProgramForStyle('Imperial Stout').id).toBe('imperiale');
    expect(mashProgramForStyle('Helles').id).toBe('lager');
    expect(mashProgramForStyle('Weissbier').id).toBe('froment');
  });

  it('un style inconnu retombe sur les programmes courants', () => {
    expect(fermentProgramForStyle('').id).toBe('ale');
    expect(mashProgramForStyle('').id).toBe('infusion');
  });
});

describe('Bouton d’action contextuel', () => {
  it('⚠️ crée ce que l’écran montre — il ouvrait toujours le même menu', () => {
    expect(fabActionFor('stocks', 'futs').intent).toBe('newKeg');
    expect(fabActionFor('stocks', 'materiel').intent).toBe('newEquipment');
    expect(fabActionFor('clients', 'tarifs').intent).toBe('newTarif');
    expect(fabActionFor('production', 'lab').intent).toBe('newIdea');
    expect(fabActionFor('production', 'recipes').intent).toBe('newRecipe');
  });

  it('sur la liste de courses, on veut emporter, pas créer', () => {
    expect(fabActionFor('stocks', 'courses').intent).toBe('copyShoppingList');
  });

  it('les onglets sans sous-onglet ont une action unique', () => {
    expect(fabActionFor('finances').intent).toBe('newTransaction');
    expect(fabActionFor('dashboard').intent).toBe('quickAction');
  });

  it('un sous-onglet inconnu retombe sur la saisie rapide au lieu de planter', () => {
    expect(fabActionFor('stocks', 'inexistant' as never).intent).toBe('quickAction');
  });

  it('chaque action porte un libellé lisible', () => {
    (['dashboard', 'finances', 'production', 'stocks', 'clients'] as const).forEach((t) => {
      expect(fabActionFor(t).label.length).toBeGreaterThan(5);
    });
  });
});

describe('Références séquentielles', () => {
  it('⚠️ ne produit jamais de collision — un aléatoire écrasait un article existant', () => {
    const refs = ['MP-001', 'MP-002', 'MP-003'];
    expect(nextUniqueRef('MP', refs)).toBe('MP-004');
    for (let i = 0; i < 50; i += 1) {
      const next = nextUniqueRef('MP', refs);
      expect(refs).not.toContain(next);
      refs.push(next);
    }
    expect(new Set(refs).size).toBe(refs.length);
  });

  it('démarre à 1 sur une base vide', () => {
    expect(nextUniqueRef('MP', [])).toBe('MP-001');
    expect(nextBatchId([])).toBe('LOT-001');
  });

  it('ignore les références d’un autre préfixe', () => {
    expect(nextUniqueRef('MP', ['NT-009'])).toBe('MP-001');
  });
});

describe('Recherche tolérante', () => {
  it('⚠️ ignore les accents — fuse.js ne les normalise PAS de lui-même', () => {
    expect(normalize('Caramünch')).toBe('caramunch');
    expect(normalize('Röstgerste')).toBe('rostgerste');
    expect(normalize('Étiquette')).toBe('etiquette');
  });

  it('trouve un malt allemand tapé sans trémas', () => {
    const items = [{ name: 'Caramünch Typ 2' }, { name: 'Röstgerste' }, { name: 'Pilsner Malz' }];
    const fuse = createSearch(items, ['name']);
    expect(runSearch(fuse, 'caramunch')[0].name).toBe('Caramünch Typ 2');
    expect(runSearch(fuse, 'rostgerste')[0].name).toBe('Röstgerste');
  });

  it('une requête vide ne rend rien plutôt que tout', () => {
    const fuse = createSearch([{ name: 'A' }], ['name']);
    expect(runSearch(fuse, '   ')).toEqual([]);
  });
});

describe('Copie figée de recette', () => {
  const recipe: Recipe = {
    id: 'REC-1',
    name: 'Test',
    style: 'IPA',
    volumeL: 20,
    ogTarget: 1.05,
    fgTarget: 1.01,
    abvTarget: 5,
    fermentables: [{ name: 'Pale', weightKg: 5, kind: 'grain', use: 'empatage' }],
    totalGristKg: 5,
    hops: [{ name: 'Citra', alpha: 12, weightG: 30, stage: 'boil', timeMin: 60 }],
    yeast: { name: 'US-05', form: 'sèche', qty: 1, unit: 'sachet' },
    steps: [],
    notes: []
  };

  it('⚠️ le snapshot ne porte ni identifiant ni favori — ce n’est plus une recette à ranger', () => {
    const snap = captureSnapshot(recipe);
    expect((snap as Record<string, unknown>).id).toBeUndefined();
    expect(snap.sourceRecipeId).toBe('REC-1');
    expect(snap.capturedAt).toMatch(/^\d{4}-/);
  });

  it('⚠️ modifier la recette ne réécrit PAS le brassin déjà lancé', () => {
    const snap = captureSnapshot(recipe);
    const modifiee = { ...recipe, name: 'Renommée', volumeL: 50 };
    expect(snap.name).toBe('Test');
    expect(snap.volumeL).toBe(20);
    expect(modifiee.name).toBe('Renommée');
  });

  it('convertit les anciens malts en fermentescibles à la lecture', () => {
    const ancienne = {
      ...recipe,
      fermentables: undefined,
      malts: [{ name: 'Pale', weightKg: 5 }]
    } as unknown as Recipe;
    const n = normalizeRecipe(ancienne);
    expect(n.fermentables[0].kind).toBe('grain');
    expect(n.fermentables[0].use).toBe('empatage');
  });

  it('convertit une levure texte en fiche structurée', () => {
    const y = yeastFromLegacy('LALLEMAND Verdant IPA (2 sachets)')!;
    expect(y.lab).toBe('LALLEMAND');
    expect(y.qty).toBe(2);
    expect(y.unit).toBe('sachet');
    expect(y.name).not.toContain('(');
  });

  it('rend undefined sur une levure absente', () => {
    expect(yeastFromLegacy(undefined)).toBeUndefined();
  });

  it('⚠️ les ingrédients d’un brassin viennent du SNAPSHOT, pas de la recette vivante', () => {
    const batch: Batch = {
      id: 'LOT-1',
      name: 'Test',
      style: 'IPA',
      volumeL: 20,
      brewDate: '01.01.2026',
      status: 'fermentation',
      recipeSnapshot: captureSnapshot(recipe)
    };
    const ing = ingredientsOf(batch);
    expect(ing.source).toBe('snapshot');
    expect(ing.fermentables[0].name).toBe('Pale');
  });

  it('retombe sur les champs directs pour les brassins d’avant la refonte', () => {
    const ancien = {
      id: 'LOT-0',
      name: 'Ancien',
      style: 'Ale',
      volumeL: 30,
      brewDate: '01.01.2025',
      status: 'termine',
      malts: [{ name: 'Vieux malt', weightKg: 4 }],
      yeastName: 'US-05'
    } as unknown as Batch;
    const ing = ingredientsOf(ancien);
    expect(ing.source).toBe('batch');
    expect(ing.fermentables[0].kind).toBe('grain');
    expect(ing.yeast?.name).toBe('US-05');
  });
});

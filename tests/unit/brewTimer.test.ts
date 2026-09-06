import { describe, it, expect } from 'vitest';
import { buildTimeline, remainingMs, formatCountdown } from '../../src/services/brewTimer';
import { Recipe } from '../../src/types';

/**
 * Le déroulé minuté du jour de brassage.
 *
 * Ce qui compte ici n'est pas l'esthétique de la liste : c'est que l'ébullition
 * soit DÉCOUPÉE aux ajouts de houblon. Sans ce découpage, il n'y a qu'un seul
 * minuteur de 75 minutes et aucune alarme au moment d'un ajout — le brasseur
 * rate son houblon d'arôme.
 */

const recipe = (over: Partial<Recipe> = {}): Recipe =>
  ({
    id: 'R-1',
    name: 'NEIPA',
    style: 'NEIPA',
    volumeL: 30,
    boilMin: 75,
    fermentables: [
      { name: 'US 2-row', weightKg: 6, kind: 'grain', use: 'empatage' },
      { name: 'Lactose', weightKg: 0.5, kind: 'lactose', use: 'ebullition' }
    ],
    hops: [
      { name: 'Magnum', weightG: 30, alpha: 12, stage: 'boil', timeMin: 60 },
      { name: 'Amarillo', weightG: 40, alpha: 8.6, stage: 'boil', timeMin: 15 },
      { name: 'Citra', weightG: 40, alpha: 12, stage: 'boil', timeMin: 15 },
      { name: 'Citra', weightG: 85, alpha: 12, stage: 'dryHop', dayOffset: 3 }
    ],
    yeast: { name: 'SafAle US-05', form: 'sèche', qty: 2, unit: 'sachet', pitchTempC: 18 },
    mash: {
      steps: [
        { name: 'Repos protéique', tempC: 52, durationMin: 20 },
        { name: 'Saccharification', tempC: 67, durationMin: 60 }
      ],
      ratioLPerKg: 3,
      spargeType: 'batch',
      spargeTempC: 76
    },
    ...over
  }) as Recipe;

describe('Découpage de l’ébullition', () => {
  const steps = buildTimeline(recipe());
  const ids = steps.map((s) => s.id);

  it('pose une étape par ajout de houblon', () => {
    // Magnum à 60 min ➔ 15 min écoulées ; Amarillo et Citra à 15 min ➔ 60 min.
    expect(ids).toContain('hop-15');
    expect(ids).toContain('hop-60');
  });

  it('regroupe deux houblons ajoutés au même instant', () => {
    const mark = steps.find((s) => s.id === 'hop-60');
    expect(mark?.hopNames).toHaveLength(2);
    expect(mark?.detail).toContain('Amarillo');
    expect(mark?.detail).toContain('Citra');
  });

  it('nomme l’ajout en minutes AVANT la fin, comme le brasseur le lit', () => {
    expect(steps.find((s) => s.id === 'hop-15')?.label).toBe('Houblon à 60 min');
    expect(steps.find((s) => s.id === 'hop-60')?.label).toBe('Houblon à 15 min');
  });

  it('les segments d’ébullition totalisent la durée annoncée', () => {
    const total = steps
      .filter((s) => s.id.startsWith('boil'))
      .reduce((sum, s) => sum + s.durationMin, 0);
    expect(total).toBe(75);
  });

  it('ne fait pas apparaître le houblonnage à cru dans la journée', () => {
    const sameDay = steps.map((s) => s.detail ?? '').join(' ');
    expect(sameDay).not.toMatch(/cru|dry ?hop/i);
  });
});

describe('Étapes de préparation', () => {
  const steps = buildTimeline(recipe());

  it('ne pèse que le grain au concassage : le lactose ne se moud pas', () => {
    const mouture = steps.find((s) => s.id === 'concassage');
    expect(mouture?.detail).toContain('6');
    expect(mouture?.detail).not.toContain('Lactose');
  });

  it('déduit l’eau d’empâtage du ratio et du grain', () => {
    expect(steps.find((s) => s.id === 'mash-0')?.detail).toContain('18');
  });

  it('reprend chaque palier avec sa température', () => {
    expect(steps.find((s) => s.id === 'mash-0')?.tempC).toBe(52);
    expect(steps.find((s) => s.id === 'mash-1')?.tempC).toBe(67);
  });

  it('annonce le rinçage selon sa méthode', () => {
    expect(steps.find((s) => s.id === 'sparge')?.label).toBe('Rinçage par bacs');
  });

  it('finit par le refroidissement puis l’ensemencement', () => {
    expect(steps.at(-2)?.id).toBe('refroidissement');
    expect(steps.at(-1)?.id).toBe('ensemencement');
    expect(steps.at(-1)?.detail).toContain('SafAle US-05');
    expect(steps.at(-1)?.detail).toContain('2 sachets');
  });
});

describe('Cas dégradés', () => {
  it('sans houblon d’ébullition, une seule étape couvre toute la durée', () => {
    const steps = buildTimeline(recipe({ hops: [] }));
    const boil = steps.filter((s) => s.id.startsWith('boil'));
    expect(boil).toHaveLength(1);
    expect(boil[0].durationMin).toBe(75);
  });

  it('sans programme d’empâtage, un palier par défaut plutôt que rien', () => {
    const steps = buildTimeline(recipe({ mash: undefined }));
    expect(steps.find((s) => s.id === 'mash-0')?.tempC).toBe(67);
  });

  it('un whirlpool porte son temps de contact', () => {
    const steps = buildTimeline(
      recipe({
        hops: [{ name: 'Citra', weightG: 100, alpha: 12, stage: 'whirlpool', timeMin: 20, tempC: 78 }]
      })
    );
    const wp = steps.find((s) => s.id === 'whirlpool');
    expect(wp?.durationMin).toBe(20);
    expect(wp?.tempC).toBe(78);
  });

  it('sans plan d’eau, l’étape existe quand même', () => {
    const steps = buildTimeline(recipe());
    expect(steps[0].id).toBe('eau');
    expect(steps[0].detail).toBeTruthy();
  });
});

describe('Décompte', () => {
  it('ne décompte pas une étape non démarrée', () => {
    expect(remainingMs({ id: 'x', label: 'x', durationMin: 60 }, Date.now())).toBeNull();
  });

  it('ne décompte pas une étape instantanée', () => {
    expect(
      remainingMs({ id: 'x', label: 'x', durationMin: 0, startedAt: Date.now() }, Date.now())
    ).toBeNull();
  });

  it('compte à partir de l’heure murale, pas d’un compteur interne', () => {
    const startedAt = 1_000_000;
    const ms = remainingMs({ id: 'x', label: 'x', durationMin: 10, startedAt }, startedAt + 60_000);
    expect(ms).toBe(9 * 60_000);
  });

  it('passe en négatif au-delà de la durée', () => {
    const startedAt = 0;
    expect(remainingMs({ id: 'x', label: 'x', durationMin: 1, startedAt }, 90_000)).toBe(-30_000);
  });

  it('affiche minutes et secondes, et signale le dépassement', () => {
    expect(formatCountdown(724_000)).toBe('12:04');
    expect(formatCountdown(0)).toBe('00:00');
    expect(formatCountdown(-38_000)).toBe('−00:38');
  });
});

describe('Ce que le déroulé oubliait de dire', () => {
  /*
   * ⚠️ Le concassage ne liste que le grain — c'est juste, le lactose ne se moud
   * pas. Mais rien ensuite ne disait de le VERSER : la journée entière de la
   * Milk Stout se déroulait sans mentionner une fois ses 500 g de lactose.
   */
  it('⚠️ rappelle les sucres et le lactose ajoutés à l’ébullition', () => {
    const sucres = buildTimeline(recipe()).find((s) => s.id === 'sucres');
    expect(sucres).toBeDefined();
    expect(sucres!.detail).toMatch(/Lactose/);
  });

  it('ne fabrique pas d’étape de sucres quand il n’y en a pas', () => {
    const sansSucre = recipe({
      fermentables: [{ name: 'Pilsner', weightKg: 5, kind: 'grain', use: 'empatage' }]
    } as Partial<Recipe>);
    expect(buildTimeline(sansSucre).find((s) => s.id === 'sucres')).toBeUndefined();
  });

  /*
   * ⚠️ Tout le calcul d'eau vise le volume avant ébullition, et le déroulé
   * passait de l'empâtage à l'ébullition sans jamais demander de le relever.
   * C'est pourtant le dernier moment où un rinçage court se rattrape.
   */
  it('⚠️ demande le contrôle de volume avant l’ébullition', () => {
    const avecPlan = recipe({
      fermentables: [{ name: 'Pilsner', weightKg: 5, kind: 'grain', use: 'empatage' }],
      waterPlan: {
        sourceId: 'w1',
        diRatioPct: 50,
        mashWaterL: 21,
        spargeWaterL: 12,
        mash: {},
        sparge: {}
      }
    } as Partial<Recipe>);
    const ctrl = buildTimeline(avecPlan).find((s) => s.id === 'preboil');
    expect(ctrl).toBeDefined();
    // 21 − 5 × 0.96 + 12 = 28.2 L
    expect(ctrl!.detail).toMatch(/28.2 L/);
    expect(ctrl!.detail).toMatch(/densité/i);
  });
});

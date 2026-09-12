import { beforeAll, describe, expect, it } from 'vitest';
import { hopSourceError, assertHopDocument, type HopVariety } from '../../functions/src/hopIndexSchema';
import { hopStyleFamily, hopStyleGuidance, suggestedHopVarieties, documentedHopNamesForStyle } from '../../src/domain/hopIndex/styleSelection';
import { createHopSolverSearch, initialHopSolverIntent } from '../../src/domain/hopIndex/solver';
import { guidePredictionKnowledge, guideSolverPolicy, loadGuideVarieties } from '../../src/ui/hopIndex/guideData';
import usage from '../../src/data/hopStyleUsageBootstrap.json';
import references from '../../src/data/hopStyleVarietyBootstrap.json';

let varieties: HopVariety[];
const fold = (s: string) => s.normalize('NFKD').replace(/\p{M}/gu, '').toLowerCase().replace(/[^a-z0-9]/g, '');
const ref = (name: string): HopVariety => ({ id: name, name, aliases: [], form: 'unknown', descriptions: [], analysis: [] });
beforeAll(async () => { varieties = await loadGuideVarieties(); });

describe('Usages IPA par provenance, sans favoris ni taxonomie de goût', () => {
  it.each([
    ['American IPA', 'american-ipa'], ['Double IPA · BJCP 2021', 'american-ipa'], ['West Coast IPA', 'american-ipa'],
    ['DIPA', 'american-ipa'], ['IPA', 'american-ipa'], ['WCIPA', 'american-ipa'], ['Hazy Double IPA', 'hazy-ipa'], ['NEIPA', 'hazy-ipa'], ['NE DIPA', 'hazy-ipa'],
    ['New England India Pale Ale', 'hazy-ipa'], ['English IPA', 'english-ipa'], ['British India Pale Ale', 'english-ipa'],
    ['IPA anglaise', 'english-ipa'], ['Pilsner', undefined], ['Tropical Pale Ale', undefined], ['Kveik', undefined],
    ['Belgian IPA', undefined], ['Black IPA', undefined],
  ])('reconnaît la famille de %s', (name, expected) => expect(hopStyleFamily(name)).toBe(expected));

  it('couvre toute référence chargée sans en exclure une pour absence de documentation', () => {
    expect(new Set(varieties.map(v => v.id)).size).toBe(varieties.length);
    const counts: Record<string, { documented: number; unknown: number; total: number }> = {};
    for (const style of ['American IPA', 'Hazy IPA', 'English IPA']) {
      const results = varieties.map(v => hopStyleGuidance(v, style));
      expect(results.every(r => ['documented', 'unknown'].includes(r.status) && r.reason.length > 0)).toBe(true);
      const documented = results.filter(r => r.status === 'documented').length;
      expect(documented).toBeGreaterThan(style === 'English IPA' ? 6 : 20);
      expect(suggestedHopVarieties(varieties, style)).toHaveLength(documented);
      counts[style] = { documented, unknown: results.length - documented, total: results.length };
    }
    console.info('Couverture catalogue réel : ' + JSON.stringify(counts));
  });

  it('inclut les fabricants, pays et variétés au-delà des trois exemples du signalement', () => {
    for (const name of ['Lotus', 'Azacca', 'Cashmere', 'Strata', 'Simcoe', 'El Dorado', 'Erebus', 'Styrian Wolf', 'Ariana', 'Callista', 'Moutere', 'Nectaron', 'Eclipse'])
      expect(hopStyleGuidance(varieties.find(v => v.name === name)!, 'Double IPA').status, name).toBe('documented');
    for (const name of ['Azacca', 'Citra', 'Mosaic', 'Cashmere', 'Sabro', 'BRU-1', 'Calypso', 'Lemondrop', 'Sultana', 'Strata', 'Nectaron', 'Galaxy', 'Lotus', 'Altus'])
      expect(hopStyleGuidance(varieties.find(v => v.name === name)!, 'Hazy IPA').status, name).toBe('documented');
    const authors = new Set(usage.varieties.flatMap(v => v.uses.map(u => u.source.author)));
    expect([...authors]).toEqual(expect.arrayContaining(['Hopsteiner', 'Hop Products Australia', 'NZ Hops', 'Indie Hops', 'Crosby Hops', 'BarthHaas', 'Charles Faram']));
  });

  it('garde un usage IPA générique distinct d’une preuve Hazy ou anglaise', () => {
    const alora = varieties.find(v => v.name === 'Alora')!;
    expect(hopStyleGuidance(alora, 'Double IPA')).toMatchObject({ status: 'documented', specificity: 'ipa-family', styleLabel: 'IPA · sous-style non précisé' });
    for (const style of ['Hazy IPA', 'English IPA'])
      expect(hopStyleGuidance(alora, style)).toMatchObject({ status: 'unknown', specificity: 'unknown', roles: [] });
    expect(hopStyleGuidance(alora, 'Hazy IPA').reason).toContain('ne signifie pas incompatible');
    expect(hopStyleGuidance(alora, 'Hazy IPA').sources.length).toBeGreaterThan(0);
    expect(hopStyleGuidance(ref('Fuggle'), 'English IPA')).toMatchObject({ status: 'documented', specificity: 'style' });
    expect(hopStyleGuidance(ref('Fuggle'), 'Hazy IPA').status).toBe('unknown');
    expect(hopStyleGuidance(ref('Willamette'), 'English IPA').status).toBe('unknown');
  });

  it('résout les identités et alias exacts, sans confondre noms voisins ou assemblages', () => {
    expect(hopStyleGuidance(ref('HBC 394'), 'Hazy IPA').status).toBe('documented');
    expect(hopStyleGuidance(ref('Denali'), 'Hazy IPA').status).toBe('documented');
    expect(hopStyleGuidance(ref('X06297'), 'Hazy IPA').status).toBe('documented');
    expect(hopStyleGuidance(ref('X07270'), 'Hazy IPA').status).toBe('documented');
    expect(hopStyleGuidance(ref('Lotus'), 'Hazy IPA').sources.map(s => s.reference)).toEqual(expect.arrayContaining([
      'https://hopsteiner.us/blog/when-juicy-meets-fruity/',
      'https://hopsteiner.us/blog/we-are-excited-to-announce-the-official-release-of-lotus',
    ]));
    expect(hopStyleGuidance(ref('Huell Melon'), 'IPA').status).toBe('documented');
    expect(hopStyleGuidance(ref('Columbus/ Tomahawk'), 'IPA').status).toBe('documented');
    expect(hopStyleGuidance(ref('Zeus'), 'IPA').status).toBe('unknown');
    expect(hopStyleGuidance(ref('Citra-like'), 'IPA').status).toBe('unknown');
    const ambiguous = { ...ref('Mon mélange'), aliases: ['Citra', 'Fuggle'] };
    expect(hopStyleGuidance(ambiguous, 'English IPA').status).toBe('unknown');
    expect(hopStyleGuidance(ambiguous, 'Hazy IPA').reason).toContain('Plusieurs identités');
    expect(hopStyleGuidance(ref('Trident'), 'Hazy IPA').reason).toContain('assemblage');
  });

  it('ne déduit pas un style des seuls descripteurs aromatiques', () => {
    const unknown = { ...ref('Variété personnelle'), descriptions: [{ text: 'Citron, fruit de la passion, mangue, pin, petits fruits.', context: 'rawHop' as const, source: usage.varieties[0].uses[0].source as any }] };
    expect(hopStyleGuidance(unknown, 'American IPA')).toMatchObject({ status: 'unknown', sources: [] });
    expect(suggestedHopVarieties([unknown], 'IPA')).toEqual([]);
  });

  it('trie toutes les références attestées sans limite, respecte archives et ordre indépendant', () => {
    const names = documentedHopNamesForStyle('IPA');
    const all = names.map((name, i) => ({ ...ref(name), id: 'entry-' + i }));
    const suggested = suggestedHopVarieties(all, 'IPA');
    expect(suggested).toHaveLength(all.length);
    expect(suggested.map(v => v.name)).toEqual(names);
    expect(suggestedHopVarieties([...all].reverse(), 'IPA')).toEqual(suggested);
    expect(suggestedHopVarieties(all.map(v => ({ ...v, archived: true })), 'IPA')).toEqual([]);
  });

  it('conserve les labels originaux, sources vérifiables et aucune intensité de style', () => {
    const aliases = new Map<string, string>();
    for (const row of usage.varieties) {
      if ('identitySources' in row) for (const source of row.identitySources ?? []) expect(hopSourceError(source)).toBeNull();
      for (const name of [row.name, ...row.aliases]) {
        expect([undefined, row.name]).toContain(aliases.get(fold(name)));
        aliases.set(fold(name), row.name);
      }
      expect(row.uses.length).toBeGreaterThan(0);
      for (const use of row.uses) {
        expect(hopSourceError(use.source)).toBeNull();
        expect(new URL(use.source.reference).protocol).toBe('https:');
        expect(['manufacturer', 'observation']).toContain(use.source.kind);
        expect(use.styles.length).toBeGreaterThan(0);
        expect(use.families.length).toBeGreaterThan(0);
        expect(use.note.length).toBeGreaterThan(0);
        expect(Object.keys(use).sort()).toEqual(['families', 'note', 'roles', 'source', 'styles']);
        if (use.families.includes('hazy-ipa')) expect(use.styles.join(' ')).toMatch(/NEIPA|Hazy/i);
        if (use.families.includes('english-ipa')) expect(use.styles.join(' ')).toMatch(/English|British/i);
      }
    }
  });

  it('charge les nouvelles références sans alpha de lot ni radar converti en prédiction', () => {
    for (const v of references.hopVarieties) {
      expect(() => assertHopDocument('hopVarieties', v)).not.toThrow();
      expect(v.analysis).toEqual([]);
      expect(v.form).toBe('unknown');
      expect(v.descriptions.every(d => hopSourceError(d.source) === null)).toBe(true);
      expect(varieties.some(loaded => loaded.id === v.id)).toBe(true);
      expect(['American IPA', 'Hazy IPA', 'English IPA'].some(style => hopStyleGuidance(v as HopVariety, style).status === 'documented')).toBe(true);
    }
  });

  it.each(['quick', 'exhaustive'] as const)('compare une variété inconnue pour ce style en mode %s', mode => {
    const policy = guideSolverPolicy([])!;
    const intent = { ...initialHopSolverIntent(undefined, policy), styleId: policy.styles.find(s => s.name === 'Double IPA · BJCP 2021')!.id, keepYeast: false };
    const crystal = varieties.find(v => v.name === 'Crystal')!;
    expect(hopStyleGuidance(crystal, 'Double IPA').status).toBe('unknown');
    const knowledge = guidePredictionKnowledge([]).filter(k => k.kind !== 'yeast' || k.id === 'fermentis-us05');
    const engine = createHopSolverSearch({ data: { varieties, lots: [], knowledge }, policy, intent, mode, varietyIds: [crystal.id], target: { floral: { min: 30, max: 70 } } });
    expect(engine.total).toBeGreaterThan(0);
    const candidates = engine.evaluateBatch(0, Math.min(20, engine.total));
    expect(candidates.length).toBeGreaterThan(0);
    expect(candidates.every(c => c.triplets.every(t => t.varietyId === crystal.id))).toBe(true);
    expect(candidates.every(c => c.styleSuggested === false)).toBe(true);
    expect(candidates.every(c => !c.checks.some(check => check.status === 'conflict' && /style/i.test(check.message)))).toBe(true);
  });
});

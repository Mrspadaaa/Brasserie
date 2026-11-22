import { createHash } from 'node:crypto';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
/**
 * Voie f4-malts (D302) : l'IA des fiches trouve un malt mais n'en rend ni l'EBC ni le PPG, parce qu'un malteur publie une PLAGE de couleur et
 * un EXTRAIT. Réponses de la forme réelle (reponses-reelles-d302.json), Gemini jamais appelé (recherche rejouée), aucune donnée réelle.
 */
vi.mock('../../../../src/services/storage', async () => (await import('./aide')).storageSimule);
vi.mock('../../../../src/services/firestoreRepo', async () => (await import('./aide')).firestoreSimule);
vi.mock('../../../../src/services/financeService', async () => (await import('./aide')).financeSimule);
vi.mock('../../../../src/services/financeDocuments', async () => (await import('./aide')).documentsSimules);
const ia = vi.hoisted(() => ({ run: vi.fn(async () => { throw new Error('AiClient.run ne doit jamais être appelé'); }) }));
vi.mock('../../../../src/services/aiClient', async orig => { const m = await orig<any>(); return { ...m, AiClient: { ...m.AiClient, run: ia.run } }; });

import { lu, remettre } from './aide';
import { confirmer, demonter, ligne, monter, saisie, type Banc } from './montage';
import { deduireValeursMalt, sanitizeFacts, type IngredientFacts } from '../../../../src/domain/ingredientFacts';
import { DEDUIT_EBC, DEDUIT_PPG, valeursDeReponse } from '../../../../src/services/enrichissementCatalogues';
import { TASKS, ingredientLookupDefinition } from '../../../../functions/src/prompts';
import { encodeGeminiFunctionDeclarationForRest } from '../../../../functions/src/geminiRequestSchema';
import reelles from './reponses-reelles-d302.json';
import reellesF4b from './reponses-reelles-f4b.json';

const SOURCE = 'BESTMALZ — Fiche technique BEST Red X®';
/** Ce que le modèle rendra avec la consigne corrigée pour BEST Red X (D302 : 28 à 32 EBC, extrait 79,0 %). */
const BEST_RED_X = { found: true, name: 'BEST Red X', source: SOURCE, sourceUrl: 'https://bestmalz.de', colorEbcMin: 28, colorEbcMax: 32, extractPct: 79 } as IngredientFacts;

let banc: Banc;
beforeEach(() => { remettre(); ia.run.mockClear(); });
afterEach(() => demonter());

describe('TEMOIN AVANT : la procédure reçoit la forme réelle (plage, extrait) et remplit la fiche', () => {
  it('BEST Red X : EBC 30 et PPG 34,7, chacun marqué « déduit » avec sa plage ou son extrait', async () => {
    banc = monter({ recherche: async () => ({ ok: true, model: 'rejeu-f4', data: BEST_RED_X }) });
    const d = saisie([ligne('l1', 'BEST Red X', 'kg', 25, { stockCategory: 'Malt', sourceReference: 'BRX-25' })]);
    await confirmer(d);
    const malt = lu(`MP-${d.submissionId}-0`)!;
    expect(banc.recherche).toHaveBeenCalledTimes(1);
    expect(malt.colorEbc).toBe(30);
    expect(malt.potentialPpg).toBe(34.7);
    expect(malt.fiche).toMatchObject({ par: 'en-ligne' });
    expect(malt.fiche.remplis.colorEbc).toMatchObject({ par: 'en-ligne', niveau: 'repris', source: SOURCE, deduit: 'EBC déduit : milieu de la plage publiée 28 à 32 EBC', valeur: 30 });
    expect(malt.fiche.remplis.potentialPpg).toMatchObject({ par: 'en-ligne', niveau: 'repris', source: SOURCE, deduit: 'PPG déduit : extrait publié 79 % × 0,46 × (1 − 4,5 % d’humidité)', valeur: 34.7 });
    expect(ia.run).not.toHaveBeenCalled();
  });

  it('un point publié gagne : la fiche garde 60 EBC et 33 PPG (comme avant), même si une plage et un extrait suivent', async () => {
    banc = monter({ recherche: async () => ({ ok: true, model: 'rejeu-f4', data: { ...BEST_RED_X, colorEbc: 60, potentialPpg: 33 } }) });
    const d = saisie([ligne('l1', 'BEST Red X', 'kg', 25, { stockCategory: 'Malt', sourceReference: 'BRX-25' })]);
    await confirmer(d);
    const malt = lu(`MP-${d.submissionId}-0`)!;
    expect(malt.colorEbc).toBe(60); expect(malt.potentialPpg).toBe(33);
    expect(malt.fiche.remplis.colorEbc.deduit).toBe(DEDUIT_EBC);
    expect(malt.fiche.remplis.potentialPpg.deduit).toBe(DEDUIT_PPG);
  });

  it('une plage seule (Chevallier 5 à 10 EBC, aucun extrait) : EBC 7,5 déduit, aucun potentiel inventé', async () => {
    banc = monter({ recherche: async () => ({ ok: true, model: 'rejeu-f4', data: { found: true, name: 'Crisp Chevallier Heritage Malt', source: 'Crisp Malt — Fiche technique', colorEbcMin: 5, colorEbcMax: 10 } as IngredientFacts }) });
    const d = saisie([ligne('l1', 'Crisp Chevallier Heritage Malt', 'kg', 25, { stockCategory: 'Malt', sourceReference: 'CCH-25' })]);
    await confirmer(d);
    const malt = lu(`MP-${d.submissionId}-0`)!;
    expect(malt.colorEbc).toBe(7.5);
    expect(malt.potentialPpg).toBeUndefined();
    expect(malt.fiche.remplis.potentialPpg).toBeUndefined();
    expect(malt.fiche.remplis.colorEbc.deduit).toMatch(/plage publiée 5 à 10 EBC/);
  });
});

describe('deduireValeursMalt : une fonction pure, partagée', () => {
  it('BEST Red X : 28 à 32 EBC → 30 ; 79 % → 34,7 ; la règle dit la plage et l’extrait', () => {
    expect(deduireValeursMalt(BEST_RED_X)).toEqual({ colorEbc: 30, potentialPpg: 34.7,
      deduit: { colorEbc: 'EBC déduit : milieu de la plage publiée 28 à 32 EBC', potentialPpg: 'PPG déduit : extrait publié 79 % × 0,46 × (1 − 4,5 % d’humidité)' } });
  });
  it('une décimale : 5,5 à 11 → 8,3 ; 80 % → 35,1 ; 81,5 % → 35,8', () => {
    expect(deduireValeursMalt({ colorEbcMin: 5.5, colorEbcMax: 11 }).colorEbc).toBe(8.3);
    expect(deduireValeursMalt({ extractPct: 80 }).potentialPpg).toBe(35.1);
    expect(deduireValeursMalt({ extractPct: 81.5 }).potentialPpg).toBe(35.8);
  });
  it('un point publié gagne toujours, valeur par valeur', () => {
    const d = deduireValeursMalt({ colorEbc: 12, colorEbcMin: 28, colorEbcMax: 32, extractPct: 79 });
    expect(d.colorEbc).toBeUndefined(); expect(d.deduit.colorEbc).toBeUndefined();
    expect(d.potentialPpg).toBe(34.7);
    const e = deduireValeursMalt({ potentialPpg: 33, colorEbcMin: 28, colorEbcMax: 32, extractPct: 79 });
    expect(e.potentialPpg).toBeUndefined(); expect(e.colorEbc).toBe(30);
  });
  it('une plage incohérente ou hors bornes, un extrait absurde : rien (jamais 0)', () => {
    for (const f of [{ colorEbcMin: 32, colorEbcMax: 28 }, { colorEbcMin: -1, colorEbcMax: 5 }, { colorEbcMin: 4000, colorEbcMax: 6000 }, { colorEbcMin: 28 }, { colorEbcMax: 32 },
      { colorEbcMin: Number.NaN, colorEbcMax: 5 }, { extractPct: 0 }, { extractPct: 2 }, { extractPct: 130 }, { extractPct: -5 }, {}])
      expect(deduireValeursMalt(f), JSON.stringify(f)).toEqual({ deduit: {} });
  });
  it('une plage d’un seul point (30 à 30) donne 30', () => { expect(deduireValeursMalt({ colorEbcMin: 30, colorEbcMax: 30 }).colorEbc).toBe(30); });
});

describe('sanitizeFacts (donc « Compléter avec l’IA ») déduit et le dit dans la note', () => {
  it('BEST Red X : colorEbc 30, potentialPpg 34,7, la note garde la règle ; la note du modèle est conservée', () => {
    const f = sanitizeFacts({ ...BEST_RED_X, note: 'Fiche consultée.' });
    expect(f.colorEbc).toBe(30); expect(f.potentialPpg).toBe(34.7);
    expect(f.note).toBe('Fiche consultée. EBC déduit : milieu de la plage publiée 28 à 32 EBC ; PPG déduit : extrait publié 79 % × 0,46 × (1 − 4,5 % d’humidité).');
  });
  it('idempotent : un second passage ne double ni la valeur ni la note', () => {
    const une = sanitizeFacts(BEST_RED_X), deux = sanitizeFacts(une);
    expect(deux).toEqual(une);
  });
  it('rien de déduit, rien dans la note ; un point publié n’est pas annoté', () => {
    expect(sanitizeFacts({ found: true, name: 'X', source: 's', colorEbc: 60, potentialPpg: 33 }).note).toBeUndefined();
    const f = sanitizeFacts({ found: true, name: 'X', source: 's', colorEbcMin: 32, colorEbcMax: 28, extractPct: 500 });
    expect(f.colorEbc).toBeUndefined(); expect(f.potentialPpg).toBeUndefined(); expect(f.note).toBeUndefined();
    expect(f.colorEbcMin).toBeUndefined(); expect(f.extractPct).toBeUndefined();
  });
});

describe('valeursDeReponse : les réponses réelles du 02.11', () => {
  const reponse = (nom: string) => (reelles.calls.find(c => c.name === nom)!.data) as unknown as IngredientFacts;
  it('la forme AVANT la correction (chiffres dans `usage`) ne donne rien : aucun chiffre lu dans un texte', () => {
    expect(valeursDeReponse('malt', reponse('BEST Red X'))).toBeUndefined();
    expect(valeursDeReponse('malt', reponse('Crisp Chevallier Heritage Malt'))).toBeUndefined();
    expect(valeursDeReponse('malt', reponse('Candi Syrup D-180'))).toBeUndefined();
  });
  it('la forme attendue : BEST Red X rend 30 et 34,7, chacun avec sa règle, la source et l’URL', () => {
    const v = valeursDeReponse('malt', BEST_RED_X)!;
    expect(v.valeurs).toMatchObject({ colorEbc: 30, potentialPpg: 34.7 });
    expect(v.deduit.colorEbc).toBe('EBC déduit : milieu de la plage publiée 28 à 32 EBC');
    expect(v.deduit.potentialPpg).toBe('PPG déduit : extrait publié 79 % × 0,46 × (1 − 4,5 % d’humidité)');
    expect(v.source).toBe(SOURCE); expect(v.url).toBe('https://bestmalz.de');
  });
  it('un sucre sans chiffre publié : rien d’écrit', () => {
    expect(valeursDeReponse('malt', { found: true, name: 'Candi Syrup D-180', source: 'Candi Syrup, Inc.', sourceUrl: 'https://www.candisyrup.com' })).toBeUndefined();
  });
  it('le houblon n’en reçoit jamais', () => { expect(valeursDeReponse('houblon', BEST_RED_X)).toBeUndefined(); });
});

describe('D303 suite : les 5 vraies réponses après le déploiement de f4b-malts (02.11, aiTask 670a2c1d)', () => {
  const reponse = (nom: string) => (reellesF4b.calls.find(c => c.name === nom)!.data) as unknown as IngredientFacts;
  it.each([['BEST Red X', 30, 34.7], ['Château Cara Ruby', 50, 32.9], ['Crisp Chevallier Heritage Malt', 8.3, 33.7]])('%s : plage et extrait publiés, EBC %s et PPG %s déduits (humidité 4,5 % supposée), chacun avec sa règle', (nom, ebc, ppg) => {
    const v = valeursDeReponse('malt', reponse(nom))!;
    expect(v.valeurs).toMatchObject({ colorEbc: ebc, potentialPpg: ppg });
    expect(v.deduit.colorEbc).toMatch(/^EBC déduit : milieu de la plage publiée /);
    expect(v.deduit.potentialPpg).toMatch(/^PPG déduit : extrait publié .* × 0,46 × \(1 − 4,5 % d’humidité\)$/);
  });
  it('Candi Syrup D-180 : des points publiés (354,6 EBC, 32 PPG) gardés tels quels, la plage et l’extrait à null', () => {
    expect(valeursDeReponse('malt', reponse('Candi Syrup D-180'))!.valeurs).toMatchObject({ colorEbc: 354.6, potentialPpg: 32 });
  });
  it('aucune réponse de malt ne porte un champ de levure ni de houblon, et chacune a ses cinq nombres', () => {
    for (const c of reellesF4b.calls.filter(c => c.kind === 'malt')) {
      for (const k of ['tempMinC', 'tempMaxC', 'lab', 'attenuationPct', 'alphaPct', 'aroma']) expect(c.data, `${c.name} ${k}`).not.toHaveProperty(k);
      for (const k of ['colorEbc', 'colorEbcMin', 'colorEbcMax', 'extractPct', 'potentialPpg']) expect(c.data, `${c.name} ${k}`).toHaveProperty(k);
    }
  });
});

describe('D303 : null se lit comme absent', () => {
  const NULS = { colorEbc: null, colorEbcMin: null, colorEbcMax: null, extractPct: null, potentialPpg: null } as unknown as IngredientFacts;
  it('les cinq nombres à null (fiche muette) : rien de déduit, rien dans la note, aucune clé gardée', () => {
    const f = sanitizeFacts({ found: true, name: 'Sucre D-180', source: 'Candi Syrup, Inc.', ...NULS });
    for (const k of ['colorEbc', 'colorEbcMin', 'colorEbcMax', 'extractPct', 'potentialPpg']) expect(f, k).not.toHaveProperty(k);
    expect(f.note).toBeUndefined();
    expect(deduireValeursMalt(NULS)).toEqual({ deduit: {} });
  });
  it('colorEbc et potentialPpg à null avec une plage et un extrait : la déduction se fait comme sans le champ', () => {
    const brute = { ...BEST_RED_X, colorEbc: null, potentialPpg: null } as unknown as IngredientFacts;
    expect(deduireValeursMalt(brute)).toEqual(deduireValeursMalt(BEST_RED_X));
    const f = sanitizeFacts(brute);
    expect(f.colorEbc).toBe(30); expect(f.potentialPpg).toBe(34.7);
    const v = valeursDeReponse('malt', brute)!;
    expect(v.valeurs).toMatchObject({ colorEbc: 30, potentialPpg: 34.7 });
    expect(v.deduit.colorEbc).toBe('EBC déduit : milieu de la plage publiée 28 à 32 EBC');
  });
  it('une borne à null, l’autre publiée : aucune plage, aucune couleur (jamais 0)', () => {
    const f = { found: true, name: 'X', source: 's', colorEbcMin: 5, colorEbcMax: null } as unknown as IngredientFacts;
    expect(deduireValeursMalt(f).colorEbc).toBeUndefined();
    expect(sanitizeFacts(f).colorEbc).toBeUndefined();
  });
  it('un malt dont les cinq nombres sont null : la procédure n’écrit rien (valeursDeReponse)', () => {
    expect(valeursDeReponse('malt', { found: true, name: 'Candi Syrup D-180', source: 'Candi Syrup, Inc.', sourceUrl: 'https://www.candisyrup.com', ...NULS })).toBeUndefined();
  });
  it('un point publié et le reste à null : le point gagne, sans règle « déduit » de plage', () => {
    const v = valeursDeReponse('malt', { found: true, name: 'X', source: 's', colorEbc: 60, colorEbcMin: null, colorEbcMax: null, extractPct: null, potentialPpg: 33 } as unknown as IngredientFacts)!;
    expect(v.valeurs).toMatchObject({ colorEbc: 60, potentialPpg: 33 });
    expect(v.deduit.colorEbc).toBe(DEDUIT_EBC); expect(v.deduit.potentialPpg).toBe(DEDUIT_PPG);
  });
});

describe('la consigne et le schéma de lookupIngredient', () => {
  const malt = ingredientLookupDefinition('malt');
  const proprietes = (def: { schema: any }) => Object.keys(def.schema.properties);
  const CINQ = ['colorEbc', 'colorEbcMin', 'colorEbcMax', 'extractPct', 'potentialPpg'];
  it('malt : seulement les champs d’un malt ou d’un sucre, dans l’ordre, les cinq nombres juste après sourceUrl', () => {
    expect(proprietes(malt)).toEqual(['found', 'name', 'source', 'sourceUrl', ...CINQ, 'retrievedAt', 'note', 'grainType', 'diastaticPower', 'usage', 'substitutes']);
    expect(malt.schema.propertyOrdering).toEqual(proprietes(malt));
  });
  it('malt : aucun champ de levure ni de houblon (BEST Red X rendait tempMinC −5 et tempMaxC 60)', () => {
    const interdits = ['lab', 'strain', 'form', 'attenuationPct', 'tempMinC', 'tempMaxC', 'flocculation', 'alcoholTolerancePct', 'technicalFacts', 'fermentation',
      'alphaPct', 'betaPct', 'aroma'];
    for (const k of interdits) expect(malt.schema.properties, k).not.toHaveProperty(k);
    expect(malt.system).not.toMatch(/tempMinC|technicalFacts|attenuationPct|alphaPct|NOLO|LEVURE\./);
  });
  it('malt : les cinq nombres sont exigés, nullables, bornés et décrits ; found, name, source restent exigés', () => {
    expect(malt.schema.required).toEqual(['found', 'name', 'source', ...CINQ]);
    for (const k of CINQ) {
      expect(malt.schema.properties[k], k).toMatchObject({ type: 'NUMBER', nullable: true });
      expect(malt.schema.properties[k].description, k).toMatch(/null/);
      expect(malt.schema.properties[k].description.length, k).toBeLessThan(120);
    }
    expect(malt.schema.properties.colorEbcMin).toMatchObject({ minimum: 0, maximum: 5000 });
    expect(malt.schema.properties.colorEbcMax).toMatchObject({ minimum: 0, maximum: 5000 });
    expect(malt.schema.properties.extractPct).toMatchObject({ minimum: 0, maximum: 100 });
    expect(malt.schema.properties.potentialPpg).toMatchObject({ minimum: 1, maximum: 50 });
    expect(malt.schema.properties.usage.description).toMatch(/sans aucun nombre/);
  });
  it('malt : le schéma passe l’encodeur Gemini, chaque nombre nullable devient « nombre ou null » borné', () => {
    const encoded = encodeGeminiFunctionDeclarationForRest({ name: 'fiche_malt', description: 'fiche', parameters: malt.schema });
    const schema = encoded.parametersJsonSchema as any;
    expect(schema.required).toEqual(['found', 'name', 'source', ...CINQ]);
    expect(schema.properties.extractPct.anyOf.map((b: any) => b.type).sort()).toEqual(['null', 'number']);
    expect(schema.properties.extractPct.anyOf.find((b: any) => b.type === 'number')).toMatchObject({ minimum: 0, maximum: 100 });
  });
  it('malt : la plage va dans min et max, jamais une moyenne dans colorEbc ; l’extrait dans extractPct ; null quand non publié ; rien sur la brasserie ni la TVA', () => {
    expect(malt.system).toContain('colorEbcMin et colorEbcMax : les deux bornes de la plage de couleur publiée');
    expect(malt.system).toContain('Jamais la moyenne de la plage dans colorEbc');
    expect(malt.system).toContain('extractPct : l\'extrait (fine grind, dry basis) en %, tel que publié');
    expect(malt.system).toContain('Ce que la fiche ne publie pas vaut null');
    expect(malt.system).toContain('N\'écris aucun nombre de malt ou de sucre dans usage ni dans note');
    expect(malt.system).toMatch(/rien sur la brasserie, la TVA ni la monnaie/);
    expect(malt.system).not.toMatch(/doit rester ABSENT/);
  });
  it('la consigne de base et celle des houblons n’ont pas bougé : les champs neufs n’y sont pas', () => {
    expect(proprietes(TASKS.lookupIngredient)).not.toContain('colorEbcMin');
    expect(ingredientLookupDefinition('houblon')).toBe(TASKS.lookupIngredient);
    expect(TASKS.lookupIngredient.system).not.toContain('SORTIE MALT');
  });
  it('levure : consigne mot pour mot (empreinte du texte d’avant D302) et schéma sans champ de malt', () => {
    const levure = ingredientLookupDefinition('levure');
    expect(levure.system).not.toMatch(/colorEbcMin|extractPct|SORTIE MALT/);
    expect(proprietes(levure)).not.toEqual(expect.arrayContaining(['colorEbcMin']));
    expect(proprietes(levure)).toEqual(['found', 'name', 'source', 'sourceUrl', 'retrievedAt', 'note', 'lab', 'strain', 'form',
      'attenuationPct', 'tempMinC', 'tempMaxC', 'flocculation', 'alcoholTolerancePct', 'technicalFacts', 'fermentation']);
    expect(createHash('sha256').update(levure.system).digest('hex')).toBe('93b033c80c121a9a8127d851d15ee9a83a8845f86723af7ccd415ccbb624202a');
  });
});

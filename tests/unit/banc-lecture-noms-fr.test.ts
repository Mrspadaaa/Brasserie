import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { TASKS } from '../../functions/src/prompts';
import {
  BUDGET_CAP_CHF, LEXIQUE_FR, NAME_FR_NOTE, STRONG_MODEL, LITE_MODEL, VARIANTS, FAULT_PLAN, GROUP_OF, callSpec, buildReadBody, deriveVariants, estimateBench, fakeFrench, readingFromResponse, runBench,
  schemaWithNameFr, thirdCallDuplicates, withNamesFr, withCodesNormalized,
  type BenchCase, type DrawReads, type ReadMeta, type Reading, type Transport
} from '../../scripts/banc-lecture-facture';
import {
  aLireNomFr, checkNomsFrSimulation, comparerCsv8F, fusionnerSorties, jetonsGardes, judgeNomsFr, jugerNomFr, renderComparaison, renderNomsFr
} from '../../scripts/banc-lecture-facture-juger';

// ---------------------------------------------------------------------------------------------------------------------
// Données fabriquées : aucun nom d'achat réel. Les exemples sont ceux de la voie f5-noms-fr (VOIE.md).
// ---------------------------------------------------------------------------------------------------------------------
const img = { mimeType: 'image/jpeg', data: Buffer.from([255, 216, 255, 217]).toString('base64') };
const item = (name: string, amount: number, extra: Record<string, unknown> = {}) => ({ name, kind: 'stock', quantity: 1, unit: 'pièce', price: amount, amountTTC: amount, ...extra });
const header = { vendor: 'Fournisseur', currency: 'CHF', date: '09.09.2026', invoiceNumber: 'F-42', documentType: 'invoice', paymentEvidence: 'unknown' };
const whole = (items: unknown[], total: number, extra: Record<string, unknown> = {}) => ({ ...header, amountHT: total, tvaAmount: 0, amountTTC: total, tvaRate: null, items, ...extra });
const answer = (data: any, finishReason = 'STOP') =>
  ({ candidates: [{ finishReason, content: { parts: [{ text: JSON.stringify(data) }] } }], usageMetadata: { promptTokenCount: 2000, candidatesTokenCount: 800, thoughtsTokenCount: 0, totalTokenCount: 2800 } });
const meta = (lecture: 1 | 2 | 3, variant = 'Csv8F'): ReadMeta => ({ id: `${variant}${lecture}`, doc: 'tdoc', tirage: 1, variant, lecture, model: lecture === 3 ? STRONG_MODEL : LITE_MODEL });
const read = (lecture: 1 | 2 | 3, data: unknown, variant = 'Csv8F'): Reading => readingFromResponse(meta(lecture, variant), answer(data), 1000, 1000);
const truthCase = (id = 'tdoc'): BenchCase => ({ id, file: 'inexistant', mimeType: 'image/jpeg', expected: { vendor: 'fournisseur', date: '09.09.2026', currency: 'CHF', invoiceNumber: ['F-42'], amountTTC: 30,
  items: [{ name: 'a', amountTTC: 10 }, { name: 'b', amountTTC: 20 }] } });
const threeLines = () => [item('Gärtank 30 Liter rund mit Deckel', 10, { nameFr: 'Fermenteur 30 L rond avec couvercle' }), item('CARABELGE®, Kg', 20, { nameFr: 'CARABELGE®' })];

let work: string;
beforeEach(() => { work = mkdtempSync(path.join(tmpdir(), 'f5-test-')); });
afterEach(() => { rmSync(work, { recursive: true, force: true }); });

// ---------------------------------------------------------------------------------------------------------------------
describe('f5 — la variante Csv8F : le réglage, le schéma, la consigne', () => {
  it('Csv8F est connue du banc, de son groupe, et son plan de fautes existe', () => {
    expect(VARIANTS).toContain('Csv8F');
    expect(GROUP_OF.Csv8F).toBe('Csv8F');
    expect(FAULT_PLAN.map(fault => fault.id)).toEqual(expect.arrayContaining(['nom-fr-non-traduit', 'nom-fr-suffixe-unite', 'nom-fr-option', 'nom-fr-absent', 'unite-x-noms-fr', 'lite-divergent-noms-fr']));
  });
  it('les deux Flash-Lite sont réglées comme Csv8 (8 192 jetons) ; sa 3.8 garde le plafond de production et la consigne 3 ; les trois portent nameFr', () => {
    const csv8 = callSpec('Csv8', 1), one = callSpec('Csv8F', 1), two = callSpec('Csv8F', 2), three = callSpec('Csv8F', 3);
    expect(one).toMatchObject({ model: LITE_MODEL, maxOut: csv8.maxOut, thinking: csv8.thinking, nameFr: true });
    expect(one.prompt).toBe(csv8.prompt);
    expect(two.prompt).toBe(callSpec('Csv8', 2).prompt);
    expect(three).toMatchObject({ model: STRONG_MODEL, nameFr: true, maxOut: callSpec('A', 3).maxOut, prompt: callSpec('A', 3).prompt });
    expect(callSpec('Csv8', 1).nameFr).toBeUndefined();
  });
  it('le corps : nameFr au schéma des lignes (hors de `required`), sa phrase à la consigne système ; sans l’option, le corps est celui de la production', () => {
    const production = buildReadBody(img, callSpec('Csv8', 1).prompt) as any;
    const withFr = buildReadBody(img, callSpec('Csv8F', 1).prompt, 8192, 'LOW', { nameFr: true }) as any;
    const lineSchema = withFr.generationConfig.responseSchema.properties.items.items;
    expect(lineSchema.properties.nameFr).toMatchObject({ type: 'STRING' });
    expect(lineSchema.required).not.toContain('nameFr');
    expect(lineSchema.required).toEqual((TASKS.scanInvoice.schema as any).properties.items.items.required);
    expect(withFr.systemInstruction.parts[0].text).toBe(`${TASKS.scanInvoice.system}\n${NAME_FR_NOTE}`);
    expect(production.systemInstruction.parts[0].text).toBe(TASKS.scanInvoice.system);
    expect(production.generationConfig.responseSchema).toBe(TASKS.scanInvoice.schema);
    // la consigne propre (parts) et le reste de la configuration ne bougent pas
    expect(withFr.contents).toEqual(buildReadBody(img, callSpec('Csv8F', 1).prompt, 8192, 'LOW', {}).contents);
    expect({ ...withFr.generationConfig, responseSchema: null }).toEqual({ ...(buildReadBody(img, callSpec('Csv8F', 1).prompt, 8192, 'LOW') as any).generationConfig, responseSchema: null });
  });
  it('la production n’est jamais modifiée par le schéma du banc', () => {
    const before = JSON.stringify(TASKS.scanInvoice.schema);
    const clone = schemaWithNameFr();
    expect(JSON.stringify(TASKS.scanInvoice.schema)).toBe(before);
    expect((TASKS.scanInvoice.schema as any).properties.items.items.properties.nameFr).toBeUndefined();
    expect(clone.properties.items.items.properties.nameFr).toBeDefined();
  });
  it('la phrase de consigne dit le contrat : français, marque gardée, ni option, ni état, ni unité', () => {
    for (const mot of ['français', 'marque', 'option', 'unité', 'CARABELGE®', 'Styrian Goldings', 'Wyeast 3787 Belgian High Gravity']) expect(NAME_FR_NOTE).toContain(mot);
    expect(TASKS.scanInvoice.system).toContain('name recopie exactement la désignation imprimée');
  });
});

// ---------------------------------------------------------------------------------------------------------------------
describe('f5 — nameFr garde la lecture, pas la production', () => {
  it('la lecture Csv8F garde nameFr à côté (même rang que les lignes normalisées) ; la ligne normalisée n’en porte pas ; une autre variante n’en garde rien', () => {
    const reading = read(1, whole(threeLines(), 30));
    expect(reading.namesFr).toEqual(['Fermenteur 30 L rond avec couvercle', 'CARABELGE®']);
    expect(reading.normalized!.items.map((line: any) => line.nameFr)).toEqual([undefined, undefined]);
    expect(read(1, whole(threeLines(), 30), 'Csv8').namesFr).toBeUndefined();
    expect(withCodesNormalized(reading).namesFr).toEqual(reading.namesFr);
  });
  it('nameFr absent d’une ligne : « » (jamais inventé) ; nameFr non texte : « »', () => {
    const reading = read(1, whole([item('Un', 10, { nameFr: 12 }), item('Deux', 20)], 30));
    expect(reading.namesFr).toEqual(['', '']);
  });
  it('withNamesFr : la 3.8 d’abord, puis Flash-Lite ; par désignation si le rang diffère ; une désignation ne sert qu’une fois par lecture ; rien d’inventé', () => {
    const l1 = read(1, whole([item('A', 10, { nameFr: 'Lite A' }), item('B', 20, { nameFr: 'Lite B' })], 30));
    const l2 = read(2, whole([item('B', 20, { nameFr: 'Lite 2 B' }), item('A', 10, { nameFr: 'Lite 2 A' })], 30));
    const third = read(3, whole([item('A', 10, { nameFr: '3.8 A' }), item('C', 5)], 15));
    const result = { items: [{ name: 'A' }, { name: 'B' }, { name: 'A' }, { name: 'A' }, { name: 'Z' }] };
    const out = withNamesFr(result, [third, l1, l2]);
    // A : la 3.8 ; B : absente de la 3.8 → Flash-Lite 1 ; 2ᵉ A : la 3.8 l'a déjà donnée → Flash-Lite 1 ; 3ᵉ A : Flash-Lite 1 l'a déjà donnée → Flash-Lite 2 ; Z : nulle part
    expect(out.items.map((line: any) => line.nameFr)).toEqual(['3.8 A', 'Lite B', 'Lite A', 'Lite 2 A', undefined]);
    expect(result.items[0]).toEqual({ name: 'A' });
    expect(withNamesFr(result, [read(1, whole([item('A', 10)], 10), 'Csv8')])).toBe(result);
  });
  it('deriveVariants : Csv8F rejoint nameFr au résultat ; sans 3.8, des Flash-Lite ; avec la 3.8, d’elle', () => {
    const agree: DrawReads = { lite: { Csv8F: { r1: read(1, whole(threeLines(), 30)), r2: read(2, whole(threeLines(), 30)) } } };
    const out = deriveVariants(agree, new Set(['Csv8F']));
    expect(out.Csv8F!.final.used).toHaveLength(2);
    expect(out.Csv8F!.final.result.items.map((line: any) => line.nameFr)).toEqual(['Fermenteur 30 L rond avec couvercle', 'CARABELGE®']);
    const different = whole([item('Gärtank 30 Liter rund mit Deckel', 10, { nameFr: 'Fût' }), item('CARABELGE®, Kg', 25, { nameFr: 'CARABELGE®' })], 35);
    const third = read(3, whole([item('Gärtank 30 Liter rund mit Deckel', 10, { nameFr: 'Fermenteur (3.8)' }), item('CARABELGE®, Kg', 20, { nameFr: 'CARABELGE® (3.8)' })], 30));
    const disputed: DrawReads = { lite: { Csv8F: { r1: read(1, whole(threeLines(), 30)), r2: read(2, different), third } } };
    const second = deriveVariants(disputed, new Set(['Csv8F']));
    expect(second.Csv8F!.final.used).toHaveLength(3);
    expect(second.Csv8F!.final.result.items.map((line: any) => line.nameFr)).toEqual(['Fermenteur (3.8)', 'CARABELGE® (3.8)']);
    expect(second.Csv8F!.thirdFrom).toBe('neuf');
  });
  it('les autres variantes ne reçoivent pas nameFr', () => {
    const reads: DrawReads = { lite: { Csv8: { r1: read(1, whole(threeLines(), 30), 'Csv8'), r2: read(2, whole(threeLines(), 30), 'Csv8') } } };
    expect(deriveVariants(reads, new Set(['Csv8'])).Csv8!.final.result.items.map((line: any) => line.nameFr)).toEqual([undefined, undefined]);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
describe('f5 — la simulation : lexique, « traduction » du banc', () => {
  it('fakeFrench traduit les mots du lexique, garde marque et nom propre, retire le suffixe d’unité et les options', () => {
    expect(fakeFrench('Gärtank 30 Liter rund mit Deckel')).toBe('fermenteur 30 L rond avec couvercle');
    expect(fakeFrench('CARABELGE®, Kg')).toBe('CARABELGE®');
    expect(fakeFrench('Styrian Goldings 4.5%')).toBe('Styrian Goldings 4.5%');
    expect(fakeFrench('Wyeast 3787 Belgian High Gravity')).toBe('Wyeast 3787 Belgian High Gravity');
    expect(fakeFrench('SPECIAL W®, Gramm [+CHF 0.0001]')).toBe('SPECIAL W®');
    expect(fakeFrench('Schrotung')).toBe('Schrotung');
  });
  it('aucun mot du lexique n’est aussi un mot français courant du métier (malt, pilsner, tank, fine, extrait)', () => {
    for (const mot of ['malt', 'pilsner', 'tank', 'fine', 'extrait', 'houblon', 'levure']) expect(Object.keys(LEXIQUE_FR)).not.toContain(mot);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
describe('f5 — le juge des désignations en français', () => {
  const bon: Array<[string, string]> = [
    ['Gärtank 30 Liter rund mit Deckel', 'Fermenteur 30 L rond avec couvercle'],
    ['Premium Pilsner Malz', 'Malt Pilsner Premium'],
    ['Hopfensack fein', 'Sac à houblon fin'],
    ['CARABELGE®, Kg', 'CARABELGE®'],
    ['SPECIAL W®, Gramm', 'SPECIAL W®'],
    ['Styrian Goldings', 'Styrian Goldings'],
    ['Wyeast 3787 Belgian High Gravity', 'Wyeast 3787 Belgian High Gravity']
  ];
  for (const [name, nameFr] of bon) it(`juste : « ${name} » → « ${nameFr} »`, () => expect(jugerNomFr({ name, nameFr })).toEqual([]));

  const mauvais: Array<[string, Record<string, unknown>, string]> = [
    ['absent', { name: 'Hopfensack fein', nameFr: '' }, 'absent'],
    ['absent (espaces)', { name: 'Hopfensack fein', nameFr: '   ' }, 'absent'],
    ['resté en allemand', { name: 'Hopfensack fein', nameFr: 'Hopfensack fein' }, 'langue'],
    ['à moitié traduit', { name: 'Gärtank 30 Liter rund mit Deckel', nameFr: 'Fermenteur 30 Liter rund mit Deckel' }, 'langue'],
    ['resté en anglais', { name: 'Hose with clamp', nameFr: 'Hose with clamp' }, 'langue'],
    ['resté en italien', { name: 'Tubo con tappo', nameFr: 'Tubo con tappo' }, 'langue'],
    ['marque perdue', { name: 'CARABELGE®, Kg', nameFr: 'Malt caramel' }, 'marque'],
    ['référence perdue', { name: 'Wyeast 3787 Belgian High Gravity', nameFr: 'Levure belge' }, 'marque'],
    ['majuscules perdues', { name: 'SPECIAL W®, Gramm', nameFr: 'Malt spécial' }, 'marque'],
    ['supplément', { name: 'CARABELGE®, Kg', nameFr: 'CARABELGE® [+CHF 0.10]' }, 'option'],
    ['état du malt', { name: 'Premium Pilsner Malz', nameFr: 'Malt Pilsner geschrotet' }, 'option'],
    ['état du malt en français', { name: 'Premium Pilsner Malz', nameFr: 'Malt Pilsner concassé' }, 'option'],
    ['option avec deux-points', { name: 'Premium Pilsner Malz', nameFr: 'Malt Pilsner, mélange : produit seul' }, 'option'],
    ['texte de la variante', { name: 'Premium Pilsner Malz', variant: 'Poids 25 kg', nameFr: 'Malt Pilsner Poids 25 kg' }, 'option'],
    ['suffixe d’unité', { name: 'CARABELGE®, Kg', nameFr: 'CARABELGE®, Kg' }, 'unite'],
    ['suffixe d’unité gramme', { name: 'SPECIAL W®, Gramm', nameFr: 'SPECIAL W®, Gramm' }, 'unite'],
    ['unité lue en fin', { name: 'Bidon', unit: 'Bidon', nameFr: 'Malt, Bidon' }, 'unite'],
    ['explication ajoutée', { name: 'Hopfensack fein', nameFr: 'Sac à houblon fin, utilisé pour contenir les cônes de houblon pendant l’ébullition de la bière' }, 'long']
  ];
  for (const [label, line, code] of mauvais) it(`défaut « ${code} » : ${label}`, () => expect(jugerNomFr(line)).toContain(code));

  it('une ligne qui est elle-même une option imprimée n’est pas accusée d’en porter le mot', () => {
    expect(jugerNomFr({ name: 'Schrotung', nameFr: 'Schrotung' })).toEqual([]);
  });
  it('« 30 L » dans le nom n’est pas une unité de vente ; seul un suffixe après virgule l’est', () => {
    expect(jugerNomFr({ name: 'Gärtank 30 Liter rund', unit: 'Stk', nameFr: 'Fermenteur 30 L rond' })).toEqual([]);
  });
  it('une ligne sans désignation n’est pas jugée', () => expect(jugerNomFr({ name: '', nameFr: '' })).toEqual([]));
  it('jetonsGardes : marque ®, référence, nombre à 4 chiffres, MAJUSCULES ; pas les mots du lexique ni un nom ordinaire', () => {
    expect(jetonsGardes('CARABELGE®, Kg')).toEqual(['CARABELGE']);
    expect(jetonsGardes('Wyeast 3787 Belgian High Gravity')).toEqual(['3787']);
    expect(jetonsGardes('SPECIAL W®, Gramm')).toEqual(['SPECIAL', 'W']);
    expect(jetonsGardes('Hopfensack fein')).toEqual([]);
    expect(jetonsGardes('HOPFEN T90 pellets')).toEqual(['T90']);
  });
  it('aLireNomFr : un nom propre retouché sans mot du lexique est signalé, pas jugé', () => {
    expect(aLireNomFr({ name: 'Styrian Goldings', nameFr: 'Goldings de Styrie' })).toBe(true);
    expect(aLireNomFr({ name: 'Styrian Goldings', nameFr: 'Styrian Goldings' })).toBe(false);
    expect(aLireNomFr({ name: 'CARABELGE®, Kg', nameFr: 'CARABELGE®' })).toBe(false);
    expect(aLireNomFr({ name: 'Hopfensack fein', nameFr: 'Sac à houblon fin' })).toBe(false);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
describe('f5 — le jugement par variante, la simulation, la comparaison', () => {
  const run = (result: any, extra: Record<string, unknown> = {}) => ({ ids: ['Csv8F1', 'Csv8F2'], calls: 2, ms: 6000, costMicroChf: 12_000, costUnknown: 0, result: { ...result, review: { status: 'checked' } }, ...extra });
  const lines = [item('Hopfensack fein', 10, { nameFr: 'Sac à houblon fin' }), item('CARABELGE®, Kg', 20, { nameFr: 'CARABELGE®, Kg' }), item('Bidon', 5)];
  it('judgeNomsFr compte les défauts par variante, par pièce et par genre, et ne garde les paires que pour le fichier privé', () => {
    const records = [{ doc: 'tdoc', tirage: 1, readings: [], variants: { 'Csv8F+N': run(whole(lines, 35)), 'Csv8+N': run(whole(lines, 35)) } }];
    const stats = judgeNomsFr(records as any, [truthCase()]);
    expect(Object.keys(stats)).toEqual(['Csv8F+N']);
    const s = stats['Csv8F+N'];
    expect(s).toMatchObject({ items: 3, justes: 1, avecNomFr: 2 });
    expect(s.defauts).toMatchObject({ absent: 1, unite: 1, langue: 0 });
    expect(s.parDoc.tdoc).toEqual({ items: 3, justes: 1 });
    expect(s.paires).toHaveLength(3);
    const table = renderNomsFr(stats).join('\n');
    expect(table).toContain('1 / 3');
    expect(table).not.toContain('Hopfensack');
    expect(table).not.toContain('CARABELGE');
  });
  it('checkNomsFrSimulation retrouve une fausse désignation fabriquée sous le bon défaut et n’accuse aucune autre ligne', () => {
    const faulty = [item('Hopfensack fein', 10, { nameFr: 'Hopfensack fein' }), item('Bidon', 5, { nameFr: 'Bidon' })];
    const records = [{ doc: 'tdoc', tirage: 1, readings: [], variants: { Csv8F: run(whole(faulty, 15)) } }];
    const applied = [{ fault: 'nom-fr-non-traduit', doc: 'tdoc', tirage: 1, family: 'n1', path: 'items.0.nameFr', wrongValue: 'Hopfensack fein' }];
    expect(checkNomsFrSimulation(records as any, applied as any)).toMatchObject({ present: 1, found: 1, ok: true });
    // TÉMOIN NÉGATIF : le défaut fabriqué n'est pas celui que le juge accuse → manqué
    const wrongCode = [{ ...applied[0], fault: 'nom-fr-option' }];
    expect(checkNomsFrSimulation(records as any, wrongCode as any)).toMatchObject({ present: 1, found: 0, ok: false });
    // une autre ligne fautive sans faute fabriquée est accusée à tort
    const stray = [{ doc: 'tdoc', tirage: 1, readings: [], variants: { Csv8F: run(whole([faulty[0], item('Hopfensack fein', 5, { nameFr: 'Hopfensack fein' })], 15)) } }];
    expect(checkNomsFrSimulation(stray as any, applied as any).accusees).toHaveLength(1);
  });
  it('fusionnerSorties réunit les variantes par (pièce, tirage) sans perdre une pièce de l’une ou l’autre', () => {
    const a = [{ doc: 'd1', tirage: 1, readings: [], variants: { 'Csv8+N': run(whole(lines, 35)) } }, { doc: 'd2', tirage: 1, readings: [], variants: { 'Csv8+N': run(whole(lines, 35)) } }];
    const b = [{ doc: 'd1', tirage: 1, readings: [], variants: { 'Csv8F+N': run(whole(lines, 35)) } }, { doc: 'd3', tirage: 1, readings: [], variants: { 'Csv8F+N': run(whole(lines, 35)) } }];
    const merged = fusionnerSorties(a as any, b as any);
    expect(merged.map(record => record.doc).sort()).toEqual(['d1', 'd2', 'd3']);
    expect(Object.keys(merged.find(record => record.doc === 'd1')!.variants).sort()).toEqual(['Csv8+N', 'Csv8F+N']);
  });
  describe('comparerCsv8F : rien ne doit être perdu ailleurs', () => {
    const cases = [truthCase('d1'), truthCase('d2')];
    const good = whole([item('a', 10), item('b', 20)], 30);
    const records = (second: any, fvSecond = false) => [
      { doc: 'd1', tirage: 1, readings: [], variants: { 'Csv8+N': run(good), 'Csv8F+N': run(good, { ms: 7000, costMicroChf: 13_000 }) } },
      { doc: 'd2', tirage: 1, readings: [], variants: { 'Csv8+N': run(good), 'Csv8F+N': { ...run(second), ...(fvSecond ? {} : {}) } } }
    ];
    it('mêmes champs, mêmes lignes, aucun faux vert : AUCUNE PERTE, et la durée et le coût sont rapportés', () => {
      const comparison = comparerCsv8F(records(good) as any, cases);
      expect(comparison.sansPerte).toBe(true);
      expect(comparison.raisons).toEqual([]);
      expect(comparison.rapportTemps).toBeGreaterThan(1);
      expect(comparison.rapportTemps).toBeLessThan(1.25);
      expect(renderComparaison(comparison).join('\n')).toContain('AUCUNE PERTE');
    });
    it('TÉMOIN NÉGATIF : un champ perdu, ou un faux vert de plus, est une PERTE et nomme la cellule', () => {
      const wrongTotal = comparerCsv8F(records({ ...good, amountTTC: 31 }) as any, cases);
      expect(wrongTotal.sansPerte).toBe(false);
      expect(wrongTotal.pertes.map(loss => loss.cellule)).toEqual(['d2/X']);
      expect(wrongTotal.raisons.join(' ')).toContain('faux verts 1 contre 0');
      expect(renderComparaison(wrongTotal).join('\n')).toContain('PERTE');
      const lostLine = comparerCsv8F(records(whole([item('a', 10)], 30)) as any, cases);
      expect(lostLine.sansPerte).toBe(false);
      expect(lostLine.raisons.join(' ')).toContain('lignes justes');
    });
    it('sans l’une des deux variantes, la comparaison refuse de conclure', () => {
      expect(() => comparerCsv8F([{ doc: 'd1', tirage: 1, readings: [], variants: { 'Csv8+N': run(good) } }] as any, cases)).toThrow('Comparaison impossible');
    });
  });
});

// ---------------------------------------------------------------------------------------------------------------------
describe('f5 — une passe payante simulée de Csv8F (transport fabriqué, jamais Gemini)', () => {
  const base = (extra: Record<string, unknown> = {}) => ({ mode: 'payant' as const, repeat: 1, budgetChf: BUDGET_CAP_CHF, faults: false, out: path.join(work, 'sortie'), variantes: ['Csv8F' as const], normaliser: true, ...extra });
  const deps = (transport: Transport) => ({ plan: [], readKey: () => 'k', optIn: () => {}, transport, journalPath: path.join(work, 'journal.md'), log: () => {}, cases: [truthCase()], readFile: () => img });
  it('les trois lectures partent avec nameFr (schéma et consigne), la 3.8 est la sienne, et le résultat final en porte', async () => {
    const calls: Array<{ model: string; lecture: number; body: any }> = [];
    const transport: Transport = async (model, body, meta) => {
      calls.push({ model, lecture: meta.lecture, body });
      const frs = meta.lecture === 3 ? ['3.8 Fermenteur', '3.8 Malt'] : ['Lite Fermenteur', 'Lite Malt'];
      const items = threeLines().map((line, index) => ({ ...line, nameFr: frs[index] }));
      return { json: answer(whole(items, meta.lecture === 2 ? 40 : 30)), ms: 10 };
    };
    const { records } = await runBench(base(), deps(transport));
    expect(calls.map(call => call.lecture).sort()).toEqual([1, 2, 3]);
    for (const call of calls) {
      expect(call.body.generationConfig.responseSchema.properties.items.items.properties.nameFr).toBeDefined();
      expect(call.body.systemInstruction.parts[0].text).toContain('nameFr est la désignation');
    }
    expect(calls.find(call => call.lecture === 3)!.model).toBe(STRONG_MODEL);
    const result = records[0].variants['Csv8F+N'].result;
    expect(result.items.map((line: any) => line.nameFr)).toEqual(['3.8 Fermenteur', '3.8 Malt']);
    expect(records[0].variants['Csv8F+N'].ids).toEqual(['Csv8F1', 'Csv8F2', 'Csv8F3']);
    expect(thirdCallDuplicates(records.flatMap(record => record.readings.map(r => r.meta)))).toEqual([]);
  });
  it('sa 3.8 n’est jamais prêtée par une sortie de la production (qui ne porte pas nameFr)', async () => {
    let lent = 0;
    const transport: Transport = async (_model, _body, meta) => ({ json: answer(whole(threeLines(), meta.lecture === 2 ? 40 : 30)), ms: 10 });
    const lender = (_doc: string, _tirage: number, ids: readonly string[]) => { lent++; return { json: answer(whole([item('x', 1)], 1)), ms: 1, costMicroChf: 1, id: ids[0] }; };
    const { records } = await runBench(base(), { ...deps(transport), lender });
    expect(lent).toBe(0);
    expect(records[0].variants['Csv8F+N'].ids).toContain('Csv8F3');
  });
  it('--estimer : 2 Flash-Lite et au pire une 3.8 par pièce, sous 3 CHF pour 14 pièces', () => {
    const cases = Array.from({ length: 14 }, (_, i) => ({ ...truthCase(`d${i + 1}`), mimeType: 'image/jpeg' }));
    const estimate = estimateBench({ mode: 'payant', repeat: 1, budgetChf: BUDGET_CAP_CHF, plafondPasse: 3, faults: false, variantes: ['Csv8F'] }, cases, undefined, 0);
    expect(estimate.lines.find(line => line.variant === 'Csv8F')!.fresh).toBe(28);
    expect(estimate.thirds[0].fresh).toBe(14);
    expect(estimate.reservedMicro / 1e6).toBeLessThan(3);
    expect(estimate.text.join('\n')).toContain('BANC ESTIME');
  });
});

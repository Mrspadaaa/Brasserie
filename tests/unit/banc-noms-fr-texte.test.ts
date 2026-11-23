import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import {
  FAUTES_TEXTE, MODELES, NOMS_SCHEMA, SYSTEME_NOMS_FR, buildNomsBody, cleBase, controlerSimulation, dejaFrancais, estimerTexte, filtrerPieces, jugerAppels, jugerTraduction, maxSortie,
  parseArgsTexte, parseNoms, planPiece, renderTexte, reponseSimulee, runNomsFr, traductionSimulee, type Appel, type FauteAppliquee, type PlanPiece
} from '../../scripts/banc-noms-fr';
import { LITE_MODEL, STRONG_MODEL, type Transport } from '../../scripts/banc-lecture-facture';

// ---------------------------------------------------------------------------------------------------------------------
// Données fabriquées : aucun nom d'achat réel. Les exemples sont ceux de la voie (f5b-traduire) ou inventés.
// ---------------------------------------------------------------------------------------------------------------------
const ligne = (name: string, extra: Record<string, unknown> = {}) => ({ name, kind: 'stock', stockCategory: '', unit: '', variant: '', ...extra });
const plans = (): PlanPiece[] => [
  planPiece('doc1', [ligne('Hopfensack fein', { kind: 'equipment' }), ligne('CARABELGE®, Kg', { variant: 'Mischung: Einzelprodukt, Schrotung: geschrotet [+CHF 0.10]' }), ligne('Tuyau en silicone 10x14mm', { kind: 'equipment' })]),
  planPiece('doc2', [ligne('Premium Pilsner Malz'), ligne('CARAFA® Spezial 3'), ligne('Hopfensack fein', { kind: 'equipment' })]),
  planPiece('doc3', [ligne('Gärtank 30 Liter rund mit Deckel', { kind: 'equipment' })])
];
const reponse = (noms: Array<{ i: number; nameFr: string }>, finishReason = 'STOP') =>
  ({ candidates: [{ finishReason, content: { parts: [{ text: JSON.stringify({ noms }) }] } }], usageMetadata: { promptTokenCount: 900, candidatesTokenCount: 120, thoughtsTokenCount: 0, totalTokenCount: 1020 } });

let work: string;
beforeEach(() => { work = mkdtempSync(path.join(tmpdir(), 'f5b-test-')); });
afterEach(() => { rmSync(work, { recursive: true, force: true }); });

// ---------------------------------------------------------------------------------------------------------------------
describe('f5b — les entrées : le nom de base de f1, dédoublonné, sans rien d’autre de la pièce', () => {
  it('la base est celle de lireOptions : options, état, supplément et suffixe d’unité retirés ; marque gardée', () => {
    const plan = plans()[0];
    expect(plan.lignes.map(l => l.base)).toEqual(['Hopfensack fein', 'CARABELGE®', 'Tuyau en silicone 10x14mm']);
    expect(plan.entrees).toEqual([
      { i: 0, base: 'Hopfensack fein', kind: 'equipment', stockCategory: '' },
      { i: 1, base: 'CARABELGE®', kind: 'stock', stockCategory: '' },
      { i: 2, base: 'Tuyau en silicone 10x14mm', kind: 'equipment', stockCategory: '' }
    ]);
  });
  it('une même base (accents, casse et espaces mis à part) ne part qu’une fois ; ses lignes pointent sur la première', () => {
    const plan = planPiece('d', [ligne('Sac à houblon'), ligne('Autre chose'), ligne('sac  A houblon'), ligne('')]);
    expect(plan.entrees.map(e => e.i)).toEqual([0, 1]);
    expect(plan.lignes.map(l => l.entree)).toEqual([0, 1, 0, null]);
    expect(cleBase('Sac à Houblon')).toBe(cleBase('sac  a houblon'));
  });
  it('le corps est du texte seul : ni image, ni montant, ni quantité ; schéma strict ; réflexion au plus bas ; température 0', () => {
    const body = buildNomsBody(plans()[0].entrees) as any;
    const json = JSON.stringify(body);
    expect(json).not.toContain('inlineData');
    expect(json).not.toContain('mediaResolution');
    expect(body.contents[0].parts).toHaveLength(1);
    expect(Object.keys(JSON.parse(body.contents[0].parts[0].text).entrees[0]).sort()).toEqual(['base', 'i', 'kind', 'stockCategory']);
    expect(body.generationConfig).toMatchObject({ responseMimeType: 'application/json', responseSchema: NOMS_SCHEMA, temperature: 0, thinkingConfig: { thinkingLevel: 'LOW' } });
    expect(NOMS_SCHEMA.properties.noms.items.required).toEqual(['i', 'nameFr']);
    expect(body.generationConfig.maxOutputTokens).toBe(maxSortie(3));
  });
  it('la consigne dit les règles : français, marque et variété gardées, nombres et dimensions, identique si déjà français, rien d’ajouté, même traduction', () => {
    for (const mot of ['français', 'marque', 'variété de houblon', 'souche', '®', 'dimensions', '5x8mm', 'à l\'identique', 'N\'ajoute', 'même traduction', 'Zuschlag', 'Porto', 'Verpackung', 'Schlauch']) expect(SYSTEME_NOMS_FR).toContain(mot);
    // aucun exemple de la consigne n'est une désignation des pièces de la voie
    for (const interdit of ['CARAFA', 'Pilsner Malz', 'Wiener Malz', 'Zuschlag Schrotung', 'Porto und Verpackung', 'Tuyau en silicone', 'Malt de blé clair']) expect(SYSTEME_NOMS_FR).not.toContain(interdit);
  });
  it('--lot : impaires pour régler, paires pour juger', () => {
    const toutes = [1, 2, 3, 4].map(n => planPiece(`doc${n}`, [ligne('Un')]));
    expect(filtrerPieces(toutes, 'impaires').map(p => p.doc)).toEqual(['doc1', 'doc3']);
    expect(filtrerPieces(toutes, 'paires').map(p => p.doc)).toEqual(['doc2', 'doc4']);
    expect(filtrerPieces(toutes, 'toutes')).toHaveLength(4);
    expect(filtrerPieces(toutes, undefined, ['doc4']).map(p => p.doc)).toEqual(['doc4']);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
describe('f5b — la réponse', () => {
  const entrees = plans()[0].entrees;
  it('une réponse complète : un nom par entrée', () => {
    expect(parseNoms(reponse([{ i: 0, nameFr: 'Sac à houblon fin' }, { i: 1, nameFr: 'CARABELGE®' }, { i: 2, nameFr: 'Tuyau en silicone 10x14mm' }]), entrees))
      .toEqual({ noms: [{ i: 0, nameFr: 'Sac à houblon fin' }, { i: 1, nameFr: 'CARABELGE®' }, { i: 2, nameFr: 'Tuyau en silicone 10x14mm' }], state: 'STOP' });
  });
  it('un i manquant, inconnu, répété ou vide n’est pas une traduction (la base reste) ; jamais une erreur', () => {
    const lu = parseNoms(reponse([{ i: 0, nameFr: 'Sac' }, { i: 0, nameFr: 'Autre' }, { i: 9, nameFr: 'Inconnu' }, { i: 1, nameFr: '   ' }]), entrees);
    expect(lu.noms).toEqual([{ i: 0, nameFr: 'Sac' }]);
  });
  it('coupée ou illisible : aucune traduction, l’état le dit', () => {
    expect(parseNoms(reponse([], 'MAX_TOKENS'), entrees)).toEqual({ noms: null, state: 'coupée (MAX_TOKENS)' });
    expect(parseNoms({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: 'pas du json' }] } }] }, entrees).state).toBe('illisible');
    expect(parseNoms({}, entrees).noms).toBeNull();
  });
});

// ---------------------------------------------------------------------------------------------------------------------
describe('f5b — le juge des traductions', () => {
  const bon: Array<[string, string]> = [
    ['Gärtank 30 Liter rund mit Deckel', 'Fermenteur 30 L rond avec couvercle'],
    ['Premium Pilsner Malz', 'Malt Pilsner Premium'],
    ['Hopfensack fein', 'Sac à houblon fin'],
    ['Zuschlag Schrotung', 'Supplément concassage'],
    ['Porto und Verpackung', 'Port et emballage'],
    ['CARAFA® Spezial 3', 'CARAFA® Spécial 3'],
    ['CARABELGE®', 'CARABELGE®'],
    ['Tuyau en silicone 10x14mm', 'Tuyau en silicone 10x14mm'],
    ['Styrian Goldings', 'Styrian Goldings'],
    ['Wyeast 3787 Belgian High Gravity', 'Wyeast 3787 Belgian High Gravity'],
    ['Domain : exemple.ch', 'Domain : exemple.ch'],
    ['French Saison M29, 10gr', 'French Saison M29, 10gr']
  ];
  for (const [base, fr] of bon) it(`juste : « ${base} » → « ${fr} »`, () => expect(jugerTraduction(base, fr)).toEqual([]));
  const mauvais: Array<[string, string, string | undefined, string]> = [
    ['Pilsner Malz resté allemand', 'Pilsner Malz', 'Pilsner Malz', 'langue'],
    ['Zuschlag resté allemand', 'Zuschlag Schrotung', 'Zuschlag Schrotung', 'langue'],
    ['Porto und Verpackung resté allemand', 'Porto und Verpackung', 'Porto und Verpackung', 'langue'],
    ['marque coupée', 'CARAFA® Spezial 3', 'Malt spécial 3', 'marque'],
    ['chiffre coupé', 'CARAFA® Spezial 3', 'CARAFA® Spécial', 'chiffre'],
    ['déjà français retouché', 'Tuyau en silicone 10x14mm', 'Tuyau silicone 10x14mm', 'identite'],
    ['déjà français traduit à tort', 'Malt de blé clair', 'Light wheat malt', 'identite'],
    ['suffixe d’unité ajouté', 'Sac à houblon', 'Sac à houblon, Kg', 'unite'],
    ['option ajoutée', 'CARABELGE®', 'CARABELGE® [+CHF 0.10]', 'option'],
    ['état ajouté', 'CARABELGE®', 'CARABELGE® concassé', 'option'],
    ['explication', 'Hopfensack fein', 'Sac à houblon fin, utilisé pour contenir les cônes de houblon pendant l’ébullition de la bière', 'long'],
    ['absent', 'Hopfensack fein', undefined, 'manquant'],
    ['vide', 'Hopfensack fein', '  ', 'manquant']
  ];
  for (const [label, base, fr, code] of mauvais) it(`défaut « ${code} » : ${label}`, () => expect(jugerTraduction(base, fr)).toContain(code));
  it('dejaFrancais : un mot français courant et aucun mot du lexique étranger', () => {
    expect(dejaFrancais('Tuyau en silicone 10x14mm')).toBe(true);
    expect(dejaFrancais('Malt de blé clair')).toBe(true);
    expect(dejaFrancais('Hopfensack fein')).toBe(false);
    expect(dejaFrancais('Wyeast 3787 Belgian High Gravity')).toBe(false);
    expect(dejaFrancais('Sac et Sack')).toBe(false);
  });
  const appel = (doc: string, modele: 'lite' | '38', plan: PlanPiece, fr: Record<number, string>): Appel => ({ doc, modele, model: MODELES[modele], plan, noms: Object.entries(fr).map(([i, nameFr]) => ({ i: Number(i), nameFr })), ms: 1000, inputTokens: 900, outputTokens: 100, costMicroChf: 1000, state: 'STOP' });
  it('cohérence : une même base rend le même français d’une pièce à l’autre ; la plus fréquente fait référence, une voix par pièce', () => {
    const p = plans(), a = p[0], b = p[1];
    // « Hopfensack fein » est dans doc1 (i 0) et doc2 (i 2)
    const incoherent = jugerAppels([appel('doc1', 'lite', a, { 0: 'Sac à houblon fin', 1: 'CARABELGE®', 2: 'Tuyau en silicone 10x14mm' }), appel('doc2', 'lite', b, { 0: 'Malt Pilsner Premium', 1: 'CARAFA® Spécial 3', 2: 'Sachet de houblon fin' })]);
    expect(incoherent.lite.defauts.incoherent).toBe(1);
    expect(incoherent.lite.paires.filter(x => x.defauts.includes('incoherent')).map(x => x.doc)).toEqual(['doc2']);
    const coherent = jugerAppels([appel('doc1', 'lite', a, { 0: 'Sac à houblon fin', 1: 'CARABELGE®', 2: 'Tuyau en silicone 10x14mm' }), appel('doc2', 'lite', b, { 0: 'Malt Pilsner Premium', 1: 'CARAFA® Spécial 3', 2: 'sac a houblon fin' })]);
    expect(coherent.lite.defauts.incoherent).toBe(0);
  });
  it('un appel sans réponse : toutes ses lignes sont « manquant », comptées, jamais jugées justes', () => {
    const sans: Appel = { ...appel('doc1', '38', plans()[0], {}), noms: null, state: 'HTTP 503', costMicroChf: 0 };
    const stats = jugerAppels([sans]);
    expect(stats['38']).toMatchObject({ appels: 1, appelsSansReponse: 1, lignes: 3, sansDefaut: 0 });
    expect(stats['38'].defauts.manquant).toBe(3);
  });
  it('le tableau publiable ne porte que des comptes : aucune base, aucun nom français', () => {
    const stats = jugerAppels([appel('doc1', 'lite', plans()[0], { 0: 'Sac à houblon fin', 1: 'CARABELGE®', 2: 'Tuyau en silicone 10x14mm' })]);
    const table = renderTexte(stats).join('\n');
    expect(table).toContain('3 / 3');
    for (const prive of ['Hopfensack', 'CARABELGE', 'silicone', 'Sac à houblon']) expect(table).not.toContain(prive);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
describe('f5b — la simulation éprouve le juge', () => {
  const jeu = (): PlanPiece[] => [
    planPiece('doc2', [ligne('Hopfensack fein'), ligne('Autre chose')]),
    planPiece('doc3', [ligne('Tuyau en silicone 10x14mm'), ligne('Sac à houblon')]),
    planPiece('doc5', [ligne('Zuschlag Schrotung'), ligne('Hopfensack fein')]),
    planPiece('doc6', [ligne('CARAFA® Spezial 3'), ligne('Autre')]),
    planPiece('doc7', [ligne('Sac à houblon'), ligne('Autre')]),
    planPiece('doc8', [ligne('Gärtank 30 Liter rund mit Deckel')]),
    planPiece('doc11', [ligne('Hopfensack fein'), ligne('Mon article')]),
    planPiece('doc12', [ligne('Hopfensack fein'), ligne('Autre')])
  ];
  const appelsDe = (pieces: PlanPiece[]) => {
    const fautes: FauteAppliquee[] = [], toutes = new Map(pieces.map(p => [p.doc, p]));
    const appels: Appel[] = pieces.flatMap(plan => (['lite', '38'] as const).map(modele => {
      const { json, ms } = reponseSimulee(MODELES[modele], plan.doc, modele, plan, toutes, FAUTES_TEXTE, fautes);
      const lu = parseNoms(json, plan.entrees);
      return { doc: plan.doc, modele, model: MODELES[modele], plan, noms: lu.noms, ms, inputTokens: 1, outputTokens: 1, costMicroChf: 1, state: lu.state } as Appel;
    }));
    return { appels, fautes };
  };
  it('chaque fausse traduction fabriquée est retrouvée sous son défaut, aucune autre ligne n’est accusée', () => {
    const { appels, fautes } = appelsDe(jeu());
    expect(new Set(fautes.map(f => f.fault))).toEqual(new Set(FAUTES_TEXTE.map(f => f.id)));
    const controle = controlerSimulation(appels, fautes);
    expect(controle).toMatchObject({ ok: true, manquees: [], accusees: [] });
    expect(controle.trouvees).toBe(controle.present);
    expect(controle.present).toBeGreaterThanOrEqual(12);
  });
  it('TÉMOIN NÉGATIF : un défaut fabriqué que le juge ne voit pas est « manqué » ; une ligne fautive sans faute fabriquée est « accusée »', () => {
    const { appels, fautes } = appelsDe(jeu());
    const faux = fautes.map(f => (f.fault === 'texte-unite' ? { ...f, code: 'long' as const } : f));
    expect(controlerSimulation(appels, faux).manquees.length).toBeGreaterThan(0);
    expect(controlerSimulation(appels, faux).ok).toBe(false);
    const sansFautes = controlerSimulation(appels, []);
    expect(sansFautes.present).toBe(0);
    expect(sansFautes.ok).toBe(false);
  });
  it('traductionSimulee remplace les mots du lexique et recopie tout le reste', () => {
    expect(traductionSimulee('Gärtank 30 Liter rund mit Deckel')).toBe('fermenteur 30 L rond avec couvercle');
    expect(traductionSimulee('CARABELGE®')).toBe('CARABELGE®');
    expect(traductionSimulee('French Saison M29, 10gr')).toBe('French Saison M29, 10gr');
  });
});

// ---------------------------------------------------------------------------------------------------------------------
describe('f5b — la passe (transport fabriqué, jamais Gemini)', () => {
  const base = (extra: Record<string, unknown> = {}) => ({ mode: 'payant' as const, modeles: ['lite' as const, '38' as const], budgetChf: 5, plafondPasse: 1, out: path.join(work, 'sortie'), ...extra });
  const deps = (transport: Transport, extra: Record<string, unknown> = {}) => ({ plans: plans(), readKey: () => 'k', optIn: () => {}, transport, journalPath: path.join(work, 'journal.md'), log: () => {}, ...extra });
  it('un appel texte seul par pièce et par modèle ; le modèle voulu ; la traduction est lue ; le journal reçoit une ligne par appel sans aucune valeur', async () => {
    const calls: Array<{ model: string; body: any; doc: string }> = [];
    const transport: Transport = async (model, body, meta) => { calls.push({ model, body, doc: meta.doc }); return { json: reponse(plans().find(p => p.doc === meta.doc)!.entrees.map(e => ({ i: e.i, nameFr: `FR ${e.base}` }))), ms: 5 }; };
    const sortie = await runNomsFr(base(), deps(transport));
    expect(calls).toHaveLength(6);
    expect(new Set(calls.map(c => c.model))).toEqual(new Set([LITE_MODEL, STRONG_MODEL]));
    for (const call of calls) expect(JSON.stringify(call.body)).not.toContain('inlineData');
    expect(sortie.appels).toHaveLength(6);
    expect(sortie.appels[0].noms![0].nameFr).toBe('FR Hopfensack fein');
    const journal = readFileSync(path.join(work, 'journal.md'), 'utf8');
    expect(journal.split('\n').filter(l => l.startsWith('| 20')).length).toBe(6);
    expect(journal).toContain('NomsFr');
    expect(journal).not.toContain('Hopfensack');
    expect(JSON.parse(readFileSync(path.join(work, 'sortie', 'results.json'), 'utf8')).appels).toHaveLength(6);
  });
  it('--reprendre : un appel déjà payé (même pièce, même modèle, mêmes entrées) n’est ni refait ni payé ni journalisé', async () => {
    const transport: Transport = async (_model, _body, meta) => ({ json: reponse(plans().find(p => p.doc === meta.doc)!.entrees.map(e => ({ i: e.i, nameFr: `FR ${e.base}` }))), ms: 5 });
    await runNomsFr(base(), deps(transport));
    let neufs = 0;
    const second: Transport = async (_model, _body, meta) => { neufs++; return transport(_model, _body, meta, new AbortController().signal); };
    const out = path.join(work, 'seconde');
    const sortie = await runNomsFr(base({ out, reprendre: path.join(work, 'sortie') }), deps(second, { journalPath: path.join(work, 'journal2.md') }));
    expect(neufs).toBe(0);
    expect(sortie.appels.every(a => a.lent)).toBe(true);
  });
  it('le plafond de passe arrête net AVANT le dépassement', async () => {
    const transport: Transport = async () => ({ json: reponse([]), ms: 5 });
    const sortie = await runNomsFr(base({ plafondPasse: 0.001 }), deps(transport));
    expect(sortie.stopped).toContain('Plafond de passe atteint');
    expect(sortie.appels).toHaveLength(0);
  });
  it('trois appels sans réponse d’affilée : arrêt net', async () => {
    const transport: Transport = async () => { throw Object.assign(new Error('Gemini HTTP 503'), { httpStatus: 503 }); };
    const sortie = await runNomsFr(base(), deps(transport));
    expect(sortie.stopped).toContain('Trois appels en échec');
  });
  it('le mode payant exige l’autorisation explicite et une clé ; la simulation coupe le réseau', async () => {
    const transport: Transport = async () => ({ json: reponse([]), ms: 5 });
    await expect(runNomsFr(base(), deps(transport, { optIn: () => { throw new Error('refusé'); } }))).rejects.toThrow('refusé');
    await expect(runNomsFr(base(), deps(transport, { readKey: () => undefined }))).rejects.toThrow('Aucune clé');
    await expect(runNomsFr(base({ budgetChf: 99 }), deps(transport))).rejects.toThrow('--budget-chf');
    const sortie = await runNomsFr({ mode: 'simuler', modeles: ['lite'], out: path.join(work, 'sim') }, { plans: plans(), log: () => {}, genres: new Map() });
    expect(sortie.appels).toHaveLength(3);
    expect(sortie.stats.lite.lignes).toBe(7);
  });
  it('--estimer : deux modèles sur 14 pièces de 16 noms de base tiennent sous 0,30 CHF', () => {
    const quatorze = Array.from({ length: 14 }, (_, n) => planPiece(`doc${n + 1}`, Array.from({ length: 16 }, (_x, k) => ligne(`Article numéro ${n}-${k} avec un libellé`))));
    const estimate = estimerTexte(quatorze, ['lite', '38'], 1, 0);
    expect(estimate.appels).toBe(28);
    expect(estimate.reserveMicro / 1e6).toBeLessThan(0.3);
    expect(estimate.text.join('\n')).toContain('BANC ESTIME');
    expect(estimerTexte(quatorze, ['lite', '38'], 1, 0, new Set(['doc1|lite'])).appels).toBe(27);
  });
  it('parseArgsTexte : refuse un modèle inconnu, un lot inconnu, --payant avec --simuler', () => {
    expect(() => parseArgsTexte(['--simuler', '--modeles', 'gpt'])).toThrow('--modeles');
    expect(() => parseArgsTexte(['--simuler', '--lot', 'tous'])).toThrow('--lot');
    expect(() => parseArgsTexte(['--simuler', '--payant'])).toThrow('s’excluent');
    expect(parseArgsTexte(['--payant', '--budget-chf', '3']).plafondPasse).toBe(3);
    expect(parseArgsTexte(['--simuler']).modeles).toEqual(['lite', '38']);
  });
});

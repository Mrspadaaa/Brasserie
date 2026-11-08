import { afterEach, describe, expect, it, vi } from 'vitest';
import { existsSync, mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { ingredientLookupDefinition } from '../../functions/src/prompts';
import { geminiBody, userTextOf } from '../../functions/src/geminiBody';
import { quoteGeminiCost } from '../../functions/src/geminiCosts';
import { valeursDeReponse } from '../../src/services/enrichissementCatalogues';
import {
  BUDGET_CAP_CHF, Budget, BudgetStop, DEFAULT_PASS_CAP_CHF, FAUTES, MISSION_JOURNAL, VERITE_FILE, appendJournal, chargerVerite, choisir, estimer, parseArgs, preparer,
  realTransport, reponseFabriquee, runBench, spentInJournal, transportSimule, withToolTokens
} from '../../scripts/banc-enrichissement';
import { classerSource, jugerChamp, jugerProduit, jugerTout, type Appel } from '../../scripts/banc-enrichissement-juger';

/**
 * Voie EI (08.11) : le banc de l'enrichissement des fiches. Tout est SIMULÉ : aucun appel Gemini, aucune clé lue. Un `fetch` espion échoue
 * le test si une requête réseau part.
 */
const verite = chargerVerite();
const fetchEspion = vi.spyOn(globalThis, 'fetch');
afterEach(() => { expect(fetchEspion).not.toHaveBeenCalled(); fetchEspion.mockClear(); });
const dossier = () => mkdtempSync(path.join(tmpdir(), 'ei-test-'));
const sansLog = () => undefined;

describe('la vérité', () => {
  it('30 à 40 produits publics, identifiants uniques, les phares et les pièges demandés', () => {
    expect(verite.produits.length).toBeGreaterThanOrEqual(30);
    expect(verite.produits.length).toBeLessThanOrEqual(40);
    expect(new Set(verite.produits.map(p => p.id)).size).toBe(verite.produits.length);
    const noms = verite.produits.map(p => p.saisie.description.toLowerCase());
    for (const phare of ['pilsner', 'maris otter', 'caramünch', 'citra', 'nelson sauvin', 'idaho 7', 'magnum', 'us-05', 'nottingham', 'wlp001'])
      expect(noms.some(n => n.includes(phare)), phare).toBe(true);
    for (const tape of ['idaho7', 'cryo hops citra 25g', 'caramünch typ 2', 'pilsner malz']) expect(noms, tape).toContain(tape);
    const pieges = verite.produits.filter(p => p.groupe === 'piege');
    expect(pieges.filter(p => p.piege === 'inconnu').length).toBeGreaterThanOrEqual(3);
    expect(pieges.filter(p => p.piege === 'ambigu').length).toBeGreaterThanOrEqual(2);
    expect(pieges.filter(p => p.piege === 'hors-perimetre').length).toBeGreaterThanOrEqual(2);
  });
  it('chaque produit réel porte l’adresse de sa fiche, son statut et au moins une valeur attendue ; chaque adresse est celle d’un producteur reconnu', () => {
    for (const p of verite.produits) {
      const reel = p.attendu.existe && !p.attendu.ambigu && !p.attendu.horsPerimetre;
      if (!reel) { expect(Object.keys(p.attendu.champs), p.id).toHaveLength(0); continue; }
      expect(p.fiche?.url, p.id).toMatch(/^https:\/\//);
      expect(['lu-sur-la-fiche', 'a-reverifier'], p.id).toContain(p.fiche!.statut);
      expect(Object.keys(p.attendu.champs).length, p.id).toBeGreaterThan(0);
      expect(classerSource('fiche', p.fiche!.url, verite).classe, p.id).toMatch(/producteur/);
      expect(p.fiche!.domaines.length, p.id).toBeGreaterThan(0);
    }
    for (const p of verite.produits) for (const c of Object.values(p.attendu.champs)) if (c.plage) expect(c.plage[0], p.id).toBeLessThanOrEqual(c.plage[1]);
  });
  it('aucune donnée du brasseur : ni fournisseur ni prix', () => {
    const texte = readFileSync(VERITE_FILE, 'utf8');
    expect(texte).not.toMatch(/CHF|fournisseur"/i);
  });
});

describe('le MÊME chemin que la production, sans copie', () => {
  const sac = (id: string) => verite.produits.find(p => p.id === id)!;
  it('la consigne, le schéma, le texte et le corps viennent des modules du serveur', () => {
    const p = preparer(sac('f03'), []);
    const def = ingredientLookupDefinition('malt');
    expect(p.system).toBe(def.system);
    expect(p.userText).toBe(userTextOf(p.requete.instruction, p.requete.context));
    expect(p.route.map(r => r.model)).toEqual(['gemini-3.8-flash', 'gemini-3.8-flash']);
    expect(p.body[0]).toEqual(geminiBody({ systemPrompt: def.system, userText: p.userText, schema: def.schema as Record<string, unknown>, settings: { temperature: 0, thinkingLevel: 'low' }, grounded: true, maxOutputTokens: 4500 }));
    expect((p.body[0] as any).tools).toEqual([{ googleSearch: {} }]);
    expect(p.requete).toMatchObject({ kind: 'malt', instruction: 'malt : Caramünch Typ 2', context: { kind: 'malt', type: 'grain', manquant: ['couleur EBC', 'potentiel PPG'] } });
  });
  it('une levure reçoit la consigne de levure, un houblon celle de base ; un sucre est un malt de type « sucre »', () => {
    expect(preparer(sac('p10'), []).system).toBe(ingredientLookupDefinition('levure').system);
    expect(preparer(sac('p04'), []).system).toBe(ingredientLookupDefinition('houblon').system);
    expect(preparer(sac('x07'), []).requete.context).toMatchObject({ kind: 'malt', type: 'sucre' });
  });
  it('ai.ts n’écrit plus ni le texte de l’utilisateur ni le corps de la requête : il appelle geminiBody.ts', () => {
    const source = readFileSync(path.join(__dirname, '../../functions/src/ai.ts'), 'utf8');
    expect(source).toContain("from './geminiBody.js'");
    expect(source).toContain('userTextOf(instruction, context)');
    expect(source).toContain('geminiBody({ systemPrompt, userText, schema, settings, file, grounded, maxOutputTokens })');
    expect(source).not.toContain('Demande : ${instruction');
    expect(source).not.toContain('tools: [{ googleSearch: {} }]');
  });
  it('la porte de la procédure f4 est notée : houblon jamais, malt sans fabricant non identifiable, levure du catalogue servie par le catalogue', async () => {
    const refs = (await import('../../src/services/enrichissementLevures')).referencesLevures();
    expect(preparer(sac('p04'), refs).garde.decision).toBe('aucune-recherche');
    expect(preparer(sac('f04'), refs).garde.decision).toBe('nonIdentifiable');
    expect(preparer(sac('p01'), refs).garde.decision).toBe('recherche');
    expect(preparer(sac('p08'), refs).garde.decision).toBe('catalogue');
    expect(preparer(sac('x03'), refs).garde.decision).toBe('recherche');
  });
});

describe('la garde de budget (10 CHF au total, plafond de passe)', () => {
  it('réserve avant, règle après ; un coût inconnu compte la réserve entière, jamais zéro', () => {
    const b = new Budget(1_000_000);
    const r = b.reserve(400_000);
    expect(b.reserved).toBe(400_000);
    b.settle(r, 90_000);
    expect(b.spentMicro).toBe(90_000);
    expect(b.reserved).toBe(0);
    const r2 = b.reserve(400_000);
    b.settle(r2, null);
    expect(b.spentMicro).toBe(490_000);
  });
  it('arrêt net : un appel dont la réserve dépasserait le budget ne part pas', () => {
    const b = new Budget(1_000_000, 700_000);
    expect(() => b.reserve(400_000)).toThrow(BudgetStop);
    expect(b.reserved).toBe(0);
    b.reserve(300_000);
    expect(() => b.reserve(1)).toThrow(/Budget atteint/);
  });
  it('le plafond de passe ne compte que ce que CETTE passe dépense', () => {
    const b = new Budget(10_000_000, 6_000_000, 800_000);
    const r = b.reserve(400_000);
    b.settle(r, 100_000);
    b.reserve(400_000);
    expect(() => b.reserve(400_000)).toThrow(/Plafond de passe/);
    expect(b.spentMicro - b.startMicro).toBe(100_000);
  });
  it('le plafond total est 10 CHF et le journal est à part de celui de la lecture des factures', () => {
    expect(BUDGET_CAP_CHF).toBe(10);
    expect(DEFAULT_PASS_CAP_CHF).toBeLessThanOrEqual(BUDGET_CAP_CHF);
    expect(MISSION_JOURNAL.replace(/\\/g, '/')).toMatch(/work\/missions\/2026-11-08-enrichissement\/journal-gemini\.md$/);
    expect(MISSION_JOURNAL).not.toContain('banc-lecture');
  });
  it('le journal : une ligne par tentative, le cumul relit les lignes payantes et ignore les SIMULÉ', () => {
    const f = path.join(dossier(), 'journal.md');
    const t = { model: 'gemini-3.8-flash', ms: 7000, etat: 'ok' as const, entree: 15000, sortie: 900, recherches: 3, coutMicro: 90_123, reserveMicro: 412_000 };
    appendJournal(f, 'p01', 1, t, 90_123, false);
    appendJournal(f, 'p02', 1, { ...t, coutMicro: 80_000 }, 170_123, false);
    appendJournal(f, 'p03', 1, { ...t, coutMicro: 999_000 }, 1_169_123, true);
    expect(spentInJournal(f)).toBe(170_123);
    expect(spentInJournal(path.join(dossier(), 'absent.md'))).toBe(0);
    expect(readFileSync(f, 'utf8')).toMatch(/\| p01 \| 1 \| gemini-3\.8-flash \| 7000 ms \| 15000 \| 900 \| 3 \| 0\.090123 \| 0\.090123 \| ok \|/);
  });
  it('les options : --payant exige un budget ≤ 10 et un plafond de passe ≤ budget ; --payant et --simuler s’excluent', () => {
    expect(() => parseArgs(['--payant'])).toThrow(/--budget-chf/);
    expect(() => parseArgs(['--payant', '--budget-chf', '10.5'])).toThrow(/10/);
    expect(() => parseArgs(['--payant', '--budget-chf', '5', '--plafond-passe', '6'])).toThrow(/plafond/);
    expect(() => parseArgs(['--payant', '--simuler'])).toThrow(/s’excluent/);
    expect(parseArgs(['--payant', '--budget-chf', '10', '--plafond-passe', '5', '--confirm-paid-ai'])).toMatchObject({ mode: 'payant', budgetChf: 10, plafondPasse: 5 });
    expect(parseArgs(['--simuler']).mode).toBe('simuler');
  });
  it('sans --confirm-paid-ai, le mode payant refuse avant tout appel (paid-ai-test-guard)', async () => {
    await expect(runBench(parseArgs(['--payant', '--budget-chf', '1', '--plafond-passe', '1', '--cas', 'p01']), { log: sansLog, readKey: () => 'cle-de-test', references: [] })).rejects.toThrow(/exclu des tests normaux/);
  });
  it('sans clé locale, aucun appel', async () => {
    await expect(runBench(parseArgs(['--payant', '--budget-chf', '1', '--plafond-passe', '1', '--cas', 'p01']), { log: sansLog, optIn: () => undefined, readKey: () => undefined, references: [] })).rejects.toThrow(/Aucune cle Gemini/);
  });
  it('passe payante (transport injecté) : arrêt net quand la réserve suivante dépasserait le plafond de passe, une ligne de journal par appel', async () => {
    const journalPath = path.join(dossier(), 'journal.md');
    const transport = transportSimule(verite, false);
    const passe = await runBench(parseArgs(['--payant', '--budget-chf', '0.6', '--plafond-passe', '0.6', '--cas', 'p01,f03,f05,f06', '--out', dossier()]),
      { log: sansLog, optIn: () => undefined, readKey: () => 'cle-de-test', references: [], transport, journalPath });
    // Réserve par appel ≈ 0,41 CHF, dépense réelle simulée ≈ 0,09 : la passe s'arrête quand dépensé + réservé + 0,41 > 0,9.
    expect(passe.arret).toMatch(/Plafond de passe|Budget atteint/);
    expect(passe.appels).toHaveLength(3);
    expect(passe.depenseMicro).toBeLessThanOrEqual(600_000);
    const lignes = readFileSync(journalPath, 'utf8').split('\n').filter(l => /^\| \d{4}-/.test(l));
    expect(lignes).toHaveLength(passe.appels.reduce((s, a) => s + a.tentatives.length, 0));
    expect(spentInJournal(journalPath)).toBe(passe.depenseMicro);   // le cumul relit ce que la passe a dépensé
  });
  it('un refus HTTP du fournisseur : une seule nouvelle tentative pour un service qui flanche, aucune pour un refus qui ne se contourne pas', async () => {
    const reponses = [{ status: 503, error: { message: 'indisponible' } }, { status: 200 }];
    let n = 0;
    const faux = (async (_url: string, init: any) => {
      const r = reponses[Math.min(n++, reponses.length - 1)];
      expect(init.headers['x-goog-api-key']).toBe('cle-de-test');
      if (r.status === 200) return { ok: true, status: 200, headers: new Headers(), json: async () => (await transportSimule(verite, false)('m', {}, { id: 'p01', essai: 1 }, AbortSignal.timeout(1000))).json };
      return { ok: false, status: r.status, headers: new Headers(), json: async () => ({ error: r.error }) };
    }) as unknown as typeof fetch;
    const passe = await runBench(parseArgs(['--payant', '--budget-chf', '2', '--plafond-passe', '2', '--cas', 'p01', '--out', dossier()]),
      { log: sansLog, optIn: () => undefined, readKey: () => 'cle-de-test', references: [], transport: realTransport('cle-de-test', faux), journalPath: path.join(dossier(), 'j.md') });
    expect(passe.appels[0].tentatives.map(t => t.etat)).toEqual(['http', 'ok']);
    expect(passe.appels[0].tentatives[0].httpStatus).toBe(503);
    n = 0; reponses[0] = { status: 403, error: { message: 'refus' } };
    const refus = await runBench(parseArgs(['--payant', '--budget-chf', '2', '--plafond-passe', '2', '--cas', 'p01', '--out', dossier()]),
      { log: sansLog, optIn: () => undefined, readKey: () => 'cle-de-test', references: [], transport: realTransport('cle-de-test', faux), journalPath: path.join(dossier(), 'j.md') });
    expect(refus.appels[0].etat).toBe('echec');
    expect(refus.appels[0].tentatives).toHaveLength(1);
    expect(refus.appels[0].coutMicro).toBe(0);   // refusé avant génération : rien n'est facturé
  });
  it('les jetons de l’outil de recherche comptent comme entrée (prudence)', () => {
    const j = withToolTokens({ usageMetadata: { promptTokenCount: 1000, toolUsePromptTokenCount: 9000, candidatesTokenCount: 10, totalTokenCount: 10010 } });
    expect(j.usageMetadata.promptTokenCount).toBe(10000);
  });
});

describe('--estimer : la passe complète tient sous 10 CHF', () => {
  it('réserve par appel ≈ 0,41 CHF (20 requêtes réservées), probable et haut réaliste sous le budget, la réserve cumulée est dite', () => {
    const e = estimer(verite.produits, [], { selonGarde: false }, 0);
    expect(e.appels).toBe(verite.produits.length);
    expect(e.reserveParAppelMicro).toBeGreaterThan(380_000);
    expect(e.reserveParAppelMicro).toBeLessThan(450_000);
    expect(e.probable[1]).toBeLessThan(BUDGET_CAP_CHF);
    expect(e.haute).toBeLessThan(BUDGET_CAP_CHF);
    expect(e.texte.join('\n')).toMatch(/BANC ESTIME probable .* CHF, haut .* CHF, reserve max .* CHF, 38 appels/);
    expect(e.texte.join('\n')).toMatch(/TIENT sous les 10 CHF/);
  });
  it('--selon-garde ne compte que les produits que la garde de f4 laisse partir', async () => {
    const e = estimer(verite.produits, (await import('../../src/services/enrichissementLevures')).referencesLevures(), { selonGarde: true }, 0);
    expect(e.appels).toBeLessThan(verite.produits.length);
  });
  it('choisir : --cas inconnu refusé ; --groupe filtre', () => {
    expect(() => choisir(verite, { cas: ['zz'] })).toThrow(/inconnu/);
    expect(choisir(verite, { groupes: ['piege'] }).every(p => p.groupe === 'piege')).toBe(true);
  });
});

describe('le juge : produit par produit et champ par champ', () => {
  it('une passe simulée avec ses fautes fabriquées : le juge voit chacune, et seulement celles-là', async () => {
    const passe = await runBench(parseArgs(['--simuler', '--out', dossier()]), { log: sansLog, references: [] });
    const { juges, synthese } = jugerTout(verite, passe.appels);
    const v = Object.fromEntries(juges.map(j => [j.id, j.verdict]));
    expect(Object.keys(FAUTES).sort()).toEqual(['f04', 'f10', 'p03', 'p05', 'p08', 'p09', 'x01', 'x02']);
    expect(v).toMatchObject({ p03: 'introuvable-a-tort', p05: 'a-corriger', p08: 'avec-invention', f04: 'attribue-a-tort', f10: 'avec-invention', x01: 'fiche-inventee', x02: 'fiche-inventee' });
    // p09 cite un blog : la valeur est juste, la source ne l'est pas.
    expect(juges.find(j => j.id === 'p09')!.source.classe).toBe('blog-ou-revendeur');
    const sains = juges.filter(j => !(j.id in FAUTES));
    expect(sains.filter(j => !['ok', 'introuvable-a-raison'].includes(j.verdict)).map(j => j.id)).toEqual([]);
    expect(synthese.inventes).toBe(5);   // p08 (moyenne), f04 (chiffre attribué), f10 (sans source), x01 et x02 (fiches inventées)
    expect(synthese.violationsM2).toBe(0);
    expect(synthese.introuvablesATort).toBe(1);
    expect(synthese.coutParAppel.moyen).toBeGreaterThan(0);
    expect(existsSync(path.join(passe.out, 'JUGEMENT.md'))).toBe(true);
    expect(existsSync(path.join(passe.out, 'appels.json'))).toBe(true);
  });
  it('sans fautes fabriquées : zéro invention, zéro introuvable à tort, chaque piège rendu « introuvable »', async () => {
    const passe = await runBench(parseArgs(['--simuler', '--sans-fautes', '--out', dossier()]), { log: sansLog, references: [] });
    const { juges, synthese } = jugerTout(verite, passe.appels);
    expect(synthese.inventes).toBe(0);
    expect(synthese.introuvablesATort).toBe(0);
    expect(juges.filter(j => j.groupe === 'piege').every(j => j.verdict === 'introuvable-a-raison')).toBe(true);
    expect(juges.filter(j => j.groupe !== 'piege').every(j => j.verdict === 'ok' || j.verdict === 'introuvable-a-raison')).toBe(true);
  });
  it('les verdicts de champ : juste, dans la plage, faux, inventé (moyenne, absent de la fiche, sans source)', () => {
    const o = { moyenneInterdite: true, sourceCitee: true };
    expect(jugerChamp('a', { plage: [78, 82] }, { plage: [78, 82] }, o).verdict).toBe('juste');
    expect(jugerChamp('a', { plage: [78, 82] }, { plage: [79, 81] }, o).verdict).toBe('dans-la-plage');
    expect(jugerChamp('a', { plage: [78, 82] }, { plage: [70, 90] }, o).verdict).toBe('faux');
    expect(jugerChamp('a', { plage: [78, 82] }, { valeur: 80 }, o).verdict).toBe('invente');
    expect(jugerChamp('a', { plage: [78, 82] }, { valeur: 80 }, { ...o, moyenneInterdite: false }).verdict).toBe('dans-la-plage');
    expect(jugerChamp('a', { plage: [78, 82] }, { valeur: 78 }, o).verdict).toBe('dans-la-plage');
    expect(jugerChamp('a', { plage: [78, 82] }, { valeur: 60 }, o).verdict).toBe('faux');
    expect(jugerChamp('a', { valeur: 14 }, { valeur: 14 }, o).verdict).toBe('juste');
    expect(jugerChamp('a', { nePublie: true }, { valeur: 5 }, o).verdict).toBe('invente');
    expect(jugerChamp('a', { nePublie: true }, undefined, o).verdict).toBe('absent-a-raison');
    expect(jugerChamp('a', { plage: [1, 2] }, undefined, o).verdict).toBe('absent-a-tort');
    expect(jugerChamp('a', { plage: [78, 82] }, { plage: [78, 82] }, { ...o, sourceCitee: false }).verdict).toBe('invente');
    expect(jugerChamp('a', undefined, { valeur: 3 }, { ...o, sourceCitee: false }).verdict).toBe('invente');
    expect(jugerChamp('a', undefined, { valeur: 3 }, o).verdict).toBe('non-verifie');
    expect(jugerChamp('f', { texte: 'medium' }, { texte: 'Medium / fast sedimentation' }, o).verdict).toBe('juste');
    expect(jugerChamp('f', { texte: 'medium' }, { texte: 'High' }, o).verdict).toBe('faux');
  });
  it('la source : producteur, racine seule, blog ou revendeur, autre, sans adresse, sans source', () => {
    expect(classerSource('Fermentis', 'https://fermentis.com/en/product/safale-us-05/', verite).classe).toBe('producteur');
    expect(classerSource('Fermentis', 'https://www.fermentis.com/', verite).classe).toBe('racine-producteur');
    expect(classerSource('Forum', 'https://www.homebrewtalk.com/threads/1', verite).classe).toBe('blog-ou-revendeur');
    expect(classerSource('Autre', 'https://example.org/x', verite).classe).toBe('autre');
    expect(classerSource('Fermentis', undefined, verite).classe).toBe('sans-url');
    expect(classerSource('  ', 'https://fermentis.com/x', verite).classe).toBe('sans-source');
  });
  it('M2 : un houblon dont la procédure f4 écrirait une valeur est signalé ; valeursDeReponse n’écrit jamais rien pour un houblon', () => {
    expect(valeursDeReponse('houblon', { found: true, name: 'Citra', source: 'Yakima Chief', alphaPct: 12 } as any)).toBeUndefined();
    const p = verite.produits.find(x => x.id === 'p04')!;
    const appel: Appel = { id: 'p04', famille: 'houblon', kind: 'houblon', nom: 'Citra', chemin: 'assistant', garde: { decision: 'aucune-recherche', raison: '' }, etat: 'repondu', tentatives: [],
      reponse: { found: true, source: 'Yakima Chief', sourceUrl: 'https://www.yakimachief.com/hops/citra', alphaPct: 12 }, facts: { alphaPct: 12 }, ecritF4: { valeurs: { alphaPct: 12 }, source: 's', deduit: {} }, coutMicro: 90_000, ms: 6000 };
    expect(jugerProduit(p, appel, verite).violeM2).toBe(true);
    expect(jugerProduit(p, { ...appel, ecritF4: null }, verite).violeM2).toBe(false);
  });
  it('une fiche de levure sans source documentaire est refusée comme par la production (yeastLookupResultError) : introuvable', async () => {
    const p = verite.produits.find(x => x.id === 'p10')!;
    const nue = { found: true, name: 'WLP001', source: 'White Labs', sourceUrl: 'https://www.whitelabs.com/', attenuationPct: 80, technicalFacts: [] };
    const passe = await runBench(parseArgs(['--simuler', '--cas', 'p10', '--out', dossier()]),
      { log: sansLog, references: [], transport: async () => ({ ms: 5000, json: { candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(nue) }] }, groundingMetadata: { webSearchQueries: ['a'] } }], usageMetadata: { promptTokenCount: 1000, candidatesTokenCount: 100, totalTokenCount: 1100 } } }) });
    expect(passe.appels[0].refusLevure).toMatch(/sources documentaires/);
    expect(jugerProduit(p, passe.appels[0], verite).verdict).toBe('introuvable-a-tort');
  });
  it('une réponse coupée par la limite de sortie n’est pas redemandée', async () => {
    let appels = 0;
    const passe = await runBench(parseArgs(['--simuler', '--cas', 'f05', '--out', dossier()]),
      { log: sansLog, references: [], transport: async () => { appels++; return { ms: 9000, json: { candidates: [{ finishReason: 'MAX_TOKENS', content: { parts: [{ text: '{"found":' }] } }], usageMetadata: { promptTokenCount: 1000, candidatesTokenCount: 4500, totalTokenCount: 5500 } } }; } });
    expect(appels).toBe(1);
    expect(passe.appels[0]).toMatchObject({ etat: 'echec' });
    expect(passe.appels[0].tentatives[0].etat).toBe('inutilisable');
  });
});

describe('la réponse fabriquée passe la garde du serveur', () => {
  it('chaque fiche de levure fabriquée est acceptée par yeastLookupResultError, et chiffrée par quoteGeminiCost', async () => {
    const { yeastLookupResultError } = await import('../../functions/src/yeastLookupResult');
    for (const p of verite.produits.filter(x => x.famille === 'levure' && x.attendu.existe && !x.attendu.ambigu && !x.attendu.horsPerimetre)) {
      expect(yeastLookupResultError(reponseFabriquee(p)), p.id).toBeUndefined();
      expect(quoteGeminiCost('gemini-3.8-flash', preparer(p, []).body[0]).reservedMicroChf, p.id).toBeGreaterThan(0);
    }
  });
});

describe('aucun résidu', () => {
  it('le test n’a écrit ni dans le journal de la mission ni ailleurs que dans des dossiers temporaires', () => {
    const journal = MISSION_JOURNAL;
    const avant = existsSync(journal) ? readFileSync(journal, 'utf8') : '';
    writeFileSync(path.join(dossier(), 'x'), '');
    expect(existsSync(journal) ? readFileSync(journal, 'utf8') : '').toBe(avant);
  });
});

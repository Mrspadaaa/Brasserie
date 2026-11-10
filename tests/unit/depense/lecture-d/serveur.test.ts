// Voie s-serveur (mission 2026-10-31-ecran-depense, D308/D310, PLAN § 5 « S, serveur ») : la lenteur D, le provisoire en flux côté serveur.
// Dix témoins, écrits AVANT le code (L13) : ils échouaient sur l'arbre d'avant (aucun `io.provisoire`, aucun `rangProvisoire`, aucun jeton).
// Gemini est entièrement simulé (lectures fictives de la forme de `invoiceScanCsv8.test.ts`) : aucun appel réel, aucune valeur d'une vraie pièce.
import { beforeEach, afterEach, describe, it, expect, vi } from 'vitest';
const budget = vi.hoisted(() => ({ run: null as any }));
vi.mock('../../../../functions/src/invoiceScanBudget', () => ({ runBudgetedInvoiceScan: (...args: any[]) => budget.run(...args) }));
import { logger } from '../../../../functions/node_modules/firebase-functions';
import { scanInvoiceSafely } from '../../../../functions/src/ai';
import { lireCsv8, type Csv8Io } from '../../../../functions/src/invoiceScanVote';
import { alignerLignes, ScanReadCutError } from '../../../../functions/src/invoiceVisionReview';
import { readFileSync } from 'node:fs';
import { SCAN_MODEL, engineDigestOf, normalizeInvoiceScan } from '../../../../functions/src/invoiceScanCore';
import { INVOICE_SCAN_PROMPTS } from '../../../../functions/src/invoiceScanPrompts';

// ---------------------------------------------------------------------------------------------------------------------
// Pièces fictives
// ---------------------------------------------------------------------------------------------------------------------
type Ligne = { name: string; kind?: string; quantity: number; unit: string; price: number; amountTTC: number };
const MALT: Ligne = { name: 'Malt Pilsner', quantity: 25, unit: 'kg', price: 2, amountTTC: 50 };
const HOUBLON: Ligne = { name: 'Houblon Citra', quantity: 1, unit: 'kg', price: 40, amountTTC: 40 };
const LEVURE: Ligne = { name: 'Levure US-05', quantity: 10, unit: 'pièce', price: 4, amountTTC: 40 };
const piece = (items: Ligne[], extra: Record<string, unknown> = {}) => ({
  vendor: 'Fournisseur', currency: 'CHF', date: '09.09.2026', invoiceNumber: 'F-42', amountHT: 100, tvaAmount: 8.1, amountTTC: 108.1, tvaRate: .081,
  items: items.map(item => ({ kind: 'stock', ...item })), ...extra });
const lu = (data: any) => normalizeInvoiceScan(data) as any;
/** Deux Flash-Lite en désaccord sur le total (ce qui appelle la 3.8) ; les lignes sont celles de la première. */
const EN_DESACCORD = (items: Ligne[]) => ({ l1: piece(items), l2: piece(items, { amountTTC: 118.1 }) });

const CUT = Symbol('cut');
const causeOf = (reason: unknown) => reason instanceof ScanReadCutError ? 'sortie' as const : null;
/** Un `Csv8Io` simulé : une lecture est un objet (lisible), CUT (coupée) ou un Error ; la 3.8 peut être retenue par une porte. */
function banc(lectures: { l1: any; l2: any; s3?: any }, options: { provisoire?: Csv8Io['provisoire']; portes?: boolean } = {}) {
  const events: string[] = [];
  let ouvrir!: () => void;
  const porte = new Promise<void>(resolve => { ouvrir = resolve; });
  const lire = (valeur: any) => valeur === CUT ? Promise.reject(new ScanReadCutError('MAX_TOKENS')) : valeur instanceof Error ? Promise.reject(valeur) : Promise.resolve(lu(valeur));
  const io: Csv8Io = {
    readLite: n => lire(n === 1 ? lectures.l1 : lectures.l2),
    readStrong: async () => { events.push('3.8 part'); if (options.portes) await porte; const r = await lire(lectures.s3 ?? CUT); events.push('3.8 rend'); return r; },
    causeOf, deadlineReached: () => false,
    ...(options.provisoire ? { provisoire: (data: any) => { events.push('provisoire'); return options.provisoire!(data); } } : {})
  };
  return { io, events, ouvrir };
}
const sansRang = (items: any[]) => items.map(({ rangProvisoire: _r, ...ligne }) => ligne);

// ---------------------------------------------------------------------------------------------------------------------
// 1 à 4 : quand le provisoire part, et ce qu'il contient
// ---------------------------------------------------------------------------------------------------------------------
describe('s-serveur — le provisoire part entre les Flash-Lite et la 3.8', () => {
  it('T1 : deux Flash-Lite en désaccord appellent io.provisoire une fois, AVANT que la 3.8 ne rende', async () => {
    const recu: any[] = [];
    const { io, events, ouvrir } = banc({ ...EN_DESACCORD([MALT]), s3: piece([MALT]) }, { provisoire: data => { recu.push(data); }, portes: true });
    const attente = lireCsv8(io);
    await vi.waitFor(() => expect(events).toContain('3.8 part'));
    expect(recu).toHaveLength(1);              // parti pendant que la 3.8 est retenue : il ne l'attend pas
    expect(events).toEqual(['provisoire', '3.8 part']);
    ouvrir();
    await attente;
    expect(events).toEqual(['provisoire', '3.8 part', '3.8 rend']);
    expect(recu[0]).toMatchObject({ provisoire: true, review: { readers: 2 } });
  });
  it('T2 : deux Flash-Lite d’accord : aucun provisoire, et un résultat sans rang ni drapeau', async () => {
    const provisoire = vi.fn();
    const { io } = banc({ l1: piece([MALT]), l2: piece([MALT]) }, { provisoire });
    const data = await lireCsv8(io);
    expect(provisoire).not.toHaveBeenCalled();
    expect(data.items[0]).not.toHaveProperty('rangProvisoire');
    expect(data.review).toMatchObject({ readers: 2 });
  });
  it('T3 : une Flash-Lite coupée : aucun provisoire (on attend la 3.8), le final garde sa forme d’aujourd’hui', async () => {
    const provisoire = vi.fn();
    const { io } = banc({ l1: piece([MALT]), l2: CUT, s3: piece([MALT]) }, { provisoire });
    const data = await lireCsv8(io);
    expect(provisoire).not.toHaveBeenCalled();
    expect(data.review).toMatchObject({ readers: 2 });
    expect(data.items[0]).not.toHaveProperty('rangProvisoire');
  });
  it('T3 bis : les deux Flash-Lite coupées : aucun provisoire non plus', async () => {
    const provisoire = vi.fn();
    const { io } = banc({ l1: CUT, l2: CUT, s3: piece([MALT]) }, { provisoire });
    await lireCsv8(io);
    expect(provisoire).not.toHaveBeenCalled();
  });
  it('T4 : le provisoire ne contient aucun point « lecture-coupee » ni la phrase du contrôle complémentaire', async () => {
    const recu: any[] = [];
    const { io } = banc({ ...EN_DESACCORD([MALT]), s3: piece([MALT]) }, { provisoire: data => { recu.push(data); } });
    await lireCsv8(io);
    const [provisoire] = recu;
    expect(provisoire.points.some((p: any) => p.code === 'lecture-coupee')).toBe(false);
    expect([...provisoire.issues, ...provisoire.review.findings].join(' ')).not.toContain('contrôle complémentaire');
    expect(provisoire.review.status).toBe('disputed');          // les deux lectures divergent : à confirmer, comme le final d'aujourd'hui
  });
  it('T4 bis : le provisoire est une copie : le final ne le mute pas', async () => {
    const recu: any[] = [];
    const { io } = banc({ ...EN_DESACCORD([MALT]), s3: CUT }, { provisoire: data => { recu.push(data); } });
    await lireCsv8(io);                                           // 3.8 en échec : ajouterCoupure s'applique au FINAL, pas au morceau parti
    expect(recu[0].points.some((p: any) => p.code === 'lecture-coupee')).toBe(false);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// 5 : la 3.8 en échec
// ---------------------------------------------------------------------------------------------------------------------
describe('s-serveur — la 3.8 en échec', () => {
  it('T5 : les valeurs finales égalent celles du provisoire, avec le point de coupure en plus', async () => {
    const recu: any[] = [];
    const { io } = banc({ ...EN_DESACCORD([MALT, HOUBLON]), s3: CUT }, { provisoire: data => { recu.push(data); } });
    const final = await lireCsv8(io);
    const [provisoire] = recu;
    expect(sansRang(final.items)).toEqual(provisoire.items);
    expect(final.amountTTC).toBe(provisoire.amountTTC);
    expect(final.vendor).toBe(provisoire.vendor);
    const coupure = final.points.filter((p: any) => p.code === 'lecture-coupee');
    expect(coupure).toHaveLength(1);
    expect(coupure[0]).toMatchObject({ luTexte: 'sortie', pese: true });
    expect(final.points.filter((p: any) => p.code !== 'lecture-coupee')).toEqual(provisoire.points);
    expect(final.issues.join(' ')).toContain('contrôle complémentaire n’a pas abouti');
    // sans 3.8, chaque ligne finale est sa ligne provisoire : le rang est l'identité
    expect(final.items.map((ligne: any) => ligne.rangProvisoire)).toEqual([0, 1]);
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// 6 et 7 : le rang provisoire de chaque ligne finale
// ---------------------------------------------------------------------------------------------------------------------
describe('s-serveur — rangProvisoire', () => {
  it('T6 : une ligne ajoutée par la 3.8 a rangProvisoire null ; une ligne permutée garde son rang', async () => {
    const { io } = banc({ ...EN_DESACCORD([MALT, HOUBLON]), s3: piece([LEVURE, HOUBLON, MALT]) }, { provisoire: () => undefined });
    const final = await lireCsv8(io);
    expect(final.items.map((ligne: any) => [ligne.name, ligne.rangProvisoire])).toEqual([['Levure US-05', null], ['Houblon Citra', 1], ['Malt Pilsner', 0]]);
  });
  it('T6 bis : une ligne que les deux Flash-Lite lisent et que la 3.8 ne lit plus reste (vote à deux contre un, Sun Store), à son rang', async () => {
    const { io } = banc({ ...EN_DESACCORD([MALT, HOUBLON, LEVURE]), s3: piece([MALT, LEVURE]) }, { provisoire: () => undefined });
    const final = await lireCsv8(io);
    expect(final.items.map((ligne: any) => ligne.rangProvisoire)).toEqual([0, 1, 2]);
  });
  it('T7 : une pièce d’une ligne dont la 3.8 change le nom et le montant : rangProvisoire 0', async () => {
    const corrigee = { ...MALT, name: 'Malt Pilsner bio, sac de 25 kg', price: 2.08, amountTTC: 52 };
    // 2026-11-10 : deux pièces d'une seule ligne : la preuve est la pièce elle-même (l'aligneur rapproche)
    const paire = alignerLignes(lu(piece([MALT])).items, lu(piece([corrigee])).items);
    expect(paire.match.size).toBe(1);
    const { io } = banc({ ...EN_DESACCORD([MALT]), s3: piece([corrigee]) }, { provisoire: () => undefined });
    const final = await lireCsv8(io);
    expect(final.items).toHaveLength(1);
    expect(final.items[0]).toMatchObject({ name: 'Malt Pilsner bio, sac de 25 kg', rangProvisoire: 0 });
  });
  it('T7 bis : aucune paire par la position : la ligne des deux Flash-Lite reste (en tête), les deux de la 3.8 sont ajoutées', async () => {
    const autre = { ...MALT, name: 'Sac de farine', quantity: 3, unit: 'sac', price: 9, amountTTC: 27 };
    const { io } = banc({ ...EN_DESACCORD([MALT]), s3: piece([autre, HOUBLON]) }, { provisoire: () => undefined });
    const final = await lireCsv8(io);
    expect(final.items.map((ligne: any) => ligne.rangProvisoire)).toEqual([0, null, null]);
  });
  it('T7 ter : sans io.provisoire (client sans flux), le final n’a aucun rang : forme d’aujourd’hui', async () => {
    const { io } = banc({ ...EN_DESACCORD([MALT]), s3: piece([MALT]) });
    const final = await lireCsv8(io);
    expect(final.items[0]).not.toHaveProperty('rangProvisoire');
    expect(final).not.toHaveProperty('provisoire');
  });
});

// ---------------------------------------------------------------------------------------------------------------------
// 8 à 10 : par scanInvoiceSafely, sur un désaccord simulé par fetch (forme de invoiceScanCsv8.test.ts)
// ---------------------------------------------------------------------------------------------------------------------
const fetchMock = vi.fn();
const fichier = { mimeType: 'image/jpeg', data: Buffer.from([255, 216, 255, 217]).toString('base64') };
const reponse = (data: any) => ({ ok: true, json: async () => ({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(data) }] } }], usageMetadata: { totalTokenCount: 100 } }) });
/** La consigne (1, 2 ou 3) d'un appel ; pour des pages, la consigne est suivie de la note « captures successives ». */
const lecture = (options: any) => { const texte: string = JSON.parse(options.body).contents[0].parts[0].text; return INVOICE_SCAN_PROMPTS.findIndex(prompt => texte.startsWith(prompt)) + 1; };
function jouer(plan: { 1: any; 2: any; 3?: any }, avantTroisieme?: () => Promise<void>) {
  fetchMock.mockImplementation(async (_url: string, options: any) => {
    const n = lecture(options) as 1 | 2 | 3;
    if (n === 3) await avantTroisieme?.();
    const valeur = plan[n];
    if (valeur === undefined) throw new Error(`appel imprévu : ${n}`);
    return reponse(valeur);
  });
}
const DESACCORD = { 1: piece([MALT]), 2: piece([MALT], { amountTTC: 118.1 }), 3: piece([MALT]) };
beforeEach(() => {
  fetchMock.mockReset(); vi.stubGlobal('fetch', fetchMock);
  vi.spyOn(logger, 'info').mockImplementation(() => undefined); vi.spyOn(logger, 'warn').mockImplementation(() => undefined);
  budget.run = async (_uid: any, _file: any, work: any, provider: any) => ({ result: await work(provider), cached: false, documentHash: 'document-hash' });
});
afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks(); });

describe('s-serveur — scanInvoiceSafely et le jeton', () => {
  it('T8 : scanInvoiceSafely(uid, file, apiKey, undefined, { jeton, onProvisoire }) l’appelle sur un désaccord, avant la 3.8 ; le final porte provisoireJeton === jeton', async () => {
    const events: string[] = [];
    let ouvrir!: () => void;
    const porte = new Promise<void>(resolve => { ouvrir = resolve; });
    jouer(DESACCORD, async () => { events.push('3.8 demandée'); await Promise.race([porte, new Promise(resolve => setTimeout(resolve, 1500))]); events.push('3.8 rend'); });
    const recu: any[] = [];
    const jeton = 'jeton-de-cet-appel';
    const final: any = await scanInvoiceSafely('u', fichier, 'fake-test-key', undefined, {
      jeton, onProvisoire: (data: any, meta: any) => { events.push('provisoire'); recu.push({ data, meta }); ouvrir(); } });
    expect(events).toEqual(['provisoire', '3.8 demandée', '3.8 rend']);   // le morceau part avant la 3.8, qui ne l'attend pas
    expect(recu).toHaveLength(1);
    expect(recu[0].data).toMatchObject({ provisoire: true, review: { readers: 2 } });
    expect(recu[0].meta).toMatchObject({ model: SCAN_MODEL });
    expect(recu[0].meta.elapsedMs).toEqual(expect.any(Number));
    expect(recu[0].meta).not.toHaveProperty('pages');
    expect(final).toMatchObject({ ok: true, data: { provisoireJeton: jeton, review: { readers: 3 } } });
    expect(final.data.items[0].rangProvisoire).toBe(0);
    expect(fetchMock).toHaveBeenCalledTimes(3);                    // les mêmes appels qu'aujourd'hui : deux Flash-Lite et une 3.8
  });
  it('T8 bis : plusieurs pages : le morceau le dit (pages)', async () => {
    jouer(DESACCORD);
    const recu: any[] = [];
    await scanInvoiceSafely('u', [fichier, { ...fichier, data: Buffer.from([255, 216, 255, 217, 0]).toString('base64') }], 'fake-test-key', undefined,
      { jeton: 'j', onProvisoire: (data: any, meta: any) => { recu.push({ data, meta }); } });
    expect(recu[0].meta.pages).toBe(2);
  });
  it('T8 ter : sans flux (ancien client, ou serveur sans SSE), ni jeton ni rang : la forme d’aujourd’hui', async () => {
    jouer(DESACCORD);
    const final: any = await scanInvoiceSafely('u', fichier, 'fake-test-key');
    expect(final.data).not.toHaveProperty('provisoireJeton');
    expect(final.data.items[0]).not.toHaveProperty('rangProvisoire');
    expect(fetchMock).toHaveBeenCalledTimes(3);
  });
  it('T8 quater : deux Flash-Lite d’accord : pas de provisoire, pas de jeton', async () => {
    jouer({ 1: piece([MALT]), 2: piece([MALT]) });
    const onProvisoire = vi.fn();
    const final: any = await scanInvoiceSafely('u', fichier, 'fake-test-key', undefined, { jeton: 'j', onProvisoire });
    expect(onProvisoire).not.toHaveBeenCalled();
    expect(final.data).not.toHaveProperty('provisoireJeton');
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
  it('T9 : un final servi du cache ne porte pas le jeton de l’appel, et aucun morceau ne part', async () => {
    // Préalable : un appel frais, lui, porte le jeton de cet appel (sinon le témoin ne prouverait rien).
    jouer(DESACCORD);
    const frais: any = await scanInvoiceSafely('u', fichier, 'fake-test-key', undefined, { jeton: 'jeton-de-cet-appel', onProvisoire: () => undefined });
    expect(frais.data.provisoireJeton).toBe('jeton-de-cet-appel');
    fetchMock.mockReset();
    const deCache = { ...lu(piece([MALT])), items: [{ ...lu(piece([MALT])).items[0], rangProvisoire: 0 }], provisoireJeton: 'jeton-d-un-ancien-appel' };
    budget.run = async () => ({ result: deCache, cached: true, documentHash: 'document-hash' });
    const onProvisoire = vi.fn();
    const final: any = await scanInvoiceSafely('u', fichier, 'fake-test-key', undefined, { jeton: 'jeton-de-cet-appel', onProvisoire });
    expect(onProvisoire).not.toHaveBeenCalled();
    expect(final.cached).toBe(true);
    expect(final.data.provisoireJeton).not.toBe('jeton-de-cet-appel');
    expect(fetchMock).not.toHaveBeenCalled();
  });
  it('T9 bis : un résultat dégradé resservi après une relecture ratée (cached: true alors qu’un morceau est parti) ne porte pas le jeton', async () => {
    const dégradé = lu(piece([MALT]));
    budget.run = async (_uid: any, _file: any, work: any, provider: any) => {
      await work(provider).catch(() => undefined);                 // la relecture a tourné (un morceau est parti), puis a échoué : l'ancien résultat est servi
      return { result: dégradé, cached: true, documentHash: 'document-hash' };
    };
    jouer(DESACCORD);
    const onProvisoire = vi.fn();
    const final: any = await scanInvoiceSafely('u', fichier, 'fake-test-key', undefined, { jeton: 'jeton-de-cet-appel', onProvisoire });
    expect(onProvisoire).toHaveBeenCalledTimes(1);
    expect(final.data).not.toHaveProperty('provisoireJeton');
  });
  it('T9 ter : le jeton n’entre pas dans ce que le registre garde (le résultat gardé est celui du travail, pas la copie rendue)', async () => {
    jouer(DESACCORD);
    let garde: any;
    budget.run = async (_uid: any, _file: any, work: any, provider: any) => { garde = await work(provider); return { result: garde, cached: false, documentHash: 'document-hash' }; };
    const final: any = await scanInvoiceSafely('u', fichier, 'fake-test-key', undefined, { jeton: 'j', onProvisoire: () => undefined });
    expect(final.data.provisoireJeton).toBe('j');
    expect(garde).not.toHaveProperty('provisoireJeton');
    expect(garde.items[0].rangProvisoire).toBe(0);                  // le rang, lui, se garde : c'est un ajout facultatif
    // Firestore refuse `undefined` : un rang est un nombre ou null, jamais absent de la valeur
    expect(garde.items.every((ligne: any) => ligne.rangProvisoire === null || Number.isInteger(ligne.rangProvisoire))).toBe(true);
  });
  it('T10 : un onProvisoire qui lève ne change pas le final : celui d’un appel sans flux, sans jeton ni rang', async () => {
    jouer(DESACCORD);
    const sans: any = await scanInvoiceSafely('u', fichier, 'fake-test-key');
    fetchMock.mockClear();
    jouer(DESACCORD);
    const onProvisoire = vi.fn(() => { throw new Error('canal fermé'); });
    const leve: any = await scanInvoiceSafely('u', fichier, 'fake-test-key', undefined, { jeton: 'j', onProvisoire });
    expect(onProvisoire).toHaveBeenCalledTimes(1);                 // il a bien été appelé, et a levé
    expect(leve.ok).toBe(true);
    expect({ ...leve.data }).toEqual({ ...sans.data });
    expect(leve.data).not.toHaveProperty('provisoireJeton');
    expect(fetchMock).toHaveBeenCalledTimes(3);                    // la 3.8 est partie quand même
  });
  it('T10 bis : un onProvisoire qui rend une promesse rejetée ne fait ni échouer la lecture ni rejet non traité', async () => {
    jouer(DESACCORD);
    const final: any = await scanInvoiceSafely('u', fichier, 'fake-test-key', undefined, { jeton: 'j', onProvisoire: () => Promise.reject(new Error('canal fermé')) });
    expect(final.ok).toBe(true);
    expect(final.data.review.readers).toBe(3);
    await new Promise(resolve => setTimeout(resolve, 20));        // laisse passer un éventuel rejet non traité
  });
  it('T10 ter : sur Lite lisible, la 3.8 en échec : le final est le provisoire plus la coupure, avec jeton et rangs identité', async () => {
    jouer({ 1: piece([MALT, HOUBLON]), 2: piece([MALT, HOUBLON], { amountTTC: 118.1 }) });   // 3 : « appel imprévu » → la 3.8 échoue
    const recu: any[] = [];
    const final: any = await scanInvoiceSafely('u', fichier, 'fake-test-key', undefined, { jeton: 'j', onProvisoire: (data: any) => { recu.push(data); } });
    expect(final.data.provisoireJeton).toBe('j');
    expect(sansRang(final.data.items)).toEqual(recu[0].items);
    expect(final.data.items.map((ligne: any) => ligne.rangProvisoire)).toEqual([0, 1]);
    expect(final.data.points.some((p: any) => p.code === 'lecture-coupee')).toBe(true);
  });
});

describe('s-serveur — l’empreinte du moteur suit ces modules', () => {
  // Ce port modifie ai.ts, invoiceScanVote.ts et invoiceVisionReview.ts : l'identifiant du cache change (une pièce lue et jamais enregistrée est
  // relue, environ 0,0445 CHF). Le test le dit sans figer une valeur : changer une ligne de chacun de ces trois modules change l'empreinte.
  const source = (module: string) => readFileSync(new URL(`../../../../functions/src/${module}.ts`, import.meta.url), 'utf8');
  it.each(['ai', 'invoiceScanVote', 'invoiceVisionReview'])('une ligne de plus dans %s change l’empreinte, donc la clé de cache', module => {
    const avant = engineDigestOf(source).digest;
    expect(engineDigestOf(m => m === module ? `${source(m)}\n// une ligne de plus` : source(m)).digest).not.toBe(avant);
    expect(engineDigestOf(source).modules).toContain(module);
  });
});

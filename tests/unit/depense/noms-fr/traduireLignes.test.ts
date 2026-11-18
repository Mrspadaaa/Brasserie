// Voie f5c-noms-prod (D271, D275, D278, D280) : le client de la traduction des noms. Gemini est simulé par `run` ; aucun réseau.
import { beforeEach, describe, expect, it, vi } from 'vitest';
vi.mock('firebase/functions', () => ({ httpsCallable: () => vi.fn() }));
vi.mock('../../../../src/services/firebase', () => ({ functions: {} }));

import {
  NOMS_DATABASE_NAME, creerTableDexie, creerTableMemoire, retenirNomBrasseur, traduireLignes, type LigneANommer, type TableNoms
} from '../../../../src/services/nomsFr';
import { NOMS_MAX_ENTREES, cleBase } from '../../../../src/domain/nomsBase';

// Des noms d'achat inventés (aucune pièce réelle).
const ligne = (name: string, extra: Partial<LigneANommer> = {}): LigneANommer => ({ name, kind: 'stock', stockCategory: '', unit: '', variant: '', ...extra });
type Req = { task: string; tier?: string; context?: any; instruction?: string; file?: unknown };
/** Le « Gemini » simulé : chaque entrée reçoit « FR <base> ». */
const repondre = (req: Req) => ({ ok: true, data: { noms: req.context.entrees.map((entree: any) => ({ i: entree.i, nameFr: `FR ${entree.base}` })) } });
const gabarit = () => vi.fn(async (req: Req) => repondre(req));
const stockDe = (...articles: Array<[string, string]>) => articles.map(([ref, name]) => ({ ref, name }));

let table: ReturnType<typeof creerTableMemoire>;
beforeEach(() => { table = creerTableMemoire(); });

describe('f5c — table vide : un appel, la Map', () => {
  it('un seul appel pour la pièce ; entrées { i, base, kind, stockCategory } sur les noms de base, rien d’autre ; la Map porte le français par rang', async () => {
    const run = gabarit();
    const lignes = [
      ligne('Hopfensack fein', { kind: 'equipment', unit: 'Stk', quantity: 3, amountTTC: 12.5, price: 4 } as any),
      ligne('CARABELGE®, Kg', { stockCategory: 'Malt', unit: 'kg', variant: 'Mischung: Einzelprodukt, Schrotung: geschrotet [+CHF 0.10]' }),
      ligne('Tuyau en silicone 10x14mm', { kind: 'equipment' })
    ];
    const noms = await traduireLignes(lignes, { enLigne: true, run, table });
    expect(run).toHaveBeenCalledTimes(1);
    const req = run.mock.calls[0][0];
    expect(req.task).toBe('traduireNoms');
    expect(req.tier).toBe('fast');
    expect(req.file).toBeUndefined();
    expect(req.instruction).toBeUndefined();
    expect(req.context.entrees).toEqual([
      { i: 0, base: 'Hopfensack fein', kind: 'equipment', stockCategory: '' },
      { i: 1, base: 'CARABELGE®', kind: 'stock', stockCategory: 'Malt' },
      { i: 2, base: 'Tuyau en silicone 10x14mm', kind: 'equipment', stockCategory: '' }
    ]);
    // ni montant, ni quantité, ni unité, ni prix, ni image
    expect(JSON.stringify(req)).not.toMatch(/amount|quantity|price|unit|12\.5|inlineData|\[\+CHF/);
    expect([...noms]).toEqual([[0, 'FR Hopfensack fein'], [1, 'FR CARABELGE®'], [2, 'FR Tuyau en silicone 10x14mm']]);
    // ils sont gardés pour la prochaine fois
    expect([...table.rows.values()].map(row => [row.nameFr, row.par]).sort()).toEqual([['FR CARABELGE®', 'ia'], ['FR Hopfensack fein', 'ia'], ['FR Tuyau en silicone 10x14mm', 'ia']]);
    expect(table.rows.get(cleBase('CARABELGE®'))?.le).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
  it('une pièce vide, ou sans nom de base : aucun appel, Map vide', async () => {
    const run = gabarit();
    expect((await traduireLignes([], { enLigne: true, run, table })).size).toBe(0);
    expect((await traduireLignes([ligne(''), ligne('   ')], { enLigne: true, run, table })).size).toBe(0);
    expect(run).not.toHaveBeenCalled();
  });
});

describe('f5c — table pleine, ligne reliée, hors ligne : aucun appel', () => {
  it('table pleine : aucun appel au deuxième passage, la même Map', async () => {
    const run = gabarit();
    const lignes = [ligne('Hopfensack fein'), ligne('Premium Pilsner Malz')];
    const premier = await traduireLignes(lignes, { enLigne: true, run, table });
    const second = await traduireLignes(lignes, { enLigne: true, run, table });
    expect(run).toHaveBeenCalledTimes(1);
    expect([...second]).toEqual([...premier]);
    expect(second.size).toBe(2);
  });
  it('une base déjà connue ne repart pas, une base neuve oui : l’appel ne porte que la neuve', async () => {
    const run = gabarit();
    await traduireLignes([ligne('Hopfensack fein')], { enLigne: true, run, table });
    const noms = await traduireLignes([ligne('hopfensack  FEIN'), ligne('Gärglocke')], { enLigne: true, run, table });
    expect(run).toHaveBeenCalledTimes(2);
    expect(run.mock.calls[1][0].context.entrees).toEqual([{ i: 1, base: 'Gärglocke', kind: 'stock', stockCategory: '' }]);
    expect(noms.get(0)).toBe('FR Hopfensack fein');
    expect(noms.get(1)).toBe('FR Gärglocke');
  });
  it('ligne reliée à un article du stock : aucun appel pour elle, aucune entrée dans la table ; une autre ligne repart', async () => {
    const run = gabarit();
    const stock = stockDe(['MP-1', 'Sac à houblon fin']);
    const seule = await traduireLignes([ligne('Hopfensack fein', { stockAction: 'existing', stockRef: 'MP-1' })], { stock, enLigne: true, run, table });
    expect(run).not.toHaveBeenCalled();
    expect(seule.size).toBe(0);
    expect(table.rows.size).toBe(0);
    const noms = await traduireLignes([ligne('Hopfensack fein', { stockAction: 'existing', stockRef: 'MP-1' }), ligne('Gärglocke')], { stock, enLigne: true, run, table });
    expect(run).toHaveBeenCalledTimes(1);
    expect(run.mock.calls[0][0].context.entrees.map((entree: any) => entree.base)).toEqual(['Gärglocke']);
    expect([...noms]).toEqual([[1, 'FR Gärglocke']]);
  });
  it('« existing » vers un article absent du stock, ou « new » / « none » : la ligne n’est pas reliée, elle est traduite', async () => {
    const run = gabarit();
    const noms = await traduireLignes([
      ligne('Alpha', { stockAction: 'existing', stockRef: 'MP-fantome' }), ligne('Bravo', { stockAction: 'new' }), ligne('Charlie', { stockAction: 'none' })
    ], { stock: stockDe(['MP-1', 'Autre']), enLigne: true, run, table });
    expect(noms.size).toBe(3);
    expect(run).toHaveBeenCalledTimes(1);
  });
  it('hors ligne : aucun appel, Map vide, rien dans la table ; les bases déjà connues se servent quand même', async () => {
    const run = gabarit();
    const horsLigne = await traduireLignes([ligne('Hopfensack fein')], { enLigne: false, run, table });
    expect(run).not.toHaveBeenCalled();
    expect(horsLigne.size).toBe(0);
    expect(table.rows.size).toBe(0);
    await traduireLignes([ligne('Hopfensack fein')], { enLigne: true, run, table });
    run.mockClear();
    const connue = await traduireLignes([ligne('Hopfensack fein'), ligne('Inconnue')], { enLigne: false, run, table });
    expect(run).not.toHaveBeenCalled();
    expect([...connue]).toEqual([[0, 'FR Hopfensack fein']]);
  });
});

describe('f5c — échec, réponse illisible : rien, sans exception, un seul appel', () => {
  const lignes = () => [ligne('Hopfensack fein'), ligne('Gärglocke')];
  it.each([
    ['ok:false', async () => ({ ok: false, error: 'Service IA momentanément indisponible.' })],
    ['exception du client', async () => { throw new Error('réseau coupé'); }],
    ['sans données', async () => ({ ok: true })],
    ['données nulles', async () => ({ ok: true, data: null })],
    ['noms n’est pas une liste', async () => ({ ok: true, data: { noms: 'Sac' } })],
    ['liste d’autre chose', async () => ({ ok: true, data: { noms: [null, 3, 'x', { nameFr: 'sans i' }, { i: 0 }, { i: 0, nameFr: 7 }, { i: 1.5, nameFr: 'Demi' }, { i: '0', nameFr: 'Texte' }] } })],
    ['réponse vide', async () => undefined]
  ])('%s → Map vide, jamais d’exception, un appel, table vide', async (_nom, reponse) => {
    const run = vi.fn(reponse as any);
    const noms = await traduireLignes(lignes(), { enLigne: true, run, table });
    expect(noms.size).toBe(0);
    expect(run).toHaveBeenCalledTimes(1);
    expect(table.rows.size).toBe(0);
  });
  it('aucun nouvel essai : un échec ne relance pas, et un nouvel appel de l’écran reste un autre geste', async () => {
    const run = vi.fn(async () => ({ ok: false, error: 'x' }));
    await traduireLignes(lignes(), { enLigne: true, run, table });
    await new Promise(resolve => setTimeout(resolve, 30));
    expect(run).toHaveBeenCalledTimes(1);
  });
  it('une table qui lève (lecture ou écriture) ne casse rien : l’appel part, la Map est rendue', async () => {
    const casse: TableNoms = { lire: async () => { throw new Error('IndexedDB fermée'); }, poser: async () => { throw new Error('quota'); }, oublier: async () => { throw new Error('x'); } };
    const run = gabarit();
    const noms = await traduireLignes(lignes(), { enLigne: true, run, table: casse });
    expect(run).toHaveBeenCalledTimes(1);
    expect(noms.size).toBe(2);
  });
});

describe('f5c — une traduction tapée par le brasseur n’est jamais écrasée', () => {
  it('une base `brasseur` de la table est servie telle quelle, sans appel', async () => {
    const run = gabarit();
    await retenirNomBrasseur(ligne('Hopfensack fein'), 'Poche à houblon', { table });
    expect(table.rows.get(cleBase('Hopfensack fein'))).toMatchObject({ nameFr: 'Poche à houblon', par: 'brasseur' });
    const noms = await traduireLignes([ligne('Hopfensack fein')], { enLigne: true, run, table });
    expect(run).not.toHaveBeenCalled();
    expect(noms.get(0)).toBe('Poche à houblon');
  });
  it('course : la table ne l’annonçait pas à la lecture, le brasseur la tape pendant l’appel → la sienne reste, en table et dans la Map', async () => {
    const run = vi.fn(async (req: Req) => {
      await retenirNomBrasseur(ligne('Hopfensack fein'), 'Poche à houblon', { table });
      return repondre(req);
    });
    const noms = await traduireLignes([ligne('Hopfensack fein'), ligne('Gärglocke')], { enLigne: true, run, table });
    expect(table.rows.get(cleBase('Hopfensack fein'))).toMatchObject({ nameFr: 'Poche à houblon', par: 'brasseur' });
    expect(noms.get(0)).toBe('Poche à houblon');
    expect(noms.get(1)).toBe('FR Gärglocke');
  });
  it('la table elle-même refuse qu’une écriture `ia` remplace une `brasseur`, et laisse le brasseur se corriger lui-même', async () => {
    await table.poser({ cle: 'a', nameFr: 'Le sien', le: '2026-11-01T10:00:00.000Z', par: 'brasseur' });
    const gardee = await table.poser({ cle: 'a', nameFr: 'Celui de l’IA', le: '2026-11-01T11:00:00.000Z', par: 'ia' });
    expect(gardee).toMatchObject({ nameFr: 'Le sien', par: 'brasseur' });
    await table.poser({ cle: 'a', nameFr: 'Sa retouche', le: '2026-11-01T12:00:00.000Z', par: 'brasseur' });
    expect(table.rows.get('a')?.nameFr).toBe('Sa retouche');
    await table.poser({ cle: 'b', nameFr: 'IA 1', le: '2026-11-01T10:00:00.000Z', par: 'ia' });
    await table.poser({ cle: 'b', nameFr: 'IA 2', le: '2026-11-01T11:00:00.000Z', par: 'ia' });
    expect(table.rows.get('b')?.nameFr).toBe('IA 2');
  });
  it('effacer le nom tapé retire la ligne de la table : la base peut être retraduite', async () => {
    await retenirNomBrasseur(ligne('Hopfensack fein'), 'Poche à houblon', { table });
    await retenirNomBrasseur(ligne('Hopfensack fein'), '   ', { table });
    expect(table.rows.size).toBe(0);
  });
  it('le brasseur retouche une ligne dont l’imprimé porte des options : la clé est celle de la base, pas de l’imprimé', async () => {
    await retenirNomBrasseur(ligne('CARABELGE®, Kg', { unit: 'kg', variant: 'Schrotung: geschrotet' }), 'Carabelge', { table });
    expect(table.rows.get(cleBase('CARABELGE®'))).toMatchObject({ nameFr: 'Carabelge', par: 'brasseur' });
  });
});

describe('f5c — dédoublonnage et réponses douteuses', () => {
  it('deux lignes de même base (casse, accents, espaces) : une seule entrée dans l’appel, les deux rangs reçoivent le français', async () => {
    const run = gabarit();
    const noms = await traduireLignes([ligne('Sac à houblon'), ligne('Autre chose'), ligne('sac  A  HOUBLON'), ligne('')], { enLigne: true, run, table });
    expect(run.mock.calls[0][0].context.entrees.map((entree: any) => entree.i)).toEqual([0, 1]);
    expect(noms.get(0)).toBe('FR Sac à houblon');
    expect(noms.get(2)).toBe('FR Sac à houblon');
    expect(noms.has(3)).toBe(false);
    expect(table.rows.size).toBe(2);
  });
  it('un `i` inconnu ou répété est ignoré (le premier valable est retenu) ; une entrée sans réponse reste sans nom, et n’entre pas dans la table', async () => {
    const run = vi.fn(async () => ({ ok: true, data: { noms: [
      { i: 99, nameFr: 'Fantôme' }, { i: 0, nameFr: 'Premier' }, { i: 0, nameFr: 'Second' }, { i: -1, nameFr: 'Négatif' }
    ] } }));
    const noms = await traduireLignes([ligne('Alpha'), ligne('Bravo')], { enLigne: true, run, table });
    expect([...noms]).toEqual([[0, 'Premier']]);
    expect([...table.rows.values()].map(row => row.nameFr)).toEqual(['Premier']);
  });
  it('un nom vide ou d’espaces est ignoré ; les espaces sont réduits ; la longueur est bornée à 160', async () => {
    const run = vi.fn(async () => ({ ok: true, data: { noms: [{ i: 0, nameFr: '   ' }, { i: 1, nameFr: '  Cloche   de\tfermentation ' }, { i: 2, nameFr: 'x'.repeat(400) }] } }));
    const noms = await traduireLignes([ligne('Alpha'), ligne('Bravo'), ligne('Charlie')], { enLigne: true, run, table });
    expect(noms.has(0)).toBe(false);
    expect(noms.get(1)).toBe('Cloche de fermentation');
    expect(noms.get(2)).toHaveLength(160);
  });
  it('D379 : une très grande pièce part par tranches de 35 noms (« faire un take ») : les 50 lignes sont toutes nommées', async () => {
    const run = gabarit();
    const lignes = Array.from({ length: 50 }, (_, rang) => ligne(`Article numéro ${rang}`));
    const noms = await traduireLignes(lignes, { enLigne: true, run, table });
    expect(run).toHaveBeenCalledTimes(2);
    expect(run.mock.calls[0][0].context.entrees).toHaveLength(NOMS_MAX_ENTREES);
    expect(run.mock.calls[1][0].context.entrees).toHaveLength(50 - NOMS_MAX_ENTREES);
    expect(noms.size).toBe(50);
    expect(noms.has(34)).toBe(true);
    expect(noms.has(49)).toBe(true);
  });
});

describe('f5c — sans IndexedDB (jsdom, node, navigation privée) : pas de table, l’appel marche quand même', () => {
  it('creerTableDexie rend null sans IndexedDB, et la base s’appelle à part', () => {
    expect(typeof indexedDB).toBe('undefined');
    expect(creerTableDexie()).toBeNull();
    expect(NOMS_DATABASE_NAME).toBe('laffinee-noms');
  });
  it('par défaut (aucune table passée) : l’appel simulé rend la Map, rien n’est gardé, le passage suivant rappelle', async () => {
    const run = gabarit();
    const premier = await traduireLignes([ligne('Hopfensack fein')], { enLigne: true, run });
    const second = await traduireLignes([ligne('Hopfensack fein')], { enLigne: true, run });
    expect([...premier]).toEqual([[0, 'FR Hopfensack fein']]);
    expect([...second]).toEqual([[0, 'FR Hopfensack fein']]);
    expect(run).toHaveBeenCalledTimes(2);
  });
  it('table: null explicite = pas de table', async () => {
    const run = gabarit();
    const noms = await traduireLignes([ligne('Hopfensack fein')], { enLigne: true, run, table: null });
    expect(noms.size).toBe(1);
    await expect(retenirNomBrasseur(ligne('Hopfensack fein'), 'Poche', { table: null })).resolves.toBeUndefined();
  });
});

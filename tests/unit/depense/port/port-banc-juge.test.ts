// Voie port-total, P3 et P4 (D249) : le juge du banc ne compte plus le port comme une ligne, des deux côtés ; `comparerJugements` définit la perte.
// Vérités et lectures FABRIQUÉES (malt, houblon, port) : aucune donnée réelle, aucun appel Gemini.
import { describe, expect, it } from 'vitest';
import { comparerJugements, judgeBench, judgeResult, lignesSansPort, type DrawVerdict, type Verdict } from '../../../../scripts/banc-lecture-facture-juger';

const vMalt = { name: 'malt', kind: ['stock'], amountTTC: 10 };
const vHoublon = { name: 'houblon', kind: ['stock'], amountTTC: 20 };
const vPort = { name: 'port', kind: ['shipping'], amountTTC: 5 };
const lMalt = { name: 'Malt', kind: 'stock', amountTTC: 10 };
const lHoublon = { name: 'Houblon', kind: 'stock', amountTTC: 20 };
const lPort = (over: Record<string, unknown> = {}) => ({ name: 'Port', kind: 'shipping', amountTTC: 5, ...over });
const verite = (items: any[], total: number, extra: Record<string, unknown> = {}) => ({ amountTTC: total, items, ...extra });
const lecture = (items: any[], total: number) => ({ amountTTC: total, items });

describe('P3 n° 1 à 3 — le port n’est plus une ligne du jugement', () => {
  it('n° 1 : vérité malt + port, lecture malt + port : rien de faux, une ligne jugée', () => {
    const v = judgeResult(lecture([lMalt, lPort()], 15), verite([vMalt, vPort], 15));
    expect(v.wrong).toEqual([]);
    expect(v).toMatchObject({ lineJudged: 1, lineRight: 1 });
  });
  it('n° 2 : vérité malt + port, lecture malt seul (une consigne qui ne lit plus le port) : rien de faux', () => {
    expect(judgeResult(lecture([lMalt], 15), verite([vMalt, vPort], 15)).wrong).toEqual([]);
  });
  it('n° 3 : vérité malt seul, lecture malt + port : rien de faux', () => {
    expect(judgeResult(lecture([lMalt, lPort()], 15), verite([vMalt], 15)).wrong).toEqual([]);
  });
});

describe('P3 n° 4 à 8 — ce que le filtre ne masque pas', () => {
  it('n° 4 : un houblon oublié reste fautif (le filtre ne masque pas une vraie omission)', () => {
    const w = judgeResult(lecture([lMalt, lPort()], 15), verite([vMalt, vHoublon, vPort], 35)).wrong;
    expect(w).toEqual(expect.arrayContaining(['items.count', 'items.1']));
  });
  it('n° 5 : port lu en `service`, en dernier : seul `items.count` est faux, la ligne de malt reste juste', () => {
    const v = judgeResult(lecture([lMalt, lPort({ kind: 'service' })], 15), verite([vMalt], 15));
    expect(v.wrong).toEqual(['items.count']);
    expect(v.lineRight).toBe(1);
  });
  it('n° 6 : port lu en `service`, au milieu : `items.count` et les champs de la ligne décalée sont faux', () => {
    const v = judgeResult(lecture([lMalt, lPort({ kind: 'service' }), lHoublon], 35), verite([vMalt, vHoublon], 35));
    expect([...v.wrong].sort()).toEqual(['items.1.amountTTC', 'items.1.kind', 'items.1.name', 'items.count']);
  });
  it('n° 7 : document réduit à son port : jugé comme avant', () => {
    const v = judgeResult(lecture([lPort()], 5), verite([vPort], 5));
    expect(v.wrong).toEqual([]);
    expect(v.lineJudged).toBe(1);
  });
  it('n° 8 : un port lu sans montant ou à −2,00 n’est pas écarté : ligne ordinaire, donc en trop', () => {
    expect(judgeResult(lecture([lMalt, lPort({ amountTTC: null })], 10), verite([vMalt], 10)).wrong).toContain('items.count');
    expect(judgeResult(lecture([lMalt, lPort({ amountTTC: -2 })], 8), verite([vMalt], 8)).wrong).toContain('items.count');
  });
});

describe('P3 n° 9 — `portEnLigne: true` rend le jugement d’avant', () => {
  it('n° 1 : la ligne du port est jugée (deux lignes) ; n° 2 et 3 : `items.count` fautif', () => {
    expect(judgeResult(lecture([lMalt, lPort()], 15), verite([vMalt, vPort], 15), { portEnLigne: true }).lineJudged).toBe(2);
    expect(judgeResult(lecture([lMalt], 15), verite([vMalt, vPort], 15), { portEnLigne: true }).wrong).toContain('items.count');
    expect(judgeResult(lecture([lMalt, lPort()], 15), verite([vMalt], 15), { portEnLigne: true }).wrong).toContain('items.count');
  });
});

describe('P3 n° 10 — `lignesSansPort`', () => {
  it('retire le port des deux formes de `kind`, garde l’ordre', () => {
    expect(lignesSansPort([lMalt, lPort(), lHoublon])).toEqual([lMalt, lHoublon]);
    expect(lignesSansPort([vMalt, vPort, vHoublon])).toEqual([vMalt, vHoublon]);
  });
  it('un document réduit à son port est laissé tel quel', () => {
    expect(lignesSansPort([lPort()])).toEqual([lPort()]);
    expect(lignesSansPort([lPort(), lPort({ name: 'Port 2' })])).toHaveLength(2);
  });
  it('un port sans montant, négatif ou non numérique est gardé ; une liste de natures qui n’est pas `[shipping]` seul aussi', () => {
    expect(lignesSansPort([lMalt, lPort({ amountTTC: null })])).toHaveLength(2);
    expect(lignesSansPort([lMalt, lPort({ amountTTC: -2 })])).toHaveLength(2);
    expect(lignesSansPort([lMalt, lPort({ amountTTC: 'cinq' })])).toHaveLength(2);
    expect(lignesSansPort([vMalt, { ...vPort, kind: ['shipping', 'service'] }])).toHaveLength(2);
    expect(lignesSansPort([lMalt, lPort({ amountTTC: 0 })])).toEqual([lMalt]);
  });
  it('ne plante pas sur autre chose qu’une liste', () => {
    expect(lignesSansPort(undefined as any)).toEqual([]);
  });
});

describe('P3 n° 11 — hors du port, le juge par défaut égale `portEnLigne: true`', () => {
  const couples: Array<[string, any, any]> = [
    ['juste', lecture([lMalt, lHoublon], 30), verite([vMalt, vHoublon], 30)],
    ['champ faux', lecture([lMalt, { ...lHoublon, amountTTC: 21 }], 31), verite([vMalt, vHoublon], 30)],
    ['ligne manquante', lecture([lMalt], 10), verite([vMalt, vHoublon], 30)],
    ['ligne en trop', lecture([lMalt, lHoublon, { name: 'Autre', kind: 'stock', amountTTC: 1 }], 31), verite([vMalt, vHoublon], 30)],
    ['ligne invisible', lecture([lMalt], 10), verite([vMalt, { ...vHoublon, invisible: true }], 30)],
    ['lignesInvisibles', lecture([lMalt], 10), verite([vMalt, vHoublon], 30, { lignesInvisibles: 1 })],
    ['nature fausse', lecture([lMalt, { ...lHoublon, kind: 'service' }], 30), verite([vMalt, vHoublon], 30)],
  ];
  it.each(couples)('%s', (_nom, r, e) => {
    const defaut: Verdict = judgeResult(r, e), avant: Verdict = judgeResult(r, e, { portEnLigne: true });
    expect(defaut).toEqual(avant);
  });
  it('`judgeBench` passe l’option jusqu’au jugement', () => {
    const run = { ids: ['A1'], ms: 1, costMicroChf: 0, calls: 1, result: { ...lecture([lMalt], 15), review: { status: 'checked' } } };
    const records: any[] = [{ doc: 'tdoc', tirage: 1, readings: [], variants: { A: run } }];
    const cases: any[] = [{ id: 'tdoc', file: 'x.jpg', mimeType: 'image/jpeg', expected: verite([vMalt, vPort], 15) }];
    expect(judgeBench(records, cases).draws[0].wrong).toEqual([]);
    expect(judgeBench(records, cases, { portEnLigne: true }).draws[0].wrong).toContain('items.count');
  });
});

describe('P4 — `comparerJugements` et la définition de la perte', () => {
  const verdict = (judged: number, right: number, lineJudged: number, lineRight: number, wrong: string[] = []): Verdict => ({ judged, right, lineJudged, lineRight, wrong });
  const tirage = (doc: string, variant: string, v: Verdict, tirageNo = 1): DrawVerdict => ({ doc, genre: 'photo', tirage: tirageNo, variant, status: 'checked', wrong: v.wrong, verdict: v, ms: 1 });
  const cellule = (liste: ReturnType<typeof comparerJugements>, nom: string) => liste.find(c => c.cellule === nom)!;

  it('une faute qui disparaît est retirée, une ligne jugée de moins n’est pas une perte', () => {
    const r = comparerJugements([tirage('doc5', 'A', verdict(12, 12, 26, 25, ['items.25']))], [tirage('doc5', 'A', verdict(12, 12, 25, 25))]);
    expect(cellule(r, 'doc5/A')).toMatchObject({ perte: false, retires: ['t1:items.25'], ajoutes: [], signales: [] });
    expect(cellule(r, 'doc5/A').avant).toEqual({ judged: 12, right: 12, lineJudged: 26, lineRight: 25 });
    expect(cellule(r, 'doc5/A').apres).toEqual({ judged: 12, right: 12, lineJudged: 25, lineRight: 25 });
  });
  it('un chemin ajouté est une perte', () => {
    const r = comparerJugements([tirage('doc8', 'A', verdict(12, 11, 37, 35, ['items.3']))], [tirage('doc8', 'A', verdict(12, 11, 36, 35, ['items.3', 'items.count']))]);
    expect(cellule(r, 'doc8/A')).toMatchObject({ perte: true, ajoutes: ['t1:items.count'] });
  });
  it('un chemin ajouté sur une cellule dont la lecture lit le port sous un autre genre est signalé à part, sans perte', () => {
    const r = comparerJugements([tirage('doc9', 'C', verdict(12, 12, 26, 26))], [tirage('doc9', 'C', verdict(12, 12, 25, 25, ['items.count']))], new Set(['doc9/C']));
    expect(cellule(r, 'doc9/C')).toMatchObject({ perte: false, signales: ['t1:items.count'], ajoutes: ['t1:items.count'] });
  });
  it('plus de champs faux ou plus de lignes fausses sans nouveau chemin : perte', () => {
    const champs = comparerJugements([tirage('doc5', 'C', verdict(12, 12, 26, 26))], [tirage('doc5', 'C', verdict(12, 11, 26, 26))]);
    expect(cellule(champs, 'doc5/C').perte).toBe(true);
    const lignes = comparerJugements([tirage('doc5', 'Csv', verdict(12, 12, 26, 26))], [tirage('doc5', 'Csv', verdict(12, 12, 26, 25))]);
    expect(cellule(lignes, 'doc5/Csv').perte).toBe(true);
  });
  it('cellule inchangée : ni perte ni chemin ; plusieurs tirages sont additionnés', () => {
    const a = [tirage('doc5', 'A', verdict(12, 12, 26, 26), 1), tirage('doc5', 'A', verdict(12, 12, 26, 26), 2)];
    const b = [tirage('doc5', 'A', verdict(12, 12, 25, 25), 1), tirage('doc5', 'A', verdict(12, 12, 25, 25), 2)];
    expect(cellule(comparerJugements(a, b), 'doc5/A')).toMatchObject({ tirages: 2, perte: false, ajoutes: [], retires: [], avant: { lineJudged: 52 }, apres: { lineJudged: 50 } });
  });
  it('une cellule qui disparaît est une perte', () => {
    const r = comparerJugements([tirage('doc5', 'A', verdict(12, 12, 26, 26))], []);
    expect(cellule(r, 'doc5/A').perte).toBe(true);
  });
});

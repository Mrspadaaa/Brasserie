import { describe, expect, it } from 'vitest';
import type { EquipmentItem } from '../../src/types';
import {
  addMonthsClamped, aTraiter, brewsUsedIn, calibrationPreset, equipmentStatus, filDuTemps, markBroken, markRepaired,
  nextDueAfter, parcValue, readingOk, recordDone, relatedExpenses, retire,
} from '../../src/domain/equipment';

// Les fixtures de la maquette za3, au 14.11.2026.
const TODAY = '2026-11-14';
const base = (over: Partial<EquipmentItem>): EquipmentItem => ({ id: over.ref ?? 'x', ref: over.ref ?? 'x', name: 'Appareil', category: 'Brassage', state: 'Bon', ...over });

const pompe = base({ ref: 'POMPE', name: 'Pompe de recirculation', state: 'À réparer', brokenSince: '2026-11-05', brokenNote: 'fuit au raccord' });
const ph = base({ ref: 'PH', name: 'pH-mètre', category: 'Mesure', task: 'Étalonner', rhythm: { every: 1, unit: 'mois' }, lastDone: '2026-10-11' });
const refroid = base({ ref: 'REFR', name: 'Refroidisseur à plaques', task: 'Détartrer', rhythm: { every: 5, unit: 'brassin' }, lastDone: '2026-06-01' });
const dens = base({ ref: 'DENS', name: 'Densimètre + éprouvette', category: 'Mesure' });
const desh = base({ ref: 'DESH', name: 'Déshumidificateur', task: 'Nettoyer le filtre', rhythm: { every: 1, unit: 'mois' }, lastDone: '2026-11-01' });
const frigo = base({ ref: 'FRIGO', name: 'Frigo levures', task: 'Dégivrer', rhythm: { every: 3, unit: 'mois' }, lastDone: '2026-09-20' });
const refracto = base({ ref: 'REFRACTO', name: 'Réfractomètre', category: 'Mesure', task: 'Étalonner', rhythm: { every: 3, unit: 'mois' }, lastDone: '2026-09-28' });
const cuve = base({ ref: 'CUVE', name: "Cuve d'ébullition", task: 'Changer le joint', rhythm: { every: 6, unit: 'mois' }, lastDone: '2026-09-02' });
const balance = base({ ref: 'BAL', name: 'Balance 0,1 g' });

const batchesAfterJune = ['2026-06-10', '2026-07-12', '2026-08-20', '2026-09-30', '2026-10-25'].map(d => ({ brewDate: d }));
const ctx = { today: TODAY, batches: batchesAfterJune };
const parc = [pompe, ph, refroid, dens, desh, frigo, refracto, cuve, balance];

describe('equipmentStatus : une ligne par appareil, les mots de za3', () => {
  it('panne : la cause d’abord, puis la date', () => {
    const s = equipmentStatus(pompe, ctx);
    expect(s.kind).toBe('panne');
    expect(s.since).toBe('2026-11-05');
    expect(s.line).toBe('fuit au raccord · depuis le 05.11');
  });
  it('panne sans cause écrite : « en panne », jamais un blanc', () => {
    expect(equipmentStatus(base({ brokenSince: '2026-11-05' }), ctx).line).toBe('en panne · depuis le 05.11');
  });
  it('mois calendaire : 11.10 + 1 mois = 11.11, dû (en retard sans le dire)', () => {
    const s = equipmentStatus(ph, ctx);
    expect(s).toMatchObject({ kind: 'du', dueDate: '2026-11-11', verb: 'étalonner' });
    expect(s.line).toBe('étalonner · prévu le 11.11');
    expect(s.line).not.toMatch(/retard|\d+ ?j/);
  });
  it('brassin : dû quand brewsSince >= every, sans date', () => {
    const s = equipmentStatus(refroid, ctx);
    expect(s).toMatchObject({ kind: 'du', brewsSince: 5, brewsTarget: 5 });
    expect(s.dueDate).toBeUndefined();
    expect(s.line).toBe('détartrer · après 5 brassins');
  });
  it('brassin pas encore dû : avenir sans date', () => {
    const s = equipmentStatus({ ...refroid, lastDone: '2026-08-01' }, ctx);
    expect(s).toMatchObject({ kind: 'avenir', brewsSince: 3, brewsTarget: 5 });
    expect(s.dueDate).toBeUndefined();
  });
  it('un brassin du jour de l’entretien est compté avant lui', () => {
    expect(brewsUsedIn({ ...refroid, lastDone: '2026-10-25' }, batchesAfterJune)).toBe(0);
  });
  it('instrument sans étalonnage connu : pas encore étalonné, jamais 0 jour', () => {
    const s = equipmentStatus(dens, ctx);
    expect(s.kind).toBe('jamais');
    expect(s.line).toBe('pas encore étalonné');
    expect(s.dueDate).toBeUndefined();
  });
  it('avenir : la date seule, le verbe en sous-ligne', () => {
    expect(equipmentStatus(desh, ctx)).toMatchObject({ kind: 'avenir', dueDate: '2026-12-01', line: 'nettoyer le filtre' });
    expect(equipmentStatus(frigo, ctx)).toMatchObject({ kind: 'avenir', dueDate: '2026-12-20', line: 'dégivrer' });
    expect(equipmentStatus(refracto, ctx)).toMatchObject({ kind: 'avenir', dueDate: '2026-12-28' });
    expect(equipmentStatus(cuve, ctx)).toMatchObject({ kind: 'avenir', dueDate: '2027-03-02', line: 'changer le joint' });
  });
  it('dû aujourd’hui : « prévu le 14.11 », encore dans le haut', () => {
    const s = equipmentStatus(base({ task: 'Vidanger', rhythm: { every: 1, unit: 'mois' }, lastDone: '2026-10-14' }), ctx);
    expect(s).toMatchObject({ kind: 'du', dueDate: '2026-11-14', line: 'vidanger · prévu le 14.11' });
  });
  it('rythme sans aucune date de départ : sans échéance, rien d’inventé', () => {
    const s = equipmentStatus(base({ task: 'Huiler', rhythm: { every: 1, unit: 'mois' } }), ctx);
    expect(s.kind).toBe('sans');
  });
  it('sans rythme ni texte : sans échéance', () => {
    expect(equipmentStatus(balance, ctx)).toMatchObject({ kind: 'sans', line: 'sans échéance' });
  });
  it('ancien texte maintenance sans task ni rythme : sous-ligne, sans échéance', () => {
    const s = equipmentStatus(base({ maintenance: 'Rincer après usage' }), ctx);
    expect(s.kind).toBe('sans');
    expect(s.line).toBe('Rincer après usage');
  });
  it('ancien texte + rythme : le texte devient le verbe', () => {
    const s = equipmentStatus(base({ maintenance: 'Filtre', rhythm: { every: 1, unit: 'mois' }, lastDone: '2026-11-01' }), ctx);
    expect(s).toMatchObject({ kind: 'avenir', dueDate: '2026-12-01', line: 'filtre' });
  });
  it('la date de départ peut être l’achat quand rien n’a été fait', () => {
    const s = equipmentStatus(base({ task: 'Vérifier', rhythm: { every: 1, unit: 'mois' }, purchaseDate: '2026-10-20' }), ctx);
    expect(s).toMatchObject({ kind: 'avenir', dueDate: '2026-11-20' });
  });
  it('une date suisse tapée (JJ.MM.AAAA) est comprise', () => {
    expect(equipmentStatus({ ...ph, lastDone: '11.10.2026' }, ctx).dueDate).toBe('2026-11-11');
  });
  it('retiré : hors du fil, sans échéance', () => {
    const s = equipmentStatus({ ...pompe, retired: { date: '2026-11-10', reason: 'réformé' } }, ctx);
    expect(s.kind).toBe('sans');
    expect(s.retired).toBe(true);
  });
});

describe('fin de mois et arithmétique calendaire', () => {
  it('31.01 + 1 mois → 28.02 (29.02 en année bissextile)', () => {
    expect(addMonthsClamped('2027-01-31', 1)).toBe('2027-02-28');
    expect(addMonthsClamped('2028-01-31', 1)).toBe('2028-02-29');
  });
  it('30.11 + 3 mois → 28.02 ; 15.11 + 12 mois → 15.11 de l’année suivante', () => {
    expect(addMonthsClamped('2026-11-30', 3)).toBe('2027-02-28');
    expect(addMonthsClamped('2026-11-15', 12)).toBe('2027-11-15');
  });
  it('semaine et jour', () => {
    const w = nextDueAfter(base({ rhythm: { every: 2, unit: 'semaine' } }), '2026-11-14');
    expect(w).toBe('2026-11-28');
    expect(nextDueAfter(base({ rhythm: { every: 10, unit: 'jour' } }), '2026-12-25')).toBe('2027-01-04');
  });
  it('après étalonnage le 14.11 → à jour jusqu’au 14.12 (11.10 + mois n’influence plus)', () => {
    expect(nextDueAfter(ph, '2026-11-14')).toBe('2026-12-14');
  });
  it('au brassin ou sans rythme : pas de date', () => {
    expect(nextDueAfter(refroid, '2026-11-14')).toBeNull();
    expect(nextDueAfter(balance, '2026-11-14')).toBeNull();
  });
});

describe('aTraiter : panne, dû par date, au brassin, jamais étalonné', () => {
  it('ordre et compte de la maquette : 4', () => {
    const list = aTraiter(parc, ctx);
    expect(list.map(r => r.item.ref)).toEqual(['POMPE', 'PH', 'REFR', 'DENS']);
  });
  it('dû par date : le plus ancien d’abord', () => {
    const vieux = base({ ref: 'OLD', task: 'Huiler', rhythm: { every: 1, unit: 'mois' }, lastDone: '2026-09-01' });
    expect(aTraiter([ph, vieux], ctx).map(r => r.item.ref)).toEqual(['OLD', 'PH']);
  });
  it('un instrument avec étalonnage propre et sans historique compte', () => {
    const inst = base({ ref: 'INST', name: 'Sonde maison', category: 'Mesure', calibration: { points: [{ label: 'eau', expected: 0 }], tolerance: 0.5 } });
    expect(aTraiter([inst], ctx).map(r => r.item.ref)).toEqual(['INST']);
  });
  it('un instrument déjà étalonné (historique) ne compte plus', () => {
    const d = { ...dens, history: [{ date: '2026-10-01', kind: 'etalonnage' as const }] };
    expect(aTraiter([d], ctx)).toEqual([]);
    expect(equipmentStatus(d, ctx).kind).toBe('sans');
  });
  it('retiré : hors du compte', () => {
    expect(aTraiter([{ ...pompe, retired: { date: '2026-11-10', reason: 'vendu' } }], ctx)).toEqual([]);
  });
});

describe('filDuTemps : à sa vraie distance, 3,5 px par jour', () => {
  const fil = filDuTemps(parc, ctx);
  it('haut = à traiter ; aujourd’hui ; sans échéance à part', () => {
    expect(fil.haut.map(r => r.item.ref)).toEqual(['POMPE', 'PH', 'REFR', 'DENS']);
    expect(fil.aujourdhui).toBe('2026-11-14');
    expect(fil.sansEcheance.map(r => r.item.ref)).toEqual(['BAL']);
  });
  it('avenir trié par date, avec offsetDays et position (y = 3,5 × j − 14)', () => {
    expect(fil.avenir.map(r => [r.item.ref, r.offsetDays])).toEqual([['DESH', 17], ['FRIGO', 36], ['REFRACTO', 44], ['CUVE', 108]]);
    expect(fil.avenir[0].y).toBe(45.5);
    expect(fil.avenir[1].y).toBe(112);
    expect(fil.avenir[2].y).toBe(140);
  });
  it('coupure : au-delà de 50 j la distance cesse d’être à l’échelle', () => {
    expect(fil.coupure).toMatchObject({ afterDays: 50 });
    expect(fil.avenir[3].apresCoupure).toBe(true);
    expect(fil.avenir[3].y).toBe(200);
    expect(fil.avenir[2].apresCoupure).toBe(false);
  });
  it('50 j reste à l’échelle, 51 j passe la coupure', () => {
    const at = (days: number, ref: string) => base({ ref, task: 'Huiler', rhythm: { every: days, unit: 'jour' }, lastDone: TODAY });
    const f = filDuTemps([at(50, 'A')], ctx);
    expect(f.coupure).toBeNull();
    expect(f.avenir[0].y).toBe(3.5 * 50 - 14);
    const g = filDuTemps([at(51, 'B')], ctx);
    expect(g.coupure).not.toBeNull();
    expect(g.avenir[0].apresCoupure).toBe(true);
  });
  it('plusieurs lignes après la coupure ne se chevauchent pas', () => {
    const at = (days: number, ref: string) => base({ ref, task: 'Huiler', rhythm: { every: days, unit: 'jour' }, lastDone: TODAY });
    const f = filDuTemps([at(100, 'A'), at(101, 'B'), at(300, 'C')], ctx);
    const ys = f.avenir.map(r => r.y);
    // P6 : deux lignes de 28 px ne se touchent pas : 34 px de pas au moins (un blanc de 6 px)
    expect(ys[1] - ys[0]).toBeGreaterThanOrEqual(34);
    expect(ys[2] - ys[1]).toBeGreaterThanOrEqual(34);
  });
  it('repères de mois : déc. et janv. sur l’échelle, mars après la coupure', () => {
    const r = fil.reperes;
    expect(r.map(m => m.label)).toEqual(['déc.', 'janv.', 'mars']);
    expect(r[0]).toMatchObject({ date: '2026-12-01', y: 45.5, tick: true });
    expect(r[1]).toMatchObject({ date: '2027-01-01', y: 154, tick: true });
    expect(r[2]).toMatchObject({ y: 200, tick: false });
  });
  it('la bande « 30 j »', () => {
    expect(fil.bande).toEqual({ days: 30, y: 3.5 * 30 - 14 });
  });
  it('un dû qui a un brassin à venir va avec les sans date, jamais dans l’avenir daté', () => {
    const f = filDuTemps([{ ...refroid, lastDone: '2026-08-01' }], ctx);
    expect(f.avenir).toEqual([]);
    expect(f.sansEcheance.map(r => r.item.ref)).toEqual(['REFR']);
    expect(f.sansEcheance[0].status.line).toBe('détartrer · encore 2 brassins');
  });
  it('retiré : absent partout', () => {
    const f = filDuTemps([{ ...pompe, retired: { date: '2026-11-10', reason: 'vendu' } }], ctx);
    expect([f.haut, f.avenir, f.sansEcheance].every(l => l.length === 0)).toBe(true);
  });
});

describe('gestes : fonctions pures qui renvoient un nouvel appareil', () => {
  it('recordDone : lastDone, historique, aucune mutation', () => {
    const copy = JSON.stringify(ph);
    const n = recordDone(ph, { date: '2026-11-14' });
    expect(JSON.stringify(ph)).toBe(copy);
    expect(n.lastDone).toBe('2026-11-14');
    expect(n.history?.[n.history.length - 1]).toMatchObject({ date: '2026-11-14', kind: 'etalonnage' });
    expect(equipmentStatus(n, ctx)).toMatchObject({ kind: 'avenir', dueDate: '2026-12-14' });
  });
  it('recordDone avec lectures : gardées dans l’événement', () => {
    const readings = [{ label: 'pH 7,00', expected: 7, read: 7.01 }, { label: 'pH 4,00', expected: 4, read: 4.02 }];
    const n = recordDone(ph, { date: '2026-11-14', readings });
    expect(n.history?.[n.history.length - 1].readings).toEqual(readings);
  });
  it('recordDone sur un appareil non étalonnable : entretien', () => {
    const n = recordDone(frigo, { date: '2026-11-14' });
    expect(n.history?.[n.history.length - 1].kind).toBe('entretien');
    expect(n.state).toBe('Bon');
  });
  it('recordDone lève « À entretenir » mais pas une panne', () => {
    expect(recordDone({ ...frigo, state: 'À entretenir' }, { date: '2026-11-14' }).state).toBe('Bon');
    expect(recordDone(pompe, { date: '2026-11-14' }).state).toBe('À réparer');
  });
  it('markBroken puis markRepaired', () => {
    const b = markBroken(balance, { date: '2026-11-14', note: 'écran noir' });
    expect(b).toMatchObject({ brokenSince: '2026-11-14', brokenNote: 'écran noir', state: 'À réparer' });
    expect(equipmentStatus(b, ctx).line).toBe('écran noir · depuis le 14.11');
    const r = markRepaired(b, { date: '2026-11-15' });
    expect(r.brokenSince).toBeUndefined();
    expect(r.brokenNote).toBeUndefined();
    expect(r.state).toBe('Bon');
    expect(r.history?.map(e => e.kind)).toEqual(['panne', 'reparation']);
    expect(balance.brokenSince).toBeUndefined();
  });
  it('retire : vendu ou réformé, journalisé', () => {
    const n = retire(balance, { date: '2026-11-14', reason: 'vendu' });
    expect(n.retired).toEqual({ date: '2026-11-14', reason: 'vendu' });
    expect(n.history?.[0]).toMatchObject({ kind: 'sortie', note: 'vendu' });
    expect(balance.retired).toBeUndefined();
  });
});

describe('brewsUsedIn : brassins depuis le dernier entretien', () => {
  const bs = [{ brewDate: '2026-06-01' }, { brewDate: '2026-06-02' }, { brewDate: '' }, { brewDate: '2026-09-01' }, {}];
  it('depuis lastDone, strictement après ; un brassin pas encore brassé ne compte pas', () => {
    expect(brewsUsedIn(base({ lastDone: '2026-06-01' }), bs)).toBe(2);
  });
  it('sans entretien : depuis l’achat, jour d’achat compris', () => {
    expect(brewsUsedIn(base({ purchaseDate: '2026-06-02' }), bs)).toBe(2);
  });
  it('sans aucune date : tous les brassins faits (« utilisé dans N brassins »)', () => {
    expect(brewsUsedIn(base({}), bs)).toBe(3);
  });
});

describe('relatedExpenses : dépenses reliées, total des montants connus', () => {
  const tx = (id: string, date: string, lines: any[], voidedAt?: string) => ({
    id, date, description: id, category: 'materiel', amountHT: 0, tvaRate: 0, tvaAmount: 0, amountTTC: 0, proofFileName: '', proofType: '',
    finance: { version: 1, kind: 'expense', amountCents: 0, lines, voidedAt },
  }) as any;
  const txs = [
    tx('T1', '2026-09-03', [{ id: 'l1', description: 'Solution tampon pH 7', kind: 'service', amountCents: 1890, equipmentRef: 'PH' }]),
    tx('T2', '2026-10-11', [{ id: 'l2', description: 'Électrode de rechange', kind: 'service', amountCents: 1850, equipmentRef: 'PH' }, { id: 'l3', description: 'autre', kind: 'ingredient', amountCents: 999 }]),
    tx('T3', '2026-10-12', [{ id: 'l4', description: 'annulée', kind: 'service', amountCents: 5000, equipmentRef: 'PH' }], '2026-10-13'),
    tx('T4', '2026-10-12', [{ id: 'l5', description: 'autre appareil', kind: 'service', amountCents: 700, equipmentRef: 'FRIGO' }]),
  ];
  it('total = somme des prix connus ; l’achat sans prix reste une ligne inconnue, pas 0', () => {
    const r = relatedExpenses(ph, txs);
    expect(r.totalCents).toBe(3740);
    expect(r.known).toBe(2);
    expect(r.count).toBe(3);
    const achat = r.lines.find(l => l.kind === 'achat')!;
    expect(achat).toMatchObject({ date: null, amountCents: null });
  });
  it('les lignes : plus récente d’abord, achat inconnu en dernier ; annulées et autres appareils écartés', () => {
    const r = relatedExpenses(ph, txs);
    expect(r.lines.map(l => l.label)).toEqual(['Électrode de rechange', 'Solution tampon pH 7', 'Achat']);
    expect(r.lines.map(l => l.txId).filter(Boolean)).toEqual(['T2', 'T1']);
  });
  it('achat connu : prix et date de la fiche, sans doublon si une facture le porte', () => {
    const a = relatedExpenses(base({ ref: 'Z', purchaseDate: '2026-01-05', purchasePrice: 120.5 }), []);
    expect(a.lines).toHaveLength(1);
    expect(a).toMatchObject({ totalCents: 12050, known: 1, count: 1 });
    const t = tx('T9', '2026-01-05', [{ id: 'q', description: 'Cuve', kind: 'equipment', amountCents: 12050, equipmentRef: 'Z' }]);
    const b = relatedExpenses(base({ ref: 'Z', purchaseDate: '2026-01-05', purchasePrice: 120.5 }), [t]);
    expect(b.lines).toHaveLength(1);
    expect(b.totalCents).toBe(12050);
  });
  it('aucune dépense connue : total 0 mais known 0 (à l’écran, « prix inconnu »)', () => {
    const r = relatedExpenses(balance, []);
    expect(r).toMatchObject({ totalCents: 0, known: 0, count: 1 });
  });
});

describe('parcValue : seulement les prix connus', () => {
  it('somme les prix connus, compte combien, ignore l’inconnu et le retiré', () => {
    const items = [
      base({ ref: 'A', purchasePrice: 1500 }), base({ ref: 'B', purchasePrice: 239.9 }), base({ ref: 'C' }),
      base({ ref: 'D', purchasePrice: 0 }), base({ ref: 'E', purchasePrice: 800, retired: { date: '2026-01-01', reason: 'vendu' } }),
    ];
    expect(parcValue(items)).toEqual({ totalCents: 173990, known: 2 });
  });
  it('rien de connu : known 0', () => {
    expect(parcValue([base({})])).toEqual({ totalCents: 0, known: 0 });
  });
});

describe('étalonnage : préréglages et tolérance', () => {
  it('pH-mètre : pH 7,00 et pH 4,00, ±0,05', () => {
    expect(calibrationPreset(ph)).toMatchObject({ tolerance: 0.05, points: [{ label: 'pH 7,00', expected: 7 }, { label: 'pH 4,00', expected: 4 }] });
  });
  it('densimètre : eau 1,000 ±0,002 ; réfractomètre : eau 0,0 °Bx ±0,2', () => {
    expect(calibrationPreset(dens)).toMatchObject({ tolerance: 0.002, points: [{ expected: 1 }] });
    expect(calibrationPreset(refracto)).toMatchObject({ tolerance: 0.2, points: [{ expected: 0 }] });
  });
  it('un appareil sans étalonnage : null ; un étalonnage propre gagne sur le nom', () => {
    expect(calibrationPreset(balance)).toBeNull();
    const own = { points: [{ label: 'x', expected: 1 }], tolerance: 9 };
    expect(calibrationPreset({ ...ph, calibration: own })).toEqual(own);
  });
  it('readingOk : dans la tolérance, bornes comprises, sans erreur d’arrondi', () => {
    const p = { label: 'pH 7,00', expected: 7 };
    expect(readingOk(p, 7.01, 0.05)).toBe(true);
    expect(readingOk(p, 7.05, 0.05)).toBe(true);
    expect(readingOk(p, 6.95, 0.05)).toBe(true);
    expect(readingOk(p, 7.06, 0.05)).toBe(false);
    expect(readingOk({ label: 'eau', expected: 1 }, 1.002, 0.002)).toBe(true);
  });
  it('readingOk : une valeur absente ou illisible n’est jamais bonne', () => {
    expect(readingOk({ label: 'a', expected: 7 }, NaN, 0.05)).toBe(false);
    expect(readingOk({ label: 'a', expected: 0 }, undefined as any, 0.2)).toBe(false);
  });
});

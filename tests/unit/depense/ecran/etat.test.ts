// Voie e-port : l'état pur de l'écran r2b (statut, chips, liens). Aucune donnée réelle ; Gemini jamais appelé.
// Rouge d'abord parce que `src/ui/depense/etat` n'existe pas (module absent) ; le rouge de comportement est dans ecran-points.test.tsx.
import { describe, expect, it } from 'vitest';
import { PESE_PAR_CODE, SCAN_POINT_CODES } from '../../../../src/domain/finance/invoicePoints';
import { CHIP_PAR_CODE, chipsDeLecture, compteLiens, memeProduit, phraseRelation, recalculerLecture, statutAffiche, voisinDe } from '../../../../src/ui/depense/etat';
import { lecture372765 } from '../lecture/aide';

const point = (code: string, extra: Record<string, unknown> = {}) => ({ code, gravite: 'ecart', origine: 'controle', enjeu: 'info', bloque: false, champ: 'vat', champs: [], ligne: null, cle: `${code}:-:x`, regle: '', lu: null, calcule: null, ecart: null, unite: 'texte', message: code, ...extra }) as any;

describe('T3 : une chip pour chaque code qui pèse', () => {
  it('chaque code de PESE_PAR_CODE qui pèse a sa chip dans la table ; ceux qui ne pèsent pas n’en ont pas', () => {
    for (const code of SCAN_POINT_CODES) {
      if (PESE_PAR_CODE[code]) expect(CHIP_PAR_CODE[code], code).toBeTruthy();
      else expect(CHIP_PAR_CODE[code], code).toBeUndefined();
    }
  });
  it('la TVA est reconnue par son code, pas par l’enjeu (info)', () => {
    const chips = chipsDeLecture([point('tva-incoherente', { enjeu: 'info' })], []);
    expect(chips.map(c => c.nom)).toEqual(['TVA']);
  });
  it('un code inconnu qui pèse reçoit une chip générique ; un point qui ne pèse pas n’en reçoit pas', () => {
    expect(chipsDeLecture([point('code-futur', { pese: true })], []).map(c => c.nom)).toEqual(['À revoir']);
    expect(chipsDeLecture([point('type-deduit')], [])).toEqual([]);
  });
  it('l’argent passe avant le stock', () => {
    const chips = chipsDeLecture([point('unite-absente', { ligne: 20, enjeu: 'stock' }), point('somme-ecart', { enjeu: 'argent' })], []);
    expect(chips.map(c => c.enjeu)).toEqual(['argent', 'stock']);
  });
});

describe('T1 : le statut', () => {
  const base = (status: string | undefined) => ({ ...lecture372765(), review: status ? { status, findings: [], readers: 2 } : undefined });
  it('format ancien (sans points) : jamais « vérifié »', () => {
    for (const status of ['checked', 'corrected', 'disputed']) expect(statutAffiche(base(status) as any, undefined), status).toBe('disputed');
    expect(statutAffiche(base('unavailable') as any, undefined)).toBe('unavailable');
    expect(statutAffiche(base(undefined) as any, undefined)).toBe('unavailable');
  });
  it('nouveau format : sans point qui pèse « checked » ; avec un point qui pèse « disputed »', () => {
    const propre = { ...base('checked'), points: [], controls: { lines: { checked: 1, failed: 0, skipped: 0, skippedIds: [] }, sum: { statut: 'ok', base: 'TTC' }, vat: { statut: 'ok', base: null }, totals: { statut: 'ok' } } } as any;
    expect(statutAffiche(propre, undefined)).toBe('checked');
    expect(statutAffiche({ ...propre, points: [point('tva-incoherente')] }, undefined)).toBe('disputed');
  });
  it('recalculerLecture : rien sans points ; le statut reste le plancher', () => {
    const brouillon = { lines: [], amount: undefined };
    expect(recalculerLecture(base('checked') as any, brouillon)).toBeUndefined();
    expect(statutAffiche(base('checked') as any, recalculerLecture(base('checked') as any, brouillon))).toBe('disputed');
  });
});

describe('liens et voisins', () => {
  it('compteLiens somme toujours au nombre de lignes', () => {
    const lignes = [{ id: 'a', stockAction: 'existing', kind: 'ingredient' }, { id: 'b', stockAction: 'new', kind: 'ingredient' }, { id: 'c', stockAction: 'none', kind: 'service' }, { id: 'd', stockAction: 'existing', kind: 'ingredient', unit: '' }] as any;
    const c = compteLiens(lignes, new Set(['d']));
    expect(c.relie + c.neuf + c.precis + c.autre + c.mouture).toBe(4);
    expect(c.precis).toBe(1);
  });
  it('voisin : même nom propre, autre α → l’article du stock est montré, rien n’est lié', () => {
    const stock = [{ id: 'T', ref: 'T', name: 'Target 11.8%', category: 'Houblon', unit: 'g', currentStock: 100, minStock: 0, reorder: false }] as any;
    expect(voisinDe({ description: 'Target 11.3%', unit: 'g', quantity: 40 } as any, stock)?.ref).toBe('T');
    expect(voisinDe({ description: 'Galaxy 17.2%', unit: 'g', quantity: 60 } as any, stock)).toBeUndefined();
    expect(voisinDe({ description: 'Target 11.8%', unit: 'g', quantity: 40 } as any, stock)).toBeUndefined();
  });
});

describe('C2, R4 : la relation d’un contrôle de TVA en phrase, jamais la clé brute', () => {
  const d = (relation: string, lu: number, calcule: number, ecart = lu - calcule) => ({ relation, lu, calcule, ecart });
  it.each([
    [d('somme-bases', 11040, 8650), 'Bases N + R : imprimé 110,40 · lignes 86,50 (+23,90)'],
    [d('base-par-code:N', 2620, 1120), 'Base N : imprimée 26,20 · lignes 11,20 (+15,00)'],
    [d('somme-tva', 280, 415), 'TVA : colonne 2,80 · N + R 4,15 (−1,35)'.replace(' (−1,35)', '')],
  ])('%j', (relation, phrase) => expect(phraseRelation(relation)).toBe(phrase));
  it('une clé inconnue reçoit un libellé neutre', () => {
    const p = phraseRelation(d('relation-future:X', 100, 200));
    expect(p).toMatch(/^Autre contrôle de la TVA/);
    expect(p).not.toMatch(/relation-future/);
  });
});

describe('R10 : le statut est le pire du départ et du recalcul', () => {
  const controls = { lines: { checked: 1, failed: 0, skipped: 0, skippedIds: [] as string[] }, sum: { statut: 'ok', base: 'TTC' }, vat: { statut: 'ok', base: null }, totals: { statut: 'ok' } };
  it('ht-tva-ttc seul au départ : vider la TVA (recalcul sans point) ne remonte pas à « vérifié »', () => {
    const lecture = { ...lecture372765(), review: { status: 'checked', findings: [], readers: 2 }, points: [point('ht-tva-ttc', { champ: 'amountHT' })], controls } as any;
    const brouillon = { lines: [], amount: undefined, sourceVatAmount: undefined };
    expect(statutAffiche(lecture, recalculerLecture(lecture, brouillon))).toBe('disputed');
  });
});

describe('R6 : un produit déjà au stock', () => {
  const stock = [{ id: 'G', ref: 'G', name: 'Galaxy', category: 'Houblon', unit: 'g', currentStock: 1, minStock: 0, reorder: false }, { id: 'T', ref: 'T', name: 'Target 11.8%', category: 'Houblon', unit: 'g', currentStock: 1, minStock: 0, reorder: false }] as any;
  it('même produit : trouvé ; autre α : jamais fusionné (D215) ; produit inconnu : rien', () => {
    expect(memeProduit('Galaxy 17.2%', 'g', stock)?.ref).toBe('G');
    expect(memeProduit('Target 11.3%', 'g', stock)).toBeUndefined();
    expect(memeProduit('Motueka 8.1%', 'g', stock)).toBeUndefined();
  });
});

describe('fractionDigits (C3) : l’affichage d’un montant hors frappe', () => {
  it('sans la prop, l’affichage est inchangé ; avec, deux décimales à la virgule suisse', async () => {
    const { formatDecimal } = await import('../../../../src/ui/numericInput');
    expect(formatDecimal(86.5)).toBe('86,5');
    expect(formatDecimal(86.5, 2)).toBe('86,50');
    expect(formatDecimal(undefined, 2)).toBe('');
  });
});

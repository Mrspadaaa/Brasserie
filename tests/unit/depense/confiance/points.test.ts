// Voie f2-confiance (D277) : les points de lecture deviennent le niveau du champ qu'ils visent ; aucun point qui pèse n'est perdu.
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { makePoint, type ScanPointCode } from '../../../../functions/src/invoiceControls';
import { PESE_PAR_CODE, SCAN_POINT_CODES, peserPoint, type InvoicePoint } from '../../../../src/domain/finance/invoicePoints';
import { CODES_SANS_NIVEAU, TABLE_POINTS, ciblesDuPoint, confianceEntete, confianceLigne, type LigneConfiance } from '../../../../src/ui/depense/confiance';

const point = (code: ScanPointCode, ligne: number | null, over: Partial<InvoicePoint> = {}): InvoicePoint => {
  const base = makePoint(code, 'ecart', 'items', ligne, { regle: 'règle fictive', message: `message fictif ${code}`, unite: 'centimes', enjeu: 'argent', lu: 1000, calcule: 990 });
  return { ...base, pese: PESE_PAR_CODE[code], ...over } as InvoicePoint;
};

describe('chaque code de point qui pèse a un niveau', () => {
  it('la table couvre tous les codes du serveur', () => {
    expect(CODES_SANS_NIVEAU).toEqual([]);
    expect(Object.keys(TABLE_POINTS).sort()).toEqual([...SCAN_POINT_CODES].sort());
  });
  it('un point qui pèse donne au moins une cible ; un point qui ne pèse pas, aucune', () => {
    for (const code of SCAN_POINT_CODES) {
      const cibles = ciblesDuPoint(point(code, code === 'ligne-montant' || code === 'ligne-prix-par-lot' || code === 'unite-absente' ? 3 : null));
      if (PESE_PAR_CODE[code]) expect(cibles.length, code).toBeGreaterThan(0);
      else expect(cibles, code).toEqual([]);
    }
    expect(ciblesDuPoint(point('lectures-divergentes', null, { pese: false, champ: 'date' }))).toEqual([]);
  });
});

describe('les points d\'en-tête : le niveau du champ qu\'ils visent', () => {
  const entete = (points: InvoicePoint[], brouillon: Record<string, unknown> = {}, tapes?: Set<any>) =>
    confianceEntete({ points }, { date: '2026-09-09', vendor: 'Fournisseur fictif', invoiceNumber: 'F-1', amount: 10, sourceVatAmount: 0.7, ...brouillon, ...(tapes ? { tapes } : {}) });

  it('sans point : tout est sûr', () => {
    const e = entete([]);
    expect(e.pire).toBe('sur');
    expect([e.date, e.fournisseur, e.total, e.tva, e.numero].map(v => v.niveau)).toEqual(['sur', 'sur', 'sur', 'sur', 'sur']);
  });
  it('une valeur absente est inconnue, jamais 0 ; le numéro et la TVA absents sont facultatifs et ne rougissent pas la pièce', () => {
    const e = entete([], { date: '', vendor: '', amount: undefined, sourceVatAmount: undefined, invoiceNumber: '' });
    for (const champ of ['date', 'fournisseur', 'total'] as const) expect(e[champ], champ).toMatchObject({ niveau: 'inconnu' });
    expect(e.tva).toMatchObject({ niveau: 'inconnu', facultatif: true });
    expect(e.numero).toMatchObject({ niveau: 'inconnu', facultatif: true });
    expect(e.total.valeur).toBeUndefined();
    const seulFacultatif = entete([], { sourceVatAmount: undefined, invoiceNumber: '' });
    expect(seulFacultatif.pire).toBe('sur');
  });
  it('date-absente : la date est inconnue ; si elle l\'a tapée, sûre', () => {
    expect(entete([point('date-absente', null, { champ: 'date' })], { date: '' }).date.niveau).toBe('inconnu');
    expect(entete([point('date-absente', null, { champ: 'date' })], { date: '2026-09-10' }, new Set(['date'])).date).toMatchObject({ niveau: 'sur', raison: 'tapé par lui' });
  });
  it('somme-ecart : un arrondi de 5 centimes est repris, un vrai écart est inconnu', () => {
    expect(entete([point('somme-ecart', null, { ecart: 5 })]).total.niveau).toBe('repris');
    expect(entete([point('somme-ecart', null, { ecart: -5 })]).total.niveau).toBe('repris');
    expect(entete([point('somme-ecart', null, { ecart: 1000 })]).total.niveau).toBe('inconnu');
  });
  it('TVA : écart faible repris, fort inconnu, taux hors plage inconnu', () => {
    expect(entete([point('tva-incoherente', null, { champ: 'vat', ecart: 2 })]).tva.niveau).toBe('repris');
    expect(entete([point('ht-tva-ttc', null, { champ: 'tvaAmount', ecart: 200 })]).tva.niveau).toBe('inconnu');
    expect(entete([point('taux-tva-hors-plage', null, { champ: 'tvaRate' })]).tva.niveau).toBe('inconnu');
  });
  it('lignes perdues : inconnu ; annoncées, non rapprochées, lecture coupée : repris ; documents particuliers : repris', () => {
    expect(entete([point('lignes-perdues', null)]).lignes.niveau).toBe('inconnu');
    for (const code of ['lignes-annoncees', 'lignes-non-rapprochees', 'lecture-coupee'] as const) expect(entete([point(code, null)]).lignes.niveau, code).toBe('repris');
    for (const code of ['pro-forma-non-payee', 'devis', 'document-livraison', 'avoir'] as const) expect(entete([point(code, null)]).document.niveau, code).toBe('repris');
  });
  it('désaccord entre lectures : toujours repris (jaune, D277 ; g2b), qu\'une lecture soit retenue ou non ; tranché à la majorité (ne pèse pas) : rien', () => {
    const lectures = (retenue: boolean) => [{ lecture: 1, valeur: 'a', retenue }, { lecture: 2, valeur: 'b', retenue: false }];
    expect(entete([point('lectures-divergentes', null, { champ: 'vendor', valeurs: lectures(true) })]).fournisseur.niveau).toBe('repris');
    expect(entete([point('lectures-divergentes', null, { champ: 'vendor', valeurs: lectures(false) })]).fournisseur.niveau).toBe('repris');
    expect(entete([point('lectures-divergentes', null, { champ: 'vendor', valeurs: lectures(true), pese: false })]).fournisseur.niveau).toBe('sur');
  });
  it('devise non CHF : le total est repris', () => {
    expect(entete([point('devise-non-chf', null, { champ: 'currency' })]).total.niveau).toBe('repris');
  });
});

describe('les points d\'une ligne : le niveau du champ qu\'ils visent', () => {
  const l: LigneConfiance = { id: 'line-3', description: 'Pilsner Malz fictif, Kg', kind: 'stock', quantity: 5, unit: '', unitPrice: 1.65, amount: 8.25 };
  const niveauxAvec = (...points: InvoicePoint[]) => confianceLigne(l, { lignes: [l], total: 8.25, points });
  const cellules = (...c: string[]) => c.map(x => `items.3.${x}`);

  it('le point d\'unité absente est remplacé par la déduction : l\'unité n\'est pas rouge', () => {
    const c = niveauxAvec(point('unite-absente', 3, { champs: cellules('quantity', 'unit') }));
    expect(c.unite.niveau).toBe('sur');
    expect(c.unite.valeur).toBe('kg');
  });
  it('alpha-libelle et ambiguité : l\'article est repris', () => {
    expect(niveauxAvec(point('alpha-libelle', 3)).article.niveau).toBe('repris');
    expect(niveauxAvec(point('ambiguite-ligne', 3)).article.niveau).toBe('repris');
  });
  it('nature à préciser : la famille est reprise', () => {
    expect(niveauxAvec(point('nature-a-preciser', 3)).famille.niveau).toBe('repris');
  });
  it('forme rejetée : la cellule rejetée est inconnue', () => {
    expect(niveauxAvec(point('forme-rejetee', 3, { champs: cellules('price') })).prix.niveau).toBe('inconnu');
  });
  it('désaccord sur une cellule de la ligne : repris', () => {
    expect(niveauxAvec(point('lectures-divergentes', 3, { champs: cellules('unit'), valeurs: [{ lecture: 1, valeur: 'kg', retenue: true }, { lecture: 2, valeur: 'g', retenue: false }] })).unite.niveau).toBe('repris');
  });
  it('un point d\'une autre ligne ne touche pas celle-ci', () => {
    expect(niveauxAvec(point('forme-rejetee', 4, { champs: ['items.4.price'] })).prix.niveau).toBe('sur');
  });
});

describe('une lecture enregistrée : tous ses points sont mappés sans perte', () => {
  const lecture = JSON.parse(readFileSync(fileURLToPath(new URL('../../../../src/ui/depense/apercu/lecture-372765.reconciliee.json', import.meta.url)), 'utf8'));
  const lignes: LigneConfiance[] = lecture.items.map((it: any) => ({
    id: it.id, description: it.name, kind: it.kind, quantity: it.quantity ?? undefined, unit: it.unit ?? '', unitPrice: it.price ?? undefined, amount: it.amountTTC ?? undefined,
    stockCategory: it.stockCategory ?? '', sourceReference: it.reference ?? '',
  }));
  const points = lecture.points as InvoicePoint[];

  it('chaque point qui pèse a une cible', () => {
    const qui = points.filter(peserPoint);
    expect(qui.length).toBeGreaterThan(0);
    for (const p of qui) expect(ciblesDuPoint(p).length, p.code).toBeGreaterThan(0);
  });
  it('la ligne sans unité imprimée reçoit une unité (ou, sans indice, une marque rouge), jamais un blanc muet', () => {
    const rang = points.find(p => p.code === 'unite-absente')!.ligne!;
    const l = lignes.find(x => x.id === `line-${rang}`)!;
    const c = confianceLigne(l, { lignes, fournisseur: lecture.vendor, total: lecture.amountTTC, points });
    expect(['sur', 'repris', 'inconnu']).toContain(c.unite.niveau);
    expect(c.unite.raison.length).toBeGreaterThan(0);
    if (c.unite.niveau !== 'inconnu') expect(c.unite.valeur).toBeTruthy();
  });
  it('l\'en-tête : le point de TVA incohérente baisse la TVA', () => {
    const e = confianceEntete({ points }, { date: lecture.date, vendor: lecture.vendor, invoiceNumber: lecture.invoiceNumber, amount: lecture.amountTTC, sourceVatAmount: lecture.tvaAmount ?? undefined }, lignes);
    expect(['repris', 'inconnu']).toContain(e.tva.niveau);
    expect(e.pire).not.toBe('sur');
  });
  it('les unités imprimées de la lecture ne sont jamais réécrites', () => {
    for (const l of lignes.filter(x => (x.unit ?? '').trim())) {
      const c = confianceLigne(l, { lignes, total: lecture.amountTTC, points });
      expect(c.unite.source, l.id).toBe('imprimee');
    }
  });
});

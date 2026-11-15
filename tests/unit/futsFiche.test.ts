import { describe, expect, it } from 'vitest';
import type { Batch, KegItem } from '../../src/types';
import { problemeRemplissage } from '../../src/domain/stock/futs';
import {
  HISTORIQUE_MAX, avecEtape, barreLitres, couleurPastille, creerFuts, dateCourte, derniereDate, etapesRecentes, jaugeFut, joursEntre,
  libelleEtape, lireCapacite, livrer, marquerPropre, numerosSuivants, phraseLitres, problemeRemplissageMultiple, remplirFut,
  reperePourStyle, resumeNumeros, retourVide, revenuPlein
} from '../../src/domain/stock/futsFiche';

const aujourdhui = '15.11.2026';
const lot: Batch = { id: 'LOT-003', name: 'Ambrée', style: 'Ambrée', status: 'garde', volumeL: 60, volumePackagedL: 60 } as Batch;
const fut = (id: string, capacityL: number, extra: Partial<KegItem> = {}): KegItem => ({ id, capacityL, state: 'propre', ...extra });

describe('repère d’âge selon le style', () => {
  it.each([['NEIPA', 30], ['IPA', 30], ['DIPA', 30], ['Double IPA', 30], ['India Pale Ale', 30], ['Pale Ale', 45], ['Ambrée', 90], ['Stout', 90], [undefined, 90]])('%s → %s j', (style, jours) => {
    expect(reperePourStyle(style as string | undefined)).toBe(jours);
  });
});

describe('jours entre deux dates', () => {
  it('compte les jours entiers, y compris à cheval sur un mois et une année', () => {
    expect(joursEntre('02.11.2026', aujourdhui)).toBe(13);
    expect(joursEntre('04.11.2026', aujourdhui)).toBe(11);
    expect(joursEntre('06.10.2026', aujourdhui)).toBe(40);
    expect(joursEntre('28.12.2025', '03.01.2026')).toBe(6);
  });
  it('l’inconnu n’est jamais 0 ; une date future vaut 0 jour', () => {
    expect(joursEntre(undefined, aujourdhui)).toBeUndefined();
    expect(joursEntre('pas une date', aujourdhui)).toBeUndefined();
    expect(joursEntre('31.02.2026', aujourdhui)).toBeUndefined();
    expect(joursEntre('20.11.2026', aujourdhui)).toBe(0);
  });
  it('date courte', () => { expect(dateCourte('02.11.2026')).toBe('02.11'); });
});

describe('jauge d’âge', () => {
  it('plein : 13 j sur le repère NEIPA de 30 j', () => {
    const j = jaugeFut({ state: 'plein', style: 'NEIPA', fillDate: '02.11.2026' }, aujourdhui)!;
    expect(j).toMatchObject({ sorte: 'cave', jours: 13, repere: 30, pct: 43, depasse: false });
  });
  it('plein : Pale Ale 43 j sur 45 j, puis dépassé', () => {
    expect(jaugeFut({ state: 'plein', style: 'Pale Ale', fillDate: '03.10.2026' }, aujourdhui)).toMatchObject({ jours: 43, repere: 45, depasse: false });
    expect(jaugeFut({ state: 'plein', style: 'Pale Ale', fillDate: '01.10.2026' }, aujourdhui)).toMatchObject({ jours: 45, depasse: false });
    expect(jaugeFut({ state: 'plein', style: 'Pale Ale', fillDate: '30.09.2026' }, aujourdhui)).toMatchObject({ jours: 46, depasse: true, pct: 100 });
  });
  it('livré : 11 j dehors, seuil 30 j ; 40 j = dépassé, barre pleine', () => {
    expect(jaugeFut({ state: 'livre', deliveryDate: '04.11.2026' }, aujourdhui)).toMatchObject({ sorte: 'dehors', jours: 11, repere: 30, pct: 37, depasse: false });
    expect(jaugeFut({ state: 'livre', deliveryDate: '06.10.2026' }, aujourdhui)).toMatchObject({ jours: 40, pct: 100, depasse: true });
  });
  it('livré sans date de livraison : jours inconnus, pas 0', () => {
    expect(jaugeFut({ state: 'livre' }, aujourdhui)).toMatchObject({ jours: undefined, pct: 0, depasse: false });
  });
  it('propre et à laver : pas de jauge', () => {
    expect(jaugeFut({ state: 'propre' }, aujourdhui)).toBeUndefined();
    expect(jaugeFut({ state: 'lavage' }, aujourdhui)).toBeUndefined();
  });
});

describe('pastille', () => {
  it('une teinte par famille connue, rien pour l’inconnu', () => {
    expect(couleurPastille('NEIPA')).toBe('#E8B84A');
    expect(couleurPastille('Pale Ale')).toBe('#D18A2E');
    expect(couleurPastille('Ambrée')).toBe('#A8552A');
    expect(couleurPastille('Gruit')).toBeUndefined();
    expect(couleurPastille(undefined)).toBeUndefined();
  });
});

describe('historique', () => {
  it('ajoute à la fin, plafonne à 30 en gardant les plus récentes', () => {
    let h = undefined as ReturnType<typeof avecEtape> | undefined;
    for (let i = 1; i <= 35; i += 1) h = avecEtape(h, { date: `01.01.2026`, quoi: 'lave', detail: `n°${i}` });
    expect(h).toHaveLength(HISTORIQUE_MAX);
    expect(h![0].detail).toBe('n°6');
    expect(h![29].detail).toBe('n°35');
  });
  it('les 3 dernières, la plus récente en premier ; tout voir', () => {
    const k = fut('F-001', 30, { historique: [
      { date: '24.10.2026', quoi: 'retour-vide', detail: 'Café du Marché' }, { date: '31.10.2026', quoi: 'lave' }, { date: '02.11.2026', quoi: 'rempli', detail: 'NEIPA Test LOT-002' }, { date: '04.11.2026', quoi: 'livre', detail: 'Café du Marché' }
    ] });
    expect(etapesRecentes(k, 3).map(libelleEtape)).toEqual(['Livré · Café du Marché', 'Rempli · NEIPA Test LOT-002', 'Lavé']);
    expect(etapesRecentes(k)).toHaveLength(4);
    expect(derniereDate(k, 'retour-vide')).toBe('24.10.2026');
    expect(derniereDate(k, 'retour-plein')).toBeUndefined();
  });
  it('un ancien fût sans historique : liste vide, pas d’erreur', () => {
    expect(etapesRecentes(fut('F-9', 30))).toEqual([]);
    expect(derniereDate(fut('F-9', 30), 'lave')).toBeUndefined();
  });
});

describe('gestes', () => {
  const plein = fut('F-001', 30, { state: 'plein', batchRef: 'LOT-002', beerName: 'NEIPA Test', style: 'NEIPA', fillDate: '02.11.2026', historique: [{ date: '02.11.2026', quoi: 'rempli', detail: 'NEIPA Test LOT-002' }] });
  it('livrer : client, date, étape', () => {
    const l = livrer(plein, { id: 'CL-001', name: 'Café du Marché' }, '04.11.2026');
    expect(l).toMatchObject({ state: 'livre', clientId: 'CL-001', clientName: 'Café du Marché', deliveryDate: '04.11.2026', beerName: 'NEIPA Test', batchRef: 'LOT-002' });
    expect(l.historique!.at(-1)).toEqual({ date: '04.11.2026', quoi: 'livre', detail: 'Café du Marché' });
  });
  it('revenu plein : garde la bière, efface le client', () => {
    const r = revenuPlein(livrer(plein, { id: 'CL-001', name: 'Café du Marché' }, '04.11.2026'), '15.11.2026');
    expect(r.state).toBe('plein');
    expect(r.beerName).toBe('NEIPA Test');
    expect(r.fillDate).toBe('02.11.2026');
    expect('clientName' in r || 'clientId' in r || 'deliveryDate' in r).toBe(false);
    expect(r.historique!.at(-1)).toEqual({ date: '15.11.2026', quoi: 'retour-plein', detail: 'Café du Marché' });
  });
  it('retour vide : passe à laver, vide la bière et le client', () => {
    const r = retourVide(livrer(plein, { name: 'Café du Marché' }, '04.11.2026'), '15.11.2026');
    expect(r.state).toBe('lavage');
    ['batchRef', 'beerName', 'style', 'fillDate', 'clientName', 'clientId', 'deliveryDate'].forEach((c) => expect(c in r).toBe(false));
    expect(r.historique!.at(-1)).toEqual({ date: '15.11.2026', quoi: 'retour-vide', detail: 'Café du Marché' });
  });
  it('marquer propre, puis remplir', () => {
    const p = marquerPropre(retourVide(plein, '10.11.2026'), '12.11.2026');
    expect(p.state).toBe('propre');
    expect(p.historique!.at(-1)).toEqual({ date: '12.11.2026', quoi: 'lave' });
    const r = remplirFut(p, lot, '15.11.2026');
    expect(r).toMatchObject({ state: 'plein', batchRef: 'LOT-003', beerName: 'Ambrée', style: 'Ambrée', fillDate: '15.11.2026' });
    expect(r.historique!.at(-1)).toEqual({ date: '15.11.2026', quoi: 'rempli', detail: 'Ambrée LOT-003' });
  });
  it('ne mute jamais le fût d’origine', () => {
    const copie = JSON.stringify(plein);
    livrer(plein, { name: 'X' }, '04.11.2026'); retourVide(plein, '04.11.2026'); marquerPropre(plein, '04.11.2026');
    expect(JSON.stringify(plein)).toBe(copie);
  });
});

describe('remplir depuis un lot', () => {
  const parc: KegItem[] = [fut('F-002', 30), fut('F-005', 20), fut('F-003', 30), fut('F-004', 30)];
  it('la barre : 60 L produits, 50 L choisis, 10 L restent', () => {
    const b = barreLitres(lot, parc, [parc[0], parc[1]]);
    expect(b).toEqual({ produits: 60, dejaEnFut: 0, choisis: 50, restent: 10 });
    expect(phraseLitres(b)).toBe('60 L produits · aucun en fût · 50 L choisis · 10 L restent');
  });
  it('compte ce qui est déjà en fût (plein ou livré) pour ce lot, pas les autres', () => {
    const avecDeja = [...parc, fut('F-010', 20, { state: 'plein', batchRef: 'LOT-003' }), fut('F-011', 30, { state: 'livre', batchRef: 'LOT-003' }), fut('F-012', 30, { state: 'plein', batchRef: 'LOT-001' })];
    const b = barreLitres(lot, avecDeja, [parc[0]]);
    expect(b).toMatchObject({ dejaEnFut: 50, choisis: 30, restent: 0 });
    expect(phraseLitres(b)).toBe('60 L produits · 50 L déjà en fût · 30 L choisis · plus rien ne reste');
  });
  it('volume inconnu : ni reste, ni refus', () => {
    const sans = { id: 'LOT-009' } as Batch;
    const b = barreLitres(sans, parc, [parc[0]]);
    expect(b.produits).toBeUndefined();
    expect(b.restent).toBeUndefined();
    expect(phraseLitres(b)).toBe('volume produit inconnu · aucun en fût · 30 L choisis');
    expect(problemeRemplissageMultiple(sans, [parc[0], parc[1], parc[2]], parc)).toBeUndefined();
  });
  it('accepte un fût partiel : 30 + 30 + 20 sur 60 L n’est pas accepté, 30 + 20 l’est', () => {
    expect(problemeRemplissageMultiple(lot, [parc[0], parc[1]], parc)).toBeUndefined();
    expect(problemeRemplissageMultiple(lot, [parc[0], parc[2], parc[1]], parc)).toMatch(/un fût resterait vide/);
  });
  it('accepte 30 + 30 sur 50 L (le second reste partiel), refuse 30 + 30 sur 30 L', () => {
    const l50 = { ...lot, volumePackagedL: 50, volumeL: 50 };
    expect(problemeRemplissageMultiple(l50, [parc[0], parc[2]], parc)).toBeUndefined();
    const l30 = { ...lot, volumePackagedL: 30, volumeL: 30 };
    expect(problemeRemplissageMultiple(l30, [parc[0], parc[2]], parc)).toMatch(/vide/);
  });
  it('un seul fût choisi : même verdict que problemeRemplissage, déjà en fût compris', () => {
    for (const deja of [0, 20, 40, 60, 80]) {
      const kegs = [fut('F-010', deja || 1, { state: 'plein', batchRef: 'LOT-003' })].map((k) => ({ ...k, capacityL: deja }));
      const un = parc[0];
      const ancien = problemeRemplissage({ ...un, state: 'plein', batchRef: 'LOT-003' }, [lot], kegs);
      expect(Boolean(problemeRemplissageMultiple(lot, [un], kegs))).toBe(Boolean(ancien));
    }
  });
  it('aucun fût choisi : pas de refus', () => { expect(problemeRemplissageMultiple(lot, [], parc)).toBeUndefined(); });
});

describe('ajouter des fûts', () => {
  it('numéros à la suite du parc', () => {
    expect(numerosSuivants(['F-001', 'F-002', 'F-003', 'F-004', 'F-005', 'F-006', 'F-007', 'F-008'], 3)).toEqual(['F-009', 'F-010', 'F-011']);
  });
  it('un fût retiré ne fait pas réattribuer son numéro ; un trou n’est pas comblé', () => {
    expect(numerosSuivants(['F-001', 'F-004'], 2)).toEqual(['F-005', 'F-006']);
  });
  it('parc vide, et numéros déjà pris sous une autre forme', () => {
    expect(numerosSuivants([], 2)).toEqual(['F-001', 'F-002']);
    expect(numerosSuivants(['f-001', 'F-002'], 1)).toEqual(['F-003']);
  });
  it('aucune collision sur 20 fûts', () => {
    const existants = ['F-001', 'F-002', 'F-007'];
    const ids = numerosSuivants(existants, 20);
    expect(new Set([...existants, ...ids]).size).toBe(23);
  });
  it('creerFuts : propres, capacité, note commune, étape « ajouté »', () => {
    const fs = creerFuts({ capacityL: 30, combien: 3, existants: ['F-008'], date: aujourdhui, notes: ' joint neuf ' });
    expect(fs.map((f) => f.id)).toEqual(['F-009', 'F-010', 'F-011']);
    fs.forEach((f) => expect(f).toMatchObject({ capacityL: 30, state: 'propre', notes: 'joint neuf', historique: [{ date: aujourdhui, quoi: 'ajoute' }] }));
    expect('notes' in creerFuts({ capacityL: 20, combien: 1, existants: [], date: aujourdhui })[0]).toBe(false);
  });
  it('aperçu et capacité saisie', () => {
    expect(resumeNumeros(['F-009', 'F-010', 'F-011'])).toBe('F-009, F-010, F-011');
    expect(resumeNumeros(numerosSuivants([], 10))).toBe('F-001 à F-010');
    expect(lireCapacite('25')).toBe(25);
    expect(lireCapacite('12,5')).toBe(12.5);
    ['', '0', 'abc', '-3', '500', '1e2'].forEach((s) => expect(lireCapacite(s)).toBeUndefined());
  });
});

// Liste des fûts (maquette G4) : fonctions pures. Parc de la planche des maquettes, au 15.11.2026.
import { describe, expect, it } from 'vitest';
import type { KegHistoryEntry, KegItem } from '../../src/types';
import {
  aReprendre, basculerFiltre, comptesParEtat, etatFut, futsARetablir, ligneDate, libelleSegment, marquerTousPropres, phraseFiltre, phraseMarques,
  phrasesResume, rangerParSections, resumeParc, titreConfirmation, trierSection
} from '../../src/domain/stock/futsFiche';

const AUJ = '15.11.2026';
const H = (date: string, quoi: KegHistoryEntry['quoi'], detail?: string): KegHistoryEntry => (detail ? { date, quoi, detail } : { date, quoi });
const PARC: KegItem[] = [
  { id: 'F-001', capacityL: 30, state: 'plein', batchRef: 'LOT-002', beerName: 'NEIPA Test', style: 'NEIPA', fillDate: '02.11.2026', historique: [H('02.11.2026', 'rempli', 'NEIPA Test LOT-002')] },
  { id: 'F-002', capacityL: 30, state: 'lavage', historique: [H('13.11.2026', 'retour-vide', 'Café du Marché')] },
  { id: 'F-003', capacityL: 30, state: 'lavage', historique: [H('10.11.2026', 'retour-vide', 'Bar Le Zinc')] },
  { id: 'F-004', capacityL: 30, state: 'lavage', historique: [H('10.11.2026', 'retour-vide')] },
  { id: 'F-005', capacityL: 20, state: 'propre', historique: [H('12.11.2026', 'lave')] },
  { id: 'F-006', capacityL: 30, state: 'livre', beerName: 'NEIPA Test', style: 'NEIPA', fillDate: '02.11.2026', clientName: 'Café du Marché', deliveryDate: '04.11.2026' },
  { id: 'F-007', capacityL: 30, state: 'livre', beerName: 'Pale Ale', style: 'Pale Ale', fillDate: '03.10.2026', clientName: 'Bar Le Zinc', deliveryDate: '06.10.2026' },
  { id: 'F-008', capacityL: 20, state: 'plein', batchRef: 'LOT-001', beerName: 'Pale Ale', style: 'Pale Ale', fillDate: '03.10.2026' }
];
const fut = (id: string) => PARC.find((k) => k.id === id)!;

describe('états, jauge et résumé', () => {
  it('compte par état, un état inconnu à part', () => {
    expect(comptesParEtat(PARC)).toEqual({ lavage: 3, propre: 1, plein: 2, livre: 2, unknown: 0 });
    expect(etatFut({ state: 'constructor' } as unknown as KegItem)).toBe('unknown');
    expect(etatFut({ state: undefined } as unknown as KegItem)).toBe('unknown');
    expect(comptesParEtat([{ state: 'ancien' } as unknown as KegItem]).unknown).toBe(1);
  });
  it('résumé du parc : 8 fûts · 220 L, 50 L pleins en cave, 2 dehors', () => {
    expect(resumeParc(PARC)).toEqual({ futs: 8, litres: 220, litresPleins: 50, dehors: 2 });
    expect(phrasesResume(resumeParc(PARC))).toEqual({ gauche: '8 fûts · 220 L', droite: '50 L pleins en cave · 2 dehors' });
  });
  it('un seul fût, aucun dehors, rien de plein : dit les zéros calculés', () => {
    expect(phrasesResume(resumeParc([fut('F-005')]))).toEqual({ gauche: '1 fût · 20 L', droite: '0 L pleins en cave · aucun dehors' });
  });
  it('une capacité illisible ne devient pas un total inventé', () => {
    expect(resumeParc([{ state: 'plein', capacityL: Number.NaN }, { state: 'plein', capacityL: 20 }]).litres).toBe(20);
  });
  it('libellé du segment : singulier à un fût (Propre 1, Propres 4)', () => {
    expect(libelleSegment('propre', 1)).toBe('Propre');
    expect(libelleSegment('propre', 4)).toBe('Propres');
    expect(libelleSegment('lavage', 3)).toBe('À laver');
    expect(libelleSegment('livre', 2)).toBe('Livrés');
  });
});

describe('filtre à choix multiple', () => {
  it('toucher ajoute, retoucher retire, aucun choisi = tout', () => {
    let f = basculerFiltre([], 'lavage');
    expect(f).toEqual(['lavage']);
    f = basculerFiltre(f, 'propre');
    expect(f).toEqual(['lavage', 'propre']);
    f = basculerFiltre(f, 'lavage');
    expect(f).toEqual(['propre']);
    expect(basculerFiltre(f, 'propre')).toEqual([]);
  });
  it('l’ordre est celui de la jauge, pas celui des touchers', () => {
    expect(basculerFiltre(basculerFiltre([], 'propre'), 'lavage')).toEqual(['lavage', 'propre']);
    expect(phraseFiltre(['propre', 'lavage'], (e) => (e === 'lavage' ? 'À laver' : 'Propres'))).toBe('À laver + Propres');
  });
});

describe('sections et tri : le plus ancien d’abord', () => {
  it('Livrés, Pleins, À laver, Propres', () => {
    expect(rangerParSections(PARC, AUJ).map((k) => k.id)).toEqual(['F-007', 'F-006', 'F-008', 'F-001', 'F-003', 'F-004', 'F-002', 'F-005']);
  });
  it('un état inconnu vient en dernier', () => {
    const inconnu = { id: 'F-009', capacityL: 30, state: 'ancien' } as unknown as KegItem;
    expect(rangerParSections([inconnu, fut('F-005'), fut('F-001')], AUJ).map((k) => k.id)).toEqual(['F-001', 'F-005', 'F-009']);
  });
  it('à date égale, par numéro ; sans date, à la fin', () => {
    const sansDate: KegItem = { id: 'F-010', capacityL: 30, state: 'lavage' };
    expect(trierSection([sansDate, fut('F-004'), fut('F-003')], AUJ).map((k) => k.id)).toEqual(['F-003', 'F-004', 'F-010']);
  });
  it('numéros triés comme des nombres (F-2 avant F-10)', () => {
    const a: KegItem = { id: 'F-10', capacityL: 20, state: 'propre' }, b: KegItem = { id: 'F-2', capacityL: 20, state: 'propre' };
    expect(trierSection([a, b], AUJ).map((k) => k.id)).toEqual(['F-2', 'F-10']);
  });
  it('ne modifie pas le tableau reçu', () => {
    const copie = [...PARC];
    rangerParSections(PARC, AUJ);
    expect(PARC).toEqual(copie);
  });
});

describe('lignes de L1', () => {
  it('plein : « Rempli le 02.11 · 13 j », âge ordinaire sous le repère NEIPA de 30 j', () => {
    expect(ligneDate(fut('F-001'), AUJ)).toEqual({ texte: 'Rempli le 02.11', age: '13 j', ancien: false });
  });
  it('plein : Pale Ale à 43 j, repère 45 j : pas encore ancien ; NEIPA de 43 j : ancien', () => {
    expect(ligneDate(fut('F-008'), AUJ)).toEqual({ texte: 'Rempli le 03.10', age: '43 j', ancien: false });
    expect(ligneDate({ ...fut('F-008'), style: 'NEIPA' }, AUJ)).toMatchObject({ age: '43 j', ancien: true });
  });
  it('livré : « Livré le 04.11 · 11 j dehors » ; 40 j dehors : ancien', () => {
    expect(ligneDate(fut('F-006'), AUJ)).toEqual({ texte: 'Livré le 04.11', age: '11 j dehors', ancien: false });
    expect(ligneDate(fut('F-007'), AUJ)).toEqual({ texte: 'Livré le 06.10', age: '40 j dehors', ancien: true });
  });
  it('propre et à laver : lavé le, revenu le (avec le client quand l’historique le dit)', () => {
    expect(ligneDate(fut('F-005'), AUJ)).toEqual({ texte: 'Lavé le 12.11', ancien: false });
    expect(ligneDate(fut('F-002'), AUJ)).toEqual({ texte: 'Revenu le 13.11 · Café du Marché', ancien: false });
    expect(ligneDate(fut('F-004'), AUJ)).toEqual({ texte: 'Revenu le 10.11', ancien: false });
  });
  it('rien si l’historique ne le dit pas : jamais une date inventée ni un 0', () => {
    expect(ligneDate({ id: 'F-011', capacityL: 20, state: 'propre' }, AUJ)).toBeUndefined();
    expect(ligneDate({ id: 'F-012', capacityL: 20, state: 'lavage', historique: [H('01.09.2026', 'ajoute')] }, AUJ)).toBeUndefined();
    expect(ligneDate({ id: 'F-013', capacityL: 20, state: 'plein' }, AUJ)).toBeUndefined();
    expect(ligneDate({ id: 'F-014', capacityL: 20, state: 'plein', fillDate: 'hier' }, AUJ)).toBeUndefined();
    expect(ligneDate({ id: 'F-015', capacityL: 20, state: 'livre', deliveryDate: '31.02.2026' }, AUJ)).toBeUndefined();
  });
  it('« À reprendre » : livré depuis plus de 30 j seulement', () => {
    expect(aReprendre(fut('F-007'), AUJ)).toBe(true);
    expect(aReprendre(fut('F-006'), AUJ)).toBe(false);
    expect(aReprendre({ ...fut('F-007'), deliveryDate: '16.10.2026' }, AUJ)).toBe(false); // 30 j pile : pas au-delà
    expect(aReprendre({ ...fut('F-007'), deliveryDate: undefined }, AUJ)).toBe(false);
    expect(aReprendre(fut('F-008'), AUJ)).toBe(false);
  });
});

describe('Tout marquer propre et Annuler', () => {
  it('seuls les fûts à laver, par numéro, avec une étape « lavé » du jour ; le contenu est vidé', () => {
    const { avant, apres } = marquerTousPropres(PARC, AUJ);
    expect(avant.map((k) => k.id)).toEqual(['F-002', 'F-003', 'F-004']);
    expect(apres.map((k) => k.state)).toEqual(['propre', 'propre', 'propre']);
    apres.forEach((k) => expect(k.historique!.at(-1)).toEqual({ date: AUJ, quoi: 'lave' }));
    expect(avant.every((k) => k.state === 'lavage')).toBe(true);
  });
  it('phrases : pluriel et singulier', () => {
    expect(titreConfirmation(3)).toBe('Marquer 3 fûts propres ?');
    expect(titreConfirmation(1)).toBe('Marquer 1 fût propre ?');
    expect(phraseMarques(3)).toBe('3 fûts marqués propres');
    expect(phraseMarques(1)).toBe('1 fût marqué propre');
  });
  it('rétablit les fûts intacts depuis le geste, laisse ceux qu’on a touchés depuis', () => {
    const { avant, apres } = marquerTousPropres(PARC, AUJ);
    const courants: KegItem[] = [
      ...apres.slice(0, 2),
      { ...apres[2], state: 'plein', historique: [...apres[2].historique!, H(AUJ, 'rempli', 'Ambrée LOT-003')] }
    ];
    expect(futsARetablir(avant, apres, courants).map((k) => k.id)).toEqual(['F-002', 'F-003']);
  });
  it('un champ ajouté par le stockage n’empêche pas de rétablir ; un fût retiré du parc est ignoré', () => {
    const { avant, apres } = marquerTousPropres(PARC, AUJ);
    const courants = [{ ...apres[0], updatedAt: 1 } as KegItem, apres[1]];
    expect(futsARetablir(avant, apres, courants).map((k) => k.id)).toEqual(['F-002', 'F-003']);
  });
});

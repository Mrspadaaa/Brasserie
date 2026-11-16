import { describe, expect, it } from 'vitest';
import type { CreativeItem } from '../../src/types';
import { chf, compteurs, dateEcheance, enEntree, genreDe, instantNote, marge, ranger, trierNotes } from '../../src/ui/atelier/atelierModel';

const item = (o: Partial<CreativeItem> & { id: string; type: CreativeItem['type'] }): CreativeItem => ({ title: 't', status: 'idea', ...o });

describe('Atelier e9na : règles du carnet', () => {
  it('range la note de la maquette en deux : une bière, une chose à faire', () => {
    const l = ranger('Lager au miel du voisin pour l\'été. Demander au Café du Midi son prix pour un fût.');
    expect(l.map(x => x.genre)).toEqual(['biere', 'faire']);
    expect(l[0].titre).toBe('Lager au miel');
    expect(l[1].titre).toBe('Demander au Café du Midi son prix pour un fût');
  });

  it('rattache « La rappeler. » au contact, et lit lieu et prénom', () => {
    const l = ranger('Lucie du Café du Midi veut un fût pour décembre. La rappeler.');
    expect(l).toHaveLength(1);
    expect(l[0]).toMatchObject({ genre: 'contact', titre: 'Café du Midi', contactName: 'Lucie' });
  });

  it('lit un tarif : prix et coût, jamais 0 quand ils manquent', () => {
    const [a] = ranger('33 cl à 6 au marché, elle me coûte 2,10.');
    expect(a).toMatchObject({ genre: 'tarif', targetPrice: 6, estimatedCost: 2.1 });
    const [b] = ranger('Carton de 24 à 120 pour l\'épicerie Le Panier.');
    expect(b.genre).toBe('tarif');
    expect(b.targetPrice).toBe(120);
    expect(b.estimatedCost).toBeUndefined();
  });

  it('ne prend pas une durée ou un degré pour un prix', () => {
    const [a] = ranger('Écorce d\'orange amère à 5 min de la fin, bière ambrée à 7 %.');
    expect(a.genre).not.toBe('tarif');
  });

  it('la ligne rangée devient une entrée sans champ neuf', () => {
    const e = enEntree(ranger('Commander 300 bouteilles 33 cl avant le 16.11.')[0], 'CR-1');
    expect(e).toMatchObject({ type: 'event', status: 'todo', date: '16.11.' + new Date().getFullYear() });
    expect(Object.keys(e).sort()).toEqual(['date', 'id', 'status', 'title', 'type']);
  });

  it('marge : TVA retirée selon les réglages, inconnue sans coût', () => {
    expect(marge(6, 2.1)).toBeCloseTo(3.9, 5);
    expect(marge(6, undefined)).toBeUndefined();
    expect(marge(undefined, 2)).toBeUndefined();
    expect(marge(108.1, 50, 0.081)).toBeCloseTo(50, 5);
  });

  it('chiffres à la virgule', () => {
    expect(chf(150)).toBe('150,00');
    expect(chf(1250.5)).toBe('1 250,50');
  });

  it('dates : celle de la saisie vient de l\'identifiant, l\'échéance prend son jour', () => {
    expect(instantNote(item({ id: 'CR-001', type: 'event' }))).toBeUndefined();
    expect(instantNote(item({ id: 'CR-1763000000000', type: 'event' }))).toBe(1763000000000);
    expect(dateEcheance('16.11.2026')).toBe('lun. 16.11');
    expect(dateEcheance('bientôt')).toBe('bientôt');
    expect(dateEcheance('')).toBeUndefined();
  });

  it('compte les tiroirs sans le matériel, trie les plus récentes d\'abord', () => {
    const l = [item({ id: 'CR-001', type: 'equipment' }), item({ id: 'CR-1763000000000', type: 'recipe-idea' }), item({ id: 'CR-1763100000000', type: 'prospect' })];
    expect(compteurs(l)).toMatchObject({ tout: 2, biere: 1, contact: 1, materiel: 1 });
    expect(genreDe(l[0])).toBeNull();
    expect(trierNotes(l).map(i => i.id)).toEqual(['CR-1763100000000', 'CR-1763000000000', 'CR-001']);
  });
});

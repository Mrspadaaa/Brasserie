import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from 'vitest';
import { defaultConfig } from '../../src/services/storage';
import { lignesImpot, totalAnnee, echeances, type DonneesImpot } from '../../src/ui/production/impotAnnee/calculAnnee';
import type { Batch } from '../../src/types';

/** La fixture de la maquette i1a : cinq brassins à densité notée et la Pale Ale de septembre, 26,6 L, sans densité. */
const lot = (id: string, nom: string, mois: string, og: string | undefined, litres: number | undefined, plus: Partial<Batch> = {}): Batch =>
  ({ id, name: nom, style: 'Ale', volumeL: 200, volumePackagedL: litres, brewDate: `2026-${mois}-10`, status: 'termine', og, abv: '5', ...plus } as Batch);
const fixture: Batch[] = [
  lot('B1', 'Blonde de janvier', '01', '1.046', 200),
  lot('B2', 'IPA de mars', '03', '1.062', 180),
  lot('B3', 'Saison de mai', '05', '1.052', 200),
  lot('B4', 'Blanche de juin', '06', '1.044', 220),
  lot('B5', 'Lager d’août', '08', '1.038', 200),
  lot('B6', 'Pale Ale de septembre', '09', undefined, 26.6)
];
const donnees = (fiscal: Partial<DonneesImpot['fiscal']> = {}): DonneesImpot => ({ plans: [], fiscal: { ...defaultConfig.fiscal, ...fiscal } });

describe('Impôt bière de l’année : le calcul de la maquette i1a', () => {
  const lignes = lignesImpot(fixture, donnees(), 2026);
  const total = totalAnnee(lignes);

  it('1. une ligne par brassin, dans l’ordre des dates, chacune sur sa bande', () => {
    expect(lignes.map(l => l.nom)).toEqual(fixture.map(b => b.name));
    expect(lignes.map(l => l.bande)).toEqual([1, 2, 1, 1, 0, null]);
    expect(lignes.map(l => l.montant)).toEqual([50.64, 60.77, 50.64, 55.7, 33.76, null]);
  });

  it('2. le total est la somme au centime : 256,00 – 260,49 (la densité manquante reste une fourchette)', () => {
    expect(total.bas).toBe(256);
    expect(total.haut).toBe(260.49);
    expect(total.nb).toBe(6);
    expect(total.litres).toBeCloseTo(1026.6, 5);
  });

  it('3. l’impôt par bande : 33,76 · 156,98 · 60,77 ; l’inconnu 4,49 – 8,98, jamais 0', () => {
    expect(total.bandes.map(b => b.chf)).toEqual([33.76, 156.98, 60.77]);
    expect(total.bandes.map(b => b.litres)).toEqual([200, 620, 180]);
    expect(total.inconnu).toEqual({ litres: 26.6, bas: 4.49, haut: 8.98 });
    expect(lignes[5].min).toBe(4.49);
    expect(lignes[5].max).toBe(8.98);
    expect(lignes[5].etat).toBe('inconnue');
  });

  it('4. sans litres, le montant est inconnu : ni 0 ni fourchette inventée, le total devient un minimum', () => {
    const sans = lignesImpot([...fixture.slice(0, 2), lot('B7', 'Sans litres', '10', '1.046', undefined)], donnees(), 2026);
    expect(sans[2]).toMatchObject({ litres: null, montant: null, min: null, max: null });
    const t = totalAnnee(sans);
    expect(t.sansLitres).toBe(1);
    expect(t.bas).toBe(111.41);
    expect(t.haut).toBe(111.41);
  });

  it('5. la visée de la recette porte la ligne, marquée estimée', () => {
    const [ligne] = lignesImpot([lot('V', 'Visée', '02', undefined, 100, { recipeSnapshot: { ogTarget: '1.046' } as never })], donnees(), 2026);
    expect(ligne.etat).toBe('visee');
    expect(ligne.bande).toBe(1);
    expect(ligne.montant).toBe(25.32);
    expect(totalAnnee([ligne]).visees).toBe(1);
  });

  it('6. un brassin sans alcool est exonéré : 0 CHF dit, pas un inconnu', () => {
    const [ligne] = lignesImpot([lot('S', 'Sans alcool', '04', '1.030', 100, { abv: '0.4' })], donnees(), 2026);
    expect(ligne.etat).toBe('exonere');
    expect(ligne.montant).toBe(0);
  });

  it('7. planifié, annulé et autres années sont absents', () => {
    const autres = [lot('P', 'Plan', '11', '1.046', 100, { status: 'planifie' }), lot('A', 'Annulé', '11', '1.046', 100, { status: 'annule' }),
      lot('Y', 'Autre année', '11', '1.046', 100, { brewDate: '2025-11-10' })];
    expect(lignesImpot(autres, donnees(), 2026)).toEqual([]);
    expect(lignesImpot(autres, donnees(), 2025).map(l => l.id)).toEqual(['Y']);
  });

  it('8. la réduction confirmée pour l’année s’applique à chaque ligne et au total', () => {
    const reduit = lignesImpot(fixture.slice(0, 1), donnees({ beerTaxAnnualReductionPct: 20, beerTaxReductionYear: 2026 } as never), 2026);
    expect(reduit[0].montant).toBe(40.51);
    const autreAnnee = lignesImpot(fixture.slice(0, 1), donnees({ beerTaxAnnualReductionPct: 20, beerTaxReductionYear: 2025 } as never), 2026);
    expect(autreAnnee[0].montant).toBe(50.64);
  });

  it('9. aucun brassin : ni 0 ni total, un tableau vide', () => {
    expect(lignesImpot([], donnees(), 2026)).toEqual([]);
    expect(totalAnnee([])).toMatchObject({ nb: 0, bas: null, haut: null });
  });
});

describe('Impôt bière de l’année : les échéances', () => {
  it('10. régime annuel : déclarer 20 jours et payer 30 jours après la fin de l’année', () => {
    expect(echeances(2026, 'annual')).toEqual({ declarer: '2027-01-20', payer: '2027-01-30' });
    expect(echeances(2026, undefined)).toEqual({ declarer: '2027-01-20', payer: '2027-01-30' });
  });
  it('11. régime trimestriel : pas de date unique', () => {
    expect(echeances(2026, 'quarterly')).toBeNull();
  });
});

describe('Impôt bière de l’année : le barème vient de la donnée', () => {
  it('12. aucun taux du barème écrit dans le dossier impotAnnee', () => {
    const dossier = path.resolve(__dirname, '../../src/ui/production/impotAnnee');
    for (const f of fs.readdirSync(dossier)) expect(fs.readFileSync(path.join(dossier, f), 'utf8'), f).not.toMatch(/16[,.]88|25[,.]32|33[,.]76/);
  });
});

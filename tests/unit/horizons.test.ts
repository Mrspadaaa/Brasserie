import { describe, expect, it } from 'vitest';
import { ajouterMois, estPassee, horizonDe, HORIZONS, lireIso, lundiDansLeMois, lundiDHorizon, motsPorteurs, prixSemblable, texteIntention, type AchatPasse } from '../../src/domain/horizons';
import { lundiDe } from '../../src/domain/calendrier';

describe('ajouterMois : mois civils bornés à la fin de mois (règle d’addMonths)', () => {
  it.each([
    ['2027-01-31', 1, '2027-02-28'],
    ['2028-01-31', 1, '2028-02-29'],
    ['2028-02-29', 12, '2029-02-28'],
    ['2026-11-21', 3, '2027-02-21'],
    ['2026-12-15', 1, '2027-01-15'],
    ['2026-08-31', 6, '2027-02-28'],
    ['2026-03-31', -1, '2026-02-28']
  ])('%s + %i mois = %s', (de, n, attendu) => expect(ajouterMois(de, n)).toBe(attendu));
});

describe('lundiDansLeMois : la semaine appartient au mois de son jeudi', () => {
  it('un samedi 1er mai donne le lundi 3 mai, pas le 26 avril', () => expect(lundiDansLeMois('2027-05-01')).toBe('2027-05-03'));
  it('un mercredi 31 mars donne le lundi 22 mars, pas le 29 (jeudi en avril)', () => expect(lundiDansLeMois('2027-03-31')).toBe('2027-03-22'));
  it('un jour au milieu du mois garde son lundi', () => expect(lundiDansLeMois('2027-02-21')).toBe('2027-02-15'));
});

describe('lundiDHorizon : un toucher, un lundi, jamais dans le passé', () => {
  const auj = '2026-11-21'; // samedi
  it('aujourd’hui : le lundi de la semaine en cours', () => expect(lundiDHorizon('aujourdhui', auj)).toBe('2026-11-16'));
  it('3 mois : vers févr.', () => {
    const l = lundiDHorizon('3-mois', auj)!;
    expect(l).toBe('2027-02-15');
    expect(texteIntention(l, auj)).toBe('vers févr.');
  });
  it('1 mois en fin d’année passe en décembre, 1 an change d’année et le dit', () => {
    expect(texteIntention(lundiDHorizon('1-mois', auj)!, auj)).toBe('vers déc.');
    expect(texteIntention(lundiDHorizon('1-an', auj)!, auj)).toBe('vers nov. 2027');
    expect(texteIntention(lundiDHorizon('6-mois', auj)!, auj)).toBe('vers mai');
  });
  it('passage d’année depuis décembre', () => expect(texteIntention(lundiDHorizon('3-mois', '2026-12-30')!, '2026-12-30')).toBe('vers mars'));
  it('plus tard : aucune date', () => expect(lundiDHorizon('plus-tard', auj)).toBeNull());
  it('chaque horizon daté tombe le lundi, et jamais avant la semaine en cours', () => {
    for (const auj2 of ['2026-01-31', '2026-02-28', '2028-02-29', '2026-12-31', '2026-11-21']) {
      for (const h of HORIZONS) {
        const l = lundiDHorizon(h.cle, auj2);
        if (l === null) continue;
        expect(lundiDe(l)).toBe(l);
        expect(estPassee(l, auj2)).toBe(false);
      }
    }
  });
  it('une date du jour illisible se refuse', () => expect(() => lundiDHorizon('3-mois', '21.11.2026')).toThrow());
});

describe('passé refusé, lecture', () => {
  it('la semaine en cours n’est pas passée ; la précédente l’est', () => {
    expect(estPassee('2026-11-16', '2026-11-22')).toBe(false);
    expect(estPassee('2026-11-09', '2026-11-16')).toBe(true);
  });
  it('une date dépassée se dit passée, jamais « vers »', () => expect(texteIntention('2026-10-05', '2026-11-21')).toBe('passé · S41'));
  it('la semaine en cours se dit « cette semaine »', () => expect(texteIntention('2026-11-18', '2026-11-21')).toBe('cette semaine'));
  it('une date illisible ne s’invente pas', () => {
    expect(texteIntention(undefined, '2026-11-21')).toBeNull();
    expect(lireIso('2026-02-30')).toBeNull();
  });
  it('horizonDe retrouve la puce choisie', () => {
    expect(horizonDe('2027-02-15', '2026-11-21')).toBe('3-mois');
    expect(horizonDe('2027-01-04', '2026-11-21')).toBeNull();
    expect(horizonDe(undefined, '2026-11-21')).toBeNull();
  });
});

describe('prixSemblable (D2) : dernier achat semblable, jamais 0, jamais inventé', () => {
  const achats: AchatPasse[] = [
    { libelle: 'ZZ TEST Pompe', centimes: 42_000, date: '2025-06-12', categorie: 'Matériel' },
    { libelle: 'Pompe vide-fût', centimes: 18_000, date: '2023-02-01' },
    { libelle: 'Malt Pilsner 25 kg', centimes: 5_600, date: '2026-10-01', ref: 'MALT-PILS' },
    { libelle: 'Évier inox', centimes: 0, date: '2026-01-10' }
  ];
  it('« Pompe 2025 : 420 » : le plus récent des achats semblables', () => {
    const p = prixSemblable({ nom: 'Nouvelle pompe de transfert' }, achats)!;
    expect(p.centimes).toBe(42_000);
    expect(p.source).toBe('ZZ TEST Pompe 2025');
  });
  it('une faute de frappe reste semblable (fuse.js)', () => expect(prixSemblable({ nom: 'pompes' }, achats)?.centimes).toBe(42_000));
  it('même référence d’abord', () => expect(prixSemblable({ nom: 'grain', ref: 'MALT-PILS' }, achats)?.centimes).toBe(5_600));
  it('rien de semblable : null (les ordres de grandeur prennent le relais)', () => expect(prixSemblable({ nom: 'Évier pour les fûts' }, achats)).toBeNull());
  it('un montant nul ou absent ne compte pas', () => expect(prixSemblable({ nom: 'évier inox' }, achats)).toBeNull());
  it('les mots vides ne rapprochent rien', () => expect(motsPorteurs('Achat pour les fûts')).toEqual(['futs']));
});

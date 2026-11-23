/**
 * D386 (18.11, CAL-JALON-UN-JOUR) : ce qui arrive un jour est un jalon (icône à sa date, nom à côté, sur une ligne de sa rangée) ; ce qui dure
 * est une barre. Un jalon lié à une barre d'une autre rangée y est relié par un fil discret ; au toucher de la barre, ses jalons s'allument.
 */
import { describe, expect, it } from 'vitest';
import { RANGEES, ajouterJours, barreLiee, estPonctuel, etiquetteS, lundiDe, type ChoseCalendrier, type Rangee as IdRangee } from '../../src/domain/calendrier';
import { disposer, type Colonne } from '../../src/ui/calendrier/frise/Rangee';
import { cheminFil, jalonsAllumes } from '../../src/ui/calendrier/frise/Frise';

const L = lundiDe('2026-11-16');
const COLS: Colonne[] = Array.from({ length: 6 }, (_, i) => ({ debut: ajouterJours(L, i * 7), fin: ajouterJours(L, i * 7 + 6), etiquette: etiquetteS(ajouterJours(L, i * 7)) }));
const LC = 56, LARGEUR = 366, RESERVE = 60;

const chose = (o: Partial<ChoseCalendrier> & { id: string; rangee: IdRangee }): ChoseCalendrier => ({
  titre: o.id, debut: ajouterJours(L, 15), fin: ajouterJours(L, 15),
  source: { genre: 'plan', id: o.id, origine: 'manual', statut: 'active' }, ouvre: { ecran: 'finances' }, deplacable: true, ...o
} as ChoseCalendrier);

describe('estPonctuel : un jour = un jalon, dans chaque rangée ; ce qui dure = une barre', () => {
  it('une chose datée d’un seul jour est un jalon dans les six rangées hors Brassins ; dans Brassins, un brassin reste une barre', () => {
    for (const { id } of RANGEES) {
      const c = chose({ id: `c-${id}`, rangee: id });
      expect(estPonctuel(c), id).toBe(id !== 'brassins');
    }
  });

  it('une fenêtre de plusieurs jours (foire, travaux) est une barre ; une fin vide vaut un jour', () => {
    expect(estPonctuel(chose({ id: 'foire', rangee: 'fetes', debut: ajouterJours(L, 18), fin: ajouterJours(L, 20) }))).toBe(false);
    expect(estPonctuel(chose({ id: 'sols', rangee: 'travaux', fin: ajouterJours(L, 30) }))).toBe(false);
    expect(estPonctuel(chose({ id: 'sans-fin', rangee: 'papiers', fin: '' }))).toBe(true);
  });

  it('une prévision récurrente (Loyer), une série par mois, un brassin habituel proposé, une fin inconnue, une chose sans date : jamais un jalon', () => {
    expect(estPonctuel(chose({ id: 'loyer', rangee: 'achats', source: { genre: 'plan', id: 'P-LOYER', origine: 'recurring', statut: 'active' } as ChoseCalendrier['source'] }))).toBe(false);
    expect(estPonctuel(chose({ id: 'serie', rangee: 'papiers', parMois: true }))).toBe(false);
    expect(estPonctuel(chose({ id: 'habituel', rangee: 'ventes', proposition: 'brassin-habituel' }))).toBe(false);
    expect(estPonctuel(chose({ id: 'inconnue', rangee: 'travaux', finInconnue: true } as Partial<ChoseCalendrier> & { id: string; rangee: IdRangee }))).toBe(false);
    expect(estPonctuel(chose({ id: 'poche', rangee: 'activites', sansDate: true } as Partial<ChoseCalendrier> & { id: string; rangee: IdRangee }))).toBe(false);
  });

  it('une vente probable d’un jour (Café du Pont, 1 fût) est un jalon (vente 1:1)', () => {
    expect(estPonctuel(chose({ id: 'cafe', rangee: 'ventes', probable: true, proposition: 'vente' }))).toBe(true);
  });

  it('barreLiee : la fête (`evenementId`) d’abord, sinon le brassin (`batchId`) ; un client seul ne fait pas de fil', () => {
    expect(barreLiee({ liens: { evenementId: 'CR-FOIRE', batchId: 'LOT-X' } })).toBe('creatif-CR-FOIRE');
    expect(barreLiee({ liens: { batchId: 'LOT-BLONDE' } })).toBe('brassin-LOT-BLONDE');
    expect(barreLiee({ liens: { clientId: 'CL-1' } })).toBeUndefined();
    expect(barreLiee({})).toBeUndefined();
  });
});

describe('disposer : le jalon au centre de SON jour, sur une ligne sans barre', () => {
  it('un mardi et un samedi de S+2 : l’icône est au centre de leur jour (1/7 de colonne), pas au milieu de la semaine', () => {
    for (const [j, jourDansSemaine] of [[15, 1], [19, 5]] as const) {
      const d = disposer([chose({ id: `j${j}`, rangee: 'achats', debut: ajouterJours(L, j), fin: ajouterJours(L, j) })], COLS, LC, LARGEUR, { reserveDroite: RESERVE }).items[0];
      expect(d).toMatchObject({ marque: true, jalon: true, avecLibelle: true });
      expect(d.gauche + 14).toBeCloseTo((2 + (jourDansSemaine + 0.5) / 7) * LC, 5);
    }
  });

  it('une barre et un jalon de la même semaine ne partagent jamais une ligne, quel que soit l’ordre d’arrivée', () => {
    const barre = chose({ id: 'travaux', rangee: 'achats', debut: ajouterJours(L, 7), fin: ajouterJours(L, 27) });
    const jalons = [chose({ id: 'a', rangee: 'achats', debut: ajouterJours(L, 15), fin: ajouterJours(L, 15) }), chose({ id: 'b', rangee: 'achats', debut: ajouterJours(L, 30), fin: ajouterJours(L, 30) })];
    for (const ordre of [[barre, ...jalons], [...jalons, barre]]) {
      const { items } = disposer(ordre, COLS, LC, LARGEUR, { reserveDroite: RESERVE });
      const ligneBarre = items.find(x => x.chose.id === 'travaux')!;
      expect(ligneBarre.jalon).toBeUndefined();
      for (const j of items.filter(x => x.jalon)) expect(j.ligne, j.chose.id).not.toBe(ligneBarre.ligne);
      /* les barres d'abord : la barre garde la première ligne */
      expect(ligneBarre.ligne).toBe(0);
    }
  });

  it('deux jalons éloignés de la même rangée partagent une ligne (ils ne mangent pas la hauteur)', () => {
    const { items } = disposer([chose({ id: 'a', rangee: 'papiers', debut: ajouterJours(L, 1), fin: ajouterJours(L, 1) }), chose({ id: 'b', rangee: 'papiers', debut: ajouterJours(L, 36), fin: ajouterJours(L, 36) })],
      COLS, LC, LARGEUR, { reserveDroite: RESERVE });
    expect(items.map(x => x.ligne)).toEqual([0, 0]);
  });
});

describe('cheminFil : le fil discret du jalon à sa barre', () => {
  const barre = { left: 100, right: 160, top: 40, bottom: 66 };
  it('jalon sous la barre, à son aplomb : un trait vertical du haut du jalon au bas de la barre', () => {
    expect(cheminFil({ left: 116, right: 144, top: 200, bottom: 228 }, barre)).toBe('M130.0 200.0V66.0');
  });
  it('jalon au-dessus et à côté : un coude à 8 px de la barre, borné à 6 px de son bord', () => {
    expect(cheminFil({ left: 20, right: 48, top: 0, bottom: 28 }, barre)).toBe('M34.0 28.0V32.0H106.0V40.0');
  });
  it('jalon et barre qui se chevauchent en hauteur : aucun fil', () => {
    expect(cheminFil({ left: 10, right: 38, top: 45, bottom: 60 }, barre)).toBeNull();
  });
});

describe('jalonsAllumes : au toucher d’une barre, ses jalons liés', () => {
  const foire = chose({ id: 'creatif-CR-FOIRE', rangee: 'fetes', debut: ajouterJours(L, 18), fin: ajouterJours(L, 20) });
  const tireuse = chose({ id: 'tireuse', rangee: 'achats', debut: ajouterJours(L, 18), fin: ajouterJours(L, 18), liens: { evenementId: 'CR-FOIRE' } });
  const dede = chose({ id: 'dede', rangee: 'ventes', debut: ajouterJours(L, 19), fin: ajouterJours(L, 19) });
  const toutes = [foire, tireuse, dede];
  it('la foire touchée allume la tireuse seule ; Dédé n’y est pas', () => {
    expect([...jalonsAllumes(toutes, foire)!]).toEqual(['tireuse']);
  });
  it('rien touché, un jalon sans lien touché, ou une barre sans jalon lié : aucun éclairage', () => {
    expect(jalonsAllumes(toutes, undefined)).toBeNull();
    expect(jalonsAllumes(toutes, dede)).toBeNull();
    expect(jalonsAllumes([foire, dede], foire)).toBeNull();
  });

  it('D390 : un jalon lié touché s’allume seul (son fil se dessine) ; sans sa barre à l’écran, rien', () => {
    expect(jalonsAllumes(toutes, tireuse)).toEqual(new Set(['tireuse']));
    expect(jalonsAllumes([tireuse, dede], tireuse)).toBeNull();
  });
});

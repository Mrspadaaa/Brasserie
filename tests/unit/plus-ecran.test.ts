import { describe, expect, it } from 'vitest';
import { COMMUNS, ecranId, LETTRES, plusMenuFor, plusMenuPage, type EcranId } from '../../src/domain/plusEcran';
import type { TabType } from '../../src/components/BottomNav';
import type { AnySubTab } from '../../src/domain/fabActions';

const ECRANS: Array<[EcranId, TabType, AnySubTab]> = [
  ['bord', 'dashboard', null], ['finances', 'finances', null],
  ['brassins', 'production', 'batches'], ['recettes', 'production', 'recipes'], ['atelier', 'production', 'lab'], ['volumes', 'production', 'scaler'],
  ['stock', 'stocks', 'stock'], ['courses', 'stocks', 'courses'], ['futs', 'stocks', 'futs'], ['materiel', 'stocks', 'materiel'], ['houblons', 'stocks', 'hops'],
  ['clients', 'clients', 'crm'], ['impot', 'clients', 'ofdf'], ['tarifs', 'clients', 'tarifs']
];
const contexte = { prochainBrassin: 'LOT-004', prochainFut: 'F-007', aCommander: 2, enCuve: 2 };

/** Ce que la feuille met en tête : l'action de l'écran et ses autres actions. */
const enTete = (id: EcranId) => {
  const [, tab, sub] = ECRANS.find((e) => e[0] === id)!;
  const m = plusMenuFor(tab, sub, contexte);
  return [m.action ? `ecran:${m.action.intent}` : null, ...m.autres.map((e) => e.cle)].filter(Boolean).join('|');
};

describe('Menu du + selon l’écran (b1s-a « Deux étages »)', () => {
  it('chaque écran est reconnu depuis son onglet et son sous-onglet', () => {
    for (const [id, tab, sub] of ECRANS) expect(ecranId(tab, sub)).toBe(id);
  });

  it('l’action de l’écran est la bonne sur les 14 écrans (BX-4 : aucune sur Volumes ni Impôt bière)', () => {
    const attendu: Record<EcranId, string | null> = {
      bord: 'Nouvelle écriture', finances: 'Nouvelle écriture', brassins: 'Nouveau brassin', recettes: 'Nouvelle recette', atelier: 'Nouvelle idée',
      volumes: null, stock: 'Nouvel article', courses: 'Copier la liste', futs: 'Nouveau fût', materiel: 'Nouveau matériel',
      houblons: 'Nouvelle variété', clients: 'Nouveau client', impot: null, tarifs: 'Nouveau tarif'
    };
    for (const [id, tab, sub] of ECRANS) expect(plusMenuFor(tab, sub, contexte).action?.label ?? null, id).toBe(attendu[id]);
  });

  it('le commun est toujours là : les cinq gestes de « Partout », dans le même ordre, sur les 14 écrans', () => {
    for (const [id, tab, sub] of ECRANS) {
      const m = plusMenuFor(tab, sub, contexte);
      expect(m.partout.map((e) => e.cle), id).toEqual(COMMUNS);
      expect(m.partout.map((e) => e.label), id).toEqual(
        ['Nouvelle écriture', 'Entrer une facture', 'Encaisser une vente', 'Créer une recette', 'Lancer un brassin']
      );
    }
  });

  it('ET-PLUS : ce que l’écran met en tête diffère d’un écran à l’autre', () => {
    const signatures = ECRANS.map(([id]) => enTete(id));
    // Quatorze écrans : au plus trois en tête identiques (Matériel, Impôt bière… presque vides).
    expect(new Set(signatures).size).toBeGreaterThanOrEqual(11);
  });

  it('un geste commun déjà en tête garde sa case de « Partout », marquée et active (jamais retirée)', () => {
    const marques = (id: EcranId) => {
      const [, tab, sub] = ECRANS.find((e) => e[0] === id)!;
      return plusMenuFor(tab, sub, contexte).partout.filter((e) => e.monte).map((e) => e.cle);
    };
    expect(marques('bord')).toEqual(['ecriture']);
    expect(marques('finances')).toEqual(['ecriture', 'facture', 'vente']);
    expect(marques('brassins')).toEqual(['brassin']);
    expect(marques('recettes')).toEqual(['recette', 'brassin']);
    expect(marques('volumes')).toEqual(['brassin']);
    expect(marques('futs')).toEqual(['vente']);
    expect(marques('clients')).toEqual(['vente']);
    expect(marques('materiel')).toEqual([]);
    expect(marques('impot')).toEqual([]);
  });

  it('rien de perdu : Estimer un brassin, Facture et Vente sont en tête de Finances (un seul +, plus de « + » rond sur la synthèse), Vente en tête de Fûts et Clients, Courses en tête de Bord', () => {
    expect(plusMenuFor('dashboard', null, contexte).autres.map((e) => e.cle)).toEqual(['courses']);
    expect(plusMenuFor('finances', null, contexte).autres.map((e) => e.cle)).toEqual(['estimer', 'facture', 'vente']);
    expect(plusMenuFor('stocks', 'futs', contexte).autres.map((e) => e.cle)).toContain('vente');
    expect(plusMenuFor('clients', 'crm', contexte).autres.map((e) => e.cle)).toContain('vente');
    expect(plusMenuFor('stocks', 'courses', contexte).autres.map((e) => e.cle)).toContain('article');
  });

  it('les précisions viennent de l’app ; une donnée inconnue ne donne ni précision ni zéro', () => {
    expect(plusMenuFor('production', 'batches', contexte).action?.hint).toBe('sera LOT-004');
    expect(plusMenuFor('production', 'batches', contexte).partout.find((e) => e.cle === 'brassin')?.hint).toBe('sera LOT-004');
    expect(plusMenuFor('production', 'batches', contexte).etat).toBe('2 en cuve');
    expect(plusMenuFor('stocks', 'futs', contexte).action?.hint).toBe('sera F-007');
    expect(plusMenuFor('stocks', 'courses', contexte).action?.hint).toBe('2 articles');
    expect(plusMenuFor('production', 'batches', contexte).autres.find((e) => e.cle === 'courses')?.hint).toBe('2 à commander');
    const inconnu = plusMenuFor('production', 'batches', {});
    expect(inconnu.action?.hint).toBeUndefined();
    expect(inconnu.etat).toBeUndefined();
    expect(inconnu.autres.find((e) => e.cle === 'courses')?.hint).toBeUndefined();
    expect(inconnu.partout.find((e) => e.cle === 'brassin')?.hint).toBeUndefined();
    expect(plusMenuFor('production', 'batches', { aCommander: 0, enCuve: 0 }).autres.find((e) => e.cle === 'courses')?.hint).toBeUndefined();
    expect(plusMenuFor('production', 'batches', { enCuve: 0 }).etat).toBeUndefined();
  });

  it('les lettres sont uniques et fixes', () => {
    const lettres = Object.values(LETTRES);
    expect(new Set(lettres).size).toBe(lettres.length);
    expect(lettres).not.toContain('N');
    expect(lettres).not.toContain('C');
    expect(plusMenuFor('dashboard', null, contexte).partout[1].lettre).toBe(LETTRES.facture);
  });

  it('les tuiles du 390 portent les libellés courts de b1s-a, le geste courses dit « Courses » (il ouvre l’écran, il n’ajoute rien)', () => {
    const m = plusMenuFor('production', 'batches', contexte);
    expect(m.partout.map((e) => e.court)).toEqual(['Écriture', 'Facture', 'Vente', 'Recette', 'Brassin']);
    expect(m.partout.map((e) => e.label)).toEqual(['Nouvelle écriture', 'Entrer une facture', 'Encaisser une vente', 'Créer une recette', 'Lancer un brassin']);
    expect(m.autres.find((e) => e.cle === 'courses')?.label).toBe('Courses');
  });

  it('une page plein écran garde les gestes de partout, sans action d’écran', () => {
    const m = plusMenuPage(contexte);
    expect(m.action).toBeNull();
    expect(m.autres).toEqual([]);
    expect(m.partout.map((e) => e.cle)).toEqual(COMMUNS);
    expect(m.partout.some((e) => e.monte)).toBe(false);
  });
});

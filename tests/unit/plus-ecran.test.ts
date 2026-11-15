import { describe, expect, it } from 'vitest';
import { ecranId, LETTRES, plusMenuFor, plusMenuPage, type EcranId } from '../../src/domain/plusEcran';
import type { TabType } from '../../src/components/BottomNav';
import type { AnySubTab } from '../../src/domain/fabActions';

const ECRANS: Array<[EcranId, TabType, AnySubTab]> = [
  ['bord', 'dashboard', null], ['finances', 'finances', null],
  ['brassins', 'production', 'batches'], ['recettes', 'production', 'recipes'], ['atelier', 'production', 'lab'], ['volumes', 'production', 'scaler'],
  ['stock', 'stocks', 'stock'], ['courses', 'stocks', 'courses'], ['futs', 'stocks', 'futs'], ['materiel', 'stocks', 'materiel'], ['houblons', 'stocks', 'hops'],
  ['clients', 'clients', 'crm'], ['impot', 'clients', 'ofdf'], ['tarifs', 'clients', 'tarifs']
];
const contexte = { prochainBrassin: 'LOT-004', prochainFut: 'F-007', aCommander: 2 };

describe('Menu du + selon l’écran (b1r)', () => {
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

  it('ET-PLUS : le menu diffère d’un écran à l’autre au-delà de la première ligne', () => {
    const signature = (id: EcranId) => {
      const [, tab, sub] = ECRANS.find((e) => e[0] === id)!;
      const m = plusMenuFor(tab, sub, contexte);
      return [...m.autres, ...m.ici].map((e) => e.cle).join('|');
    };
    const signatures = ECRANS.map(([id]) => signature(id));
    // Quatorze écrans, au plus deux menus identiques (Brassins/Volumes se ressemblent, pas les autres).
    expect(new Set(signatures).size).toBeGreaterThanOrEqual(12);
  });

  it('une seule entrée Brassin par menu : jamais l’action de l’écran répétée plus bas', () => {
    for (const [, tab, sub] of ECRANS) {
      const m = plusMenuFor(tab, sub, contexte);
      const cles = [...m.autres, ...m.ici].map((e) => e.cle);
      expect(new Set(cles).size).toBe(cles.length);
      if (m.action?.intent === 'newBatch') expect(cles).not.toContain('brassin');
      if (m.action?.intent === 'newRecipe') expect(cles).not.toContain('recette');
      if (m.action?.intent === 'newIdea') expect(cles).not.toContain('idee');
      expect(m.ici.length).toBeLessThanOrEqual(3);
    }
  });

  it('rien de perdu : Écriture, Facture et Vente restent sur Bord et Finances ; Vente sur Fûts et Clients', () => {
    const bord = plusMenuFor('dashboard', null, contexte);
    expect([bord.action?.intent, ...bord.autres.map((e) => e.cle)]).toEqual(['newTransaction', 'facture', 'vente']);
    expect(plusMenuFor('finances', null, contexte).autres.map((e) => e.cle)).toEqual(['facture', 'vente']);
    expect(plusMenuFor('stocks', 'futs', contexte).ici.map((e) => e.cle)).toContain('vente');
    expect(plusMenuFor('clients', 'crm', contexte).ici.map((e) => e.cle)).toContain('vente');
  });

  it('les précisions viennent de l’app ; une donnée inconnue ne donne ni précision ni zéro', () => {
    expect(plusMenuFor('production', 'batches', contexte).action?.hint).toBe('sera LOT-004');
    expect(plusMenuFor('stocks', 'futs', contexte).action?.hint).toBe('sera F-007');
    expect(plusMenuFor('stocks', 'courses', contexte).action?.hint).toBe('2 articles');
    expect(plusMenuFor('production', 'batches', contexte).ici.find((e) => e.cle === 'courses')?.hint).toBe('2 à commander');
    const inconnu = plusMenuFor('production', 'batches', {});
    expect(inconnu.action?.hint).toBeUndefined();
    expect(inconnu.ici.find((e) => e.cle === 'courses')?.hint).toBeUndefined();
    expect(plusMenuFor('production', 'batches', { aCommander: 0 }).ici.find((e) => e.cle === 'courses')?.hint).toBeUndefined();
  });

  it('les lettres sont uniques et fixes', () => {
    const lettres = Object.values(LETTRES);
    expect(new Set(lettres).size).toBe(lettres.length);
    expect(lettres).not.toContain('N');
    expect(lettres).not.toContain('C');
    expect(plusMenuFor('dashboard', null, contexte).autres[0].lettre).toBe(LETTRES.facture);
  });

  it('une page plein écran garde les quatre gestes de partout, sans action d’écran', () => {
    const m = plusMenuPage(contexte);
    expect(m.action).toBeNull();
    expect(m.ici.map((e) => e.cle)).toEqual(['facture', 'vente', 'recette', 'brassin']);
  });
});

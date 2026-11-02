// Voie r4-port-d, reprise 1 (D311, son choix E) : le segment « Plié | Déplié » — « Plié » garde ouvert un groupe à vérifier, l'état allumé se calcule, un toucher
// plie ou déplie toujours chaque groupe. Calculs purs de groupes.ts, pièce SIMULÉE (celle de sa maquette E, Nettoyage et Rénovation). Rouges sur l'arbre d'avant.
import { describe, expect, it } from 'vitest';
import { bandes, etatSegment, groupeOuvert, pliable, poserGroupe, toutDeplier, toutPlier, type LigneBande } from '../../../../src/ui/depense/groupes';
import { reserveInconnu } from '../../../../src/ui/depense/Liste';

const L = (id: string, groupe: LigneBande['groupe'], sf: string, cents: number, extra: Partial<LigneBande> = {}): LigneBande =>
  ({ id, groupe, sousFamille: sf, amount: cents / 100, quantity: 1, unit: 'Stk', uniteLisible: true, mouture: false, ...extra });
// Sa maquette E : Nettoyage (CIP alcalin 2, Désinfectant 2 dont une ligne à vérifier, Détergent 2), Rénovation (Peinture 2, Outillage 2, Plomberie 1).
const piece = (): LigneBande[] => [
  L('a1', 'nettoyage', 'CIP alcalin', 980), L('a2', 'nettoyage', 'CIP alcalin', 1260),
  L('d1', 'nettoyage', 'Désinfectant', 1640), L('d2', 'nettoyage', 'Désinfectant', 1380, { averifier: true, niveau: 'repris' }),
  L('g1', 'nettoyage', 'Détergent', 2000), L('g2', 'nettoyage', 'Détergent', 1340),
  L('p1', 'renovation', 'Peinture et sols', 6490), L('p2', 'renovation', 'Peinture et sols', 895),
  L('o1', 'renovation', 'Outillage', 8900), L('o2', 'renovation', 'Outillage', 650), L('pl1', 'renovation', 'Plomberie', 4600),
];
const liste = bandes(piece());
const ouverts = (choix: ReadonlyMap<string, boolean>, forces?: ReadonlySet<string>) =>
  liste.flatMap(b => (b.sousGroupes ?? []).filter(pliable).filter(g => groupeOuvert(b.cle, g, choix, forces)).map(g => `${b.cle}/${g.nom}`));

describe('D311 : « Plié » garde ouvert un groupe à vérifier', () => {
  it('au repos d\'une lecture : seul le groupe à vérifier est ouvert', () => {
    expect(ouverts(new Map())).toEqual(['nettoyage/Désinfectant']);
  });
  it('« Plié » après « Déplié » : tout replié, sauf Désinfectant (sa page : « une ligne à vérifier garde son groupe ouvert, même tout plié »)', () => {
    expect(ouverts(toutPlier(liste, toutDeplier(liste, new Map())))).toEqual(['nettoyage/Désinfectant']);
  });
  it('« Plié » rouvre un groupe à vérifier que le brasseur avait fermé', () => {
    const ferme = poserGroupe(new Map(), 'nettoyage', 'Désinfectant', false);
    expect(ouverts(ferme)).toEqual([]);
    expect(ouverts(toutPlier(liste, ferme))).toEqual(['nettoyage/Désinfectant']);
  });
  it('« Déplié » ouvre tout', () => {
    expect(ouverts(toutDeplier(liste, new Map()))).toEqual(['nettoyage/CIP alcalin', 'nettoyage/Désinfectant', 'nettoyage/Détergent', 'renovation/Peinture et sols', 'renovation/Outillage']);
  });
  it('une seule bande : « Plié » de la Rénovation ne touche pas Nettoyage', () => {
    const sorti = toutPlier(liste, toutDeplier(liste, new Map()), 'renovation');
    expect(ouverts(sorti)).toEqual(['nettoyage/CIP alcalin', 'nettoyage/Désinfectant', 'nettoyage/Détergent']);
  });
});

describe('D311 : l\'état allumé se calcule, il n\'est jamais gardé', () => {
  it('au repos d\'une lecture, « Plié » est allumé, pas « Déplié »', () => {
    expect(etatSegment(liste, new Map())).toEqual({ visible: true, plie: true, deplie: false });
  });
  it('après « Déplié » : « Déplié » allumé seul ; après « Plié » : « Plié » allumé seul', () => {
    expect(etatSegment(liste, toutDeplier(liste, new Map()))).toEqual({ visible: true, plie: false, deplie: true });
    expect(etatSegment(liste, toutPlier(liste, toutDeplier(liste, new Map())))).toEqual({ visible: true, plie: true, deplie: false });
  });
  it('un toucher après « Plié » ouvre un groupe : « Plié » s\'éteint, aucun des deux n\'est allumé (état mêlé, sa vue e-mele)', () => {
    const plie = toutPlier(liste, new Map());
    const mele = poserGroupe(plie, 'renovation', 'Peinture et sols', true);
    expect(etatSegment(liste, mele)).toEqual({ visible: true, plie: false, deplie: false });
  });
  it('un toucher replie un groupe à vérifier : toujours possible, l\'état est alors mêlé', () => {
    const ferme = poserGroupe(toutDeplier(liste, new Map()), 'nettoyage', 'Désinfectant', false);
    expect(ouverts(ferme)).not.toContain('nettoyage/Désinfectant');
    expect(etatSegment(liste, ferme)).toEqual({ visible: true, plie: false, deplie: false });
  });
  it('rouvrir le groupe refermé rend l\'état de « Plié » : l\'état est celui des groupes, pas un mode', () => {
    const mele = poserGroupe(toutPlier(liste, new Map()), 'renovation', 'Outillage', true);
    const retour = poserGroupe(mele, 'renovation', 'Outillage', false);
    expect(etatSegment(liste, retour).plie).toBe(true);
  });
  it('« Déplié » puis un toucher qui replie un groupe : mêlé ; « Déplié » puis un toucher sur un groupe déjà ouvert le replie', () => {
    const d = toutDeplier(liste, new Map());
    expect(groupeOuvert('renovation', liste.find(b => b.cle === 'renovation')!.sousGroupes![0], poserGroupe(d, 'renovation', 'Peinture et sols', false))).toBe(false);
  });
  it('un groupe forcé ouvert (plateau ouvert, filtre) compte comme ouvert : l\'état suit ce qu\'on voit', () => {
    expect(etatSegment(liste, toutPlier(liste, new Map()), new Set(['p1']))).toEqual({ visible: true, plie: false, deplie: false });
  });
  it('tous les groupes à vérifier : « Plié » et « Déplié » produisent le même état, les deux allumés', () => {
    const tous = bandes([L('x1', 'renovation', 'Outillage', 100, { averifier: true }), L('x2', 'renovation', 'Outillage', 100), L('y1', 'renovation', 'Plomberie', 100, { averifier: true }), L('y2', 'renovation', 'Plomberie', 100)]);
    expect(etatSegment(tous, new Map())).toEqual({ visible: true, plie: true, deplie: true });
  });
});

describe('D311 : le segment n\'existe que s\'il a quelque chose à plier', () => {
  it('sans bande à deux sous-familles : invisible', () => {
    expect(etatSegment(bandes([L('a', 'renovation', 'Outillage', 100), L('b', 'renovation', 'Outillage', 100)]), new Map()).visible).toBe(false);
    expect(etatSegment([], new Map()).visible).toBe(false);
  });
  it('deux sous-familles d\'une ligne chacune : rien à plier, invisible (lecture du pilote, plus étroite que « deux sous-familles »)', () => {
    expect(etatSegment(bandes([L('a', 'renovation', 'Outillage', 100), L('b', 'renovation', 'Plomberie', 100)]), new Map()).visible).toBe(false);
  });
});

describe('M1 : la colonne des quantités ne glisse pas sur un montant inconnu', () => {
  it('sans inconnu : rien (les classes d\'aujourd\'hui)', () => {
    expect(reserveInconnu('410,50', false)).toEqual({});
  });
  it('avec inconnu : le montant réserve la largeur de « 410,50 + ? » en ch, la quantité rend d\'autant sa marge', () => {
    const r = reserveInconnu('410,50', true);
    expect(r.montant).toEqual({ minWidth: 'max(54px, 10ch)' });
    expect(r.qte).toEqual({ marginRight: 'calc(57px - max(0px, 11.667ch - 54px))' });
  });
  it('un montant plus long réserve plus (« 1234,50 + ? » : 11 ch)', () => {
    expect(reserveInconnu('1234,50', true).montant).toEqual({ minWidth: 'max(54px, 11ch)' });
  });
});

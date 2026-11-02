// Voie r4-port-d (D307, son choix D) : les sous-groupes d'une bande (calculs purs de groupes.ts). Pièce SIMULÉE : les seize lignes de « Brico Fictif SA » de sa maquette choisie
// (`choix-sousfamilles/outils/gen.mjs`), montants en centimes entiers. Rouges sur l'arbre d'avant (groupes.ts de HEAD : aucun sous-groupe), verts après.
import { describe, expect, it } from 'vitest';
import {
  bandes, cleGroupe, groupeDe, groupeOuvert, ordreSousFamilles, pliable, poserGroupe, sousFamilleDeLigne, texteQte, toutDeplier, toutPlier, type ChoixGroupes, type LigneBande,
} from '../../../../src/ui/depense/groupes';

const L = (id: string, groupe: LigneBande['groupe'], sousFamille: string | undefined, amount: number | undefined, quantity: number | undefined, unit: string, extra: Partial<LigneBande> = {}): LigneBande =>
  ({ id, groupe, ...(sousFamille ? { sousFamille } : {}), amount, quantity, unit, uniteLisible: unit.trim() !== '', mouture: false, ...extra });
const R = (id: string, sf: string, q: number, prixCents: number, extra: Partial<LigneBande> = {}) => L(id, 'renovation', sf, (q * prixCents) / 100, q, 'Stk', extra);
// L'ordre du papier de la maquette (les sous-familles y sont mêlées).
const brico = (): LigneBande[] => [
  R('1', 'Peinture et sols', 2, 6490), R('2', 'Peinture et sols', 2, 895), R('3', 'Outillage', 1, 8900), R('4', 'Quincaillerie', 1, 1450), R('5', 'Quincaillerie', 1, 790),
  R('6', 'Électricité', 1, 2490), R('7', 'Électricité', 2, 1240), R('8', 'Plomberie', 4, 320), R('9', 'Plomberie', 1, 4600), R('10', 'Peinture et sols', 1, 990),
  R('11', 'Peinture et sols', 3, 460), R('12', 'Protection', 1, 850), R('13', 'Protection', 1, 1290), R('14', 'Outillage', 1, 650), R('15', 'Divers travaux', 2, 780), R('16', 'Peinture et sols', 1, 1990),
];
const rev = (l: LigneBande[]) => bandes(l).find(b => b.cle === 'renovation')!;

describe('D307 : les sous-groupes d\'une bande à sept sous-familles', () => {
  const b = rev(brico());
  it('sept sous-groupes, dans l\'ordre de SOUS_FAMILLES_RENOVATION, pas dans celui du papier', () => {
    expect(b.sousGroupes!.map(g => g.nom)).toEqual(['Peinture et sols', 'Outillage', 'Quincaillerie', 'Électricité', 'Plomberie', 'Protection', 'Divers travaux']);
  });
  it('rangées d\'un groupe : l\'ordre du papier', () => {
    expect(b.sousGroupes![0].ids).toEqual(['1', '2', '10', '11', '16']);
    expect(b.sousGroupes![4].ids).toEqual(['8', '9']);
  });
  it('sous-totaux de quantité (la fonction de la bande) et de montant, au centime : ceux de sa maquette', () => {
    const lu = b.sousGroupes!.map(g => `${g.nom} ${g.ids.length} ${texteQte(g.qte)} ${g.cents}`);
    expect(lu).toEqual(['Peinture et sols 5 9 Stk 19130', 'Outillage 2 2 Stk 9550', 'Quincaillerie 2 2 Stk 2240', 'Électricité 2 3 Stk 4970', 'Plomberie 2 5 Stk 5880', 'Protection 2 2 Stk 2140', 'Divers travaux 1 2 Stk 1560']);
  });
  it('la somme des sous-groupes est la bande : 454,70, 16 rangées, 25 Stk', () => {
    expect(b.sousGroupes!.reduce((s, g) => s + g.cents, 0)).toBe(b.cents);
    expect(b.cents).toBe(45470);
    expect(b.sousGroupes!.reduce((s, g) => s + g.ids.length, 0)).toBe(b.ids.length);
    expect(texteQte(b.qte)).toBe('25 Stk');
  });
  it('les unités d\'une même grandeur s\'additionnent dans un sous-groupe comme dans la bande (1 Kg + 300 g = 1,3 Kg), les pièces à part', () => {
    const g = rev([L('a', 'renovation', 'Peinture et sols', 4.1, 1, 'Kg'), L('b', 'renovation', 'Peinture et sols', 1.2, 300, 'g'), L('c', 'renovation', 'Peinture et sols', 3, 2, 'Stk'), R('d', 'Outillage', 1, 650)]).sousGroupes![0];
    expect(texteQte(g.qte)).toBe('1,3 Kg + 2 Stk'); expect(g.cents).toBe(830);
  });
  it('les centimes restent entiers : 0,10 + 0,20 = 0,30', () => {
    const g = rev([L('a', 'renovation', 'Outillage', 0.1, 1, 'Stk'), L('b', 'renovation', 'Outillage', 0.2, 1, 'Stk'), R('c', 'Protection', 1, 100)]).sousGroupes![0];
    expect(g.cents).toBe(30);
  });
  it('l\'inconnu n\'est jamais 0 : un montant absent marque son sous-groupe (« + ? »), pas les autres ; une unité illisible reste « ? »', () => {
    const t = rev([R('a', 'Outillage', 1, 650), L('b', 'renovation', 'Outillage', undefined, 1, 'Stk'), L('c', 'renovation', 'Protection', 5, 3, ''), R('d', 'Protection', 1, 100)]);
    const [out, pro] = t.sousGroupes!;
    expect(out.incomplet).toBe(true); expect(pro.incomplet).toBe(false);
    expect(texteQte(pro.qte)).toBe('1 Stk + 3 ?');
    expect(t.incomplet).toBe(true);
  });
});

describe('D307 : une bande sans deux sous-familles reste celle d\'aujourd\'hui', () => {
  it('une seule sous-famille : aucun sous-groupe, la bande est identique à celle de lignes sans sous-famille', () => {
    const avec = bandes([R('1', 'Outillage', 2, 650), R('2', 'Outillage', 1, 890)]);
    const sans = bandes([L('1', 'renovation', undefined, 13, 2, 'Stk'), L('2', 'renovation', undefined, 8.9, 1, 'Stk')]);
    expect(avec[0].sousGroupes).toBeUndefined();
    expect(avec).toEqual(sans);
  });
  it('Houblons et Malts (une catégorie de stock ou aucune) : aucun sous-groupe', () => {
    const b = bandes([L('1', 'houblon', 'Houblon', 5, 100, 'g'), L('2', 'houblon', 'Houblon', 6, 100, 'g'), L('3', 'malt', undefined, 9, 5, 'Kg')]);
    expect(b.every(x => x.sousGroupes === undefined)).toBe(true);
  });
  it('aucune sous-famille : la bande n\'a pas le champ', () => {
    expect('sousGroupes' in bandes([L('1', 'autres', undefined, 5, 1, 'Stk')])[0]).toBe(false);
  });
});

describe('D307 : un sous-groupe d\'une ligne n\'a ni chevron ni ligne', () => {
  const g = rev(brico()).sousGroupes!;
  it('Divers travaux (une ligne) n\'est pas pliable ; Outillage (deux) l\'est', () => {
    expect(pliable(g[6])).toBe(false); expect(pliable(g[1])).toBe(true);
  });
  it('un sous-groupe non pliable est toujours « ouvert » : sa rangée seule, quoi que dise le choix', () => {
    expect(groupeOuvert('renovation', g[6], new Map([[cleGroupe('renovation', 'Divers travaux'), false]]))).toBe(true);
  });
  it('les lignes sans sous-famille d\'une bande qui en a d\'autres viennent à la fin, sans ligne de sous-famille', () => {
    const b = rev([R('1', 'Outillage', 1, 100), R('2', 'Plomberie', 1, 100), L('3', 'renovation', undefined, 1, 1, 'Stk'), R('4', 'Outillage', 1, 100)]);
    const sg = b.sousGroupes!;
    expect(sg.map(x => x.nom)).toEqual(['Outillage', 'Plomberie', '']);
    expect(sg[2].libre).toBe(true); expect(pliable(sg[2])).toBe(false);
    expect(b.sousGroupes!.reduce((s, x) => s + x.cents, 0)).toBe(b.cents);
  });
});

describe('D307 : l\'ordre des sous-groupes hors Rénovation est celui de STOCK_CATEGORIES', () => {
  it('Nettoyage : CIP alcalin, CIP acide, Désinfectant, Détergent, quel que soit l\'ordre du papier', () => {
    const N = (id: string, sf: string) => L(id, 'nettoyage', sf, 1, 1, 'Stk');
    const b = bandes([N('1', 'Détergent'), N('2', 'Désinfectant'), N('3', 'CIP acide'), N('4', 'CIP alcalin'), N('5', 'Désinfectant')])[0];
    expect(b.sousGroupes!.map(g => g.nom)).toEqual(['CIP alcalin', 'CIP acide', 'Désinfectant', 'Détergent']);
    expect(b.sousGroupes![2].ids).toEqual(['2', '5']);
    expect(ordreSousFamilles('nettoyage')[0]).toBe('Malt');
  });
  it('un nom hors liste vient après, dans l\'ordre d\'arrivée', () => {
    const b = bandes([L('1', 'autres', 'Zèbre', 1, 1, 'Stk'), L('2', 'autres', 'Divers', 1, 1, 'Stk'), L('3', 'autres', 'Détergent', 1, 1, 'Stk')])[0];
    expect(b.sousGroupes!.map(g => g.nom)).toEqual(['Détergent', 'Zèbre', 'Divers']);
  });
});

describe('D307 : une ligne à vérifier ouvre son groupe d\'office', () => {
  const lignes = brico().map(l => (l.id === '7' ? { ...l, averifier: true, niveau: 'repris' as const } : l));
  const b = rev(lignes);
  it('le groupe de la ligne jaune est marqué, les autres non', () => {
    expect(b.sousGroupes!.filter(g => g.averifier).map(g => g.nom)).toEqual(['Électricité']);
  });
  it('sans choix du brasseur : Électricité ouvert, les autres repliés', () => {
    const ouvert = b.sousGroupes!.filter(g => pliable(g)).map(g => `${g.nom}:${groupeOuvert('renovation', g, new Map())}`);
    expect(ouvert).toEqual(['Peinture et sols:false', 'Outillage:false', 'Quincaillerie:false', 'Électricité:true', 'Plomberie:false', 'Protection:false']);
  });
  it('son quantité porte le niveau « repris » (jaune pointillé à l\'écran)', () => {
    expect(b.sousGroupes![3].qte[0].niveau).toBe('repris');
    expect(b.sousGroupes![0].qte[0].niveau).toBeUndefined();
  });
  it('le brasseur peut le fermer (le choix prime) ; une rangée à voir (plateau, filtre) le rouvre', () => {
    const g = b.sousGroupes![3];
    expect(groupeOuvert('renovation', g, poserGroupe(new Map(), 'renovation', 'Électricité', false))).toBe(false);
    expect(groupeOuvert('renovation', g, poserGroupe(new Map(), 'renovation', 'Électricité', false), new Set(['6']))).toBe(true);
  });
  it('un groupe replié s\'ouvre sur le choix du brasseur', () => {
    const g = b.sousGroupes![1];
    expect(groupeOuvert('renovation', g, poserGroupe(new Map(), 'renovation', 'Outillage', true))).toBe(true);
  });
});

describe('D307 : toutPlier / toutDeplier', () => {
  const liste = [...bandes([...brico(), L('n1', 'nettoyage', 'CIP acide', 1, 1, 'Stk'), L('n2', 'nettoyage', 'CIP acide', 1, 1, 'Stk'), L('n3', 'nettoyage', 'Détergent', 1, 1, 'Stk', { averifier: true }), L('n4', 'nettoyage', 'Détergent', 1, 1, 'Stk')])];
  const ouverts = (choix: ChoixGroupes) => liste.flatMap(b => (b.sousGroupes ?? []).filter(pliable).filter(g => groupeOuvert(b.cle, g, choix)).map(g => `${b.cle}/${g.nom}`));
  it('au départ : seul le groupe à vérifier est ouvert', () => { expect(ouverts(new Map())).toEqual(['nettoyage/Détergent']); });
  it('toutDeplier (toutes les bandes) ouvre tous les groupes pliables : six en Rénovation, deux en Nettoyage', () => {
    expect(ouverts(toutDeplier(liste, new Map()))).toHaveLength(8);
  });
  // D311 (son choix E, sa page : « Une ligne à vérifier garde son groupe ouvert, même tout plié ») : la reprise 1 corrige l'attente de la première livraison (« même le groupe à vérifier »).
  it('toutPlier (toutes les bandes) replie tout SAUF le groupe qui porte une ligne à vérifier (D311)', () => {
    const plie = toutPlier(liste, toutDeplier(liste, new Map()));
    expect(ouverts(plie)).toEqual(['nettoyage/Détergent']);
    expect(ouverts(toutPlier(liste, new Map()))).toEqual(['nettoyage/Détergent']);
  });
  it('une seule bande : l\'autre ne bouge pas', () => {
    const ouvertes = toutDeplier(liste, new Map(), 'renovation');
    expect(ouverts(ouvertes).filter(x => x.startsWith('renovation/'))).toHaveLength(6);
    expect(ouverts(ouvertes).filter(x => x.startsWith('nettoyage/'))).toEqual(['nettoyage/Détergent']);
    const pliee = toutPlier(liste, toutDeplier(liste, new Map()), 'nettoyage');
    expect(ouverts(pliee).filter(x => x.startsWith('nettoyage/'))).toEqual(['nettoyage/Détergent']); // le groupe à vérifier reste ouvert (D311)
    expect(ouverts(pliee).filter(x => x.startsWith('renovation/'))).toHaveLength(6);
  });
  it('un état ne s\'écrit pas sur l\'ancien (valeur pure) ; un choix isolé survit à tout plier puis à un choix de plus', () => {
    const avant: ChoixGroupes = new Map();
    toutDeplier(liste, avant); expect(avant.size).toBe(0);
    const apres = poserGroupe(toutPlier(liste, avant), 'renovation', 'Outillage', true);
    expect(ouverts(apres)).toEqual(['nettoyage/Détergent', 'renovation/Outillage']);
  });
});

describe('D307 : la sous-famille vient de la même entrée que la famille', () => {
  it('sousFamilleDeLigne suit groupeDe : un tuyau sans autre mot, sous Local, est une Plomberie de la Rénovation', () => {
    expect(groupeDe('autre', 'other', 'Siphon de sol inox', undefined, undefined, 'renovation')).toBe('renovation');
    expect(sousFamilleDeLigne('autre', 'other', 'Siphon de sol inox', undefined, undefined, 'renovation')).toBe('Plomberie');
  });
  it('une famille sans sous-famille (Houblons) : undefined', () => {
    expect(sousFamilleDeLigne('Houblon', 'ingredient', 'Cascade 6.8%')).toBeUndefined();
  });
});

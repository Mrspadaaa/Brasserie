// Pastille C, fenêtre réglable (demande du 16.11 : « jusqu'à S50 par exemple, ou juste 50 51 ») :
// la somme d'une fenêtre de l'histogramme, ses raccourcis, sa garde, et le geste au doigt (géométrie pure, sans DOM).
import { describe, expect, it } from 'vitest';
import {
  compteDeReglage, fenetreDeHorizon, fenetreDeReglage, libelleFenetre, lignesDeFenetre, lignesDeReglage, phraseReglage,
  reglageDeFenetre, reglageValide, sommeFenetre, vueHorizon
} from '../../src/domain/stock/horizon';
import type { ArticleACommander } from '../../src/domain/stockLevel';
import type { SourceBesoin } from '../../src/domain/stock/disponibilite';
import type { Batch, StockItem } from '../../src/types';
import { RAYON_POIGNEE, colonnesDeLargeur, debutGeste, deplacerGeste, finGeste, pousserPoignee } from '../../src/ui/stock/fenetreGeste';

const article = (ref: string, nom: string, sources: SourceBesoin[], extra: Partial<StockItem> = {}): ArticleACommander => ({
  item: { id: ref, ref, name: nom, currentStock: 1, minStock: 0, unit: 'kg', category: 'Malt', reorder: false, kind: 'rawMaterials', ...extra } as StockItem,
  missing: 2, rupture: false, auMoins: false, sources
});
const src = (nom: string, date: string): SourceBesoin => ({ genre: 'brassin', id: nom, nom, date, quantite: 1 });
const brassin = (id: string, nom: string, date: string) => ({ id, name: nom, status: 'planifie', plannedBrewDate: date } as unknown as Batch);

// Aujourd'hui : lundi 16.11.2026 (S47). Colonnes : S47 2 · S48 0 · S49 2 · S50 1 · S51 1 · S52 0 · seuil 3 (9 en tout).
const AUJOURDHUI = '2026-11-16';
const batches = [brassin('B1', 'Porter', '2026-12-03')];
const liste = [
  article('soude', 'Soude caustique', [src('Porter', '2026-11-10')]), // en retard : cette semaine (S47)
  article('mosaic', 'Mosaic', [{ genre: 'ajouts-restants', id: 'B0', nom: 'IPA', date: '2026-11-02', quantite: 1 }]), // dû tout de suite (S47)
  article('munich', 'Munich', [src('Porter', '2026-12-03')]), // S49
  article('fuggle', 'Fuggle', [src('Porter', '2026-12-03')]), // S49
  article('capsules', 'Capsules', [src('Blonde', '2026-12-10')]), // S50
  article('saaz', 'Saaz', [src('Pils de Noël', '2026-12-15')]), // S51
  article('co2', 'CO₂', [src('Fûts', '2027-03-01')]), // au-delà de six semaines : seuil
  article('simcoe', 'Simcoe', [{ genre: 'recette', id: 'R', nom: 'IPA écrite', date: '2026-10-01', quantite: 1 }]), // sans date : seuil
  article('gypse', 'Gypse', [], { minStock: 5, currentStock: 3 }) // au seuil : seuil
];
const vue = vueHorizon(liste, batches, AUJOURDHUI);
const noms = (l: { item: StockItem }[]) => l.map((x) => x.item.name).sort();

describe('la somme d’une fenêtre de l’histogramme', () => {
  it('les sept colonnes de la fixture', () => {
    expect(vue.colonnes.map((c) => `${c.etiquette}:${c.n}`)).toEqual(['S47:2', 'S48:0', 'S49:2', 'S50:1', 'S51:1', 'S52:0', 'seuil:3']);
  });

  it('jusqu’à S50 : les colonnes S47 à S50', () => {
    const f = { a: 0, b: 3 };
    expect(sommeFenetre(vue, f)).toBe(5);
    expect(noms(lignesDeFenetre(vue, f))).toEqual(['Capsules', 'Fuggle', 'Mosaic', 'Munich', 'Soude caustique']);
    expect(libelleFenetre(vue, f)).toBe('jusqu’à S50');
  });

  it('S50–S51 : deux colonnes, rien du reste', () => {
    const f = { a: 3, b: 4 };
    expect(sommeFenetre(vue, f)).toBe(2);
    expect(noms(lignesDeFenetre(vue, f))).toEqual(['Capsules', 'Saaz']);
    expect(libelleFenetre(vue, f)).toBe('S50–S51');
  });

  it('une colonne seule, et la colonne seuil qui peut entrer', () => {
    expect(sommeFenetre(vue, { a: 3, b: 3 })).toBe(1);
    expect(libelleFenetre(vue, { a: 3, b: 3 })).toBe('S50');
    expect(sommeFenetre(vue, { a: 4, b: 6 })).toBe(4); // S51 + les 3 du seuil
    expect(noms(lignesDeFenetre(vue, { a: 4, b: 6 }))).toEqual(['CO₂', 'Gypse', 'Saaz', 'Simcoe']);
    expect(libelleFenetre(vue, { a: 4, b: 6 })).toBe('de S51 au seuil');
    expect(sommeFenetre(vue, { a: 6, b: 6 })).toBe(3);
    expect(libelleFenetre(vue, { a: 6, b: 6 })).toBe('seuil');
  });

  it('la somme est toujours le nombre de lignes de la fenêtre, quelle qu’elle soit', () => {
    for (let a = 0; a <= 6; a++) for (let b = a; b <= 6; b++) {
      expect(lignesDeFenetre(vue, { a, b })).toHaveLength(sommeFenetre(vue, { a, b }));
    }
  });

  it('avec le seuil, de bout en bout : c’est Tout ; sans lui, c’est les six semaines', () => {
    expect(sommeFenetre(vue, { a: 0, b: 6 })).toBe(vue.comptes.tout);
    expect(sommeFenetre(vue, { a: 0, b: 5 })).toBe(vue.comptes.six);
  });
});

describe('les raccourcis restent des fenêtres', () => {
  it('S49, 6 sem. et Tout sont les fenêtres 0 à 2, 0 à 5 et 0 à 6, et gardent leur compte', () => {
    expect(fenetreDeHorizon(vue, 'brassin')).toEqual({ a: 0, b: 2 });
    expect(fenetreDeHorizon(vue, 'six')).toEqual({ a: 0, b: 5 });
    expect(fenetreDeHorizon(vue, 'tout')).toEqual({ a: 0, b: 6 });
    for (const h of ['brassin', 'six', 'tout'] as const) expect(sommeFenetre(vue, fenetreDeHorizon(vue, h))).toBe(vue.comptes[h]);
  });

  it('une fenêtre qui redessine un raccourci redevient ce raccourci (il suit alors le prochain brassin)', () => {
    expect(reglageDeFenetre(vue, { a: 0, b: 2 })).toBe('brassin');
    expect(reglageDeFenetre(vue, { a: 0, b: 5 })).toBe('six');
    expect(reglageDeFenetre(vue, { a: 0, b: 6 })).toBe('tout');
    expect(reglageDeFenetre(vue, { a: 0, b: 3 })).toEqual({ de: vue.courante, a: vue.courante + 3 });
  });

  it('une fenêtre libre se garde en semaines absolues, avec le seuil à part, et s’y relit', () => {
    const garde = reglageDeFenetre(vue, { a: 4, b: 6 });
    expect(garde).toEqual({ de: vue.courante + 4, a: null });
    expect(fenetreDeReglage(vue, garde)).toEqual({ a: 4, b: 6 });
    expect(compteDeReglage(vue, garde)).toBe(4);
    expect(lignesDeReglage(vue, 'six')).toHaveLength(vue.comptes.six);
    expect(phraseReglage(vue, garde)).toBe('de S51 au seuil');
    expect(phraseReglage(vue, 'tout')).toBe('tout, seuil compris');
  });

  it('une semaine gardée qui est passée revient à la semaine en cours (la fenêtre ne s’inverse pas)', () => {
    const plusTard = vueHorizon(liste, batches, '2026-11-30'); // S49
    expect(fenetreDeReglage(plusTard, { de: vue.courante + 1, a: vue.courante + 3 })).toEqual({ a: 0, b: 1 });
  });

  it('une valeur gardée mal formée est refusée', () => {
    expect(reglageValide({ de: 2967, a: null })).toBe(true);
    expect(reglageValide({ de: '2967', a: null })).toBe(false);
    expect(reglageValide({ de: 1.5, a: 2 })).toBe(false);
    expect(reglageValide('demain')).toBe(false);
    expect(reglageValide(null)).toBe(false);
  });
});

describe('le geste au doigt', () => {
  const W = 350;
  const cols = colonnesDeLargeur(W);
  const centre = (i: number) => (cols[i].l + cols[i].r) / 2;

  it('les colonnes remplissent la largeur : 7 colonnes, écart de 6 px, marge de 2 px', () => {
    expect(cols).toHaveLength(7);
    expect(cols[0].l).toBe(2);
    expect(cols[6].r).toBeCloseTo(W - 2, 6);
    expect(cols[1].l - cols[0].r).toBeCloseTo(6, 6);
  });

  it('chaque poignée se saisit sur au moins 24 px (36 px : 18 de chaque côté du bord)', () => {
    expect(RAYON_POIGNEE * 2).toBeGreaterThanOrEqual(24);
    const f = { a: 1, b: 3 };
    const bordG = cols[1].l - 4;
    const bordD = cols[3].r + 4;
    expect(debutGeste(f, bordG - RAYON_POIGNEE, W).mode).toBe('g');
    expect(debutGeste(f, bordG + RAYON_POIGNEE, W).mode).toBe('g');
    expect(debutGeste(f, bordD - RAYON_POIGNEE, W).mode).toBe('d');
    expect(debutGeste(f, bordD + RAYON_POIGNEE, W).mode).toBe('d');
    expect(debutGeste(f, centre(2), W).mode).toBe('in');
    expect(debutGeste(f, centre(5), W).mode).toBe('out');
  });

  it('glisser la poignée droite jusqu’à S50 : la fenêtre s’aimante sur la colonne, sans croiser l’autre bord', () => {
    const f = { a: 0, b: 2 };
    const g = debutGeste(f, cols[2].r + 4, W);
    expect(g.mode).toBe('d');
    const r = deplacerGeste(g, cols[3].r + 3, W, f);
    expect(r.fenetre).toEqual({ a: 0, b: 3 });
    expect(deplacerGeste(r.geste, -50, W, { a: 0, b: 3 }).fenetre).toEqual({ a: 0, b: 0 });
  });

  it('glisser la fenêtre entière : S50–S51 se déplace d’une colonne à la fois et s’arrête aux bornes', () => {
    const f = { a: 3, b: 4 };
    const g = debutGeste(f, centre(3) + 30, W); // entre les deux poignées
    expect(g.mode).toBe('in');
    const pas = cols[1].l - cols[0].l;
    expect(deplacerGeste(g, g.x0 + pas * 1.1, W, f).fenetre).toEqual({ a: 4, b: 5 });
    expect(deplacerGeste(g, g.x0 + pas * 10, W, f).fenetre).toEqual({ a: 5, b: 6 }); // la colonne seuil peut entrer
    expect(deplacerGeste(g, g.x0 - pas * 10, W, f).fenetre).toEqual({ a: 0, b: 1 });
  });

  it('toucher une colonne la prend seule, la colonne seuil aussi ; un tremblement n’est pas un glissé', () => {
    const f = { a: 0, b: 2 };
    const g = debutGeste(f, centre(6), W);
    expect(g.mode).toBe('out');
    const trem = deplacerGeste(g, centre(6) + 4, W, f);
    expect(trem.fenetre).toBeNull();
    expect(finGeste(trem.geste)).toEqual({ a: 6, b: 6 });
    const dedans = debutGeste({ a: 0, b: 6 }, centre(3), W);
    expect(finGeste(dedans)).toEqual({ a: 3, b: 3 });
  });

  it('une poignée touchée sans bouger ne change rien', () => {
    const f = { a: 1, b: 3 };
    expect(finGeste(debutGeste(f, cols[3].r + 4, W))).toBeNull();
  });

  it('glisser depuis le dehors trace une nouvelle fenêtre, dans les deux sens', () => {
    const f = { a: 0, b: 1 };
    const g = debutGeste(f, centre(5), W);
    expect(deplacerGeste(g, centre(3), W, f).fenetre).toEqual({ a: 3, b: 5 });
    expect(deplacerGeste(g, centre(6), W, f).fenetre).toEqual({ a: 5, b: 6 });
  });

  it('le clavier : une colonne par flèche, les poignées ne se croisent pas', () => {
    expect(pousserPoignee({ a: 1, b: 3 }, 'd', 1)).toEqual({ a: 1, b: 4 });
    expect(pousserPoignee({ a: 1, b: 3 }, 'g', -5)).toEqual({ a: 0, b: 3 });
    expect(pousserPoignee({ a: 3, b: 3 }, 'g', 1)).toEqual({ a: 3, b: 3 });
    expect(pousserPoignee({ a: 3, b: 3 }, 'd', 9)).toEqual({ a: 3, b: 6 });
  });
});

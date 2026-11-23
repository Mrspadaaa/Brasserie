/**
 * Voie f4-enrichir : témoins sur le code d'aujourd'hui. Ce fichier n'importe AUCUN module neuf de f4 : il tourne sur l'arbre d'avant la voie.
 * - « constat » : ce que le code fait aujourd'hui (vert), la lacune que f4 comble (E1, E2, E3).
 * - « P1 » : une valeur remplie par f4 (clé `fiche.remplis`) ne doit jamais changer le rapprochement d'une ligne (G5). (a), (b), (c2) et (d) sont
 *   ROUGES tant que le pilote n'a pas branché `valeurLueDe` / `porteDonneeLue` dans `stockLineMatching.ts` (PLAN § 6), verts après (mesuré sur
 *   une copie branchée : `sondes/sonde-p1-apres.ts`) ; (b0) et (c) sont des gardes, verts avant et après.
 */
import { describe, expect, it } from 'vitest';
import { regleProduit } from '../../../../src/services/stockLineMatching';
import { articleNeufDe } from '../../../../src/domain/stock/articleNeuf';
import { yeastReferences } from '../../../../src/domain/yeastReferences';
import { resolveFermentationYeast } from '../../../../src/domain/fermentationScenario';
import type { StockItem } from '../../../../src/types';

const article = (ref: string, name: string, category: string, unit: string, more: Record<string, unknown> = {}): StockItem =>
  ({ id: ref, ref, name, category, unit, currentStock: 5, minStock: 0, reorder: false, ...more }) as StockItem;
const ligne = (description: string, unit: string, quantity = 5) => ({ description, unit, quantity, kind: 'ingredient' }) as never;
/** Un article enrichi par f4 : la valeur écrite ET sa trace dans `fiche.remplis` (forme du PLAN § 3.6). */
const remplir = (item: StockItem, champ: 'colorEbc' | 'potentialPpg', valeur: number): StockItem => {
  const fiche = (item.fiche ?? { id: 'cle:malt||munchner malz', approchee: false, par: 'en-ligne' }) as Record<string, unknown>;
  const remplis = { ...(fiche.remplis as object | undefined), [champ]: { par: 'en-ligne', source: 'Fiche du Banc', le: '2026-11-01T10:00:00.000Z', niveau: 'repris', valeur } };
  return { ...item, [champ]: valeur, fiche: { ...fiche, remplis } } as StockItem;
};
const verdict = (r: ReturnType<typeof regleProduit>) => ({
  cas: r.cas, nom: 'nom' in r ? r.nom : undefined, article: 'article' in r ? r.article.ref : undefined, voisin: 'voisin' in r ? r.voisin.ref : undefined,
  ecarts: 'ecarts' in r ? r.ecarts : undefined, seul: 'connuUnSeulCote' in r ? [...r.connuUnSeulCote].sort() : undefined, motif: 'motif' in r ? r.motif : undefined,
  candidats: 'candidats' in r ? r.candidats.map(c => c.ref) : undefined,
});

// D286, D290 : branchés le 02.11 (accord du schéma) ; les témoins, en `it.fails` jusque-là, sont redevenus `it`.
describe('constat : ce que le code d’aujourd’hui fait d’un article neuf (E1, E2, E3)', () => {
  it('E2 : le rapprochement des recettes ne reconnaît qu’une levure de facture sur quatre (372765), alors que les quatre sont au catalogue', () => {
    const refs = yeastReferences();
    const libelles = ['LALLEMAND Windsor 11g', 'Safale BE-256 (Abbaye) 11.5 g', 'Safale US-05 11,5g', 'LALLEMAND Verdant IPA 11g'];
    const trouves = libelles.map(name => resolveFermentationYeast({ yeast: { name } } as never, refs)?.id);
    expect(trouves).toEqual([undefined, undefined, 'fermentis-us05', undefined]);
    for (const id of ['lalbrew-windsor', 'yeast-fermentis-safale-be-e2-80-91256', 'fermentis-us05', 'lalbrew-verdant-ipa']) expect(refs.some(r => r.id === id)).toBe(true);
  });
  it('E1, E3 : levure sans fiche (T11), houblon sans fiche quand le catalogue manque, malt sans EBC ni potentiel', () => {
    const levure = articleNeufDe({ description: 'LALLEMAND Windsor 11g', unit: 'Stk', quantity: 2, kind: 'ingredient' }, [], {});
    const houblon = articleNeufDe({ description: 'Target 11.3%', unit: 'g', quantity: 40, kind: 'ingredient' }, [], {});
    const malt = articleNeufDe({ description: 'Malterie du Banc Ambre 60', unit: 'kg', quantity: 2, kind: 'ingredient', stockCategory: 'Malt' }, [], {});
    expect(levure.fiche).toBeUndefined();
    expect(houblon.fiche).toBeUndefined();
    expect(malt.colorEbc).toBeUndefined();
    expect((malt as { potentialPpg?: number }).potentialPpg).toBeUndefined();
  });
});

describe('P1 : une valeur remplie par f4 ne change jamais le verdict de la règle (même verdict que l’article d’avant f4)', () => {
  const munich = article('MP-a-0', 'Münchner Malz', 'Malt', 'kg', { fiche: { id: 'munich-malt', approchee: false } });
  it('(a) EBC trouvé 24, la ligne imprime 25 EBC : pas de « bis » forcé (aujourd’hui : neuf, « Münchner Malz bis »)', () => {
    const l = ligne('Münchner Malz 25 EBC', 'kg');
    expect(verdict(regleProduit(l, [remplir(munich, 'colorEbc', 24)]))).toEqual(verdict(regleProduit(l, [munich])));
  });
  it('(b) la ligne ne dit pas l’EBC et la règle de s1 ne relie pas (unité Stk contre kg) : l’EBC trouvé n’ajoute pas « connu d’un seul côté » (aujourd’hui : seul [ebc] contre [])', () => {
    const l = ligne('Münchner Malz', 'Stk');
    expect(verdict(regleProduit(l, [remplir(munich, 'colorEbc', 24)]))).toEqual(verdict(regleProduit(l, [munich])));
  });
  it('(b0) la ligne ne dit pas l’EBC : même verdict (garde)', () => {
    const l = ligne('Münchner Malz', 'kg');
    expect(verdict(regleProduit(l, [remplir(munich, 'colorEbc', 24)]))).toEqual(verdict(regleProduit(l, [munich])));
  });
  it('(c) levure liée par f4 au catalogue, même libellé : même article (garde)', () => {
    const windsor = article('MP-y-0', 'LALLEMAND Windsor 11g', 'Levure', 'sachet');
    const lie = { ...windsor, fiche: { id: 'levure:lalbrew-windsor', approchee: false, par: 'catalogue', cle: 'levure|lallemand|windsor' } } as StockItem;
    const l = ligne('LALLEMAND Windsor 11g', 'Stk', 2);
    expect(verdict(regleProduit(l, [lie]))).toEqual(verdict(regleProduit(l, [windsor])));
  });
  it('(c2) « Windsor bis » créé à la main puis lié par f4 : le lien ne retire pas son « bis » (aujourd’hui : ambigu, « Windsor bis 2 »)', () => {
    const seul = article('S-1', 'Windsor', 'Levure', 'sachet');
    const bis = article('S-2', 'Windsor bis', 'Levure', 'sachet');
    const bisLie = { ...bis, fiche: { id: 'levure:lalbrew-windsor', approchee: false, par: 'catalogue', cle: 'levure||windsor' } } as StockItem;
    const l = ligne('Windsor', 'Stk', 1);
    expect(verdict(regleProduit(l, [seul, bisLie]))).toEqual(verdict(regleProduit(l, [seul, bis])));
  });
  it('(d) « Target bis » nu lié par f4 à sa variété : même verdict', () => {
    const target = article('S-3', 'Target', 'Houblon', 'g', { alphaPct: 11.8 });
    const bis = article('S-4', 'Target bis', 'Houblon', 'g');
    const bisLie = { ...bis, fiche: { id: 'beermaverick-target', approchee: false, par: 'catalogue', cle: 'houblon||target' } } as StockItem;
    for (const d of ['Target 11.3%', 'Target']) {
      const l = ligne(d, 'g', 40);
      expect(verdict(regleProduit(l, [target, bisLie]))).toEqual(verdict(regleProduit(l, [target, bis])));
    }
  });
});

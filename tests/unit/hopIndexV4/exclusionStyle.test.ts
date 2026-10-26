// Voie g2c-exclusion-style (D90, 26.10) : une famille indésirable du style, ou « moins » de la visée, n'exclut un houblon que si elle est MARQUÉE,
// c'est-à-dire citée par la moitié au moins de ses fiches. Une fiche isolée ne l'exclut plus (Nelson Sauvin, « végétal vert » dans 1 fiche sur 9, d'une Hazy).
// Les houblons sont synthétiques : un clone de Galaxy dont on fixe le nombre de fiches (8) et celles qui citent « grassy » (végétal vert).
import { describe, expect, it } from 'vitest';
import { CATALOGUE, type CatalogueHop } from '../../../src/domain/hopIndex/v4/data';
import { creerMoteur } from '../../../src/domain/hopIndex/v4/moteur';
import { marquee } from '../../../src/domain/hopIndex/v4/hops';
import type { Recipe } from '../../../src/domain/hopIndex/v4/recipe';

const base = CATALOGUE.find((h) => h.id === 'beermaverick-galaxy')!;
const modele = base.descriptions[0];
/** Un houblon de `sur` fiches dont `vert` citent « grassy » (végétal vert) ; toutes citent « passion fruit » (tropical). */
function houblon(id: string, sur: number, vert: number, tropical = true): CatalogueHop {
  const descriptions = Array.from({ length: sur }, (_, i) => ({
    ...modele, text: `Tags documentaires : ${tropical ? '#passion_fruit' : '#tangerine'}${i < vert ? ', #grassy' : ''}.`,
    source: { ...modele.source, reference: `${modele.source.reference}#${id}-${i}` },
  }));
  return { ...base, id, name: id, aliases: [], descriptions, tags: [], tagsFr: [] };
}
const R21C: Recipe = { name: 'Hazy', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [] };
const idsAjouter = (catalogue: CatalogueHop[], dir: Record<string, number>, code = '21C') => {
  const m = creerMoteur({ catalogue, stock: [] });
  return new Set(m.proposeVoies({ ...R21C, styleCode: code }, dir, { maxBuy: 50, limit: 100, buyLimit: 100, moments: ['dryActive'], assemblages: false }).voies
    .filter((v) => v.type === 'ajouter').map((v) => v.actions[0].hopKey));
};

describe('D90 : seule une famille marquée (la moitié au moins des fiches) exclut', () => {
  const un = houblon('un-sur-huit', 8, 1), quatre = houblon('quatre-sur-huit', 8, 4), trois = houblon('trois-sur-huit', 8, 3), aucun = houblon('aucun-vert', 8, 0);
  const m = creerMoteur({ catalogue: [un, quatre, trois, aucun], stock: [] });

  it('marquee : 1 fiche sur 8 non, 3 sur 8 non, 4 sur 8 oui (la moitié), 0 non', () => {
    expect(m.dans(() => [un, trois, quatre, aucun].map((h) => marquee(h.id, 'green')))).toEqual([false, false, true, false]);
    expect(m.describeFamilies('un-sur-huit').green).toMatchObject({ sources: 1, of: 8 }); // la fiche dit bien « 1 sur 8 »
    expect(m.describeFamilies('quatre-sur-huit').green).toMatchObject({ sources: 4, of: 8 });
  });

  it('Hazy (21C, végétal vert indésirable) : cité par 1 fiche sur 8, le houblon reste dans le pool ; par 4 sur 8, il en sort', () => {
    const pool = idsAjouter([un, quatre, trois, aucun], { tropical: 1 });
    expect(pool.has('un-sur-huit')).toBe(true);
    expect(pool.has('trois-sur-huit')).toBe(true);
    expect(pool.has('aucun-vert')).toBe(true);
    expect(pool.has('quatre-sur-huit')).toBe(false);
    // Témoin : sous un style sans famille indésirable (21A), le même houblon est dans le pool.
    expect(idsAjouter([quatre], { tropical: 1 }, '21A').has('quatre-sur-huit')).toBe(true);
  });

  it('« moins de végétal vert » : la même règle (1 sur 8 reste, 4 sur 8 sort)', () => {
    const pool = idsAjouter([un, quatre, aucun], { tropical: 1, green: -1 }, '21A');
    expect([...pool].sort()).toEqual(['aucun-vert', 'un-sur-huit']);
  });

  it('sans fiche : jamais marquée, comportement d\'avant gardé (ne cite rien, n\'est pas exclu, n\'entre pas dans la liste d\'une famille montée)', () => {
    const vide = { ...houblon('sans-fiche', 0, 0), descriptions: [] };
    const mv = creerMoteur({ catalogue: [vide], stock: [] });
    expect(mv.dans(() => marquee('sans-fiche', 'green'))).toBe(false);
    expect(mv.citations('sans-fiche').green.status).toBe('sans descripteur');
    expect(idsAjouter([vide], { tropical: 1 }).has('sans-fiche')).toBe(false);
  });

  it('un houblon marqué en stock reste proposé mais en conflit de style ; à 1 fiche sur 8, aucun conflit', () => {
    const stock = [un, quatre].map((h) => ({ key: h.id, varietyId: h.id, form: 'unknown' as const, grams: 500, alpha: null, alphaFrom: null, items: [] }));
    const ms = creerMoteur({ catalogue: [un, quatre], stock });
    const voies = ms.proposeVoies(R21C, { tropical: 1 }, { moments: ['dryActive'], assemblages: false, limit: 20 }).voies.filter((v) => v.type === 'ajouter');
    const de = (k: string) => voies.find((v) => v.actions[0].hopKey === k)!;
    expect(de('un-sur-huit').conflicts.join(' ')).not.toMatch(/exclu par le style/);
    expect(de('quatre-sur-huit').conflicts.join(' ')).toMatch(/exclu par le style/);
  });

  it('styleFit (liste « Mes houblons ») : « hors style » seulement pour une famille indésirable marquée', () => {
    const scale = m.getStyleScale('21C');
    const fit = (id: string) => m.styleFit([id], scale)[0].fit;
    expect(fit('un-sur-huit')).not.toBe('hors style');
    expect(fit('quatre-sur-huit')).toBe('hors style');
  });

  it('Substituer : conflit de style seulement si le remplaçant marque la famille (1 sur 8 : aucun ; 4 sur 8 : végétal vert)', () => {
    const original = houblon('original', 8, 0);
    const ms = creerMoteur({ catalogue: [original, un, quatre], stock: [] });
    const r = ms.substitutes('original', { style: ms.getStyleScale('21C'), moment: 'dryActive' });
    const conflit = (k: string) => r.remplacants.find((x) => x.key === k)!.conflitsStyle;
    expect(conflit('un-sur-huit')).toEqual([]);
    expect(conflit('quatre-sur-huit')).toEqual(['green']);
  });
});

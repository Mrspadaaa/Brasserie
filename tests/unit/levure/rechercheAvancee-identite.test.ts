// Voie r2 (2026-11-09-levure-retours) : la levure, instance du moteur de facettes commun, rend la même recherche qu'avant.
// Référence : `rechercheAvancee-identite.json`, figée sur HEAD avant la généralisation (gen-identite.ts de la voie). Catalogue
// réel de l'app (1 733 fiches, faits sourcés versés), aucune donnée inventée.
import { describe, expect, it } from 'vitest';
import { creerApiLevure } from '../../../src/domain/levure';
import { FILTRES } from '../../../src/domain/levure/axes';
import { etatEffectif, facettesLevure } from '../../../src/domain/levure/filtres';
import { facetter, tranches, trancheDe, type Facette } from '../../../src/domain/rechercheAvancee/facettes';
import identite from './rechercheAvancee-identite.json';
import { REQUETES, resume } from './rechercheAvancee-requetes';

const api = creerApiLevure();
const ref = identite as Record<string, ReturnType<typeof resume>>;

describe('rechercheAvancee : la levure à l’identique', () => {
  for (const q of REQUETES) {
    it(`« ${q.nom} » : même liste (ordre compris), mêmes comptes, même résumé`, () => {
      const r = resume(api.chercher(q.texte, q.filtres, q.reperes, q.stockIds ? { stockIds: q.stockIds } : undefined));
      expect(JSON.parse(JSON.stringify(r))).toEqual(ref[q.nom]);
    });
  }

  it('le moteur commun appelé seul, sur les facettes de la levure, rend les comptes et le total figés', () => {
    const ctx = api.contexte;
    for (const q of REQUETES.filter((x) => !x.texte)) {
      const etats = FILTRES.map((f) => etatEffectif(q.filtres, f.id));
      const { retenues, comptes } = facetter(ctx.tous(), facettesLevure(ctx, new Set(q.stockIds ?? [])), etats);
      expect(retenues.length).toBe(ref[q.nom].total);
      expect(JSON.parse(JSON.stringify(comptes))).toEqual(ref[q.nom].comptes);
    }
  });
});

describe('rechercheAvancee : le moteur seul', () => {
  type F = { id: string; t?: string[]; x?: number | null; ok?: boolean };
  const fiches: F[] = [
    { id: 'a', t: ['r', 'v'], x: 4, ok: true }, { id: 'b', t: ['r'], x: 9, ok: false }, { id: 'c', t: ['v'], x: null, ok: true }, { id: 'd', x: 12 },
  ];
  const facettes: Facette<F>[] = [
    { id: 't', options: [{ valeur: 'r', libelle: 'rouge' }, { valeur: 'v', libelle: 'vert' }], valeur: (f) => f.t ?? null },
    { id: 'x', options: tranches([5, 10]), valeur: (f) => f.x ?? null, tranche: (v) => trancheDe([5, 10], v) },
    { id: 'ok', options: [{ valeur: 'oui', libelle: 'oui' }], valeur: (f) => f.ok ?? false },
  ];
  it('comptes disjonctifs : une option se compte sans son propre filtre ; l’inconnu à part, jamais 0 ni accord', () => {
    const { retenues, comptes } = facetter(fiches, facettes, [['r'], null, null]);
    expect(retenues.map((f) => f.id)).toEqual(['a', 'b']);
    // t posé : ses options se comptent sur toutes les fiches ; « d » ne documente pas t
    expect(comptes.t.options.map((o) => o.n)).toEqual([2, 2]);
    expect(comptes.t.nonDocumentees).toBe(1);
    // x : seulement les retenues (a : 4, b : 9)
    expect(comptes.x.options.map((o) => [o.valeur, o.n])).toEqual([['<5', 1], ['5-10', 1], ['>=10', 0]]);
    expect(comptes.x.nonDocumentees).toBe(0);
  });
  it('une plage posée ne garde pas une fiche sans la donnée ; la tranche suit les bornes', () => {
    const { retenues, comptes } = facetter(fiches, facettes, [null, { min: 5, max: 99 }, null]);
    expect(retenues.map((f) => f.id)).toEqual(['b', 'd']);
    expect(comptes.x.nonDocumentees).toBe(1);
    expect(tranches([5, 10]).map((o) => o.libelle)).toEqual(['< 5', '5–10', '≥ 10']);
  });
});

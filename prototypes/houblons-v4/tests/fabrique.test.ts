// Fabrique du moteur v4 (#164) : creerMoteur sur une forme injectée, borne des caches, et équivalence des preuves
// documentaires réécrites chez l'appelant (hops.ts) avec hopDescriptorEvidence seul (référence : le serveur).
import { describe, expect, it } from 'vitest';
import { hopDescriptorEvidence } from '../../../functions/src/hopExtrapolationCore';
import {
  CATALOGUE, DONNEES_FIXTURE, FAMILIES, Lru, STOCK, citations, creerMoteur, describeFamilies, getStyleScale, hopRef, substitutes,
  type CatalogueHop, type StockHop,
} from '../../../src/domain/hopIndex/v4';
import { EXTRAPOLATION, contexteParDefaut, courant, type Contexte } from '../../../src/domain/hopIndex/v4/data';
import { BORNE_BASES } from '../../../src/domain/hopIndex/v4/profil-simule';
import { recetteDegustee, DEGUSTATION, H } from '../parcours/src/donnees/cas';

const fiche = (id: string): CatalogueHop => CATALOGUE.find((c) => c.id === id)!;
// Une variété inventée (absente des fixtures), avec une copie des fiches de Nugget.
const INVENTE: CatalogueHop = {
  ...fiche(H.nugget), id: 'essai-invente', name: 'Inventé', aliases: [], hopsteinerId: null, url: null, usage: null,
  alpha: [12, 14], descriptions: structuredClone(fiche(H.nugget).descriptions),
};
const FORME = {
  catalogue: [fiche(H.nugget), fiche(H.cascade), fiche(H.idaho7), INVENTE],
  stock: [{ key: 'essai-invente', varietyId: 'essai-invente', form: 'unknown', grams: 500, alpha: 13.1, alphaFrom: 'lot essai', items: ['Inventé 500 g'] }] as StockHop[],
};

describe('creerMoteur : données injectées (B2, #164)', () => {
  it('le moteur lit SES fiches et SON stock ; le moteur par défaut et les fixtures ne bougent pas', () => {
    const avant = [CATALOGUE.length, STOCK.length];
    const m = creerMoteur(FORME);
    expect(m.hopRef('essai-invente')).toMatchObject({ name: 'Inventé', alpha: { value: 13.1, from: 'lot essai' } });
    expect(hopRef('essai-invente')).toBeNull();
    expect(m.hopRef(H.galaxy)).toBeNull(); // hors des fiches injectées : inconnu, jamais une valeur par défaut
    expect(m.stockKeys()).toEqual(['essai-invente']);
    expect(m.describeFamilies('essai-invente')).toEqual(describeFamilies(H.nugget));
    expect([CATALOGUE.length, STOCK.length]).toEqual(avant);
  });
  it('substitutes ne classe que les fiches injectées et lit le stock injecté', () => {
    const m = creerMoteur(FORME);
    const r = m.substitutes(H.nugget, { moment: 'b60', grams: 46, stockFirst: true });
    expect(r.candidats).toBe(3);
    expect(r.remplacants.map((s) => s.key).sort()).toEqual([H.cascade, H.idaho7, 'essai-invente'].sort());
    const inv = r.remplacants.find((s) => s.key === 'essai-invente')!;
    expect(inv.stock).toMatchObject({ etat: 'en stock', libre: 500 });
    expect(r.remplacants.find((s) => s.key === H.cascade)!.stock.etat).toBe('à acheter');
  });
  it('sur les fixtures, la fabrique rend exactement le moteur par défaut (stout S1, Nugget à 60′)', () => {
    const recette = recetteDegustee();
    const o = { moment: 'b60' as const, grams: 46, recipe: recette, style: getStyleScale(recette.styleCode), stockFirst: true, limit: 8 };
    const neuf = creerMoteur({ catalogue: [...DONNEES_FIXTURE.catalogue], stock: [...DONNEES_FIXTURE.stock] });
    expect(neuf.substitutes(H.nugget, o)).toEqual(substitutes(H.nugget, o));
    const cas = { id: 'c', titre: 'c', ajouts: [{ id: 'x', houblon: H.idaho7, dose_gL: 4, moment: 'dryPost' as const, jourDebut: 7, jours: 3 }], levure: 'fermentis-us05', recette: recette as never, degustation: DEGUSTATION, complet: true };
    expect(neuf.simulerCas(cas)).toEqual(creerMoteur().simulerCas(cas));
  });
  it('mêmes tableaux, même contexte ; autres tableaux, autres caches', () => {
    const ctx = (m: ReturnType<typeof creerMoteur>): Contexte => m.dans(courant);
    expect(ctx(creerMoteur())).toBe(contexteParDefaut());
    expect(ctx(creerMoteur(FORME))).toBe(ctx(creerMoteur(FORME)));
    expect(ctx(creerMoteur({ ...FORME, stock: [] }))).not.toBe(ctx(creerMoteur(FORME)));
  });
});

describe('caches bornés (#164)', () => {
  it('Lru : jamais plus que la borne ; une entrée relue survit, la plus ancienne non relue sort (éviction)', () => {
    const c = new Lru<number>(4);
    for (let i = 0; i < 10; i++) { c.set(`k${i}`, i); if (i > 0) c.get('k0'); expect(c.size).toBeLessThanOrEqual(4); }
    expect(c.get('k0')).toBe(0);
    expect(c.has('k1')).toBe(false);
    expect(c.obtenir('k9', () => -1)).toBe(9);
  });
  it('les bases simulées d\'un moteur restent bornées quand la dose change à chaque appel', () => {
    const m = creerMoteur({ catalogue: [...DONNEES_FIXTURE.catalogue], stock: [...DONNEES_FIXTURE.stock] });
    const recette = recetteDegustee();
    for (let i = 0; i < BORNE_BASES + 300; i++) {
      m.simulerCas({ id: 'b', titre: 'b', ajouts: [{ id: 'x', houblon: H.idaho7, dose_gL: 1 + i / 1000, moment: 'wp' }], levure: 'fermentis-us05', recette: recette as never, degustation: null, complet: false });
    }
    const bases = m.dans(courant).locaux.get('profil:bases') as Lru<unknown>;
    expect(bases.size).toBeGreaterThan(0);
    expect(bases.size).toBeLessThanOrEqual(BORNE_BASES);
  }, 60000);
});

describe('preuves documentaires chez l\'appelant (t2, point 2) : mêmes niveaux que hopDescriptorEvidence seul', () => {
  // Référence : l'algorithme d'avant #164, appel par appel, sans cache.
  const terms = new Map(EXTRAPOLATION.axes.map((a) => [a.id, a.terms]));
  const firstItem = (text: string) => (text.split(':').slice(1).join(':') || text).split(/,|;| and /)[0].replace(/^[\s#]+|[\s.]+$/g, '').replace(/[_-]+/g, ' ');
  const sourceKey = (d: { source: { author: string; reference: string } }) => `${d.source.author}|${d.source.reference}`;
  it('tout le catalogue, 12 familles : niveau, sources, premier, auteurs, citations', () => {
    let compares = 0;
    for (const v of contexteParDefaut().engineData.varieties) {
      const all = new Set(v.descriptions.map(sourceKey));
      const ref = Object.fromEntries(FAMILIES.map((f) => {
        const ev = hopDescriptorEvidence(v, terms.get(f) ?? []);
        const keys = new Set(ev.map(sourceKey));
        const first = v.descriptions.some((d) => hopDescriptorEvidence({ ...v, descriptions: [{ ...d, text: firstItem(d.text) }] }, terms.get(f) ?? []).length > 0);
        return [f, { level: keys.size === 0 ? 'non décrit' : keys.size >= 2 || first ? 'marqué' : 'cité', sources: keys.size, of: all.size, first, authors: [...new Set(ev.map((d) => d.source.author))] }];
      }));
      expect(describeFamilies(v.id)).toEqual(ref);
      const any = FAMILIES.some((f) => hopDescriptorEvidence(v, terms.get(f) ?? []).length > 0);
      expect(citations(v.id)).toEqual(Object.fromEntries(FAMILIES.map((f) => {
        const ev = hopDescriptorEvidence(v, terms.get(f) ?? []);
        return [f, { status: ev.length ? 'cité' : any ? 'non cité' : 'sans descripteur', sources: [...new Set(ev.map((d) => d.source.author))] }];
      })));
      compares++;
    }
    expect(compares).toBe(CATALOGUE.length);
  }, 60000);
});

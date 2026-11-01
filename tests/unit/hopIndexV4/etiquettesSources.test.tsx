// @vitest-environment jsdom
// Voie b1-etiquettes (31.10, D201, option B étape 1 de l'audit v2 : I18 à I20 et I23) : les 188 variétés ajoutées ne sont plus étiquetées
// « Beer Maverick » (leur plage est l'enveloppe des sources qui les citent), chaque plage dit ses vraies sources, et la ligne de sources de
// la fiche dit « 1 source » ou « n sources » pour chaque valeur. Sa parole (31.10) : « SI on a que une seul source pour ce houblons,
// tempis il faut pas se limité à si une seul source on montre pas, non » ; D168 : « un endroit qui renvoie la source suffit ».
// Rouge sur HEAD : un ajout porte « Beer Maverick » dans hopRef().alpha.from, dans ses lignes de sources et dans ses liens ; aucune ligne « 1 source ».
// Données : fixtures et catalogue des ajouts du dépôt ; aucune donnée réelle, aucun appel Gemini.
import { cleanup, render } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import type { Recipe } from '../../../src/types';

vi.mock('../../../src/services/storage', () => ({
  StorageService: {
    subscribe: () => () => {},
    getStocks: () => ({ rawMaterials: [], cleaning: [], equipment: [], kegs: [] }),
    getBatches: () => [],
    getHopTastings: () => [],
  },
}));

import { CATALOGUE, chargerAjouts, sourceDeLAdresse, type CatalogueHop } from '../../../src/domain/hopIndex/v4/data';
import { hopSheet } from '../../../src/domain/hopIndex/v4/fiches';
import { creerMoteur } from '../../../src/domain/hopIndex/v4/moteur';
import { chargerComplements, complementsCharges } from '../../../src/domain/hopIndex/v4/complements';
import { toHopRecipe } from '../../../src/domain/hopIndex/v4/recipeConversion';
import type { Recipe as RecetteMoteur } from '../../../src/domain/hopIndex/v4/recipe';
import { configurerDonnees } from '../../../src/ui/hopIndex/parcours/donnees';
import { houblon } from '../../../src/ui/hopIndex/parcours/adaptateur';
import { ContenuSources } from '../../../src/ui/hopIndex/fiche/SourcesFiche';
import { complementsFiche, confianceSources, groupesConfiance, liensDe, sourcesFiche, texteSources } from '../../../src/ui/hopIndex/fiche/sources';

const RECETTE = {
  id: 'REC-B1', name: 'Pale', style: '16D', volumeL: 20, boilMin: 60, ogTarget: 1.066, colorEbc: 70,
  fermentables: [], hops: [{ name: 'Nugget', alpha: 13, weightG: 46, stage: 'boil', timeMin: 60 }],
  yeast: { name: 'SafAle US-05', hopIndexId: 'fermentis-us05' },
} as unknown as Recipe;
const recette = () => toHopRecipe(RECETTE, { boilOg: 1.066 }).recette;
const BASE: RecetteMoteur = { name: 'Pale', styleCode: '16D', volumeL: 20, og: 1.05, boilMin: 60, yeastId: null, additions: [] };

let ajouts: CatalogueHop[] = [];
beforeAll(async () => {
  (globalThis as unknown as { ResizeObserver: unknown }).ResizeObserver ??= class { observe() {} unobserve() {} disconnect() {} };
  ajouts = await chargerAjouts();
  await chargerComplements();
  configurerDonnees({ stock: [] });
});
afterEach(cleanup);

const nbBM = (t: string) => (t.match(/Beer ?Maverick/gi) ?? []).length;

describe('un ajout n’est plus étiqueté « Beer Maverick » (I18 à I20)', () => {
  it('les 188 ajouts : ni l’α retenu, ni les lignes de la fiche, ni les liens ne portent Beer Maverick', () => {
    expect(ajouts.length).toBeGreaterThan(100);
    const fautes: string[] = [];
    for (const v of ajouts) {
      const h = houblon(v.id);
      if (!h.connu) { fautes.push(`${v.id} : fiche inconnue`); continue; }
      const s = sourcesFiche(v.id)!;
      const textes = [
        ...s.alpha.map((x) => x.source), ...s.beta.map((x) => x.source), ...s.huileTotale.map((x) => x.source),
        ...(s.cohumulone ? [s.cohumulone.source] : []), ...s.composants.flatMap((c) => (c.plage ? [c.plage.source] : [])),
        ...liensDe(v).flatMap((l) => [l.nom, l.auteur]),
      ];
      if (textes.some((t) => /Beer ?Maverick/i.test(t))) fautes.push(`${v.name} : ${textes.filter((t) => /Beer ?Maverick/i.test(t)).join(' ; ')}`);
      if (s.bm) fautes.push(`${v.name} : un bloc Beer Maverick`);
    }
    expect(fautes.slice(0, 5), `${fautes.length} ajouts mal étiquetés`).toEqual([]);
  });

  it('l’α retenu d’un ajout dit sa source (et celui d’une variété de base reste « Beer Maverick »)', () => {
    for (const v of ajouts.filter((x) => x.alpha)) expect(houblon(v.id).alpha?.source, v.name).not.toMatch(/Beer ?Maverick/i);
    const lotus = CATALOGUE.find((x) => x.id === 'beermaverick-lotus')!;
    expect(houblon(lotus.id).alpha?.source).toBe('plage variétale (Beer Maverick)');
    const seule = ajouts.find((x) => x.alpha && x.nbSources === 1 && sourceDeLAdresse(x.url))!;
    expect(houblon(seule.id).alpha?.source).toBe(`plage variétale (${sourceDeLAdresse(seule.url)})`);
    const plusieurs = ajouts.find((x) => x.alpha && (x.nbSources ?? 0) >= 2)!;
    expect(houblon(plusieurs.id).alpha?.source).toBe(`plage variétale (enveloppe de ${plusieurs.nbSources} sources)`);
  });

  it('la fiche du moteur (hopSheet) : les lignes d’α, de β, d’huile et les composants d’un ajout nomment leur source', () => {
    const m = creerMoteur({ catalogue: [...CATALOGUE, ...ajouts], stock: [] });
    const fautes: string[] = [];
    for (const v of ajouts) {
      const f = m.dans(() => hopSheet(v.id, { recipes: [], ibuBase: BASE }));
      const noms = [...f.alpha.sources, ...f.beta.sources, ...f.huiles.totale.sources].map((x) => x.source);
      for (const c of Object.values(f.huiles.composants)) if (c && typeof c === 'object' && 'source' in c) noms.push((c as { source: string }).source);
      if (noms.some((n) => /Beer ?Maverick/i.test(n))) fautes.push(v.name);
    }
    expect(fautes.slice(0, 5)).toEqual([]);
    const lotus = m.dans(() => hopSheet('beermaverick-lotus', { recipes: [], ibuBase: BASE }));
    expect(lotus.alpha.sources[0].source).toBe('Beer Maverick');
  });

  it('la source d’un ajout à une seule source est celle de son adresse, avec son lien ; une enveloppe n’a pas de lien qui la prétende', () => {
    const seule = ajouts.find((x) => x.alpha && x.nbSources === 1 && sourceDeLAdresse(x.url))!;
    const s = sourcesFiche(seule.id)!;
    expect(s.alpha[0]).toMatchObject({ source: sourceDeLAdresse(seule.url), url: seule.url });
    expect(s.liens[0]).toMatchObject({ auteur: sourceDeLAdresse(seule.url), url: seule.url });
    const plusieurs = ajouts.find((x) => x.alpha && (x.nbSources ?? 0) >= 2)!;
    const p = sourcesFiche(plusieurs.id)!;
    expect(p.alpha[0].source).toBe(`enveloppe de ${plusieurs.nbSources} sources`);
    expect(p.alpha[0].url).toBeNull();
  });
});

describe('la ligne de sources de la fiche dit « 1 source » ou « n sources » (B1)', () => {
  const rendre = (cle: string, avecComplements: boolean) => {
    const s = sourcesFiche(cle)!;
    const comp = avecComplements ? complementsFiche(cle, complementsCharges()!) : null;
    return { s, comp, ...render(<ContenuSources h={houblon(cle)} cle={cle} s={s} recette={recette()} comp={comp} />) };
  };

  it('un ajout à une seule source, sans compléments : « 1 source » pour chaque valeur qu’il porte, rien pour celles qu’il n’a pas', () => {
    const seule = ajouts.find((x) => x.alpha && x.beta && !x.cohumulone && x.nbSources === 1 && sourceDeLAdresse(x.url))!;
    const { container, s } = rendre(seule.id, false);
    const ligne = container.querySelector('[data-role="sources-confiance"]')!;
    expect(ligne).not.toBeNull();
    const un = ligne.querySelector('[data-n="1"]')!.textContent!;
    expect(un).toMatch(/^1 source :/);
    expect(un).toContain('α');
    expect(un).toContain('β');
    expect(ligne.textContent).not.toMatch(/cohumulone/);           // pas de cohumulone : inconnue, ni 0 ni compte
    expect(confianceSources(s, null).every((x) => x.n === 1)).toBe(true);
    expect(nbBM(container.textContent ?? '')).toBe(0);
  });

  it('une variété de base dont aucune autre source ne donne l’α : « 1 source » ; une variété très documentée : « n sources » (calcul indépendant)', () => {
    const c = complementsCharges()!;
    const seule = CATALOGUE.find((h) => h.alpha && !h.hs && !c.valeursDe(h.id, 'alpha').some((v) => !v.horsEnveloppe))!;
    expect(seule, 'une variété de base sans autre source pour l’α').toBeTruthy();
    const a = confianceSources(sourcesFiche(seule.id)!, complementsFiche(seule.id, c)).find((x) => x.champ === 'alpha')!;
    expect(a.n).toBe(1);

    const citra = 'beermaverick-citra';
    const attendu = new Set(['beermaverick', ...(CATALOGUE.find((h) => h.id === citra)!.hs?.alpha ? ['hopsteiner'] : []),
      ...c.valeursDe(citra, 'alpha').filter((v) => !v.horsEnveloppe).map((v) => v.source.id)]);
    expect(attendu.size).toBeGreaterThan(2);
    const { container, s } = rendre(citra, true);
    expect(confianceSources(s, complementsFiche(citra, c)).find((x) => x.champ === 'alpha')!.n).toBe(attendu.size);
    const groupe = [...container.querySelectorAll('[data-role="sources-confiance"] [data-n]')].find((e) => e.getAttribute('data-n') === String(attendu.size))!;
    expect(groupe.textContent).toContain(`${attendu.size} sources :`);
    expect(groupe.textContent).toContain('α');
  });

  it('un seul endroit : le texte « n source(s) » n’est écrit que dans cette ligne, jamais dans les rangées de valeurs', () => {
    const seule = ajouts.find((x) => x.alpha && x.nbSources === 1 && sourceDeLAdresse(x.url))!;
    const { container } = rendre(seule.id, false);
    const ligne = container.querySelector('[data-role="sources-confiance"]')!;
    const hors = (container.textContent ?? '').replace(ligne.textContent ?? '', '');
    expect(hors).not.toMatch(/\b\d+ sources?\b/);
  });

  it('une valeur inconnue n’a pas de compte ; les groupes se rangent « 1 source » d’abord', () => {
    expect(groupesConfiance([{ champ: 'alpha', libelle: 'α', n: 3 }, { champ: 'beta', libelle: 'β', n: 1 }, { champ: 'huile', libelle: 'huile totale', n: 1 }]))
      .toEqual([{ n: 1, libelles: ['β', 'huile totale'] }, { n: 3, libelles: ['α'] }]);
    expect(texteSources(1)).toBe('1 source');
    expect(texteSources(2)).toBe('2 sources');
    const sansCoh = CATALOGUE.find((h) => !h.cohumulone)!;
    expect(confianceSources(sourcesFiche(sansCoh.id)!, null).some((x) => x.champ === 'cohumulone')).toBe(false);
  });

  it('un ajout à plusieurs sources, sans compléments : aucun compte inventé ; avec eux, le compte des sources qui donnent la valeur', () => {
    const c = complementsCharges()!;
    const plusieurs = ajouts.find((x) => x.alpha && (x.nbSources ?? 0) >= 2 && c.valeursDe(x.id, 'alpha').some((v) => !v.horsEnveloppe))!;
    expect(plusieurs).toBeTruthy();
    expect(confianceSources(sourcesFiche(plusieurs.id)!, null).some((x) => x.champ === 'alpha')).toBe(false);
    const avec = confianceSources(sourcesFiche(plusieurs.id)!, complementsFiche(plusieurs.id, c)).find((x) => x.champ === 'alpha')!;
    expect(avec.n).toBe(new Set(c.valeursDe(plusieurs.id, 'alpha').filter((v) => !v.horsEnveloppe).map((v) => v.source.id)).size);
  });
});

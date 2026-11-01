// @vitest-environment jsdom
// Voie c7-catalogue-branche (26.10, D98, #187) : les 188 variétés ajoutées par c6 sont visibles et utilisables dans l'étape Houblons.
// - Krush se trouve à la recherche du champ « Ajouter — houblon… », s'ajoute, et paraît parmi les candidats de Substituer d'un houblon voisin ;
// - une variété `peuDeDonnees` ne passe jamais devant une variété documentée à égalité, dans Suggérer (« à acheter », voies) ;
// - « Cascade CHE » au stock : la fiche est celle de Cascade (US), l'astérisque dit « origine CHE non répertoriée » ;
// - le catalogue plein arrive après le premier rendu, sans le retarder (le premier rendu se fait sur les 317 de base).
import { act, cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeAll, describe, expect, it } from 'vitest';
import { createRef } from 'react';
import { CATALOGUE, cataloguePleinCharge, chargerAjouts, hopRef, type CatalogueHop } from '../../../src/domain/hopIndex/v4/data';
import { relierStock } from '../../../src/domain/hopIndex/v4/donneesApp';
import { creerMoteur } from '../../../src/domain/hopIndex/v4/moteur';
import { origineDuNom } from '../../../src/domain/hopIndex/v4/donneesApp';
import type { Recipe } from '../../../src/domain/hopIndex/v4/recipe';
import { getStyleScale } from '../../../src/domain/hopIndex/v4/style/scale';
import { configurerDonnees, donnees } from '../../../src/ui/hopIndex/parcours/donnees';
import { houblon } from '../../../src/ui/hopIndex/parcours/adaptateur';
import { Ajouter } from '../../../src/ui/hopIndex/maBiere/Ajouter';
import { HoteEtapeProvider, type HoteEtape } from '../../../src/ui/hopIndex/maBiere/hote';
import { MarquesCatalogue } from '../../../src/ui/hopIndex/fiche/marques';
import { marquesDe, origineNonRepertoriee } from '../../../src/ui/hopIndex/fiche/MarquesVue';
import type { RecetteParcours } from '../../../src/ui/hopIndex/parcours/types';

const R21C: Recipe = { name: 'Hazy du jeudi (21C)', styleCode: '21C', volumeL: 20, og: 1.058, boilMin: 60, yeastId: 'fermentis-us05', ebc: 8, additions: [
  { id: 'a1', hopKey: 'beermaverick-nugget', moment: 'b60', grams: 20 }, { id: 'a2', hopKey: 'beermaverick-cascade', moment: 'dryActive', grams: 80 }] };
const RECETTE = R21C as unknown as RecetteParcours;

afterEach(cleanup);

describe('le premier rendu ne dépend pas des ajouts', () => {
  it('avant l\'arrivée du morceau : 317 variétés, Krush inconnue ; la configuration des données reprend le catalogue de base', () => {
    expect(cataloguePleinCharge()).toBeNull();
    configurerDonnees({ stock: [] });
    expect(donnees().catalogue).toBe(CATALOGUE);
    expect(donnees().catalogue).toHaveLength(317);
    expect(hopRef('sources-krush')).toBeNull();
  });
});

describe('après l\'arrivée du catalogue plein', () => {
  beforeAll(async () => { await chargerAjouts(); });

  it('configurerDonnees rejouée à l\'arrivée : les 505 variétés sont dans les données courantes, un même tableau à chaque lecture', () => {
    const plein = cataloguePleinCharge()!;
    expect(plein).toHaveLength(317 + 180); // D199 (c9) : huit doublons fondus dans leur variété (188 avant)
    expect(cataloguePleinCharge()).toBe(plein);                       // identité stable : les moteurs et leurs caches la reconnaissent
    configurerDonnees({ stock: [] });
    expect(donnees().catalogue).toBe(plein);
    expect(donnees().fiches).toBe(plein);
  });

  it('Substituer : Krush est parmi les candidats d\'un houblon voisin (aucun filtre ne l\'exclut)', () => {
    configurerDonnees({ stock: [] });
    const m = creerMoteur({ catalogue: cataloguePleinCharge()!, stock: [] });
    const r = m.substitutes('beermaverick-columbus', { limit: 600 });
    const rang = r.remplacants.findIndex((x) => x.key === 'sources-krush' || x.name === 'Krush');
    expect(rang, 'Krush parmi les remplaçants de Columbus').toBeGreaterThanOrEqual(0);
    // Un houblon de la liste complète (limit grand) : les 505 moins lui-même, aucun écarté d'avance.
    expect(r.remplacants.length).toBeGreaterThan(450);
  });

  it('le champ « Ajouter — houblon… » trouve Krush, l\'ajoute à la recette, et une variété à peu de données porte sa marque', async () => {
    configurerDonnees({ stock: [] });
    const ajouts: { sur: string; hopKey: string }[] = [];
    const hote = {
      recette: RECETTE, route: { ecran: 'ma-biere' }, aller: () => {}, ouvrir: () => {}, modifierAjout: () => {},
      gestes: { ajouter: (sur: string, a: { hopKey: string }) => ajouts.push({ sur, hopKey: a.hopKey }), dose: () => {}, retirer: () => {} },
    } as unknown as HoteEtape;
    const champRef = createRef<HTMLInputElement>() as never;
    const { container } = render(<HoteEtapeProvider valeur={hote}><Ajouter recette={RECETTE} onGeste={() => {}} onAjout={() => {}} champRef={champRef} /></HoteEtapeProvider>);
    const champ = screen.getByLabelText('Ajouter un houblon : stock ou catalogue');
    await act(async () => { fireEvent.change(champ, { target: { value: 'krush' } }); });
    const ligne = await waitFor(() => { const l = container.querySelector('[data-houblon-ajout="sources-krush"]'); expect(l).not.toBeNull(); return l as HTMLElement; });
    expect(ligne.textContent).toMatch(/Krush/);
    expect(ligne.querySelector('[data-role="peu-de-donnees"]')).toBeNull();     // Krush : 8 sources, documentée
    fireEvent.click(ligne.querySelector('[data-role="ajout-rapide-plus"]')!);
    expect(ajouts).toEqual([{ sur: 'recette', hopKey: 'sources-krush' }]);

    // Une variété ajoutée à peu de données : trouvée aussi, avec sa marque discrète.
    const peu = (await chargerAjouts()).find((v) => v.peuDeDonnees && v.name.length > 4 && !/[^A-Za-z ]/.test(v.name))!;
    await act(async () => { fireEvent.change(champ, { target: { value: peu.name.toLowerCase() } }); });
    const lignePeu = await waitFor(() => { const l = container.querySelector(`[data-houblon-ajout="${peu.id}"]`); expect(l, peu.name).not.toBeNull(); return l as HTMLElement; });
    await waitFor(() => expect(lignePeu.querySelector('[data-role="peu-de-donnees"]')?.textContent).toBe('peu de données'));
  });

  it('la fiche d\'une variété ajoutée se lit : nom, α, origine, rôle ; jamais 0 pour un inconnu', () => {
    configurerDonnees({ stock: [] });
    const h = houblon('sources-krush');
    expect(h.connu).toBe(true);
    expect(h.nom).toBe('Krush');
    expect(h.alpha?.plage?.[0]).toBeGreaterThanOrEqual(8);
    expect(h.origine).toBe('États-Unis');
    const sans = (c: CatalogueHop[]) => c.filter((v) => v.alpha == null);
    for (const v of sans(cataloguePleinCharge()!)) expect(houblon(v.id).alpha, `${v.name} : α inconnu reste null`).toBeNull();
  });
});

describe('D175 : une variété à peu de données ne passe jamais devant une variété documentée à égalité, dans Suggérer', () => {
  const clone = (id: string, nom: string, peu: boolean): CatalogueHop => ({ ...structuredClone(CATALOGUE.find((v) => v.id === id)!), id: `test-${nom}`, name: nom, aliases: [], peuDeDonnees: peu || undefined, nbSources: peu ? 1 : 9 });
  const catalogue = [...CATALOGUE, clone('beermaverick-mosaic', 'Aaa clone peu de données', true), clone('beermaverick-mosaic', 'Zzz clone documenté', false)];
  const m = creerMoteur({ catalogue, stock: [] });

  it('« à acheter » (ajout en un toucher) : deux clones de Mosaic, le documenté d\'abord malgré l\'ordre alphabétique', () => {
    const r = m.quickAdds(R21C, getStyleScale('21C'), null, { catalogueLimit: 10000 });
    const rang = (nom: string) => r.catalogue.findIndex((x) => x.name === nom);
    const peu = r.catalogue[rang('Aaa clone peu de données')], doc = r.catalogue[rang('Zzz clone documenté')];
    expect(peu.peuDeDonnees).toBe(true);
    expect(doc.peuDeDonnees).toBeUndefined();
    expect(peu.fit).toBe(doc.fit);                                     // égalité réelle sur toutes les autres clés
    expect(rang('Zzz clone documenté')).toBeLessThan(rang('Aaa clone peu de données'));
    expect(peu.rank).toBe(doc.rank);                                   // l'égalité reste dite (même rang) ; l'ordre d'affichage départage
  });

  it('les voies d’achat de Suggérer : chaque houblon en deux jumeaux, le documenté passe avant le jumeau à peu de données, même derrière par le nom', () => {
    // Tout le catalogue en deux jumeaux (aucun n'est « usage attesté » : leurs identifiants sont neufs) : un jumeau « Aaa » à peu de données et un jumeau « Zzz »
    // documenté ont exactement la même fiche, donc le même rang. Sans la règle, le nom (ou le pool) donnerait la place au premier.
    const jumeau = (v: CatalogueHop, prefixe: string, peu: boolean): CatalogueHop => ({ ...structuredClone(v), id: `test-${prefixe}-${v.id}`, name: `${prefixe} ${v.name}`, aliases: [], peuDeDonnees: peu || undefined, nbSources: peu ? 1 : 9 });
    const dansLaRecette = new Set(R21C.additions.map((x) => x.hopKey));
    const catalogue = CATALOGUE.flatMap((v) => (dansLaRecette.has(v.id) ? [v] : [jumeau(v, 'Aaa', true), jumeau(v, 'Zzz', false)]));
    const res = creerMoteur({ catalogue, stock: [] }).proposeVoies(R21C, { citrus: 1 }, { limit: 5000, buyLimit: 5000, perHop: 100, assemblages: false });
    const ordre = res.voies.filter((v) => v.type === 'ajouter').map((v) => v.actions[0].hopKey);
    let paires = 0;
    for (const k of ordre.filter((x) => x.startsWith('test-Zzz-'))) {
      const peu = ordre.indexOf(k.replace('test-Zzz-', 'test-Aaa-'));
      if (peu < 0) continue;
      paires++;
      expect(ordre.indexOf(k), `${k} avant son jumeau à peu de données`).toBeLessThan(peu);
    }
    expect(paires, 'des jumeaux sont classés côte à côte').toBeGreaterThan(20);
  });
});

describe('l\'astérisque d\'origine non répertoriée', () => {
  it('lit l\'origine écrite dans un nom d\'article : code en queue, en tête, ou entre parenthèses', () => {
    expect(origineDuNom('Cascade CHE')).toMatchObject({ ecrit: 'CHE', sansOrigine: 'Cascade' });
    expect(origineDuNom('NZ Cascade')).toMatchObject({ ecrit: 'NZ', sansOrigine: 'Cascade' });
    expect(origineDuNom('Houblon Cascade (UK) 5,5 %')).toMatchObject({ ecrit: 'UK', sansOrigine: 'Houblon Cascade' });
    expect(origineDuNom('Cascade')).toBeNull();
    expect(origineDuNom('US')).toBeNull();
    expect(origineDuNom('Sorachi Ace')).toBeNull();
    expect(origineDuNom('Citra Cryo')).toBeNull();
  });

  const stockDe = (nom: string) => {
    const { stock, nonRelies } = relierStock([{ name: nom, currentStock: 500, unit: 'g' }], CATALOGUE);
    expect(nonRelies, `« ${nom} » se relie à une variété`).toEqual([]);
    configurerDonnees({ stock });
    return stock[0].key;
  };

  it('« Cascade CHE » au stock : reliée à Cascade, l\'astérisque dit la fiche américaine et l\'origine CHE non répertoriée', async () => {
    const cle = stockDe('Houblon Cascade CHE 5,5%');
    expect(cle).toBe('beermaverick-cascade');
    expect(origineNonRepertoriee(cle)).toEqual({ code: 'CHE', texte: 'fiche de Cascade (US) ; origine CHE non répertoriée' });
    render(<div className="flex flex-wrap"><MarquesCatalogue cle={cle} /></div>);
    const bouton = await screen.findByRole('button', { name: 'fiche de Cascade (US) ; origine CHE non répertoriée' });
    expect(bouton.textContent).toBe('*');
    expect(screen.queryByRole('note')).toBeNull();
    fireEvent.click(bouton);                                            // au toucher : la phrase
    expect(screen.getByRole('note').textContent).toBe('* fiche de Cascade (US) ; origine CHE non répertoriée');
    expect(bouton.getAttribute('aria-expanded')).toBe('true');
    fireEvent.click(bouton);
    expect(screen.queryByRole('note')).toBeNull();
  });

  it('l\'origine du catalogue, ou aucune origine écrite : pas d\'astérisque', () => {
    for (const nom of ['Houblon Cascade 5,5%', 'Cascade (US)', 'Cascade US']) {
      const cle = stockDe(nom);
      expect(origineNonRepertoriee(cle), nom).toBeNull();
      expect(marquesDe(cle), nom).toBeNull();
    }
    // Un houblon du catalogue seul (sans article) n'a aucun nom écrit : rien à marquer.
    configurerDonnees({ stock: [] });
    expect(origineNonRepertoriee('beermaverick-cascade')).toBeNull();
  });
});

import './temoin'; // témoin négatif de check:engine (B3)
// Un houblon hors du catalogue du moteur (`inconnu:<nom>`, ex. le Hallertau d'une vraie recette) ne plante plus Ma bière
// (#160, R1 de l'état des lieux) : la bière est lue, l'ajout est marqué « non simulé » avec sa raison, son arôme est
// inconnu (jamais 0 inventé) et la fiche de houblon (houblon()) rend une fiche vide qui se dit inconnue.
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { companionRecipe } from '../../../tests/fixtures/companionRecipe';
import { yeastFlowRecipe } from '../../../tests/fixtures/yeastRecipeFlow';
import { toHopRecipe } from '../parcours/src/integration/conversion';
import { configurerDonnees, houblon, lireBiere } from '../parcours/src/moteur';
import { FAMILIES } from '../src/engine';

beforeAll(() => configurerDonnees({ degustation: null }));
afterAll(() => configurerDonnees());

describe('Houblon inconnu du moteur (#160)', () => {
  it('un ajout « inconnu:hallertau » : la bière se lit, l’ajout est non simulé, aucune exception', () => {
    const conv = toHopRecipe(yeastFlowRecipe());
    const ajout = conv.recette.additions.find((a) => a.hopKey === 'inconnu:hallertau');
    expect(ajout, 'la Weissbier de fixture porte un Hallertau hors catalogue').toBeDefined();
    const biere = lireBiere(conv.recette);
    const ns = biere.nonSimules.find((x) => x.ajoutId === ajout!.id);
    expect(ns?.raison).toMatch(/absent des fiches du moteur/);
    // L'inconnu n'est jamais 0 : l'arôme d'un recette dont le seul houblon est inconnu n'est pas situé par ce houblon.
    expect(biere.profil).toBeDefined();
  });

  it('une recette dont tous les houblons sont inconnus : chaque famille est lue, jamais un 0 inventé', () => {
    const conv = toHopRecipe(companionRecipe());
    const r = { ...conv.recette, additions: conv.recette.additions.map((a) => ({ ...a, hopKey: 'inconnu:houblon-maison' })) };
    const biere = lireBiere(r);
    expect(biere.nonSimules.map((x) => x.ajoutId).sort()).toEqual(r.additions.map((a) => a.id).sort());
    for (const f of FAMILIES) {
      const p = biere.profil[f];
      // soit non située (valeur null + raison), soit située par la levure seule ; jamais une valeur nulle présentée comme mesurée
      if (p.valeur === null) expect(p.raison).toBeTruthy();
    }
  });

  it('houblon("inconnu:…") rend une fiche vide qui se dit inconnue : α null, rôle sans mot, familles non décrites, stock null', () => {
    const h = houblon('inconnu:hallertau');
    expect(h.cle).toBe('inconnu:hallertau');
    expect(h.nom).toBe('Hallertau');
    expect(h.connu).toBe(false);
    expect(h.alpha).toBeNull();
    expect(h.role.mot).toBeNull();
    expect(h.stock).toBeNull();
    expect(h.origine).toBeNull();
    expect(h.partSansFamille).toBeNull();
    for (const f of FAMILIES) expect(h.familles[f]).toEqual({ niveau: 'non décrit', fiches: 0, sur: 0 });
  });

  it('un houblon connu reste connu', () => {
    expect(houblon('beermaverick-nugget').connu).toBe(true);
  });
});

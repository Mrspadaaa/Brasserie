/**
 * D378 (08.11, banc payant de l'enrichissement) : la recherche rend la floculation tantôt en français (« moyenne »), tantôt en anglais (« Very High »,
 * Nottingham). La fiche écrite au stock dit la catégorie de l'app, en français ; un libellé hors catégorie reste tel que publié.
 */
import { describe, expect, it } from 'vitest';
import { valeursDeReponse } from '../../../../src/services/enrichissementCatalogues';
import { floculationFrancaise } from '../../../../src/domain/yeastFlocculation';

const levure = (flocculation: string) => ({ found: true, name: 'Nottingham', source: 'Lallemand Brewing', lab: 'Lallemand', form: 'dry', attenuationPct: 80, flocculation }) as any;

describe('D378 — floculation trouvée en ligne, en français', () => {
  it.each([['Very High', 'Très élevée'], ['High', 'Élevée'], ['medium-high', 'Moyenne à élevée'], ['moyenne', 'Moyenne'], ['Faible', 'Faible']])('%s → %s', (lu, attendu) => {
    expect(valeursDeReponse('levure', levure(lu))?.valeurs.yeastFlocculation).toBe(attendu);
  });
  it('un libellé hors catégorie reste tel que publié (jamais deviné)', () => {
    expect(floculationFrancaise('pulvérulente ')).toBe('pulvérulente');
    expect(valeursDeReponse('levure', levure('poudreuse'))?.valeurs.yeastFlocculation).toBe('poudreuse');
  });
});

import { classerEchec, SUITE_ECHEC } from '../../../../src/services/enrichissementReglages';
import { GEMINI_UNUSABLE_MESSAGES } from '../../../../functions/src/geminiResponse';

describe('D378 — une réponse coupée (Nelson Sauvin au banc) est réessayée par la file, jamais perdue', () => {
  it.each(['truncated', 'degenerate'] as const)('%s : compte au plafond, attend le prochain essai (30 min), échec après 3 jours', (raison) => {
    const classe = classerEchec(GEMINI_UNUSABLE_MESSAGES[raison]);
    expect(classe).toBe('autre');
    expect(SUITE_ECHEC[classe]).toEqual({ plafond: true, jour: true, etat: 'attend' });
  });
});

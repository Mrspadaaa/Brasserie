import { describe, expect, it } from 'vitest';
import { fixtureCarnets, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { lireCarnets } from '../../src/domain/carnets/modele';
import { rattacher, propositions } from '../../src/domain/carnets/rattacher';
import { parleDuBrassin } from '../../src/domain/carnets/analyseLocale';

/** Voie r (tour 3) : PCN-134 et PCN-141 au tag en-ligne/2026-11-19-tour2, sur la fixture du carnet (aucune donnée réelle, aucun Gemini). */
const carnets = lireCarnets(fixtureCarnets());

describe('PCN-134 : un seuil de débit à la hotte se rattache à la Ventilation', () => {
  it('« hotte murale à 1 200 m³/h au moins » propose le carnet Ventilation, pas un 2e carnet hotte', () => {
    const p = rattacher('hotte murale à 1 200 m³/h au moins', carnets);
    expect(p?.carnetId).toBe(ID_VENTILATION);
    expect(propositions('hotte murale à 1 200 m³/h au moins', carnets)[0]?.carnetId).toBe(ID_VENTILATION);
  });
});

describe('PCN-141 : le brassin se reconnaît avant tout classement par objet', () => {
  it.each(['Prochain brassage mardi', 'Sachets de levure x2', '2 sachets de levure'])('« %s » parle du brassin', t => {
    expect(parleDuBrassin(t)).toBe(true);
  });
  it.each(['moulin à malt', 'Sol du local', 'hotte murale'])('« %s » n’est pas le brassin', t => {
    expect(parleDuBrassin(t)).toBe(false);
  });
});

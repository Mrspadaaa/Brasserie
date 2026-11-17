import { describe, expect, it } from 'vitest';
import { fixtureCarnets, ID_EMBOUTEILLAGE, ID_EVIER, ID_FRIGO, ID_VENTILATION } from '../../src/domain/carnets/fixture';
import { lireCarnets } from '../../src/domain/carnets/modele';
import { carnetProche, propositions, raisonRattachement, rattacher, SEUIL_RATTACHER } from '../../src/domain/carnets/rattacher';

const carnets = lireCarnets(fixtureCarnets());

/** Seuil réglé sur la première moitié (REGLAGE), jugé sur la seconde (JUGEMENT) ; `null` = aucun carnet proche (carnet neuf). L20. */
const REGLAGE: [string, string | null][] = [
  ['hotte 100 cm vue chez un autre fournisseur', ID_VENTILATION],
  ['isobarique 4 becs d’occasion', ID_EMBOUTEILLAGE],
  ['chambre froide 3 m³', ID_FRIGO],
  ['douchette pour l’évier', ID_EVIER],
  ['extracteur plus silencieux', ID_VENTILATION],
  ['remplisseuse contre-pression', ID_EMBOUTEILLAGE],
  ['vitrine pro d’occasion', ID_FRIGO],
  ['acheter du houblon Citra', null],
  /* voisine difficile : « cuve » est dans la phrase de Ventilation, mais ce n'est pas elle */
  ['nettoyer la cuve de fermentation', null],
  ['bacs profonds pour laver les fûts', ID_EVIER]
];
const JUGEMENT: [string, string | null][] = [
  ['hotte inox moins chère', ID_VENTILATION],
  ['monobloc 6 becs', ID_EMBOUTEILLAGE],
  ['frigo pour les fûts', ID_FRIGO],
  ['évier sur pieds', ID_EVIER],
  ['condensation au plafond', ID_VENTILATION],
  ['oxygène dans les bouteilles', ID_EMBOUTEILLAGE],
  ['température en été dans le local', ID_FRIGO],
  ['prix des levures', null],
  ['pinceau et rouleau pour le sol', null],
  ['isobarique pré-évacuation', ID_EMBOUTEILLAGE]
];

const bons = (cas: [string, string | null][], seuil: number) => cas.filter(([t, attendu]) => (rattacher(t, carnets, seuil)?.carnetId ?? null) === attendu).length;

describe('rattacher (A5)', () => {
  it('le seuil du module est dans la plage optimale trouvée sur la moitié de réglage', () => {
    const grille = Array.from({ length: 61 }, (_, i) => Math.round(i * 5) / 100);
    const scores = grille.map(s => bons(REGLAGE, s));
    const meilleur = Math.max(...scores);
    const optimaux = grille.filter((_, i) => scores[i] === meilleur);
    console.info(`A5 réglage : ${meilleur}/10 au mieux, seuils optimaux ${optimaux[0]} à ${optimaux.at(-1)} ; module ${SEUIL_RATTACHER}`);
    console.info('A5 scores réglage :', REGLAGE.map(([t]) => `${t} → ${propositions(t, carnets)[0]?.titre ?? '—'} ${propositions(t, carnets)[0]?.score ?? 0}`).join(' | '));
    expect(optimaux).toContain(SEUIL_RATTACHER);
  });
  it('jugé sur l’autre moitié : au moins 80 % de bons carnets proposés', () => {
    const n = bons(JUGEMENT, SEUIL_RATTACHER);
    console.info(`A5 jugement : ${n}/10 au seuil ${SEUIL_RATTACHER}`);
    console.info('A5 scores jugement :', JUGEMENT.map(([t]) => `${t} → ${propositions(t, carnets)[0]?.titre ?? '—'} ${propositions(t, carnets)[0]?.score ?? 0}`).join(' | '));
    expect(n).toBeGreaterThanOrEqual(8);
  });
  it('la raison dite reprend les mots en commun ; un carnet proche d’un autre (G35) l’exclut lui-même', () => {
    const p = rattacher('hotte inox moins chère', carnets)!;
    expect(raisonRattachement(p)).toMatch(/^comme Ventilation de la salle de brassage : .*hotte/);
    const v = carnets.find(c => c.id === ID_VENTILATION)!;
    expect(carnetProche(v, carnets)?.carnetId).not.toBe(ID_VENTILATION);
  });
  it('texte vide ou sans carnet : rien', () => {
    expect(rattacher('', carnets)).toBeNull();
    expect(rattacher('hotte', [])).toBeNull();
  });
});

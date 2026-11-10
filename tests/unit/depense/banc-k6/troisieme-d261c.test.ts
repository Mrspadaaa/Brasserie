// D261c (01.11, nuit) : « Et ça a pris vraiment beaucoup de temps pour une "facture" relativement simple ??? » — deux lectures 3.5 Flash-Lite en
// parallèle (6,3 et 6,8 s), puis une troisième par 3.8 Flash (19,6 s) : ~27 s côté serveur.
// Ce qui appelle la 3.8 en production : `needsThird(r1, r2)` (functions/src/invoiceScanVote.ts) = `reconcileInvoiceVision([r1, r2]).needsCorrection`
// (functions/src/invoiceVisionReview.ts : `triggered` | `controlTriggered`). `compareInvoiceReview` (invoiceScanCore.ts:418) n'est appelée par aucun
// chemin vivant (ai.ts, invoiceScanVote.ts) : ce n'est pas elle. Sont des déclencheurs : tout champ d'en-tête qui diverge hors tvaAmount/tvaRate,
// quantity, unit, amountTTC, kind et reference d'une ligne, un nom de ligne qui n'est ni une coquille ni les mêmes mots, des lignes sans vis-à-vis.
// Le relevé `releveDivergences` du banc dit lesquels. Les tests « EN ATTENTE D261c » sont le contrat du correctif non posé (choix du pilote), suspendus.
import { describe, expect, it } from 'vitest';
import { reconcileInvoiceVision } from '../../../../functions/src/invoiceVisionReview';
import { divergencesDe, releveDivergences, texteDivergences } from '../../../../scripts/banc-lecture-facture';
import { corpus } from '../rapprochement/aide';
import { items, lecture, lire, trouve } from './piece';

const IDX = { hopfensack: 2, carafictif: 3 };
const paire = (a: any, b: any) => [lire(a), lire(b)] as const;
const needs = (a: any, b: any) => reconcileInvoiceVision([...paire(a, b)]).needsCorrection;
const points = (a: any, b: any) => (reconcileInvoiceVision([...paire(a, b)]).result as any).points as any[];
/** La lecture 2 d'un Flash-Lite : le matériel est « other » au lieu de « equipment » (deux lectures se défendent, D262c), le reste identique. */
const kindsAutres = () => lecture({}, items([{}, { kind: 'other' }, { kind: 'other' }]));
/** La lecture 2 colle la variante au nom (« CARAFICTIF®, Kg » → « CARAFICTIF, Mischung: … ») : le même article. */
const nomAvecVariante = () => lecture({}, items([{}, {}, {}, { name: 'CARAFICTIF, Mischung: Einzelprodukt Schrotung: geschrotet [+CHF 0.10]' }]));

describe('D261c — ce qui appelle la 3.8 sur une pièce de cette forme', () => {
  it('la pièce lue deux fois à l’identique : aucune 3.8, aucun relevé', () => {
    expect(needs(lecture(), lecture())).toBe(false);
    expect(releveDivergences(...paire(lecture(), lecture()))).toEqual([]);
  });

  it('AUJOURD’HUI (cause ; à retirer une fois le correctif posé) — un `kind` qui diverge (equipment / other) sur 2 lignes : la 3.8 est appelée, et le relevé nomme les 2 champs `kind` (jamais leurs valeurs)', () => {
    expect(needs(lecture(), kindsAutres())).toBe(true);
    const releve = releveDivergences(...paire(lecture(), kindsAutres()));
    expect(releve.filter(d => d.declenche).map(d => d.champ).sort()).toEqual(['items.2.kind', 'items.3.kind']);
    expect(texteDivergences(releve)).toBe('!kind×2');
    expect(JSON.stringify(releve)).not.toMatch(/Cuve|Hopfensack|CARAFICTIF/);
  });

  it('AUJOURD’HUI (cause ; à retirer une fois le correctif posé) — un nom qui contient la variante de l’autre lecture : la 3.8 est appelée (le nom diverge, ce n’est ni une coquille ni les mêmes mots)', () => {
    expect(needs(lecture(), nomAvecVariante())).toBe(true);
    const releve = releveDivergences(...paire(lecture(), nomAvecVariante()));
    expect(releve.filter(d => d.declenche).map(d => d.champ)).toEqual([`items.${IDX.carafictif + 1}.name`]);
  });

  it('deux lectures qui ne divergent que sur la TVA : pas de 3.8 (P5) ; le relevé, s’il la voit, ne la compte pas comme déclencheur', () => {
    const a = lecture({ tvaAmount: 6.55 }), b = lecture({ tvaAmount: 8 });
    expect(needs(a, b)).toBe(false);
    const releve = releveDivergences(...paire(a, b));
    expect(releve).toEqual([{ champ: 'tvaAmount', ligne: null, code: 'lectures-divergentes', lectures: [1, 2], pese: true, declenche: false }]);
  });

  it('un montant de ligne qui diverge appelle toujours la 3.8 (l’argent), et le relevé le dit', () => {
    const b = lecture({}, items([{}, {}, {}, { amountTTC: 4.2, price: 2.1 }]));
    expect(needs(lecture(), b)).toBe(true);
    expect(releveDivergences(...paire(lecture(), b)).some(d => d.declenche && d.champ.endsWith('.amountTTC'))).toBe(true);
  });

  it('parité : sur le jeu des 20 paires du rapprochement, « une divergence déclenche » coïncide avec `needsCorrection` de la production', () => {
    for (const [nom, a, b] of corpus()) {
      const [r1, r2] = paire(a, b);
      const prod = reconcileInvoiceVision([r1, r2]).needsCorrection;
      expect(releveDivergences(r1, r2).some(d => d.declenche), nom).toBe(prod);
    }
  });

  it('`divergencesDe` (le rapport du banc) : un relevé par paire de lectures exploitables, jamais de valeur ; une lecture sans `normalized` n’en fait pas', () => {
    const lue = (raw: any) => ({ normalized: lire(raw) }) as any;
    const reads = { lite: {}, l1: lue(lecture()), l2: lue(kindsAutres()), a1: lue(lecture()), a2: {} } as any;
    const out = divergencesDe(reads);
    expect(Object.keys(out)).toEqual(['C']);
    expect(out.C.map(d => d.champ).sort()).toEqual(['items.2.kind', 'items.3.kind']);
    expect(JSON.stringify(out)).not.toMatch(/Cuve|Hopfensack|CARAFICTIF|6,55|124/);
  });

  it('parité : les trois cas de la pièce imitée', () => {
    for (const [a, b] of [[lecture(), kindsAutres()], [lecture(), nomAvecVariante()], [lecture(), lecture()]] as const) {
      const [r1, r2] = paire(a, b);
      expect(releveDivergences(r1, r2).some(d => d.declenche)).toBe(reconcileInvoiceVision([r1, r2]).needsCorrection);
    }
  });

  // D261c NON POSÉ (voie k6-correctifs, 01.11) : il change quand la 3.8 est appelée et attend le choix du pilote (options A, B, C du diagnostic).
  // Les trois tests de contrat ci-dessous sont suspendus (`it.skip`, corps gardé) et se rallument avec le correctif ; les tests « AUJOURD’HUI » décrivent le code actuel.
  it.skip('EN ATTENTE D261c — `kind` qui diverge ENTRE deux natures sans argent (equipment / other) : pas de 3.8', () => {
    expect(needs(lecture(), kindsAutres())).toBe(false);
  });

  it.skip('EN ATTENTE D261c — un nom qui diverge (variante collée) sur une ligne que la MÊME référence imprimée identifie dans les deux lectures : pas de 3.8', () => {
    expect(needs(lecture(), nomAvecVariante())).toBe(false);
  });

  it('reste vrai après le correctif — `kind` stock contre equipment (un ingrédient lu comme du matériel change le stock) appelle toujours la 3.8', () => {
    const b = lecture({}, items([{ kind: 'equipment' }]));   // la levure lue « equipment »
    expect(needs(lecture(), b)).toBe(true);
  });

  it('D261c (posé le 10.11, alignement de Needleman-Wunsch) — kind ET nom divergent sans référence imprimée : les lignes ne sont pas « sans vis-à-vis » (l’ancre par les chiffres ne devrait pas exiger le même kind)', () => {
    const sansRef = (list: any[]) => list.map(l => ({ ...l, reference: '' }));
    const a = lecture({}, sansRef(items()));
    const b = lecture({}, sansRef(items([{}, {}, { kind: 'other', name: 'Hopfensack fictif fein, Mischung: Einzelprodukt' }])));
    expect(trouve(points(a, b), 'lignes-non-rapprochees')).toEqual([]);
  });

});

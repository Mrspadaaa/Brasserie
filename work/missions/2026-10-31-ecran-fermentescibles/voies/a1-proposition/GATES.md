# Gates: voie a1-proposition — les tuiles de l'ouverture classées selon le style (D222)

OWNS: src/domain/fermentables/, src/data/fermentables/, src/data/fermentableSources/, scripts/collecte-malt/, tests/unit/fermentables/, work/missions/2026-10-31-ecran-fermentescibles/voies/a1-proposition/

Scope: la donnée de typicité des fermentescibles, les noms et alias, la règle de proposerFermentables ; signature inchangée.

- [ ] G1: la voie est comprise
  CHECK: node scripts/agents/systeme.mjs comprendre work/missions/2026-10-31-ecran-fermentescibles/voies/a1-proposition
  EXPECT: COMPRIS OK

- [ ] G2: les tests de la proposition passent
  CHECK: npx vitest run tests/unit/fermentables --maxWorkers=2 && echo TESTS PROPOSITION OK
  EXPECT: TESTS PROPOSITION OK

- [ ] G3: la table se recalcule depuis les relevés, sans réseau
  CHECK: node scripts/collecte-malt/typicite-malts.mjs --verifier
  EXPECT: TYPICITE MALTS OK

- [ ] G4: les types tiennent
  CHECK: npx tsc --noEmit -p . && echo TYPES OK
  EXPECT: TYPES OK

- [ ] G5: la règle est écrite et le contrat garde son nom
  CHECK: node scripts/agents/systeme.mjs note src/domain/fermentables/proposition.ts --contient "export function proposerFermentables,export const PROPOSITION_RULE,EntreeProposition,typicit"
  EXPECT: NOTE OK

- [ ] G6: le résultat dit le témoin rouge, les deux styles témoins et la licence
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-fermentescibles/voies/a1-proposition/RESULTAT.md --contient "TEMOIN AVANT,German Pils,Stout,CC BY-SA,inconnu"
  EXPECT: NOTE OK

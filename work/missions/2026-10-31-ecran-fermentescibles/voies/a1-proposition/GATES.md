# Gates: voie a1-proposition — les tuiles de l'ouverture classées selon le style (D222)

OWNS: src/domain/fermentables/, src/data/fermentables/, src/data/fermentableSources/, scripts/collecte-malt/, tests/unit/fermentables/, work/missions/2026-10-31-ecran-fermentescibles/voies/a1-proposition/

Scope: la donnée de typicité des fermentescibles, les noms et alias, la règle de proposerFermentables ; signature inchangée.

- [x] G1: la voie est comprise
  CHECK: node scripts/agents/systeme.mjs comprendre work/missions/2026-10-31-ecran-fermentescibles/voies/a1-proposition
  EXPECT: COMPRIS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=d34d8ba88cc6ada348fabf548083d3d0c819a4c618ddbeab365a02798101e037; exit=0; EXPECT=matched; output-sha256=1f3f59c2f50e5bb301170ef4d11e620e68abb530f0f1595c159f44ad2f1acbf4; output-bytes=22; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: les tests de la proposition passent
  CHECK: npx vitest run tests/unit/fermentables --maxWorkers=2 && echo TESTS PROPOSITION OK
  EXPECT: TESTS PROPOSITION OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=b391c74812d15d75670c9357a186bfdb60e9d46c312eb7fa81c626e230963d74; exit=0; EXPECT=matched; output-sha256=a2db8d3b073c1ce0a9890c20e706238db4fcdf99014e7e2b24c6d5bd01009d05; output-bytes=1039; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: la table se recalcule depuis les relevés, sans réseau
  CHECK: node scripts/collecte-malt/typicite-malts.mjs --verifier
  EXPECT: TYPICITE MALTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=81b8f70fd16c367571beafa9407a406121ef1220fe952e684721e59312c89ea4; exit=0; EXPECT=matched; output-sha256=fd7bda3263f96e73fb7789fdbe50fa12fef04635269cc2200270d013dbc02c95; output-bytes=18; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les types tiennent
  CHECK: npx tsc --noEmit -p . && echo TYPES OK
  EXPECT: TYPES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=80124aa147802b69711fce941250771ac666157ec2b6a3706d483ab28aee9797; exit=0; EXPECT=matched; output-sha256=825f80aa6f2c74e6119827ce9086d829923aeedac46e3c0efa2596d4e807842c; output-bytes=10; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: la règle est écrite et le contrat garde son nom
  CHECK: node scripts/agents/systeme.mjs note src/domain/fermentables/proposition.ts --contient "export function proposerFermentables,export const PROPOSITION_RULE,EntreeProposition,typicit"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=3944a749252b3aae572e12f5264ef872e3890dc162b99d7aa160e5c67bc68225; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: le résultat dit le témoin rouge, les deux styles témoins et la licence
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-fermentescibles/voies/a1-proposition/RESULTAT.md --contient "TEMOIN AVANT,German Pils,Stout,CC BY-SA,inconnu"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=387f8c15f9ead84a3d6dc51384c0273b138b52322a6d739ae1be9b0425f26433; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

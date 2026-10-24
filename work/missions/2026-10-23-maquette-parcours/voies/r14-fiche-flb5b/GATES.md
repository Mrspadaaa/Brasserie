# Gates: voie r14-fiche-flb5b — la liste de la fiche en flb5b (D130)

OWNS: prototypes/houblons-v4/parcours/src/ecrans/fiche/**, prototypes/houblons-v4/maquettes/parcours-fiche/**, work/missions/2026-10-23-maquette-parcours/voies/r14-fiche-flb5b/RESULTAT.md

Scope: la matrice de flb5b sous le radar de g1, ses types hors 16D en tête, sans perdre un état de la fiche.

- [x] G1: la maquette se construit
  CHECK: node prototypes/houblons-v4/parcours/outils/construire.mjs --sortie=prototypes/houblons-v4/maquettes/parcours-fiche
  EXPECT: CONSTRUIT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=0c956612b92966f98cca8cc1e0be76f53fd5401ed46925b5da477ae61152a20c; exit=0; EXPECT=matched; output-sha256=29b4b7d8561a15276f9cd22d65b617c72c8fa492873e0b8c2886fc7e8333d546; output-bytes=76; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: les types hors 16D de la fiche
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-hors-16d.mjs prototypes/houblons-v4/maquettes/parcours-fiche/fiche/etat.html --min=1
  EXPECT: HORS-16D OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=b0e38e5b57ce0dd1c1b90d4765575d003f5946fe09d0fd54d39ab4fa8ccedd02; exit=0; EXPECT=matched; output-sha256=bb9e5c9487f8f2f9777ec8f8978ee5cbdb5076741ae42b710f93f9be1f934766; output-bytes=86; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: aucun état de la fiche perdu
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-etats.mjs prototypes/houblons-v4/maquettes/parcours-fiche --ecran=fiche
  EXPECT: ETATS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=2530f56b54ed0a5c637425331585f968dd2bb883620219e4235e83923dfa17c8; exit=0; EXPECT=matched; output-sha256=d03624e066645ddfed407cdeb6bc3e6196a481144b719fbe2ec8a1637d2fe7ae; output-bytes=408; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: son choix et la baseline
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs prototypes/houblons-v4/maquettes/parcours-fiche --ecran=fiche && node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs prototypes/houblons-v4/maquettes/parcours-fiche fiche --page=etat.html --sans=mots,fiche,legende
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=d8a5d8555ff6804ad52642ca71eb0b6e0047370d8468fc88d27e2d91e7229f1f; exit=0; EXPECT=matched; output-sha256=7cf9364db9b111d57224eb6b84bce12385ea3f273a0a81e7e83c90d5a6a8afd9; output-bytes=279; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: la fiche exhaustive, le pied de flu2b (D132)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-fiche-exhaustive.mjs prototypes/houblons-v4/maquettes/parcours-fiche/fiche/etat.html
  EXPECT: EXHAUSTIVE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=2990c26516a5ce0ac4151e668f147891abc4c5ded793b74cb45f3179bfdf4535; exit=0; EXPECT=matched; output-sha256=e69910625ee4d32dbe75d43c0e1ae68457fd902395e777c328550a8764dcda38; output-bytes=256; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

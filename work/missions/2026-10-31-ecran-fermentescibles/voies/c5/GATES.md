# Gates: voie c5 — le contrôle « à la volée » (D211), qui échoue sur r4d

OWNS: work/refonte-frontend/v4/tournoi/outils/controle-volee.mjs, work/missions/2026-10-31-ecran-fermentescibles/voies/c5/

Scope: le contrôle de D211 ; il refuse r4d et accepte un témoin qui fait les quatre réglages sur la ligne.

- [x] G1: le contrôle refuse r4d
  CHECK: node scripts/agents/systeme.mjs echoue "VOLEE ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-volee.mjs work/missions/2026-10-31-ecran-fermentescibles/v3/r4d/etat.html
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1312fb0ef01cd27f5e941b2408cd60be6c14807613cdba7644e166d94238a40c; exit=0; EXPECT=matched; output-sha256=a7ff38a3725d49c0399db88d0c01bafc710be54d9f2bf4a0a3bcc344bce4b56c; output-bytes=32; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: le contrôle accepte le témoin positif
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-volee.mjs work/missions/2026-10-31-ecran-fermentescibles/voies/c5/temoin-ok.html
  EXPECT: VOLEE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=0dc7622961b81b434e20e4b708a0fe2a9ddc47b7a4f0e0cd6ce61c3eb662b203; exit=0; EXPECT=matched; output-sha256=a50d5f87c8699e89270c2a83d4c0d69dc883e2e41d68cda39ed70dfff213c50b; output-bytes=883; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: le résultat donne la sortie sur r4d
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-fermentescibles/voies/c5/RESULTAT.md --contient "TEMOIN r4d,part,moment,couleur"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=92db7fe35d062b3218a59c5a1162b97219cdee6c84e6913ac8696d67b532010b; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

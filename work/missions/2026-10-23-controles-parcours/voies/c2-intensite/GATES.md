# Gates: voie c2-intensite — l'intensité et l'usage, sur la maquette jouable

OWNS: work/refonte-frontend/v4/tournoi/outils/controle-usage-intensite.mjs, work/refonte-frontend/v4/tournoi/outils/temoins/usage-parcours-*, work/missions/2026-10-23-controles-parcours/voies/c2-intensite

Scope: un mode --parcours de controle-usage-intensite.mjs contre le moteur en direct, ses témoins, joué sur le parcours, sans toucher au mode actuel.

- [x] G1: le mode actuel ne change pas
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-usage-intensite.mjs work/refonte-frontend/v4/ecran-1/fils15-s5-complexe q2b --page=etat-b.html
  EXPECT: USAGE-INTENSITE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=abd78a82dd4ee4dc3a761af7c3cee2a41ed64fd75019b33b56d9fb82f8a543aa; exit=0; EXPECT=matched; output-sha256=ea8b369d850b407800c4a8c26ace354ff81d992468e2b5ac21c1e78db0671cfd; output-bytes=46; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: le témoin positif passe en mode parcours
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-usage-intensite.mjs work/refonte-frontend/v4/tournoi/outils/temoins usage-parcours-ok --page=etat.html --parcours
  EXPECT: USAGE-INTENSITE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=0a60cce29579f9ca0acde96aaddfb267b1b1837824ed8fea73420dcbcb9e3443; exit=0; EXPECT=matched; output-sha256=153775d3bdced02fe2c5dc7a310bdd8c5c9bc96ab467f491d3f9f9e072320e33; output-bytes=92; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: un usage faux échoue par U1 usage
  CHECK: node scripts/agents/systeme.mjs echoue "U1 usage" -- node work/refonte-frontend/v4/tournoi/outils/controle-usage-intensite.mjs work/refonte-frontend/v4/tournoi/outils/temoins usage-parcours-usage-faux --page=etat.html --parcours
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=968d979fc0fb0dad402802f1c12be8273e9f1c15d64495c314859c05a612dafd; exit=0; EXPECT=matched; output-sha256=a6b38914c64c94ee736a568726092fe861bffe79af562d3f498ce0627d4d5657; output-bytes=29; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: une source de forme longue échoue par U1 source
  CHECK: node scripts/agents/systeme.mjs echoue "U1 source" -- node work/refonte-frontend/v4/tournoi/outils/controle-usage-intensite.mjs work/refonte-frontend/v4/tournoi/outils/temoins usage-parcours-source-longue --page=etat.html --parcours
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=4abb84bc5b17a6efdc8786cde3da7a7e0c5b26667f7f1d8b98f83f5557e9d399; exit=0; EXPECT=matched; output-sha256=60a71fe5ace5a9e9cd1a72c4bd2fc275e2c941c96b2ed51859a49494a56b0f1f; output-bytes=30; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: une intensité absente échoue par I1 absente
  CHECK: node scripts/agents/systeme.mjs echoue "I1 absente" -- node work/refonte-frontend/v4/tournoi/outils/controle-usage-intensite.mjs work/refonte-frontend/v4/tournoi/outils/temoins usage-parcours-sans-intensite --page=etat.html --parcours
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=66f9848b054d08b78028bf08fb7f738a2163456c15e95cc75cd68fcd7369737f; exit=0; EXPECT=matched; output-sha256=047093cca198856191d5a44d1343b5652e14546dda5fb8e1ad42b89f63e1c98e; output-bytes=31; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: une intensité loin du moteur échoue par I1 écart
  CHECK: node scripts/agents/systeme.mjs echoue "I1 écart" -- node work/refonte-frontend/v4/tournoi/outils/controle-usage-intensite.mjs work/refonte-frontend/v4/tournoi/outils/temoins usage-parcours-ecart --page=etat.html --parcours
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=2f5f16b1212b7e391c3dba9ed9e1cfb0f88666b7754ceff4aa58ed0cfd4f4fc2; exit=0; EXPECT=matched; output-sha256=c202ce9c1d96cce6608d12681cc5dcc33e59fa1917a65f24186529d61de5eea3; output-bytes=30; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: joué sur Ma bière, Suggérer et Comparer du parcours, il rend un verdict sans planter
  CHECK: node scripts/agents/systeme.mjs verdict -- node work/refonte-frontend/v4/tournoi/outils/controle-usage-intensite.mjs prototypes/houblons-v4/maquettes/parcours ma-biere suggerer comparer --page=etat.html --parcours
  EXPECT: /ma-biere · [\s\S]*suggerer · [\s\S]*comparer · [\s\S]*VERDICT (OK|ECHEC)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=fbec1ac2551ce719a69888b7f08ac1909a79f997e1f235e79913bb0b8f7a8589; exit=0; EXPECT=matched; output-sha256=2372c235badb29cc822fb8496a778a010dcdf202776ee56a1f65ba1efb11fcb7; output-bytes=481; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: la NOTE décrit la table des routes et ce qui reste hors du contrôle
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-controles-parcours/voies/c2-intensite/NOTE.md --contient "ma-biere,suggerer,comparer,hopRole,cransOf"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=0e1cf98e738bb4211ece7ee46160e795910d157dc3662d01663cd9cec8c438c2; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G9: les défauts du parcours sont écrits pour les écrans
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-controles-parcours/voies/c2-intensite/RESULTAT.md --exiger "Défauts du parcours"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=13c38e59772dc66ae6b9b4ba51d4914c5be04254ab45186f95a51e96838b938f; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G10: le câblage du système tient (pas d'OK 0/0, pas de caractère de contrôle)
  CHECK: node scripts/agents/systeme.mjs cablage
  EXPECT: CABLAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=5713fcbe8de744cefb76370244175b1a2dda328c030386acddcf0e090d0c4911; exit=0; EXPECT=matched; output-sha256=5ec18eb46548cd9619d98ce192a9c22635986ec66e4b705f9f65c00c6d173416; output-bytes=11; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

# Gates: voie c1-rail — le contrôle du rail, sur la maquette jouable

OWNS: work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs, work/refonte-frontend/v4/tournoi/outils/temoins/rail-parcours-*, work/missions/2026-10-23-controles-parcours/voies/c1-rail

Scope: un mode --parcours de controle-rail.mjs, ses témoins, joué sur le parcours construit, sans toucher au mode actuel.

- [x] G1: le mode actuel ne change pas
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs work/refonte-frontend/v4/ecran-1/base consolide
  EXPECT: RAIL OK 1/1
  EVIDENCE: automatic-evidence=v1; definition-sha256=e6d3dc24776f93ddadaee98ffc11248e062ffb28b576e1ca2d9094c982611f45; exit=0; EXPECT=matched; output-sha256=e48ea88c9935dc905dd3e04ef2d3663cc0b20bc9d886ddad1ed9eae108a7feb2; output-bytes=41; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: le témoin positif passe en mode parcours
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs work/refonte-frontend/v4/tournoi/outils/temoins rail-parcours-ok --page=etat.html --parcours
  EXPECT: RAIL OK 1/1
  EVIDENCE: automatic-evidence=v1; definition-sha256=97851c56102df5ffb1ecca966a203924cddeca0c628f9b0db8ab1a6c290605dd; exit=0; EXPECT=matched; output-sha256=e174feb7e842a50e900b540b24946e139e0becfacc3e5a4a7a34eb94a0c6acd9; output-bytes=153; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: des graduations au repos échouent par D47
  CHECK: node scripts/agents/systeme.mjs echoue D47 -- node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs work/refonte-frontend/v4/tournoi/outils/temoins rail-parcours-gradue --page=etat.html --parcours
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=c517f7f592c3eb78891dacbaae88cec56d324726be2a097e62b0cedf2ef0c61e; exit=0; EXPECT=matched; output-sha256=031a0d2ca62919c6a1e562daf2713d5ba75d15860e9ee9a2036e64882458b0ae; output-bytes=24; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: des pas de 10 minutes échouent par D34
  CHECK: node scripts/agents/systeme.mjs echoue D34 -- node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs work/refonte-frontend/v4/tournoi/outils/temoins rail-parcours-pas10 --page=etat.html --parcours
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=4d3205b94cf9735102681339f64bf480ecfac230a9cb8c0bb9095a2a91915d5d; exit=0; EXPECT=matched; output-sha256=6b5130befd076ca9b5540dbe867d9bb80be7afdf914a5f0ce6d6769af0aac51e; output-bytes=24; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: un rail sans loupe échoue par D63
  CHECK: node scripts/agents/systeme.mjs echoue D63 -- node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs work/refonte-frontend/v4/tournoi/outils/temoins rail-parcours-sans-loupe --page=etat.html --parcours
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=2b12c2d882d935a6e6d385aa4206d75176db93dbac0081daf766979e9f4bddf1; exit=0; EXPECT=matched; output-sha256=5a43d9811ec7cbd7a669590ea9a41db55eac43c65fa1265f50b629b607f174ff; output-bytes=24; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: une ombre au repos échoue par D42
  CHECK: node scripts/agents/systeme.mjs echoue D42 -- node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs work/refonte-frontend/v4/tournoi/outils/temoins rail-parcours-ombre --page=etat.html --parcours
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=01371baf46bae54fef7ca343315b787227eecb63c4bceb13257c4a4730dad26c; exit=0; EXPECT=matched; output-sha256=d52c8c18bdd94a3c0630fcf8b93448508c63e660fc09831bde7f206df1353397; output-bytes=24; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: un bout hors d'atteinte échoue par D69
  CHECK: node scripts/agents/systeme.mjs echoue D69 -- node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs work/refonte-frontend/v4/tournoi/outils/temoins rail-parcours-extreme --page=etat.html --parcours
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1907c12cb2432b838b6c89184f1764353dc6c145cff4865edd7aa1d15128456e; exit=0; EXPECT=matched; output-sha256=72c43fd2d52c6cff11b6990f2f1979e3f767389f7dd1cf2677d89d42d40b4f6a; output-bytes=24; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: une poignée qui saute échoue par D46
  CHECK: node scripts/agents/systeme.mjs echoue D46 -- node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs work/refonte-frontend/v4/tournoi/outils/temoins rail-parcours-saccade --page=etat.html --parcours
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=36328dcb30e5156b836537bcb47751910091b47f65a0af36db71821c62200f86; exit=0; EXPECT=matched; output-sha256=47e82115154d5ee3cd33fcfe611aa230d14187a31b84c9dd41967d37ba706132; output-bytes=24; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G9: les 22 plaintes sont classées dans la NOTE
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-controles-parcours/voies/c1-rail/NOTE.md --exiger "Règles" --contient "D27,D28,D34,D35,D36,D37,D41,D42,D43,D44,D45,D46,D47,D55,D56,D61,D63,D64,D67,D68,D69"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=0dfec684ec4a1cb812e81fb5e69def38ab3b3d0d96af53b33965803d807953f6; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G10: joué sur Ma bière et Dryhopper du parcours, il rend un verdict sans planter
  CHECK: node scripts/agents/systeme.mjs verdict -- node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs prototypes/houblons-v4/maquettes/parcours ma-biere dryhopper --page=etat.html --parcours
  EXPECT: /ma-biere · [\s\S]*dryhopper · [\s\S]*VERDICT (OK|ECHEC)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=3b4b6f69873914ba9bfc22a4fabed8c11145177d5df7d0c5c249f4075030e07c; exit=0; EXPECT=matched; output-sha256=aa3b80d73948542d0957010e31f23e9240e94c00528d9c50137a9074453de07b; output-bytes=1494; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G11: les défauts du parcours sont écrits pour les écrans
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-controles-parcours/voies/c1-rail/RESULTAT.md --exiger "Défauts du parcours"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=db23638646a73643649ea68d6bb4e265a71800d736b58bdad90c9696c7c8b39d; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G12: le câblage du système tient (pas d'OK 0/0, pas de caractère de contrôle)
  CHECK: node scripts/agents/systeme.mjs cablage
  EXPECT: CABLAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=5713fcbe8de744cefb76370244175b1a2dda328c030386acddcf0e090d0c4911; exit=0; EXPECT=matched; output-sha256=5ec18eb46548cd9619d98ce192a9c22635986ec66e4b705f9f65c00c6d173416; output-bytes=11; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [ ] G13: une frise verticale à plusieurs houblons (étape Houblons de la base v4.10, son choix) passe en mode parcours
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs work/refonte-frontend/v4/tournoi/outils/temoins rail-parcours-ok-vertical --page=etat.html --parcours
  EXPECT: RAIL OK 1/1
  EVIDENCE: pending

- [ ] G14: un houblon déjà posé qui saute de côté pendant le geste d'un autre échoue par D64
  CHECK: node scripts/agents/systeme.mjs echoue D64 -- node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs work/refonte-frontend/v4/tournoi/outils/temoins rail-parcours-saute --page=etat.html --parcours
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G15: deux textes du rail l'un sur l'autre, à deux houblons, échouent par D56
  CHECK: node scripts/agents/systeme.mjs echoue D56 -- node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs work/refonte-frontend/v4/tournoi/outils/temoins rail-parcours-deux-chevauchent --page=etat.html --parcours
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G16: un moment tenu qui remonte en descendant l'ébullition échoue par D61 bis
  CHECK: node scripts/agents/systeme.mjs echoue "D61 bis" -- node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs work/refonte-frontend/v4/tournoi/outils/temoins rail-parcours-remonte --page=etat.html --parcours
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G17: des graduations d'ébullition irrégulières échouent par D45
  CHECK: node scripts/agents/systeme.mjs echoue D45 -- node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs work/refonte-frontend/v4/tournoi/outils/temoins rail-parcours-irregulier --page=etat.html --parcours
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G18: la NOTE reclasse D45, D56, D61 bis et D64 pour un rail à plusieurs houblons
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-controles-parcours/voies/c1-rail/NOTE.md --exiger "Règles" --contient "plusieurs houblons,aria-orientation,rail-parcours-ok-vertical"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G19: un vide de plus de 80 px dans la frise verticale, au repos ou pendant le geste, échoue par D55
  CHECK: node scripts/agents/systeme.mjs echoue D55 -- node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs work/refonte-frontend/v4/tournoi/outils/temoins rail-parcours-vide --page=etat.html --parcours
  EXPECT: ECHOUE OK
  EVIDENCE: pending

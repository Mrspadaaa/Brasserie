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
  EVIDENCE: automatic-evidence=v1; definition-sha256=97851c56102df5ffb1ecca966a203924cddeca0c628f9b0db8ab1a6c290605dd; exit=0; EXPECT=matched; output-sha256=7c58eb5199ef28fba67fa6d12557b0e8abf5d012d3ce84275ec777e0b3686cec; output-bytes=314; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

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
  EVIDENCE: automatic-evidence=v1; definition-sha256=3b4b6f69873914ba9bfc22a4fabed8c11145177d5df7d0c5c249f4075030e07c; exit=0; EXPECT=matched; output-sha256=c90de091bad5cedf5c21eb107a3d48f6a4ab5a0a79eb8d09d3a9ce72a5030b47; output-bytes=633; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G11: les défauts du parcours sont écrits pour les écrans
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-controles-parcours/voies/c1-rail/RESULTAT.md --exiger "Défauts du parcours"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=db23638646a73643649ea68d6bb4e265a71800d736b58bdad90c9696c7c8b39d; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G12: le câblage du système tient (pas d'OK 0/0, pas de caractère de contrôle)
  CHECK: node scripts/agents/systeme.mjs cablage
  EXPECT: CABLAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=5713fcbe8de744cefb76370244175b1a2dda328c030386acddcf0e090d0c4911; exit=0; EXPECT=matched; output-sha256=5ec18eb46548cd9619d98ce192a9c22635986ec66e4b705f9f65c00c6d173416; output-bytes=11; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G13: une frise verticale à plusieurs houblons (étape Houblons de la base v4.10, son choix) passe en mode parcours
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs work/refonte-frontend/v4/tournoi/outils/temoins rail-parcours-ok-vertical --page=etat.html --parcours
  EXPECT: RAIL OK 1/1
  EVIDENCE: automatic-evidence=v1; definition-sha256=bb248ab4ce6503ead127ccfeb58ebd1e3fecfd8ff704a96daccf39ab235552f7; exit=0; EXPECT=matched; output-sha256=5e9fdf0b4a55b7b23558cb928217b18e27453071eda0873db4868187d7f79b7f; output-bytes=521; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G14: un houblon déjà posé qui saute de côté pendant le geste d'un autre échoue par D64
  CHECK: node scripts/agents/systeme.mjs echoue D64 -- node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs work/refonte-frontend/v4/tournoi/outils/temoins rail-parcours-saute --page=etat.html --parcours
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a44aa9e4bd92f1361592e12351c59754c697a4c5ba010ebe0b0125fe46fa0868; exit=0; EXPECT=matched; output-sha256=0a8e4c83be11570d8ac4caba9961216814c0e01ebbc0131f0471377d6278d195; output-bytes=24; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G15: deux textes du rail l'un sur l'autre, à deux houblons, échouent par D56
  CHECK: node scripts/agents/systeme.mjs echoue D56 -- node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs work/refonte-frontend/v4/tournoi/outils/temoins rail-parcours-deux-chevauchent --page=etat.html --parcours
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=2b1112c0bab15c1599420dbf37745bdc4d5287ddede7dd6ad8bea1f359fcb631; exit=0; EXPECT=matched; output-sha256=88909bfecd074f77bd1a37e0b2d9e4ff6cbbfae66c7e503c79e04e9480456cde; output-bytes=24; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G16: un moment tenu qui remonte en descendant l'ébullition échoue par D61 bis
  CHECK: node scripts/agents/systeme.mjs echoue "D61 bis" -- node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs work/refonte-frontend/v4/tournoi/outils/temoins rail-parcours-remonte --page=etat.html --parcours
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=b0d14f463f46a30fc7be4954dffa15bfc169f2ce1b45d7fa545551f541812988; exit=0; EXPECT=matched; output-sha256=23b63b8c07df4092ecd5b97aadf6aaabc8da2240ce5039c172cfffe277aca677; output-bytes=28; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G17: des graduations d'ébullition irrégulières échouent par D45
  CHECK: node scripts/agents/systeme.mjs echoue D45 -- node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs work/refonte-frontend/v4/tournoi/outils/temoins rail-parcours-irregulier --page=etat.html --parcours
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=4b4078a46c90e32567bea89940d267b5217ca0702603f94d7e16d4d17e031b5b; exit=0; EXPECT=matched; output-sha256=a26dd3425d0917183aac76a7dda7a27a95bbdc9fb64ad39a36dee91d9a1be01b; output-bytes=24; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G18: la NOTE reclasse D45, D56, D61 bis et D64 pour un rail à plusieurs houblons
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-controles-parcours/voies/c1-rail/NOTE.md --exiger "Règles" --contient "plusieurs houblons,aria-orientation,rail-parcours-ok-vertical"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=32656dfc3ba87c731b89032f98530a7d0ed45d37d333471730f1ecf36a04b9a0; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G19: un vide de plus de 80 px dans la frise verticale, au repos ou pendant le geste, échoue par D55
  CHECK: node scripts/agents/systeme.mjs echoue D55 -- node work/refonte-frontend/v4/tournoi/outils/controle-rail.mjs work/refonte-frontend/v4/tournoi/outils/temoins rail-parcours-vide --page=etat.html --parcours
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=49281a5c319c87c1a6450a9a93fc3dc937e52b37ee118941fbfd74e88ded7968; exit=0; EXPECT=matched; output-sha256=02d1a265a65d497db8438aed90e5874d5926bed502012e1cca3400446b6e319b; output-bytes=24; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

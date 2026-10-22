# Gates: voie r6b-trois-radars — Un radar par houblon

OWNS: work/refonte-frontend/v4/ecran-1/fils22-comparer/r6b/**, work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6b-*.png, work/missions/2026-10-22-reprise-lot21/voies/r6b-trois-radars/RESULTAT.md

Scope: une mini maquette de Comparer (lot 22) qui ne laisse libre que la variété, porte les quatre acquis et les choix Radar : r3 ; Base : dose égale ; Porte : non ; Descripteurs : B.

- [x] G1: les exigences de toute l'app tiennent (MOTS joué à part, à 80)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6b --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1d20d0bda5fad2b4e99800c34de66c7465e7282753e77bf7c4982f250050fd8d; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6b --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=246fec708621ec3f87639a1fa2d306009dad868f834325df3e6f29e34b723720; exit=0; EXPECT=matched; output-sha256=49894bbada961c91b3393f199c1c1856d2af7b73069ec429fdf8badb37710e70; output-bytes=20; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: un seul facteur libre, la variété (D98)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6b --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : houblon\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=b6c62f7866f699a15cbc9d0fdbb64716a1e8e243529c8e5ffdbe90f2a67b66cd; exit=0; EXPECT=matched; output-sha256=4d5314c28869b26831e0084962a1b9fb57f4f7bf912b658276db8a89d02fb8e1; output-bytes=179; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les quatre acquis sont là (D99)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6b --page=etat.html
  EXPECT: ACQUIS OK (4/4
  EVIDENCE: automatic-evidence=v1; definition-sha256=1dbf55c7c2cda2850761df387f949bdba93cd6799f989e362adfd5b9b4f8618c; exit=0; EXPECT=matched; output-sha256=567e94febae5b354c726233038c867ce42553489348300fece3df30447f736a4; output-bytes=144; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: l'α de chaque houblon, sourcé (D87)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-alpha.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6b --page=etat.html
  EXPECT: ALPHA OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=4e7d6ae38bef2b88e5684df649c1a31d0f7fadd211ee907b8a7a911a7a801e93; exit=0; EXPECT=matched; output-sha256=1414e7c250c25e3d8015e5ea23d0c521ded3feb24624f82eda06c73ccda5d857; output-bytes=42; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: option B : la part « autres » se voit au seuil proposé de 25 % (D100)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-sans-famille.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6b --page=etat.html --seuil=0.25
  EXPECT: /SANS-FAMILLE OK \([1-9]/
  EVIDENCE: automatic-evidence=v1; definition-sha256=a9dbb34dd151027b91131090988e7493401b68960ede62bf3d52b3285517124e; exit=0; EXPECT=matched; output-sha256=02e5115e1e0620c043922cd09838ef0967d2a6d8b61ba499f14579f2723773ce; output-bytes=149; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: page, générateur, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils22-comparer/r6b/etat.html work/refonte-frontend/v4/ecran-1/fils22-comparer/r6b/generer.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer/r6b/NOTE.md work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6b-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6b-premier-ecran.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6b-fiche-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6b-toucher-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=ff249f56b582752bffddfb9c56c79a609d42f563b0c12052562b7cccbe5a0d35; exit=0; EXPECT=matched; output-sha256=3156347a759048d840ab56a5d7c1806edb556ccf6a0825499f2641c077c25bd9; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: la NOTE dit les choix que la variante porte
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils22-comparer/r6b/NOTE.md --contient "Choix portés,Radar : r3,Base : dose égale,Porte : non,Descripteurs : B"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=5038008348669519b969e41f9b2866fb8dd098045c0954fd3b3f95416de9fc11; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G9: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r6b-trois-radars/RESULTAT.md --contient "r6b-390.png,r6b-premier-ecran.png,r6b-fiche-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a42dbbe963268b2a786b4e9c4a71a861796f4b5f510d50eadeddff09ff995c3f; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

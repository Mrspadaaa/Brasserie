# Gates: voie r6c-podium-agrumes — Le podium des agrumes

OWNS: work/refonte-frontend/v4/ecran-1/fils22-comparer/r6c/**, work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6c-*.png, work/missions/2026-10-22-reprise-lot21/voies/r6c-podium-agrumes/RESULTAT.md

Scope: une mini maquette de Comparer (lot 22) qui ne laisse libre que la variété, porte les quatre acquis et les choix Radar : r2 ; Base : effet égal (agrumes) ; Porte : non ; Descripteurs : A.

- [x] G1: les exigences de toute l'app tiennent (MOTS joué à part, à 80)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6c --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=ac726517779c2a6fa7a3d7da1c32993583529d6dc2893821bb52cefdd02168ed; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6c --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1972fb48570c6c240370a2ed36f86ee2d20a3db8ab5a5e2c60374a61e16a61da; exit=0; EXPECT=matched; output-sha256=f3c092813fff55283eb944bd8e066bab75d1bcd912521a4b2190bf9fedcbbc12; output-bytes=20; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: un seul facteur libre, la variété (D98)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6c --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : houblon\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=de43f775d697df54c0ae9e9b51b54397bcd8423401bea7576c130582555d4a45; exit=0; EXPECT=matched; output-sha256=dac2f78ec44262d2dc502600072557dc9ab5d2f8ff9a7a25deafefa0f23525fd; output-bytes=166; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les quatre acquis sont là (D99)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6c --page=etat.html
  EXPECT: ACQUIS OK (4/4
  EVIDENCE: automatic-evidence=v1; definition-sha256=da5d6fef5cf93bd21ef82b76390696ab32736636c83175e8af1158e34d383892; exit=0; EXPECT=matched; output-sha256=b82a26469c34235ce852ee2049092e4d7f3a5a966b5579649655c6a718db9862; output-bytes=136; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: l'α de chaque houblon, sourcé (D87)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-alpha.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6c --page=etat.html
  EXPECT: ALPHA OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=60c87e09f3b03a980e4289bedcaa5e2cea721041132705e2e1e4a6e9a791e7da; exit=0; EXPECT=matched; output-sha256=13a2d01053df324a271e5de8142a857c570c2da6bbc58b0fc58697c5ba4a8dfa; output-bytes=42; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: page, générateur, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils22-comparer/r6c/etat.html work/refonte-frontend/v4/ecran-1/fils22-comparer/r6c/generer.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer/r6c/NOTE.md work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6c-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6c-premier-ecran.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6c-fiche-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6c-toucher-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a79143ae018a23bc1fcb6026b9fed7ca44b57fa01430705f604c3c4ee1daf720; exit=0; EXPECT=matched; output-sha256=3156347a759048d840ab56a5d7c1806edb556ccf6a0825499f2641c077c25bd9; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: la NOTE dit les choix que la variante porte
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils22-comparer/r6c/NOTE.md --contient "Choix portés,Radar : r2,Base : effet égal (agrumes),Porte : non,Descripteurs : A"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=05c23dd2a6fb5a505bc79d28349c77ee246de17849144e9829515ac627ec3aaa; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r6c-podium-agrumes/RESULTAT.md --contient "r6c-390.png,r6c-premier-ecran.png,r6c-fiche-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=9abc3003d680d9e97e34ffdd2a760164f524114de0e2524851118e45ab88c06d; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

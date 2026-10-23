# Gates: voie p6-critique — l'avis du critique sur le parcours

OWNS: work/missions/2026-10-23-maquette-parcours/voies/p6-critique/RESULTAT.md

Scope: un avis par écran de la maquette jouable, en défauts vérifiables, chaque rejet appuyé sur SPEC ou DEFAUTS.

- [x] G1: un avis pour chacun des sept écrans
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p6-critique/RESULTAT.md --contient "ma-biere :,fiche :,suggerer :,comparer :,dryhopper :,levure :,substituer :"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=0f310d4f796f4888fe2578340511f359d6a900914e24fd9118b7db030616afe6; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: l'avis porte sur les captures du parcours aux deux largeurs
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p6-critique/RESULTAT.md --contient "-390.png,-1280.png,r6a"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=8c7b5bf38b678e8f8ad22225796515fa7ac8292341c2b06d7a8c11e45e6ffdd5; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [ ] G3: un avis par écran sur la version D107 à D121, côte à côte, et une ligne par défaut
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p6-critique/RESULTAT.md --contient "## Version D107 à D121,ma-biere :,biere :,fiche :,suggerer :,comparer :,dryhopper :,levure :,substituer :,D107 :,D108 :,D110 :,D111 :,D114 :,D115 :,D116 :,D117 :,D119 :,D120 :,D121 :,-base.png"
  EXPECT: NOTE OK
  EVIDENCE: pending

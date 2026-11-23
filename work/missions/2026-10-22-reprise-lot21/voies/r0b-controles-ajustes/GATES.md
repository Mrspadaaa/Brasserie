# Gates: voie r0b-controles-ajustes — D99 « à un toucher » et radar r3, D100 à seuil réglable

OWNS: work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs, work/refonte-frontend/v4/tournoi/outils/controle-sans-famille.mjs, work/refonte-frontend/v4/tournoi/outils/temoins/acquis-toucher-ok/etat.html, work/refonte-frontend/v4/tournoi/outils/temoins/acquis-deux-touchers/etat.html, work/refonte-frontend/v4/tournoi/outils/temoins/sans-famille-seuil-ok/etat.html, work/refonte-frontend/v4/tournoi/outils/temoins/sans-famille-seuil-ko/etat.html, work/missions/2026-10-22-reprise-lot21/voies/r0b-controles-ajustes/RESULTAT.md

Scope: D99 admet un acquis à un toucher et le radar r3 ; D100 prend un seuil ; témoins positifs et négatifs.

- [x] G1: D99 passe sur un acquis à un toucher et un radar r3
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/tournoi/outils/temoins acquis-toucher-ok --page=etat.html
  EXPECT: ACQUIS OK (4/4
  EVIDENCE: automatic-evidence=v1; definition-sha256=44a1c31e7fa06b12ee14ccc3071801a5063d2e209dc3456c849c1da3d690f7f4; exit=0; EXPECT=matched; output-sha256=bba1ec71769c3fcbf53e694b7487a5ab9a27656c8b185cb7bb563dd3c5b3fb63; output-bytes=158; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: D99 échoue sur des valeurs cachées derrière deux touchers
  CHECK: node scripts/agents/systeme.mjs echoue "ACQUIS ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/tournoi/outils/temoins acquis-deux-touchers --page=etat.html
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=95926f56d1944c50508f2b0f10095119e05cc0661ac34c04196b6bcff4d106aa; exit=0; EXPECT=matched; output-sha256=2237192c592d499f5134c6f1edc55c93323a4c85fdc58f993ac955e31d7dfcb0; output-bytes=33; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: D99 échoue toujours sur y3 (pas de radar), même en ouvrant d'un toucher
  CHECK: node scripts/agents/systeme.mjs echoue "ACQUIS ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/ecran-1/fils21-choisir y3 --page=etat.html
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=f1773943acd79fb38aa1521410608d56049b609e82c6abde86b257959a2953f0; exit=0; EXPECT=matched; output-sha256=2237192c592d499f5134c6f1edc55c93323a4c85fdc58f993ac955e31d7dfcb0; output-bytes=33; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: D100 à seuil 25 % passe quand Galaxy (40 %) montre sa part « autres »
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-sans-famille.mjs work/refonte-frontend/v4/tournoi/outils/temoins sans-famille-seuil-ok --page=etat.html --seuil=0.25
  EXPECT: /SANS-FAMILLE OK \(1 houblon\(s\) au-dessus de 25 %/
  EVIDENCE: automatic-evidence=v1; definition-sha256=1452eecc8660819b9945c0518efbd7d51fe1e672b18e0322af6d3d2470da83c5; exit=0; EXPECT=matched; output-sha256=43afddc44f9176521761b1b878645b7def178e3dc1dbc3d1cd4d0ec0337e3664; output-bytes=167; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: D100 à seuil 25 % échoue quand la part « autres » manque
  CHECK: node scripts/agents/systeme.mjs echoue "SANS-FAMILLE ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-sans-famille.mjs work/refonte-frontend/v4/tournoi/outils/temoins sans-famille-seuil-ko --page=etat.html --seuil=0.25
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=bfca35dfa1ebc18a17cf02c49609604169749c774e63519c8d0f321163ad113c; exit=0; EXPECT=matched; output-sha256=bc9b4a26d2adaa325b5ff78a0d223f8b84493862883b82f4a5251424cc00b686; output-bytes=39; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: au seuil par défaut (50 %), la même page ne juge aucun houblon : c'est bien le seuil qui travaille
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-sans-famille.mjs work/refonte-frontend/v4/tournoi/outils/temoins sans-famille-seuil-ko --page=etat.html
  EXPECT: /SANS-FAMILLE OK \(0 houblon\(s\) au-dessus de 50 %/
  EVIDENCE: automatic-evidence=v1; definition-sha256=b18f5fce0618a4b6aebf9256617cf1f67426423db02822e549d9be67e6293db4; exit=0; EXPECT=matched; output-sha256=dad2dc2e73892b3c5eb4ff592e7493a8cc8a3514e5626db5098630e5c050857c; output-bytes=147; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: D100 échoue toujours sur l5f au seuil par défaut
  CHECK: node scripts/agents/systeme.mjs echoue "SANS-FAMILLE ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-sans-famille.mjs work/refonte-frontend/v4/ecran-1/fils18-baseline l5f --page=etat-b.html
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=22e8fb130c8cf43fa9fae7b12b0235b101e12e83632ad683a7e6af125483e626; exit=0; EXPECT=matched; output-sha256=bc9b4a26d2adaa325b5ff78a0d223f8b84493862883b82f4a5251424cc00b686; output-bytes=39; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

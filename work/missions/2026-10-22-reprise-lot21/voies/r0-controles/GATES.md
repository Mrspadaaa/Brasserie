# Gates: voie r0-controles — trois contrôles nés des plaintes du lot 21

OWNS: work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs, work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs, work/refonte-frontend/v4/tournoi/outils/controle-sans-famille.mjs, work/refonte-frontend/v4/tournoi/outils/temoins/une-question-ok/etat.html, work/refonte-frontend/v4/tournoi/outils/temoins/acquis-ok/etat.html, work/refonte-frontend/v4/tournoi/outils/temoins/sans-famille-ok/etat.html, work/missions/2026-10-22-reprise-lot21/voies/r0-controles/RESULTAT.md

Scope: trois contrôles au rendu (L10, L06, L14), en échec sur leurs témoins négatifs réels et en réussite sur un témoin positif.

- [x] G1: L10 échoue sur y1b (houblon, dose et levure libres)
  CHECK: node scripts/agents/systeme.mjs echoue "UNE-QUESTION ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils21-choisir y1b --page=etat.html
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=70f076e39676ec728ba5808321876e435b805d20a8f100325261f75b02004e3a; exit=0; EXPECT=matched; output-sha256=6ae0a22da14626bce8b58ae2d608b19d0b9d1034711659b03741cc74fe73b9f5; output-bytes=39; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: L10 échoue sur y3
  CHECK: node scripts/agents/systeme.mjs echoue "UNE-QUESTION ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils21-choisir y3 --page=etat.html
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=7eadd5991f59315079717a964e4ed2bb6ee424a4b02cd179a0f0a862e5988738; exit=0; EXPECT=matched; output-sha256=6ae0a22da14626bce8b58ae2d608b19d0b9d1034711659b03741cc74fe73b9f5; output-bytes=39; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: L10 passe sur son témoin positif, avec un seul groupe libre
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/tournoi/outils/temoins une-question-ok --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : /
  EVIDENCE: automatic-evidence=v1; definition-sha256=631b4689c870810f8a7efef9d8bcf4ff4e943509b06229fa0ef9644f7dfee713; exit=0; EXPECT=matched; output-sha256=e33a28484c82249d0bca80dacd48ec2aa72adbc12e27d897165ef94c2b0126ac; output-bytes=190; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: L06 échoue sur y3 (panel OSU sans radar)
  CHECK: node scripts/agents/systeme.mjs echoue "ACQUIS ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/ecran-1/fils21-choisir y3 --page=etat.html
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=f1773943acd79fb38aa1521410608d56049b609e82c6abde86b257959a2953f0; exit=0; EXPECT=matched; output-sha256=2237192c592d499f5134c6f1edc55c93323a4c85fdc58f993ac955e31d7dfcb0; output-bytes=33; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: L06 échoue sur y1b
  CHECK: node scripts/agents/systeme.mjs echoue "ACQUIS ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/ecran-1/fils21-choisir y1b --page=etat.html
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=8391c3e55d6f5a0e6f815e2d8ada18a0639070a4ec59e71dcd8e447df2bfa363; exit=0; EXPECT=matched; output-sha256=2237192c592d499f5134c6f1edc55c93323a4c85fdc58f993ac955e31d7dfcb0; output-bytes=33; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: L06 passe sur son témoin positif, avec les quatre acquis
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/tournoi/outils/temoins acquis-ok --page=etat.html
  EXPECT: ACQUIS OK (4/4
  EVIDENCE: automatic-evidence=v1; definition-sha256=6e9ba44fdee689d0714d6dcdccc0ba104f297284088d0a6b2d9c2a8953ed146b; exit=0; EXPECT=matched; output-sha256=4fc267b4df72cbfcaafc2846244145310870bdc809bbe854deb7279c274760f7; output-bytes=137; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: L14 échoue sur l5f (Nelson Sauvin à 83 % sans part « autres »)
  CHECK: node scripts/agents/systeme.mjs echoue "SANS-FAMILLE ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-sans-famille.mjs work/refonte-frontend/v4/ecran-1/fils18-baseline l5f --page=etat-b.html
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=22e8fb130c8cf43fa9fae7b12b0235b101e12e83632ad683a7e6af125483e626; exit=0; EXPECT=matched; output-sha256=bc9b4a26d2adaa325b5ff78a0d223f8b84493862883b82f4a5251424cc00b686; output-bytes=39; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: L14 passe sur son témoin positif, avec au moins un houblon au-dessus de 50 %
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-sans-famille.mjs work/refonte-frontend/v4/tournoi/outils/temoins sans-famille-ok --page=etat.html
  EXPECT: /SANS-FAMILLE OK \([1-9]/
  EVIDENCE: automatic-evidence=v1; definition-sha256=56685a75504dcb99ab0e99fa4c4695513d382b9a8563cf705a34f61e9903e708; exit=0; EXPECT=matched; output-sha256=fcd70073e31f6c7ba1ca0fe7cb2754424e3ea1b0e677575e197e26b289f97939; output-bytes=194; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

# Gates: voie r0d-controles-dryhopper — les contrôles de la passe 2 de Dryhopper

OWNS: work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs, work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs, work/refonte-frontend/v4/tournoi/outils/temoins/dryhopper-*/**, work/refonte-frontend/v4/tournoi/outils/temoins/une-question-edition-*/**, work/missions/2026-10-22-reprise-lot21/voies/r0d-controles-dryhopper/RESULTAT.md

Scope: acquis de Dryhopper (--outil=dryhopper), D98 (b) (--edition), data-libre sur le curseur lui-même ; témoins neufs ; anciens témoins et vraies pages inchangés.

- [x] G1: non-régression : le témoin positif de D98 passe toujours
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/tournoi/outils/temoins une-question-ok --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : houblon\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=5228b649e2919d3713ee1b47ca8a74b0658752d2607d47a86daa7fbe857b99f1; exit=0; EXPECT=matched; output-sha256=e33a28484c82249d0bca80dacd48ec2aa72adbc12e27d897165ef94c2b0126ac; output-bytes=190; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: non-régression : y1b échoue toujours à D98 (règle stricte)
  CHECK: node scripts/agents/systeme.mjs echoue "UNE-QUESTION ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils21-choisir y1b --page=etat.html
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=70f076e39676ec728ba5808321876e435b805d20a8f100325261f75b02004e3a; exit=0; EXPECT=matched; output-sha256=6ae0a22da14626bce8b58ae2d608b19d0b9d1034711659b03741cc74fe73b9f5; output-bytes=39; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: non-régression : les acquis de Comparer (r6n1) passent toujours
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6n1 --page=etat.html
  EXPECT: ACQUIS OK (4/4
  EVIDENCE: automatic-evidence=v1; definition-sha256=e8dd248e1cad3fb12cd52604d51fdd4b9458cf458e6327702dead378687453c6; exit=0; EXPECT=matched; output-sha256=bbe138bc5535ecd4f1836d4c9d4529bff2b794115432619b5e0ba1ec6f70addd; output-bytes=142; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: non-régression : deux touchers échouent toujours (D99)
  CHECK: node scripts/agents/systeme.mjs echoue "ACQUIS ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/tournoi/outils/temoins acquis-deux-touchers --page=etat.html
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=95926f56d1944c50508f2b0f10095119e05cc0661ac34c04196b6bcff4d106aa; exit=0; EXPECT=matched; output-sha256=2237192c592d499f5134c6f1edc55c93323a4c85fdc58f993ac955e31d7dfcb0; output-bytes=33; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: acquis de Dryhopper : le témoin positif passe
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/tournoi/outils/temoins dryhopper-acquis-ok --page=etat.html --outil=dryhopper
  EXPECT: ACQUIS OK (4/4 : geste, frise, valeurs, levure)
  EVIDENCE: automatic-evidence=v1; definition-sha256=47f39c7e3e38c313471be74cd1fc255277b7b5ff63b6da3817bfd38bb78038a5; exit=0; EXPECT=matched; output-sha256=4782d928d25412d9da06646630ea30c7f8e2d2d1abc90f4fdb242abaa65c3b5b; output-bytes=151; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: acquis de Dryhopper : un témoin sans frise échoue
  CHECK: node scripts/agents/systeme.mjs echoue "ACQUIS ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/tournoi/outils/temoins dryhopper-acquis-sans-frise --page=etat.html --outil=dryhopper
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=e0cdfedef42cd174ff4f61bb653478b5d57dd87b3a346afcda143092a1dc341a; exit=0; EXPECT=matched; output-sha256=2237192c592d499f5134c6f1edc55c93323a4c85fdc58f993ac955e31d7dfcb0; output-bytes=33; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: D98 (b) : un bouton d'édition par facteur de contexte, ouvert en feuille, passe avec --edition
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/tournoi/outils/temoins une-question-edition-ok --page=etat.html --edition
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : moment\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=5b3537f781b7f60265b5bf2e805fc3d7211bd285d4bb338318752c07e3b860c7; exit=0; EXPECT=matched; output-sha256=4366fcb7f884430483d1fd0c84aae2415ef7e9c476896e3c559d7638ef0192c0; output-bytes=184; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: D98 (b) : deux contrôles pour un même facteur de contexte échouent
  CHECK: node scripts/agents/systeme.mjs echoue "UNE-QUESTION ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/tournoi/outils/temoins une-question-edition-ko --page=etat.html --edition
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=737ea15d73c92803a63fcb281e84bb15dce0ed943a413d6bd5fe3095d7fc157f; exit=0; EXPECT=matched; output-sha256=6ae0a22da14626bce8b58ae2d608b19d0b9d1034711659b03741cc74fe73b9f5; output-bytes=39; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G9: D98 (b) : sans --edition, le même témoin positif échoue (règle stricte gardée)
  CHECK: node scripts/agents/systeme.mjs echoue "UNE-QUESTION ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/tournoi/outils/temoins une-question-edition-ok --page=etat.html
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=e760c5f8e344d9ff91ce0612abc5d8d30918603f6ef6bd2f834a01bd93093865; exit=0; EXPECT=matched; output-sha256=6ae0a22da14626bce8b58ae2d608b19d0b9d1034711659b03741cc74fe73b9f5; output-bytes=39; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G10: data-libre posé sur le curseur lui-même compte ses crans
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/tournoi/outils/temoins dryhopper-curseur-ok --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : moment\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=b91b0c7631374391d570688e795932109ce475cfe64e58d54d1be7813227c50f; exit=0; EXPECT=matched; output-sha256=1c5378975528a02649bec0422b937281705163f8f4c3cd75e0a76b1a137990ca; output-bytes=181; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G11: non-régression : les concepts de Dryhopper passent toujours D98
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e e1 e2 e3 e4 --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : moment\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=fe51b9c8ce6b6cabe06ad15e0ac546f197003417cf198c417da8de57dd6b7177; exit=0; EXPECT=matched; output-sha256=25727f0598d7f3d64a7882643239162ae4193cb39427a82b61bb7eb9e42e8da7; output-bytes=526; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G12: aucun caractère de contrôle dans les scripts (M10)
  CHECK: node scripts/agents/systeme.mjs cablage
  EXPECT: CABLAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=5713fcbe8de744cefb76370244175b1a2dda328c030386acddcf0e090d0c4911; exit=0; EXPECT=matched; output-sha256=5ec18eb46548cd9619d98ce192a9c22635986ec66e4b705f9f65c00c6d173416; output-bytes=11; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G13: le rapport est complet
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r0d-controles-dryhopper/RESULTAT.md --contient "ACQUIS OK,--edition,--outil=dryhopper,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=9ab3de444476d3b9712744c1c6419b825c85dd5add41fd408192f9b0be43a44d; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

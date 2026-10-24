# Gates: voie p9-controle-etapes — le contrôle D107 et ses témoins

OWNS: work/refonte-frontend/v4/tournoi/outils/controle-comparer-etapes.mjs, work/refonte-frontend/v4/tournoi/outils/temoins/comparer-etapes-*/**, work/missions/2026-10-23-maquette-parcours/voies/p9-controle-etapes/RESULTAT.md

Scope: un contrôle qui exige, sur Comparer, les valeurs de chaque houblon à 60′, 10′ et au dry hop, visibles ensemble, et une référence aux mêmes étapes ; il échoue sur la version publiée (d332792c).

- [x] G1: le contrôle échoue sur la construction rejetée d332792c (un seul moment)
  CHECK: node scripts/agents/systeme.mjs echoue "COMPARER-ETAPES ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-comparer-etapes.mjs prototypes/houblons-v4/maquettes/parcours-d332792c
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=b8ca90d287c96d89ac9223d2348af43839b2c9d843b97ec9fccf52ce9b7872be; exit=0; EXPECT=matched; output-sha256=5dbc25f053e51c391f6be600c0d6648bc62338cebe2b0d30fdcbe08ed78a34fe; output-bytes=42; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: le témoin positif passe, aux deux largeurs
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-comparer-etapes.mjs work/refonte-frontend/v4/tournoi/outils/temoins/comparer-etapes-ok
  EXPECT: COMPARER-ETAPES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=241c839554440ab012f5d63b5756c9072cfbb4e8d13c11f2ede9fdfe8426a10f; exit=0; EXPECT=matched; output-sha256=9d63081814ba6b86fd6e98f6b5cc751a21c9832fe6e6bb05a69a4bd3cdf28ab1; output-bytes=467; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2b: le témoin positif avec le houblon de la recette en référence passe
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-comparer-etapes.mjs work/refonte-frontend/v4/tournoi/outils/temoins/comparer-etapes-ok-houblon
  EXPECT: COMPARER-ETAPES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=87e7b10368b49e6b04ad101bc9cc89e7c568ea9297b0c4f4ae33c2ec9d80a22b; exit=0; EXPECT=matched; output-sha256=239887fcb3ef4a9fdcb7ba48fb05243203fbb6484c17e53beb351c6fa93ca283; output-bytes=509; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: le témoin à un seul moment échoue
  CHECK: node scripts/agents/systeme.mjs echoue "COMPARER-ETAPES ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-comparer-etapes.mjs work/refonte-frontend/v4/tournoi/outils/temoins/comparer-etapes-un-moment
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=71e12d82b83ae05929c1e3536a259e13d8a0ddaa4cad32c59a5551606d84e56a; exit=0; EXPECT=matched; output-sha256=5dbc25f053e51c391f6be600c0d6648bc62338cebe2b0d30fdcbe08ed78a34fe; output-bytes=42; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: le dry hop caché derrière un toucher échoue
  CHECK: node scripts/agents/systeme.mjs echoue "COMPARER-ETAPES ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-comparer-etapes.mjs work/refonte-frontend/v4/tournoi/outils/temoins/comparer-etapes-cache
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=46156f610a50b315838314955c430e02e9e69654dfae1f0f5592bb25a9fd26b2; exit=0; EXPECT=matched; output-sha256=5dbc25f053e51c391f6be600c0d6648bc62338cebe2b0d30fdcbe08ed78a34fe; output-bytes=42; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: les étapes sans référence échouent
  CHECK: node scripts/agents/systeme.mjs echoue "COMPARER-ETAPES ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-comparer-etapes.mjs work/refonte-frontend/v4/tournoi/outils/temoins/comparer-etapes-sans-reference
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=29d30a724689d9512a8b480e2d9629792b93779a61efdba1ed9bddc8cad39246; exit=0; EXPECT=matched; output-sha256=5dbc25f053e51c391f6be600c0d6648bc62338cebe2b0d30fdcbe08ed78a34fe; output-bytes=42; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: les étapes sur deux écrans échouent
  CHECK: node scripts/agents/systeme.mjs echoue "COMPARER-ETAPES ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-comparer-etapes.mjs work/refonte-frontend/v4/tournoi/outils/temoins/comparer-etapes-trop-haut
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=229f39949e1d69d3ad075236e7ba8c7fad8afd683822e84a35d7a71d468f5567; exit=0; EXPECT=matched; output-sha256=5dbc25f053e51c391f6be600c0d6648bc62338cebe2b0d30fdcbe08ed78a34fe; output-bytes=42; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: D107 est dans la portée des défauts, gardé, sur Comparer
  CHECK: node -e "const p=require('./work/refonte-frontend/v4/tournoi/outils/portee-defauts.json');const d=p.defauts.find(x=>x.id==='D107');if(!d||d.verdict!=='garde'||d.tourne!=='oui'||!d.portee.includes('comparer')||d.script!=='controle-comparer-etapes.mjs'){console.log('PORTEE ECHEC');process.exit(1)}console.log('PORTEE OK')"
  EXPECT: PORTEE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=409e4cbfd0c73afb1486d0b9b5db3e493001f55198353a1c8aa477fe0a0d2a91; exit=0; EXPECT=matched; output-sha256=1812cb74b426905949893119c1eb3f66773036cdf500a13bf881ef86663fe91b; output-bytes=10; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: les témoins du système tiennent toujours
  CHECK: node scripts/agents/systeme.mjs temoins
  EXPECT: TEMOINS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1eb6e5d347a145baa08fdc3f609ab02c9fc05a91fd07b0a610b551cac1c25510; exit=0; EXPECT=matched; output-sha256=93822630816dc5de9c6d3af8b198315777d02cdc0d13b9bfc038553f4946a27d; output-bytes=3572; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G9: le rapport donne les sorties sur d332792c et les témoins
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p9-controle-etapes/RESULTAT.md --contient "d332792c,comparer-etapes-ok,comparer-etapes-un-moment,comparer-etapes-cache,comparer-etapes-sans-reference,comparer-etapes-trop-haut"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=3e81f01897f72224afc342e7d4efd6938922b83802cbcb4882bf9677aac6232a; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G10: le panel OSU au premier écran, titre gras, échoue (D114)
  CHECK: node scripts/agents/systeme.mjs echoue "COMPARER-ETAPES ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-comparer-etapes.mjs work/refonte-frontend/v4/tournoi/outils/temoins/comparer-etapes-panel-haut
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=9bea78217618fce8a6aca0ad33eefc18547492755cb0e6e0c25f84b6e9d9eb9f; exit=0; EXPECT=matched; output-sha256=5dbc25f053e51c391f6be600c0d6648bc62338cebe2b0d30fdcbe08ed78a34fe; output-bytes=42; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

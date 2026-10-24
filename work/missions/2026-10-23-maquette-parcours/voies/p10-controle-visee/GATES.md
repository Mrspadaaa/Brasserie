# Gates: voie p10-controle-visee — le contrôle D108 et ses témoins

OWNS: work/refonte-frontend/v4/tournoi/outils/controle-visee.mjs, work/refonte-frontend/v4/tournoi/outils/temoins/visee-*/**, work/missions/2026-10-23-maquette-parcours/voies/p10-controle-visee/RESULTAT.md

Scope: un contrôle joué qui exige que « + », « − », « × » et « bannir » de Ma bière se dessinent sur la piste de la famille, comme sa base v4.10 ; il échoue sur la version publiée (d332792c).

- [x] G1: le contrôle échoue sur la construction rejetée d332792c (piste inchangée)
  CHECK: node scripts/agents/systeme.mjs echoue "VISEE ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-visee.mjs prototypes/houblons-v4/maquettes/parcours-d332792c
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=7bb795b1cbae0a9c4726feab2d1644eb4e0997b904ac71ee773a87f1986bb47b; exit=0; EXPECT=matched; output-sha256=9e404a6d5bba66ca32edf76244545c2d3f4e867b5625d2bafbd9ca0e60c240c1; output-bytes=32; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: sa base v4.10, balisée, passe
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-visee.mjs work/refonte-frontend/v4/tournoi/outils/temoins/visee-base
  EXPECT: VISEE OK (6/6
  EVIDENCE: automatic-evidence=v1; definition-sha256=ed6dabd7fe2f6a5caed42dba73aa8a357d0e5e6524c6024081317d125be9daf8; exit=0; EXPECT=matched; output-sha256=65abf475b67a9deabcb426471378adc4cc801e37f37279ec11ee074cae1295f7; output-bytes=341; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: la visée qui ne change que le mot échoue
  CHECK: node scripts/agents/systeme.mjs echoue "VISEE ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-visee.mjs work/refonte-frontend/v4/tournoi/outils/temoins/visee-sans-trace
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=f2ca197da6d1236d81e6b83d87661e41dc27ef7abc90604043e09a580cbcd6ce; exit=0; EXPECT=matched; output-sha256=9e404a6d5bba66ca32edf76244545c2d3f4e867b5625d2bafbd9ca0e60c240c1; output-bytes=32; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: le losange du mauvais côté échoue
  CHECK: node scripts/agents/systeme.mjs echoue "VISEE ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-visee.mjs work/refonte-frontend/v4/tournoi/outils/temoins/visee-mauvais-cote
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=f90c62db0251efffed280d9b357cbdd9d54da654839fcf0fada89dee4faca5a0; exit=0; EXPECT=matched; output-sha256=9e404a6d5bba66ca32edf76244545c2d3f4e867b5625d2bafbd9ca0e60c240c1; output-bytes=32; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: D108 est dans la portée des défauts, gardé, sur Ma bière
  CHECK: node -e "const p=require('./work/refonte-frontend/v4/tournoi/outils/portee-defauts.json');const d=p.defauts.find(x=>x.id==='D108');if(!d||d.verdict!=='garde'||d.tourne!=='oui'||!d.portee.includes('biere')||d.script!=='controle-visee.mjs'){console.log('PORTEE ECHEC');process.exit(1)}console.log('PORTEE OK')"
  EXPECT: PORTEE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a0abcccccc4cf3eeb1adc61936cea7f2797b600eedba81f3a02d8962d2a4b4fa; exit=0; EXPECT=matched; output-sha256=1812cb74b426905949893119c1eb3f66773036cdf500a13bf881ef86663fe91b; output-bytes=10; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: les témoins du système tiennent toujours
  CHECK: node scripts/agents/systeme.mjs temoins
  EXPECT: TEMOINS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1eb6e5d347a145baa08fdc3f609ab02c9fc05a91fd07b0a610b551cac1c25510; exit=0; EXPECT=matched; output-sha256=93822630816dc5de9c6d3af8b198315777d02cdc0d13b9bfc038553f4946a27d; output-bytes=3572; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: le rapport donne les sorties sur d332792c et les témoins
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p10-controle-visee/RESULTAT.md --contient "d332792c,visee-base,visee-sans-trace,visee-mauvais-cote"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=391c2611eca2b9f8dc7a883f810b31b630d768573009c59239165952f2f19258; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

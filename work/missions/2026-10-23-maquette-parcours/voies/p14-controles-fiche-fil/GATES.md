# Gates: voie p14-controles-fiche-fil — D115, D116 et leurs témoins

OWNS: work/refonte-frontend/v4/tournoi/outils/controle-fiche.mjs, work/refonte-frontend/v4/tournoi/outils/controle-fiche-radar.mjs, work/refonte-frontend/v4/tournoi/outils/controle-stepper.mjs, work/refonte-frontend/v4/tournoi/outils/temoins/fiche-radar-*/**, work/refonte-frontend/v4/tournoi/outils/temoins/stepper-*/**, work/missions/2026-10-23-maquette-parcours/voies/p14-controles-fiche-fil/RESULTAT.md

Scope: deux contrôles (le radar avant la liste dans la fiche, le fil d'étapes de l'app en tête de l'étape Houblons), chacun en échec sur la version publiée d332792c.

- [x] G1: l'étape de la version publiée n'a pas le fil d'étapes de l'app (en-tête maison, « hypothèse »)
  CHECK: node scripts/agents/systeme.mjs echoue "STEPPER ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-stepper.mjs prototypes/houblons-v4/maquettes/parcours-d332792c
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a38001d402dd7c1adaf14d601d6b6d83badb798cb5dc01a1edbef84323217f30; exit=0; EXPECT=matched; output-sha256=85a46e720883b6b35b39ec108ddd1c4b3c70b20113a3cae18a550298db2c5241; output-bytes=34; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: le témoin du vrai fil d'étapes passe
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-stepper.mjs work/refonte-frontend/v4/tournoi/outils/temoins/stepper-ok
  EXPECT: STEPPER OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=2a27219df1feb7834769353579cd0ccf7caa42e719e5796c8fe06818168c02b3; exit=0; EXPECT=matched; output-sha256=fcd3f8912b003ce5d14957f300945ebaba122c4dd0551e3b943927c6fb38f15a; output-bytes=201; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: l'en-tête maison avec « hypothèse » échoue
  CHECK: node scripts/agents/systeme.mjs echoue "STEPPER ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-stepper.mjs work/refonte-frontend/v4/tournoi/outils/temoins/stepper-hypothese
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=62a9e40303ea7e3e3d34a6e424012b3418c9627971fff6b8b70fa0e16bb652d9; exit=0; EXPECT=matched; output-sha256=85a46e720883b6b35b39ec108ddd1c4b3c70b20113a3cae18a550298db2c5241; output-bytes=34; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: le rapport donne les sorties de D115 et D116 sur d332792c et les témoins, et les appels rejoués
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p14-controles-fiche-fil/RESULTAT.md --contient "D115,D116,d332792c,fiche-radar-ok,fiche-radar-bas,stepper-ok,stepper-hypothese,appel"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=f8df2dc1bd68be3f94ac069bc73b64d1716289d38b4146c9fb484502f95706bf; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: D115 et D116 sont dans la portée des défauts, gardés
  CHECK: node -e "const p=require('./work/refonte-frontend/v4/tournoi/outils/portee-defauts.json');const a=p.defauts.find(x=>x.id==='D115'),b=p.defauts.find(x=>x.id==='D116');const ok=a&&b&&a.verdict==='garde'&&b.verdict==='garde'&&a.portee.includes('fiche')&&b.portee.includes('ma-biere');console.log(ok?'PORTEE OK':'PORTEE ECHEC');process.exit(ok?0:1)"
  EXPECT: PORTEE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1950c3c1b63b3db15c7bc4e0896184a1e8eef89f9a150665abd955d7d9a05992; exit=0; EXPECT=matched; output-sha256=1812cb74b426905949893119c1eb3f66773036cdf500a13bf881ef86663fe91b; output-bytes=10; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: les témoins du système tiennent toujours
  CHECK: node scripts/agents/systeme.mjs temoins
  EXPECT: TEMOINS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1eb6e5d347a145baa08fdc3f609ab02c9fc05a91fd07b0a610b551cac1c25510; exit=0; EXPECT=matched; output-sha256=93822630816dc5de9c6d3af8b198315777d02cdc0d13b9bfc038553f4946a27d; output-bytes=3572; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

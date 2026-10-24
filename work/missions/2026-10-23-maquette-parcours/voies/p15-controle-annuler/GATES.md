# Gates: voie p15-controle-annuler — le contrôle D120 et ses témoins

OWNS: work/refonte-frontend/v4/tournoi/outils/controle-annuler.mjs, work/refonte-frontend/v4/tournoi/outils/temoins/annuler-*/**, work/missions/2026-10-23-maquette-parcours/voies/p15-controle-annuler/RESULTAT.md

Scope: un contrôle qui exige « Annuler » à côté de l'action qui change la recette, sans effet sur elle, sur Substituer, Levure et Dryhopper ; il échoue sur la version publiée (d332792c).

- [x] G1: la version publiée échoue (Substituer sans Annuler)
  CHECK: node scripts/agents/systeme.mjs echoue "ANNULER ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-annuler.mjs prototypes/houblons-v4/maquettes/parcours-d332792c
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=8d944875642fbc9b27243ce2d9babf4cd641f85ea642108aa7a1e843c0f27022; exit=0; EXPECT=matched; output-sha256=04cd398665cbfee5d5164a2cb02ed79a014f8d1f545522299eef770669a5fe4d; output-bytes=34; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: le témoin positif passe
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-annuler.mjs work/refonte-frontend/v4/tournoi/outils/temoins/annuler-ok --routes=substituer
  EXPECT: ANNULER OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a35c4fe81a2c3cf35612fd6301a5fdee935681bab1f5a6477d38c0d3f5451990; exit=0; EXPECT=matched; output-sha256=d2ab0f71b1e6f52ee517c969423796c93016043f03b2aa12f6826dc392d99136; output-bytes=404; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: sans Annuler, échec
  CHECK: node scripts/agents/systeme.mjs echoue "ANNULER ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-annuler.mjs work/refonte-frontend/v4/tournoi/outils/temoins/annuler-absent --routes=substituer
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=ecb4247cf74a60eed7f4bf71bacdf339575ab6eb12f0ddb363acf22bd6316ef7; exit=0; EXPECT=matched; output-sha256=04cd398665cbfee5d5164a2cb02ed79a014f8d1f545522299eef770669a5fe4d; output-bytes=34; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: un Annuler qui change la recette échoue
  CHECK: node scripts/agents/systeme.mjs echoue "ANNULER ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-annuler.mjs work/refonte-frontend/v4/tournoi/outils/temoins/annuler-qui-change --routes=substituer
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=146eda8dc35baea70cb11b5b0329795a4b9f8fa5f378b862115b3c8d8e2cb81d; exit=0; EXPECT=matched; output-sha256=04cd398665cbfee5d5164a2cb02ed79a014f8d1f545522299eef770669a5fe4d; output-bytes=34; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: D120 est dans la portée des défauts, gardé
  CHECK: node -e "const p=require('./work/refonte-frontend/v4/tournoi/outils/portee-defauts.json');const d=p.defauts.find(x=>x.id==='D120');const ok=d&&d.verdict==='garde'&&d.tourne==='oui'&&['substituer','levure','dryhopper'].every(r=>d.portee.includes(r))&&d.script==='controle-annuler.mjs';console.log(ok?'PORTEE OK':'PORTEE ECHEC');process.exit(ok?0:1)"
  EXPECT: PORTEE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=3c877941d5e215eaeba063d57c21db8eef2c2388e75d692a74bd879a6e7cd91e; exit=0; EXPECT=matched; output-sha256=1812cb74b426905949893119c1eb3f66773036cdf500a13bf881ef86663fe91b; output-bytes=10; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: les témoins du système tiennent toujours
  CHECK: node scripts/agents/systeme.mjs temoins
  EXPECT: TEMOINS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1eb6e5d347a145baa08fdc3f609ab02c9fc05a91fd07b0a610b551cac1c25510; exit=0; EXPECT=matched; output-sha256=93822630816dc5de9c6d3af8b198315777d02cdc0d13b9bfc038553f4946a27d; output-bytes=3572; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: le rapport donne les sorties sur d332792c et les témoins
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p15-controle-annuler/RESULTAT.md --contient "d332792c,annuler-ok,annuler-absent,annuler-qui-change"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=40f60eb920b6f34d3d43654dac254bd65fcd14f2a2e1035cca404b5712a19497; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

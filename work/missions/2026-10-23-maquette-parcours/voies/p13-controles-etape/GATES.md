# Gates: voie p13-controles-etape — D111, D112, D113 et leurs témoins

OWNS: work/refonte-frontend/v4/tournoi/outils/controle-geste-etape.mjs, work/refonte-frontend/v4/tournoi/outils/controle-appui.mjs, work/refonte-frontend/v4/tournoi/outils/controle-legende.mjs, work/refonte-frontend/v4/tournoi/outils/temoins/geste-etape-*/**, work/refonte-frontend/v4/tournoi/outils/temoins/appui-etape-*/**, work/refonte-frontend/v4/tournoi/outils/temoins/legende-etape-*/**, work/missions/2026-10-23-maquette-parcours/voies/p13-controles-etape/RESULTAT.md, work/refonte-frontend/v4/tournoi/outils/controle-profil-ouvre.mjs, work/refonte-frontend/v4/tournoi/outils/temoins/profil-*/**, work/refonte-frontend/v4/tournoi/outils/controle-hauteur.mjs, work/refonte-frontend/v4/tournoi/outils/temoins/hauteur-*/**

Scope: trois contrôles de l'étape Houblons (le glisser replié et lisible, un retour pendant l'appui long, un « ? » près de chaque groupe d'icônes), chacun en échec sur la version publiée d332792c.

- [x] G1: le glisser de la version publiée échoue (carte entière, chevauchements)
  CHECK: node scripts/agents/systeme.mjs echoue "GESTE-ETAPE ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-geste-etape.mjs prototypes/houblons-v4/maquettes/parcours-d332792c
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=03ffb8da77630f5aa9f18ba6f046c04f960d2a81ba61f42e1d6814586b6ad9d2; exit=0; EXPECT=matched; output-sha256=2318575a3fc90d98b6936a7f59ef7e1b9480c9d2884b600c01fae5c372d153a6; output-bytes=38; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: le glisser de sa base v4.10 passe
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-geste-etape.mjs work/refonte-frontend/v4/ecran-1/base/consolide --page=index.html
  EXPECT: GESTE-ETAPE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=f5da5d5e2c26619e42664a4805f3e5982e9e98caecdc7b903b6fbfd22248254d; exit=0; EXPECT=matched; output-sha256=cc119e96d200e26ee5e6932d7173aeb7fdd3fbc29e0000fcb8bd88595d73aef3; output-bytes=221; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: le témoin aux étiquettes qui se chevauchent échoue
  CHECK: node scripts/agents/systeme.mjs echoue "GESTE-ETAPE ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-geste-etape.mjs work/refonte-frontend/v4/tournoi/outils/temoins/geste-etape-chevauche
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=61d0372eb1521e95189b2af1c8d5d6a42b0c5e8d6c8f000924ea37c15324e6aa; exit=0; EXPECT=matched; output-sha256=2318575a3fc90d98b6936a7f59ef7e1b9480c9d2884b600c01fae5c372d153a6; output-bytes=38; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: le rapport donne, pour chaque contrôle, ses sorties sur la base, sur d332792c et sur ses témoins, et les appels rejoués
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p13-controles-etape/RESULTAT.md --contient "D111,D112,D113,d332792c,base v4.10,appel"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=4c0728442972f6f9cbefdf982b70528e6c371d2b186f77a51c63681498b2db21; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: D111, D112 et D113 sont dans la portée des défauts, gardés, sur l'étape
  CHECK: node -e "const p=require('./work/refonte-frontend/v4/tournoi/outils/portee-defauts.json');const ok=['D111','D112','D113'].every(i=>{const d=p.defauts.find(x=>x.id===i);return d&&d.verdict==='garde'&&d.tourne==='oui'&&d.portee.includes('ma-biere')});console.log(ok?'PORTEE OK':'PORTEE ECHEC');process.exit(ok?0:1)"
  EXPECT: PORTEE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=58ad1f9ac4f475649a92e9d10e107cb52547858dbe530b8955bd9cf37839669e; exit=0; EXPECT=matched; output-sha256=1812cb74b426905949893119c1eb3f66773036cdf500a13bf881ef86663fe91b; output-bytes=10; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: les témoins du système tiennent toujours
  CHECK: node scripts/agents/systeme.mjs temoins
  EXPECT: TEMOINS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1eb6e5d347a145baa08fdc3f609ab02c9fc05a91fd07b0a610b551cac1c25510; exit=0; EXPECT=matched; output-sha256=93822630816dc5de9c6d3af8b198315777d02cdc0d13b9bfc038553f4946a27d; output-bytes=3572; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: le bloc du profil qui ne s'ouvre que par son « › » échoue (D121)
  CHECK: node -e "const fs=require('fs');const s=fs.existsSync('work/refonte-frontend/v4/tournoi/outils/controle-profil-ouvre.mjs')?'controle-profil-ouvre.mjs':'controle-geste-etape.mjs';const r=require('child_process').spawnSync(process.execPath,['scripts/agents/systeme.mjs','echoue','PROFIL ECHEC','--','node','work/refonte-frontend/v4/tournoi/outils/'+s,'work/refonte-frontend/v4/tournoi/outils/temoins/profil-chevron-seul'],{encoding:'utf8'});process.stdout.write(r.stdout+r.stderr)"
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1da82640f832451bd396a4e932544bf71a24121d9e80adb6a6ef89642da40501; exit=0; EXPECT=matched; output-sha256=af23ecdb30c7df0279971924a5d7b4b3d4a0b746bbae3f049b7cf48efc8ab08d; output-bytes=33; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: une étape plus haute que 1,05 écran à 390 échoue (D5)
  CHECK: node scripts/agents/systeme.mjs echoue "HAUTEUR ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-hauteur.mjs work/refonte-frontend/v4/tournoi/outils/temoins/hauteur-trop ma-biere --max=1.05
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=2a98e12d62cff0adbe2ef183f0a124b5c3bc3b9423cc60a45ba05be5eacc149b; exit=0; EXPECT=matched; output-sha256=dd525f446d5d2526cfb5a0f3995b4272a243182fe1b18f6b702e3de72190b48f; output-bytes=34; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G9: une étape tenue dans un écran passe (D5)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-hauteur.mjs work/refonte-frontend/v4/tournoi/outils/temoins/hauteur-ok ma-biere --max=1.05
  EXPECT: HAUTEUR OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=efb95e1167ac02ee22d34922ea977ab7d0ac455a0f4e272bbaec95a47ac7435d; exit=0; EXPECT=matched; output-sha256=51f1ddab9f3d936ffe5043b4322d832a6f53238d8a205aff46386aab75f26702; output-bytes=190; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

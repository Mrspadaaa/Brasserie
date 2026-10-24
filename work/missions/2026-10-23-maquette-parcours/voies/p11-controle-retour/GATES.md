# Gates: voie p11-controle-retour — le contrôle D109 et ses témoins

OWNS: work/refonte-frontend/v4/tournoi/outils/controle-retour.mjs, work/refonte-frontend/v4/tournoi/outils/temoins/retour-*/**, work/missions/2026-10-23-maquette-parcours/voies/p11-controle-retour/RESULTAT.md, work/refonte-frontend/v4/tournoi/outils/temoins/retour-fiche-*/**

Scope: un contrôle qui exige, sur chaque outil, une croix de 44 px au moins, icône de 20 px à l'encre, à la même place et dans un en-tête de même hauteur d'un onglet à l'autre (D119), qui ramène toujours à l'étape Houblons (D118) ; il échoue sur la version publiée (d332792c).

- [x] G1: le contrôle échoue sur la construction rejetée d332792c (« ‹ » de 28 px, gris ; retour selon le chemin ; en-tête qui change)
  CHECK: node scripts/agents/systeme.mjs echoue "RETOUR ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-retour.mjs prototypes/houblons-v4/maquettes/parcours-d332792c
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=8ba936d04e74c76b0aa425d782aeec9c41bdd6cc29cdd30c88d6281d85c45400; exit=0; EXPECT=matched; output-sha256=992694cfbfac5ff54b1b1c717ae0431c339ae64c41b8f3e6f957682a059f4388; output-bytes=33; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: le témoin positif passe, aux deux largeurs
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-retour.mjs work/refonte-frontend/v4/tournoi/outils/temoins/retour-ok --routes=suggerer
  EXPECT: RETOUR OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=70d50a7af84dae0b50453b526799ac01e0cea6513c0d9785bd6bd19f3940efa3; exit=0; EXPECT=matched; output-sha256=eca2a4c877e0e0a7ce25b98ee48fc2914094ae3cb999a934058f9a50b373066b; output-bytes=504; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: le retour petit et gris échoue
  CHECK: node scripts/agents/systeme.mjs echoue "RETOUR ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-retour.mjs work/refonte-frontend/v4/tournoi/outils/temoins/retour-petit --routes=suggerer
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a615d01974473a87ee662e874398901eb8c1f7233b87cfdf81c735dee4e71c16; exit=0; EXPECT=matched; output-sha256=992694cfbfac5ff54b1b1c717ae0431c339ae64c41b8f3e6f957682a059f4388; output-bytes=33; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: une croix qui ne ramène pas à l'étape Houblons échoue (D118)
  CHECK: node scripts/agents/systeme.mjs echoue "RETOUR ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-retour.mjs work/refonte-frontend/v4/tournoi/outils/temoins/retour-ailleurs --routes=suggerer
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=4f1a70ba2e48de3d035df4fd3467996f86e647e85a576ab6fbcf7c6a24e4a3da; exit=0; EXPECT=matched; output-sha256=992694cfbfac5ff54b1b1c717ae0431c339ae64c41b8f3e6f957682a059f4388; output-bytes=33; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4b: un en-tête qui saute d'un onglet à l'autre échoue (D119)
  CHECK: node scripts/agents/systeme.mjs echoue "RETOUR ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-retour.mjs work/refonte-frontend/v4/tournoi/outils/temoins/retour-en-tete-saute --routes=biere,suggerer,comparer
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=8298a71e7104bdb694e61b25a676fd624edf6c553127bd3ccba8abefc6caecd2; exit=0; EXPECT=matched; output-sha256=992694cfbfac5ff54b1b1c717ae0431c339ae64c41b8f3e6f957682a059f4388; output-bytes=33; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: D109 (avec D118 et D119) est dans la portée des défauts, gardé, sur les outils
  CHECK: node -e "const p=require('./work/refonte-frontend/v4/tournoi/outils/portee-defauts.json');const d=p.defauts.find(x=>x.id==='D109');if(!d||d.verdict!=='garde'||d.tourne!=='oui'||!['suggerer','comparer','dryhopper','levure','substituer'].every(r=>d.portee.includes(r))||d.script!=='controle-retour.mjs'){console.log('PORTEE ECHEC');process.exit(1)}console.log('PORTEE OK')"
  EXPECT: PORTEE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=ffa652578336050c09b5a5541e7f461cccc5ca3e9626507c74b9cdfb312956eb; exit=0; EXPECT=matched; output-sha256=1812cb74b426905949893119c1eb3f66773036cdf500a13bf881ef86663fe91b; output-bytes=10; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: les témoins du système tiennent toujours
  CHECK: node scripts/agents/systeme.mjs temoins
  EXPECT: TEMOINS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1eb6e5d347a145baa08fdc3f609ab02c9fc05a91fd07b0a610b551cac1c25510; exit=0; EXPECT=matched; output-sha256=93822630816dc5de9c6d3af8b198315777d02cdc0d13b9bfc038553f4946a27d; output-bytes=3572; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: le rapport donne les sorties et les mesures sur d332792c et les témoins
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p11-controle-retour/RESULTAT.md --contient "d332792c,retour-ok,retour-petit,retour-ailleurs,retour-en-tete-saute,28"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=7a137bc8d3ff1f1acdbd9b197f2482930f24c3665616e31d701e404f53f4f504; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: la fiche de la version publiée échoue : « × » gris de 16 px et « ‹ » en plus (D109, critique p6)
  CHECK: node scripts/agents/systeme.mjs echoue "RETOUR ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-retour.mjs prototypes/houblons-v4/maquettes/parcours-d332792c --fiche
  EXPECT: ECHOUE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=02fef7b0d50b800626f9a88feeb62c9f84513ead55eafd84084a8b4efaa8fed4; exit=0; EXPECT=matched; output-sha256=992694cfbfac5ff54b1b1c717ae0431c339ae64c41b8f3e6f957682a059f4388; output-bytes=33; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G9: une fiche à une seule croix ronde de 44 px à l'encre passe
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-retour.mjs work/refonte-frontend/v4/tournoi/outils/temoins/retour-fiche-ok --fiche
  EXPECT: RETOUR OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=511a9a7fc48d8e322ae20e72f53770f142a6e9889e191bddd2341884b959254f; exit=0; EXPECT=matched; output-sha256=40da5dbbd428f148578bd822ef764c735af27c0fe4e7988463685f2bfeec2a7d; output-bytes=357; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

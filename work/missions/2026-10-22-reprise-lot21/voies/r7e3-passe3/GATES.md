# Gates: voie r7e3-passe3 — Dryhopper, passe 3 de e5 : pas de vide

OWNS: work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/passe3/**, work/missions/2026-10-22-reprise-lot21/voies/r7e3-passe3/RESULTAT.md

Scope: e5 sans vide (premier écran couvert à 0,55 au moins, comme r6n2), avec tous les critères de la passe 2.

- [x] G1: baseline : les exigences de toute l'app tiennent (MOTS joué à part)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/passe3 e5 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=7a4b00c58a48ffece077a86678c0c6b2f463a4029d9b9242101299815ea1fa25; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/passe3 e5 --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=b5dde7d5a7e38e819559b05d20a6325d87d83dd3bd52115ff78eff8d5fabc0bf; exit=0; EXPECT=matched; output-sha256=f9a079657cd85dad5fdd7f4aa366fd5ae567a868637f3e4d490c5ac93fb7706a; output-bytes=19; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: un seul facteur libre, le moment (D98, édition du contexte admise)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/passe3 e5 --page=etat.html --edition
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : moment\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=aa08bd054fb695aa5b094ab71be64347c27be28be424833845f647dcca9f4c7a; exit=0; EXPECT=matched; output-sha256=09aca32a905aed6f10ef3e5c6c4996fd3365ad13a34210d16f56ae162ef93f0d; output-bytes=163; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les acquis de Dryhopper
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/passe3 e5 --page=etat.html --outil=dryhopper
  EXPECT: ACQUIS OK (4/4 : geste, frise, valeurs, levure)
  EVIDENCE: automatic-evidence=v1; definition-sha256=b11769e9ef5d3e7b1428070ddad1d53a400f9f42142de5414a1afd4871d4bfff; exit=0; EXPECT=matched; output-sha256=3fdd3fc0ca688202401adece26c519ed647d2501c16f55005035a431cf36de29; output-bytes=134; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: la page se rend sans erreur de script ni défilement horizontal
  CHECK: node scripts/agents/verifier-page.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/passe3/e5/etat.html --min-images 0
  EXPECT: PAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=e32277931a1e0b0efa1949c7cb70dee7eb9b3bbcb2631fc2f7d803db2274ecbe; exit=0; EXPECT=matched; output-sha256=8b41bf6d50130554819585d7bc2314ffb9174f5a88af247a6bd7ca1b8522fa10; output-bytes=50; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: pas de vide : le premier écran couvert à 0,55 au moins, à côté de r6n2 (M14)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-panel.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/passe3/captures/e5-premier-ecran.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6n2-premier-ecran.png --plancher=0.55 --part-vides=0
  EXPECT: PANEL OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=e6a897245510122ac3c9ba9ffa407cf0a04ec5dccb0d7214cecd2320999ae3b5; exit=0; EXPECT=matched; output-sha256=c216e5bacc8032213cc35fb9e2798b56c0ab97269d737c5e8d9be5be6984a8c9; output-bytes=129; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: page, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/passe3/e5/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/passe3/NOTE.md work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/passe3/captures/e5-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/passe3/captures/e5-premier-ecran.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-e/passe3/captures/e5-toucher-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=754bfd70673344a95cb75dee05d24774482bfa2f5c598bc32906ced1bacbc834; exit=0; EXPECT=matched; output-sha256=6135d4eaaef809fdb6913125e25ddab705378564706aac0a57963d6ff2a4e803; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: la NOTE et le rapport disent la passe 3
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r7e3-passe3/RESULTAT.md --contient "e5-premier-ecran.png,remplissage,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=c314505d02f6e3aafd7f5014e83fdab223407fce5638809cd23217ee70ee8b98; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

# Gates: voie r7d3-passe3 — Dryhopper, passe 3 de d8 : pas de vide

OWNS: work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/passe3/**, work/missions/2026-10-22-reprise-lot21/voies/r7d3-passe3/RESULTAT.md

Scope: d8 sans vide (premier écran couvert à 0,55 au moins, comme r6n2), avec tous les critères de la passe 2.

- [x] G1: baseline : les exigences de toute l'app tiennent (MOTS joué à part)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/passe3 d8 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=b2505929253c3692b1dd5163acca1d4178e9aab823daf0da8c506922272258fc; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/passe3 d8 --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=278a572acbc7d6740964971ab6371b9634514afc0817a97217e5e7ecd97502fc; exit=0; EXPECT=matched; output-sha256=547543be61e1e6d590cdafa3fa36d3443b7a02e9869952126253c86ab84fa723; output-bytes=19; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: un seul facteur libre, le moment (D98, édition du contexte admise)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/passe3 d8 --page=etat.html --edition
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : moment\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=2d822e11ebb3fe5c3cd909ccaaeaa91cf9a17977d42258c33ca6135475df115f; exit=0; EXPECT=matched; output-sha256=990ea29fc278a49d454db243a4a6215a090902eada3636e106e488e8fa0460c0; output-bytes=164; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les acquis de Dryhopper
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/passe3 d8 --page=etat.html --outil=dryhopper
  EXPECT: ACQUIS OK (4/4 : geste, frise, valeurs, levure)
  EVIDENCE: automatic-evidence=v1; definition-sha256=b62dc8e8e188cc5e5c2ab27a2e4394ad42c503d9bd7bb500630d8dc083b942b2; exit=0; EXPECT=matched; output-sha256=6cb579d48ceb83506bb1e7f67e25c290fe13b447dd774cb6aad8ffecaae15a18; output-bytes=134; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: la page se rend sans erreur de script ni défilement horizontal
  CHECK: node scripts/agents/verifier-page.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/passe3/d8/etat.html --min-images 0
  EXPECT: PAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=d60eff714e175751b2be679f48c03809f76590ea7870da0a9aa3447620813e06; exit=0; EXPECT=matched; output-sha256=8b41bf6d50130554819585d7bc2314ffb9174f5a88af247a6bd7ca1b8522fa10; output-bytes=50; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: pas de vide : le premier écran couvert à 0,55 au moins, à côté de r6n2 (M14)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-panel.mjs work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/passe3/captures/d8-premier-ecran.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6n2-premier-ecran.png --plancher=0.55 --part-vides=0
  EXPECT: PANEL OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=5fbd299be1ffec9f3306bf74339a58009d3b5e83156a90b2115d639c2ae4ccf3; exit=0; EXPECT=matched; output-sha256=2f05df12681f50bd3004bd54101affa88bd9c5be7a70cf44d2edbfd3777ca063; output-bytes=129; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: page, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/passe3/d8/etat.html work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/passe3/NOTE.md work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/passe3/captures/d8-390.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/passe3/captures/d8-premier-ecran.png work/refonte-frontend/v4/ecran-1/fils23-dryhopper/serie-d/passe3/captures/d8-toucher-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=b798acebae8970448bdf1c125f10ef385d8a366d295580c908868a71683ca4b6; exit=0; EXPECT=matched; output-sha256=6135d4eaaef809fdb6913125e25ddab705378564706aac0a57963d6ff2a4e803; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: la NOTE et le rapport disent la passe 3
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r7d3-passe3/RESULTAT.md --contient "d8-premier-ecran.png,remplissage,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=e151c176485ead1959a1a10044abb3e75ab3d612305161f7da1a488d99c94fa2; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

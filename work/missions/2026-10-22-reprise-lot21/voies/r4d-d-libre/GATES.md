# Gates: voie r4d-d-libre — « épicé », série D (v0 ×8)

OWNS: work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-d/v0/**, work/missions/2026-10-22-reprise-lot21/voies/r4d-d-libre/RESULTAT.md

Scope: 8 propositions « épicé » sous l'angle de la série D, deux genres au moins, aucune idée ni aucun dessin refusés, à 12, 16 et 24 px, à côté de la feuille et des brins, et sur de vraies cartes.

- [x] G1: D101 ter, 8 propositions, 2 genres au moins, refus, tailles, cartes, voisins
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-planche-picto.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-d/v0/etat.html --ter --genres=2 --nombre=8-8 --voisins=herbal,green
  EXPECT: /PLANCHE OK \(8 variantes/
  EVIDENCE: automatic-evidence=v1; definition-sha256=6bfb8953b7467d556c3dfb31fa8e939ee737ae349a367865d08e0e6f98be507d; exit=0; EXPECT=matched; output-sha256=dae11c3a20a0566b2a12d81539f4ee5674d3bcbee978516dc2c031446b448d37; output-bytes=639; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: au trait, sans halo ni disque (D88)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-pictos-trait.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-d v0 --page=etat.html
  EXPECT: TRAIT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=219ffebf95219107dc71087bac6b61932b477bc5059f9cb3199bddf707bd0151; exit=0; EXPECT=matched; output-sha256=5608cfb0bf95f616a398af80886853fb5d781847e275274f79bb81ea746f0f6c; output-bytes=51; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: la page se rend sans erreur de script ni défilement horizontal
  CHECK: node scripts/agents/verifier-page.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-d/v0/etat.html --min-images 0
  EXPECT: PAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=e5fc1ce43f585975bf5ef674ed7925e828789c6192b087d74b7ad7a0c00d60c4; exit=0; EXPECT=matched; output-sha256=8b41bf6d50130554819585d7bc2314ffb9174f5a88af247a6bd7ca1b8522fa10; output-bytes=50; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: générateur, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-d/v0/generer.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-d/v0/NOTE.md work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-d/v0/captures/planche-390.png work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-d/v0/captures/tailles-390.png work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-d/v0/captures/cartes-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=5799e2733e95f8ab3b2271ff2b9eac0c7dae5ab37478a7e9120ead655906b6de; exit=0; EXPECT=matched; output-sha256=6135d4eaaef809fdb6913125e25ddab705378564706aac0a57963d6ff2a4e803; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: la NOTE nomme chaque proposition, son genre, et ce que les refus ont fait éviter
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-d/v0/NOTE.md --contient "## Propositions,## Refus précédents,genre"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=7a27d6cfa1b6516963ff7174721e0683fca86660c863cd3aa446b83a247d2237; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r4d-d-libre/RESULTAT.md --contient "planche-390.png,tailles-390.png,cartes-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=66a0fa8e9afdce6622f6bff3547ec5e207ca145c4d9347e993104de32dd513ef; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

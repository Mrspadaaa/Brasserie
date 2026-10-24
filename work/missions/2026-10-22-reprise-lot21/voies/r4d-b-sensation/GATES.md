# Gates: voie r4d-b-sensation — « épicé », série B (v0 ×8)

OWNS: work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-b/v0/**, work/missions/2026-10-22-reprise-lot21/voies/r4d-b-sensation/RESULTAT.md

Scope: 8 propositions « épicé » sous l'angle de la série B, deux genres au moins, aucune idée ni aucun dessin refusés, à 12, 16 et 24 px, à côté de la feuille et des brins, et sur de vraies cartes.

- [x] G1: D101 ter, 8 propositions, 2 genres au moins, refus, tailles, cartes, voisins
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-planche-picto.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-b/v0/etat.html --ter --genres=2 --nombre=8-8 --voisins=herbal,green
  EXPECT: /PLANCHE OK \(8 variantes/
  EVIDENCE: automatic-evidence=v1; definition-sha256=e92179308db442ba4eca199b0c93d40374c9eb6c07ad74022deca7df5556aa92; exit=0; EXPECT=matched; output-sha256=e2d4182c7ce6780860604efce4b6f7795ef6a6c51836d8adbbeff5aba4a48583; output-bytes=629; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: au trait, sans halo ni disque (D88)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-pictos-trait.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-b v0 --page=etat.html
  EXPECT: TRAIT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=8f232b41ff235e654588cdd826fa7a14de961cdb1854826871f707e6f6ed0cad; exit=0; EXPECT=matched; output-sha256=5608cfb0bf95f616a398af80886853fb5d781847e275274f79bb81ea746f0f6c; output-bytes=51; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: la page se rend sans erreur de script ni défilement horizontal
  CHECK: node scripts/agents/verifier-page.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-b/v0/etat.html --min-images 0
  EXPECT: PAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=878cc3c84509bfb5d9e92d111a8a04b4cc2659a15797045557761c88327db2b2; exit=0; EXPECT=matched; output-sha256=8b41bf6d50130554819585d7bc2314ffb9174f5a88af247a6bd7ca1b8522fa10; output-bytes=50; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: générateur, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-b/v0/generer.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-b/v0/NOTE.md work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-b/v0/captures/planche-390.png work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-b/v0/captures/tailles-390.png work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-b/v0/captures/cartes-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=6ece81c9c2f73aff5e7ec43f0702e5c2434a5af575d04d456280aba0ba35389d; exit=0; EXPECT=matched; output-sha256=6135d4eaaef809fdb6913125e25ddab705378564706aac0a57963d6ff2a4e803; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: la NOTE nomme chaque proposition, son genre, et ce que les refus ont fait éviter
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-b/v0/NOTE.md --contient "## Propositions,## Refus précédents,genre"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=4409828ee308e8f2d02614304b13fbd138f8c73a6ba956f06f3e7121e681e777; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r4d-b-sensation/RESULTAT.md --contient "planche-390.png,tailles-390.png,cartes-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=9d56837a2d96efc80a8b3cb86fa27c1ac07554afe43c722d450e1eeb5abec526; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

# Gates: voie r4d-c-signe — « épicé », série C (v0 ×8)

OWNS: work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-c/v0/**, work/missions/2026-10-22-reprise-lot21/voies/r4d-c-signe/RESULTAT.md

Scope: 8 propositions « épicé » sous l'angle de la série C, deux genres au moins, aucune idée ni aucun dessin refusés, à 12, 16 et 24 px, à côté de la feuille et des brins, et sur de vraies cartes.

- [x] G1: D101 ter, 8 propositions, 2 genres au moins, refus, tailles, cartes, voisins
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-planche-picto.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-c/v0/etat.html --ter --genres=2 --nombre=8-8 --voisins=herbal,green
  EXPECT: /PLANCHE OK \(8 variantes/
  EVIDENCE: automatic-evidence=v1; definition-sha256=97e0105b7599b3e7797f30e44a1ec7f47d1b6f50c3f736b04398258bcbdc3cb1; exit=0; EXPECT=matched; output-sha256=18f4904b62369e79e6752231689a6811ec87616f01d5d0585b00262dd19e56f6; output-bytes=620; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: au trait, sans halo ni disque (D88)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-pictos-trait.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-c v0 --page=etat.html
  EXPECT: TRAIT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=3377f6b4a71d499b8e74c43a1382c4d95a32d8a000ad945ce63b40df0c83eaa2; exit=0; EXPECT=matched; output-sha256=5581a1e502767c060f3fad4101642df5d9889e5819c950c8cbd685614ba865c7; output-bytes=51; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: la page se rend sans erreur de script ni défilement horizontal
  CHECK: node scripts/agents/verifier-page.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-c/v0/etat.html --min-images 0
  EXPECT: PAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=332786cc8708367b0615a990c0d564822d9eafcb7d6e3bc95e16a7fb02296a2c; exit=0; EXPECT=matched; output-sha256=8b41bf6d50130554819585d7bc2314ffb9174f5a88af247a6bd7ca1b8522fa10; output-bytes=50; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: générateur, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-c/v0/generer.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-c/v0/NOTE.md work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-c/v0/captures/planche-390.png work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-c/v0/captures/tailles-390.png work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-c/v0/captures/cartes-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=888dc117288eaa60cfeb80bbf3b22af2db249951e5fc03f541ff3f347614842e; exit=0; EXPECT=matched; output-sha256=6135d4eaaef809fdb6913125e25ddab705378564706aac0a57963d6ff2a4e803; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: la NOTE nomme chaque proposition, son genre, et ce que les refus ont fait éviter
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-c/v0/NOTE.md --contient "## Propositions,## Refus précédents,genre"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=0fe276be59ec26804a8d7d128e17b5ef7996927ac37d9f4e7cb3b8642433fe03; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r4d-c-signe/RESULTAT.md --contient "planche-390.png,tailles-390.png,cartes-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=8b556f3914d692b4f00c160b9eddcd846f75d38054ecb6b3a3982ec00994e17c; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

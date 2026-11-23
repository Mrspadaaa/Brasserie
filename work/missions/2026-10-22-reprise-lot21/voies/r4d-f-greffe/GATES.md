# Gates: voie r4d-f-greffe — « épicé », série F (v0 ×8)

OWNS: work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-f/v0/**, work/missions/2026-10-22-reprise-lot21/voies/r4d-f-greffe/RESULTAT.md

Scope: 8 épices réelles dessinées en picto « épicé », sous l'angle de la série F, à 12, 16 et 24 px, à côté de la feuille et des brins, et sur de vraies cartes.

- [x] G1: D101 ter et quater : 8 propositions, 8 épices réelles déclarées, refus, tailles, cartes, voisins
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-planche-picto.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-f/v0/etat.html --ter --genres=2 --nombre=8-8 --voisins=herbal,green --epices=8
  EXPECT: /PLANCHE OK \(8 variantes\) · 8 épices réelles/
  EVIDENCE: automatic-evidence=v1; definition-sha256=fda506378e548ecbfc2551ed23b0d0cf588e9a3977b9dee4cdfc291f5e7b795b; exit=0; EXPECT=matched; output-sha256=3b424be0719b1b22a120b4f0450823e913888372816f18066ec8f4ed0bbd031c; output-bytes=680; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: baseline : au trait, sans halo ni disque (D88)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-pictos-trait.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-f v0 --page=etat.html
  EXPECT: TRAIT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=af4c0dcec9e42532c946a5c68ab86c550bc374430e2ae39af0d355e0b3b43eec; exit=0; EXPECT=matched; output-sha256=359ae3c5d7f2cd849f5012237ff518e2d04ed5543805ee0dc33d1dc8180b667a; output-bytes=51; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: la page se rend sans erreur de script ni défilement horizontal
  CHECK: node scripts/agents/verifier-page.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-f/v0/etat.html --min-images 0
  EXPECT: PAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=863138d871accd6b81c81cd7140378ac419ff729ee96de8eb5983b94bd2f683e; exit=0; EXPECT=matched; output-sha256=8b41bf6d50130554819585d7bc2314ffb9174f5a88af247a6bd7ca1b8522fa10; output-bytes=50; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: générateur, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-f/v0/generer.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-f/v0/NOTE.md work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-f/v0/captures/planche-390.png work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-f/v0/captures/tailles-390.png work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-f/v0/captures/cartes-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=c4672847c1f7a703bbc59f084921cc093916eb7e76d7c1e317d44c2187c5ef47; exit=0; EXPECT=matched; output-sha256=6135d4eaaef809fdb6913125e25ddab705378564706aac0a57963d6ff2a4e803; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: la NOTE nomme chaque proposition, son épice, et ce que les refus ont fait éviter
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-f/v0/NOTE.md --contient "## Propositions,## Refus précédents,épice"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=77f70fff5b40b41bb556b09ef17fcfcddd72e756f2cb0925950249399f6ef01d; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r4d-f-greffe/RESULTAT.md --contient "planche-390.png,tailles-390.png,cartes-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=980165959996466aeda22f88a21ff10a9d9dcadde9d15b93281d9d44d9215c45; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

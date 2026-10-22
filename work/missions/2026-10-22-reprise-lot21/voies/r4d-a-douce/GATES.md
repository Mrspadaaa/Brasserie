# Gates: voie r4d-a-douce — « épicé », série A (v0 ×8)

OWNS: work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-a/v0/**, work/missions/2026-10-22-reprise-lot21/voies/r4d-a-douce/RESULTAT.md

Scope: 8 propositions « épicé » sous l'angle de la série A, deux genres au moins, aucune idée ni aucun dessin refusés, à 12, 16 et 24 px, à côté de la feuille et des brins, et sur de vraies cartes.

- [x] G1: D101 ter, 8 propositions, 2 genres au moins, refus, tailles, cartes, voisins
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-planche-picto.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-a/v0/etat.html --ter --genres=2 --nombre=8-8 --voisins=herbal,green
  EXPECT: /PLANCHE OK \(8 variantes/
  EVIDENCE: automatic-evidence=v1; definition-sha256=99e13d7798f622ed6b1f004cb638fc4112ca602c8681f0362e0b809851579b2d; exit=0; EXPECT=matched; output-sha256=427e8a71c5799e4c71b554d095a3f4c594fbec77fbfeaf1d5a68aaa6990ea191; output-bytes=667; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: au trait, sans halo ni disque (D88)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-pictos-trait.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-a v0 --page=etat.html
  EXPECT: TRAIT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=68947106087be433e47b088003b0d1b1c1271fdacde7394730e65987bbb59c78; exit=0; EXPECT=matched; output-sha256=359ae3c5d7f2cd849f5012237ff518e2d04ed5543805ee0dc33d1dc8180b667a; output-bytes=51; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: la page se rend sans erreur de script ni défilement horizontal
  CHECK: node scripts/agents/verifier-page.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-a/v0/etat.html --min-images 0
  EXPECT: PAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=2a0e70fa0693d5000e2bffd3713413ec9926bd330535b932dc79764340ec74fb; exit=0; EXPECT=matched; output-sha256=8b41bf6d50130554819585d7bc2314ffb9174f5a88af247a6bd7ca1b8522fa10; output-bytes=50; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: générateur, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-a/v0/generer.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-a/v0/NOTE.md work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-a/v0/captures/planche-390.png work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-a/v0/captures/tailles-390.png work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-a/v0/captures/cartes-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1f80b6619809627478f63eb6e1720a3ceffaa67d3b1a0e322d13bb8126c6caa2; exit=0; EXPECT=matched; output-sha256=6135d4eaaef809fdb6913125e25ddab705378564706aac0a57963d6ff2a4e803; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: la NOTE nomme chaque proposition, son genre, et ce que les refus ont fait éviter
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-a/v0/NOTE.md --contient "## Propositions,## Refus précédents,genre"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=b8c3d091fe9ee09c40bd83c530aaebb2f9189de6c98d1f61877aec0042e1e1db; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r4d-a-douce/RESULTAT.md --contient "planche-390.png,tailles-390.png,cartes-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=62dc6d4af97bd5e785d5915b48bf049ea8584d0cd663497dbd559659367f3c3d; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: sa piste est là : cannelle et vanille redessinées
  CHECK: node -e "const h=require('fs').readFileSync('work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-a/v0/etat.html','utf8'); const v=[...h.matchAll(/data-variante=\x22([^\x22]+)\x22/g)].map(m=>m[1]).join(' '); const ok=/cannelle|canelle/i.test(v) && /vanille/i.test(v); console.log(ok?'PISTE OK':'PISTE ECHEC '+v); process.exit(ok?0:1)"
  EXPECT: PISTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=6393585098ae190cd775f1c2fec3bcfa2091f4339acffb81989649eddf9e3a28; exit=0; EXPECT=matched; output-sha256=74c406020d8dd68cb73d6131c3e6327fc8b9160acf6efc478e0b1ffea7856a37; output-bytes=9; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

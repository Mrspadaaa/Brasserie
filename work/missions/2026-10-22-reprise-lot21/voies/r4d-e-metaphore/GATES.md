# Gates: voie r4d-e-metaphore — « épicé », série E (v0 ×8)

OWNS: work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-e/v0/**, work/missions/2026-10-22-reprise-lot21/voies/r4d-e-metaphore/RESULTAT.md

Scope: 8 épices réelles dessinées en picto « épicé », sous l'angle de la série E, à 12, 16 et 24 px, à côté de la feuille et des brins, et sur de vraies cartes.

- [x] G1: D101 ter et quater : 8 propositions, 8 épices réelles déclarées, refus, tailles, cartes, voisins
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-planche-picto.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-e/v0/etat.html --ter --genres=2 --nombre=8-8 --voisins=herbal,green --epices=8
  EXPECT: /PLANCHE OK \(8 variantes\) · 8 épices réelles/
  EVIDENCE: automatic-evidence=v1; definition-sha256=c5d8bd99c0e660ef3172adc5dd4435a49be46f657c04e37ba76586123dca6f28; exit=0; EXPECT=matched; output-sha256=d58232fc85e02a392a79cc528c152efebaff0f41e4a97721a7ce072224f15721; output-bytes=673; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: baseline : au trait, sans halo ni disque (D88)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-pictos-trait.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-e v0 --page=etat.html
  EXPECT: TRAIT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a2cc1e2c4dee86da5f610a1cd938f473826973da1f0ce5ac3946f71e5854b99a; exit=0; EXPECT=matched; output-sha256=fc76e6aaa8a254f545f8c27c7bbfb8bfd004af97ae20412b53e84c51758e6937; output-bytes=51; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: la page se rend sans erreur de script ni défilement horizontal
  CHECK: node scripts/agents/verifier-page.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-e/v0/etat.html --min-images 0
  EXPECT: PAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=fd4844c171810a734adf0e8f63aefa87c8b171b3ada5ecbb2be9fb7d4edf36e4; exit=0; EXPECT=matched; output-sha256=8b41bf6d50130554819585d7bc2314ffb9174f5a88af247a6bd7ca1b8522fa10; output-bytes=50; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: générateur, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-e/v0/generer.mjs work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-e/v0/NOTE.md work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-e/v0/captures/planche-390.png work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-e/v0/captures/tailles-390.png work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-e/v0/captures/cartes-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=c15b2a70babf6245fc7f2a4644db2813d37b9d2e5dfbdc57d34d190ccfb18206; exit=0; EXPECT=matched; output-sha256=6135d4eaaef809fdb6913125e25ddab705378564706aac0a57963d6ff2a4e803; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: la NOTE nomme chaque proposition, son épice, et ce que les refus ont fait éviter
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils22-picto-epice-3/serie-e/v0/NOTE.md --contient "## Propositions,## Refus précédents,épice"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=f0c4a5e240f48172389dfac5c91059dd11487794d22e43701895376b9fcea4d7; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r4d-e-metaphore/RESULTAT.md --contient "planche-390.png,tailles-390.png,cartes-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a19ed0007b3f6604175b26d3c8fdf03b83fb0841d76f7bd12d67f48d44ef0be6; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

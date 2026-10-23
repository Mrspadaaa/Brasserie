# Gates: voie r6p1-nettoyee — variante de r6n2 : r6n2 nettoyée

OWNS: work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p1/**, work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6p1-*.png, work/missions/2026-10-22-reprise-lot21/voies/r6p1-nettoyee/RESULTAT.md

Scope: une variante de r6n2 qui ne laisse libre que la variété, garde les quatre acquis et les 37 éléments de l'inventaire, et reprend les meilleures idées sous l'angle « r6n2 nettoyée ».

- [x] G1: les exigences de toute l'app tiennent (MOTS joué à part, à 80)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6p1 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=aab2a84412d6cfebbfa31efee526ca0411fc5b6ee855f2a29d54f7858531461b; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6p1 --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=95a185acef21f5d25297f66efdc2ee13e3b38bfea6a1adb94bc82a41fe9cffc5; exit=0; EXPECT=matched; output-sha256=379e593ab34ad58c6a78d1105b20e59d35a70d4f1067f3dff9655df4b1b75630; output-bytes=21; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: un seul facteur libre, la variété (D98)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6p1 --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : houblon\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=17ed16025587a8097abf92919f15b11aa20fe0b7940865d1392ecd66761150d7; exit=0; EXPECT=matched; output-sha256=a07aa59bd4df38b3babdbea4ae428e8a0f7fe0433e0b5004959c4c6262a39175; output-bytes=180; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les quatre acquis sont là (D99)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6p1 --page=etat.html
  EXPECT: ACQUIS OK (4/4
  EVIDENCE: automatic-evidence=v1; definition-sha256=f8c9ab84a171fee276a86aa827cc075ec82f69e99d4d1f4cc311da58dedf0d9f; exit=0; EXPECT=matched; output-sha256=ee7c2ff1520c9e708e2b3a1514344ece30d86c50befa2136365b0e70602832d1; output-bytes=147; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: l'α de chaque houblon, sourcé (D87)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-alpha.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6p1 --page=etat.html
  EXPECT: ALPHA OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=bd94f5481dfc30b2b98ccae6bb26cbf0a51d03a72733b5d239999de48dd16d31; exit=0; EXPECT=matched; output-sha256=cedf78ac301db98d281335fc520ac653c9821f6a01d587e05cf9225236cf5a22; output-bytes=43; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: chaque élément de l'inventaire est classé et balisé (D104)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-reprise.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6p1 --page=etat.html
  EXPECT: REPRISE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1880777f396ab140fdc6e15143cd362335c5b1923d15ffc6c0ede19b11fe064c; exit=0; EXPECT=matched; output-sha256=7041fcf68896f577eb6700b4215b058bbd0a2f44b455b5f55403b7ce36775d6a; output-bytes=1675; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: la page se rend sans erreur de script ni défilement horizontal
  CHECK: node scripts/agents/verifier-page.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p1/etat.html --min-images 0
  EXPECT: PAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=041f538c0ff71c533bdfdfa01eae97ee88f9a722eebcd267508cc538771c298a; exit=0; EXPECT=matched; output-sha256=8b41bf6d50130554819585d7bc2314ffb9174f5a88af247a6bd7ca1b8522fa10; output-bytes=50; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: page, générateur, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p1/etat.html work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p1/generer.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p1/NOTE.md work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6p1-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6p1-premier-ecran.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6p1-toucher-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6p1-fiche-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=f65c9ebdce2dfd0a6f3c089e767725886787ad626eb54b5204cdc73d30b34296; exit=0; EXPECT=matched; output-sha256=3156347a759048d840ab56a5d7c1806edb556ccf6a0825499f2641c077c25bd9; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G9: la NOTE dit ses choix, ses idées reprises, sa reprise et sa règle de radar
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p1/NOTE.md --contient "Choix portés,Radar : r2,Base : dose égale,Porte : non,Descripteurs : A,## Idées reprises,## Reprise,D103"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=693f70d3e06f6f3f2b6320575deabaed69749471694a0721af8f788f3fcde343; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G10: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r6p1-nettoyee/RESULTAT.md --contient "r6p1-premier-ecran.png,r6p1-toucher-390.png,r6p1-fiche-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=2d840a61125e0488e0cb1588b8c01dbde41100cdc1b2869cd6cc6cc69b78a27d; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

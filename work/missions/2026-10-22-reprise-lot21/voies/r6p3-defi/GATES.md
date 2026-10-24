# Gates: voie r6p3-defi — variante de r6n2 : Ton défi au premier écran

OWNS: work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p3/**, work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6p3-*.png, work/missions/2026-10-22-reprise-lot21/voies/r6p3-defi/RESULTAT.md

Scope: une variante de r6n2 qui ne laisse libre que la variété, garde les quatre acquis et les 37 éléments de l'inventaire, et reprend les meilleures idées sous l'angle « Ton défi au premier écran ».

- [x] G1: les exigences de toute l'app tiennent (MOTS joué à part, à 80)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6p3 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=b16e28fdfa5556a502c93260fb96ccb6bf0190fc02b3737789f1776137c1b097; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6p3 --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=b9e7680fac6d7e205b35fb126bd2a72e3d068334d2872685dc589203bfa6ec1e; exit=0; EXPECT=matched; output-sha256=c930210d2c809e52da068bb107674a97eda824e195483bfad5cd18e00032acd5; output-bytes=21; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: un seul facteur libre, la variété (D98)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6p3 --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : houblon\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=f600779dd8bebc5c2bdefb1bcce7a76caa72956b31103d6674a4b9f48b00c4d0; exit=0; EXPECT=matched; output-sha256=2d9b393e84671cb3007c0ef7da9572bffba5ba6fc95a188de1f18a6bfb81c8e8; output-bytes=180; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les quatre acquis sont là (D99)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6p3 --page=etat.html
  EXPECT: ACQUIS OK (4/4
  EVIDENCE: automatic-evidence=v1; definition-sha256=a5702e43f1e36074734a4d4e826493b911c11c2122bc93d9265dde0d34e78d49; exit=0; EXPECT=matched; output-sha256=245334da2a41bd58e21efbb85f50f7224dc2eaa303640b26e925559d698d9572; output-bytes=147; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: l'α de chaque houblon, sourcé (D87)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-alpha.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6p3 --page=etat.html
  EXPECT: ALPHA OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a8ed0a48ec24e81533bdf589e4eaf90e0b941ef8708e3563d058ccb0e7af1b8c; exit=0; EXPECT=matched; output-sha256=223a38d18470c2af9c3045cf1c7ff6f48153ca9fe5a501afb09bc365004f70b8; output-bytes=43; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: chaque élément de l'inventaire est classé et balisé (D104)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-reprise.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6p3 --page=etat.html
  EXPECT: REPRISE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=edda28daa94aa9eaec35856865c6d7ef55d8399389d140dd93307cde035cf0c5; exit=0; EXPECT=matched; output-sha256=0f8fe19a52fa25bdabcb36e683ac0c50ee2404248eeec9f05c0f1f9ee7159377; output-bytes=1655; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: la page se rend sans erreur de script ni défilement horizontal
  CHECK: node scripts/agents/verifier-page.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p3/etat.html --min-images 0
  EXPECT: PAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=6b4dbc02f661739b22e50c46e716c097e21eab7d5cbceb661aeaa5cf0dd16f6d; exit=0; EXPECT=matched; output-sha256=8b41bf6d50130554819585d7bc2314ffb9174f5a88af247a6bd7ca1b8522fa10; output-bytes=50; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: page, générateur, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p3/etat.html work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p3/generer.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p3/NOTE.md work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6p3-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6p3-premier-ecran.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6p3-toucher-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6p3-fiche-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a59edc41cd67829ebb5e5ac3b565cf9f0931e1ffbdae5d0f6318bad8f3eddd39; exit=0; EXPECT=matched; output-sha256=3156347a759048d840ab56a5d7c1806edb556ccf6a0825499f2641c077c25bd9; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G9: la NOTE dit ses choix, ses idées reprises, sa reprise et sa règle de radar
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils22-comparer/r6p3/NOTE.md --contient "Choix portés,Radar : r2,Base : dose égale,Porte : non,Descripteurs : A,## Idées reprises,## Reprise,D103"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=d252be637fe4261b96f09b90a29228f310ec1ada4ee49b2f9dcb9dbb122f804f; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G10: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r6p3-defi/RESULTAT.md --contient "r6p3-premier-ecran.png,r6p3-toucher-390.png,r6p3-fiche-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=587e3ea9edbbe4d5e99d722b4b0cc193aa99f9cf4c36042d29f75bf0f8fe19b8; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

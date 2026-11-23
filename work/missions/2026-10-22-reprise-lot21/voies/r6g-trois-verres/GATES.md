# Gates: voie r6g-trois-verres — Trois verres à même amertume

OWNS: work/refonte-frontend/v4/ecran-1/fils22-comparer/r6g/**, work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6g-*.png, work/missions/2026-10-22-reprise-lot21/voies/r6g-trois-verres/RESULTAT.md

Scope: une mini maquette de Comparer (lot 22) qui ne laisse libre que la variété, porte les quatre acquis et les choix Radar : r3 ; Base : IBU égal ; Porte : non ; Descripteurs : A.

- [x] G1: les exigences de toute l'app tiennent (MOTS joué à part, à 80)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6g --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=058697b4db5d6bb45813bfe1f1447a21bf28092f054c8e0e960f68732257c905; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6g --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=7c1e0e488b89a88ec9cad0e3784048cae85170a38142908d269685290bf4fd1b; exit=0; EXPECT=matched; output-sha256=2c927ba69cda2b9d48e3f0b4bb3c95dd68df502b9bec9c9270124e04d8b72d7b; output-bytes=20; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: un seul facteur libre, la variété (D98)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6g --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : houblon\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=0ee6950320c75a69a49c5d10a11bdc43b7bfcc9d0f6e82179ec614be5f40304a; exit=0; EXPECT=matched; output-sha256=69a5ce8bea0265ad6870a0160325df4a76124c8cd47e2774777831dd4574b772; output-bytes=165; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les quatre acquis sont là (D99)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6g --page=etat.html
  EXPECT: ACQUIS OK (4/4
  EVIDENCE: automatic-evidence=v1; definition-sha256=5551eb79383f86ba95a2201cbaf80210cb4127b5d7b6b8be5e354302db2a873f; exit=0; EXPECT=matched; output-sha256=853c4f6c2530909b08f18aecc47f7dd7bcee41c2cf0775da388e1bc48a498dcc; output-bytes=149; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: l'α de chaque houblon, sourcé (D87)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-alpha.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6g --page=etat.html
  EXPECT: ALPHA OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=38b8ee0642ba69d9901040a278953e2312e2141853c6735d6191a80629ab4fe7; exit=0; EXPECT=matched; output-sha256=b24d1e4ebe214537981f1b7352f856f04d23730aa2bb4038d8ffd19e92282ee8; output-bytes=42; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: page, générateur, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils22-comparer/r6g/etat.html work/refonte-frontend/v4/ecran-1/fils22-comparer/r6g/generer.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer/r6g/NOTE.md work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6g-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6g-premier-ecran.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6g-fiche-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6g-toucher-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=265b02dc5d1a86cc70d403c784483c59cb2c987467535756f70c028fbaa41b06; exit=0; EXPECT=matched; output-sha256=3156347a759048d840ab56a5d7c1806edb556ccf6a0825499f2641c077c25bd9; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: la NOTE dit les choix que la variante porte
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils22-comparer/r6g/NOTE.md --contient "Choix portés,Radar : r3,Base : IBU égal,Porte : non,Descripteurs : A"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=0620e4020fb0e396216fe7389c40662f202e24854d42bc3cbcac2e2e69f14a62; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r6g-trois-verres/RESULTAT.md --contient "r6g-390.png,r6g-premier-ecran.png,r6g-fiche-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a31b82696fb0e9775131e0d1a42db6586043b77b620e2dc21015ca1bd4e3be0a; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

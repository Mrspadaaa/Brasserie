# Gates: voie r6n1-reprise-tout — Tout au premier écran

OWNS: work/refonte-frontend/v4/ecran-1/fils22-comparer/r6n1/**, work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6n1-*.png, work/missions/2026-10-22-reprise-lot21/voies/r6n1-reprise-tout/RESULTAT.md

Scope: une mini maquette de reprise de r6a (lot 22 bis) qui ne laisse libre que la variété, porte les quatre acquis, classe et balise chaque élément de l'inventaire, tout au premier écran.

- [x] G1: les exigences de toute l'app tiennent (MOTS joué à part, à 80)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6n1 --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1b0c250985e5a864ac56b91cc345cff1f9889d9fc8a43d36559169a9b8ce04de; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6n1 --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=583b080eb47d1bab8e34de154b13ff99094abe4fe6143e1c254eb6b68c05afc4; exit=0; EXPECT=matched; output-sha256=058abd274e01d594c1cb64fa8ed3459c348c8ce4cb16fd24c7d6669b4654d9a8; output-bytes=21; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: un seul facteur libre, la variété (D98)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6n1 --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : houblon\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=961bfe926aa060fcb1eca245a2bcab08fdb541c2623c9b060d8e9c9867e119a6; exit=0; EXPECT=matched; output-sha256=7906ff504f0eb3bba0961560cc3e50faf16aa2a127a2c8bd6662f81bba67fdde; output-bytes=179; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les quatre acquis sont là (D99)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6n1 --page=etat.html
  EXPECT: ACQUIS OK (4/4
  EVIDENCE: automatic-evidence=v1; definition-sha256=e8dd248e1cad3fb12cd52604d51fdd4b9458cf458e6327702dead378687453c6; exit=0; EXPECT=matched; output-sha256=bbe138bc5535ecd4f1836d4c9d4529bff2b794115432619b5e0ba1ec6f70addd; output-bytes=142; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: l'α de chaque houblon, sourcé (D87)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-alpha.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6n1 --page=etat.html
  EXPECT: ALPHA OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1cdb868339cfdbadca6149324494b9eab42ddda2cc4cd78dc1c9d7338c2d2771; exit=0; EXPECT=matched; output-sha256=0769ef7b275fc15e8aa79509994151422cf9a9ca446aa6fc8cf2902ece3d9737; output-bytes=43; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: chaque élément de l'inventaire est classé et balisé (D104), au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-reprise.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6n1 --page=etat.html --premier-ecran
  EXPECT: REPRISE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=ba1891b06854beec8c506edd85f65ce3945f97bf1575a28e267d0466b8958d73; exit=0; EXPECT=matched; output-sha256=bd884ea99443ccceb8150ba9ab4a200f76a1bdb13c3ca0dd9a71a66a12f5bf14; output-bytes=1575; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: la page se rend sans erreur de script ni défilement horizontal
  CHECK: node scripts/agents/verifier-page.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer/r6n1/etat.html --min-images 0
  EXPECT: PAGE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=5915b9089f12db7e4ff72abbf63a3ec184b1b4d11b7c28718edb2186ea2916fd; exit=0; EXPECT=matched; output-sha256=8b41bf6d50130554819585d7bc2314ffb9174f5a88af247a6bd7ca1b8522fa10; output-bytes=50; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: page, générateur, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils22-comparer/r6n1/etat.html work/refonte-frontend/v4/ecran-1/fils22-comparer/r6n1/generer.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer/r6n1/NOTE.md work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6n1-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6n1-premier-ecran.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6n1-toucher-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6n1-fiche-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=da6e0633c061797b7424d49425a9d83ceec9defacad29170384c0aec458530bb; exit=0; EXPECT=matched; output-sha256=3156347a759048d840ab56a5d7c1806edb556ccf6a0825499f2641c077c25bd9; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G9: la NOTE dit ses choix, sa reprise et sa règle de radar
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils22-comparer/r6n1/NOTE.md --contient "Choix portés,Radar : r2,Base : dose égale,Porte : non,Descripteurs : A,## Reprise,D103"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=c4fc0b39dc4d74ff644f86c14a201225831336a962668a5c8fce1d8f05aa4f16; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G10: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r6n1-reprise-tout/RESULTAT.md --contient "r6n1-premier-ecran.png,r6n1-toucher-390.png,r6n1-fiche-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=ae6028e868e841212593f70298a0667dcf41380848d155d7118e781a7225f671; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

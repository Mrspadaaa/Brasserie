# Gates: voie r6m-la-phrase — La phrase et le radar

OWNS: work/refonte-frontend/v4/ecran-1/fils22-comparer/r6m/**, work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6m-*.png, work/missions/2026-10-22-reprise-lot21/voies/r6m-la-phrase/RESULTAT.md

Scope: une mini maquette de Comparer (lot 22) qui ne laisse libre que la variété, porte les quatre acquis et les choix Radar : r3 ; Base : IBU égal ; Porte : non ; Descripteurs : B.

- [x] G1: les exigences de toute l'app tiennent (MOTS joué à part, à 80)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6m --page=etat.html --sans=mots
  EXPECT: COMMUN OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=8e97a177c7a6823af033dc08522e97c976229cae7574c4d1ada8866d2812ec94; exit=0; EXPECT=matched; output-sha256=17c208fcc8bcaece23f4c60d9cb18741b72129c670bc157e4fe6eff6b3b9ac33; output-bytes=191; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6m --max=80 --page=etat.html
  EXPECT: MOTS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=eeffb9793f2eeb55686a3c63474aee192cdd24435857b4a7a300097c30b60368; exit=0; EXPECT=matched; output-sha256=db859b351fbaf1da5533c62d27d5697414166ffa63edf1fc71b1d5195ed8e0c8; output-bytes=20; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: un seul facteur libre, la variété (D98)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-une-question.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6m --page=etat.html
  EXPECT: /UNE-QUESTION OK \(1 groupe libre : houblon\)/
  EVIDENCE: automatic-evidence=v1; definition-sha256=ca83f3bc74c1454ad98f91bcef0fa83d40bf7722420278161be9010f7630c2ec; exit=0; EXPECT=matched; output-sha256=d6c80cbec60e3dadd9f86f755efc1ade87f20d38516db42229ff7772a6a9f32b; output-bytes=165; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: les quatre acquis sont là (D99)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-acquis.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6m --page=etat.html
  EXPECT: ACQUIS OK (4/4
  EVIDENCE: automatic-evidence=v1; definition-sha256=d1a883909164428d82c4461c61a76b99607c3b7bab3cd525d5e28a992e5d88db; exit=0; EXPECT=matched; output-sha256=159337e56348a4dbb91ed54fc1b7936d4aa18899ee000f2c4807c15b59b0c25a; output-bytes=139; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: l'α de chaque houblon, sourcé (D87)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-alpha.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6m --page=etat.html
  EXPECT: ALPHA OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=b558171b46349c9a9ce9e482c6b4d57d6e9ffb58fd9c1b31ff560e5ce1e5c461; exit=0; EXPECT=matched; output-sha256=1f5229bf903520bb22d8cb406b5332ca29ef8809a39999c4e456986410389af0; output-bytes=42; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: option B : la part « autres » se voit au seuil proposé de 25 % (D100)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-sans-famille.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer r6m --page=etat.html --seuil=0.25
  EXPECT: /SANS-FAMILLE OK \([1-9]/
  EVIDENCE: automatic-evidence=v1; definition-sha256=8122ea792a73b1bb6860a7ed3786de9a5301ee533b38feb515f46272480f86ce; exit=0; EXPECT=matched; output-sha256=c8b8eee5d83fbeaa81a23f1a3f1decb25dc400c17138652e3adbca1980c0249a; output-bytes=149; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: page, générateur, note et captures existent
  CHECK: node scripts/agents/systeme.mjs existent work/refonte-frontend/v4/ecran-1/fils22-comparer/r6m/etat.html work/refonte-frontend/v4/ecran-1/fils22-comparer/r6m/generer.mjs work/refonte-frontend/v4/ecran-1/fils22-comparer/r6m/NOTE.md work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6m-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6m-premier-ecran.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6m-fiche-390.png work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6m-toucher-390.png
  EXPECT: EXISTENT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=8bdfe6f1d5f1de07a53c3c3e9080febda13d71120c2bcd2b7118715511e48d42; exit=0; EXPECT=matched; output-sha256=3156347a759048d840ab56a5d7c1806edb556ccf6a0825499f2641c077c25bd9; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: la NOTE dit les choix que la variante porte
  CHECK: node scripts/agents/systeme.mjs note work/refonte-frontend/v4/ecran-1/fils22-comparer/r6m/NOTE.md --contient "Choix portés,Radar : r3,Base : IBU égal,Porte : non,Descripteurs : B"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=5c889a79f79980acd9fef5b011962813210417a6af1ccdb101df67561c1387f0; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G9: le rapport cite les captures ouvertes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-22-reprise-lot21/voies/r6m-la-phrase/RESULTAT.md --contient "r6m-390.png,r6m-premier-ecran.png,r6m-fiche-390.png,LEÇON PROPOSÉE"
  EXPECT: NOTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=17c951cb5d59130806a31d7d47152422a433f60b9e033bbcdfeb09cc56f3571a; exit=0; EXPECT=matched; output-sha256=9ebc2a3bc86c0b29c21d72443842e536bd7da4e7adcc302b3ba991bcde6c1c36; output-bytes=8; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

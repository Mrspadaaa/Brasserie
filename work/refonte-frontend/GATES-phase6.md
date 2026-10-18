# Gates: phase 6 — specs, architecture, doc

OWNS: docs/specs/**, docs/architecture/**, work/refonte-frontend/**

Scope: spec houblons et architecture actuelle en anglais ASD-STE100 (environ 80 %), glossaire FR-EN, diagrammes Mermaid de la logique cœur (classement, comparaison et simulation, remplacement, brouillon et hors ligne, passerelle IA). Les specs des autres zones du frontend sont hors de cette phase (suite de la mission).

- [x] G0: ce registre de critères énonce des résultats qui peuvent échouer
  CHECK: node .claude/skills/unlazy/scripts/gate-lint.mjs work/refonte-frontend/GATES-phase6.md
  EXPECT: LINT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=bbd4d8de28f73c0467218805b307b7bd3baa63e621cf0f017e80cdf4d1af9e05; exit=0; EXPECT=matched; output-sha256=5ac01488afd0a641b67dc4b448ffe59ead4156bf217c6cbf221f31a7e6b8bbd8; output-bytes=466; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G1: la spec couvre Q01 à Q30, chacune avec une fonction ou « not documented » et sa donnée manquante ; chaque fichier cité dans les specs et l'architecture existe
  CHECK: node work/refonte-frontend/checks/check-phase6.mjs
  EXPECT: SPECS OK 30 questions
  EVIDENCE: automatic-evidence=v1; definition-sha256=75c58e4344579cd0588ad3d2ea7348ab80c2b0437378dbc3373c990bf2bbf7c4; exit=0; EXPECT=matched; output-sha256=007ad0f7056e7d4c77b0832ac11882b8abd5f4ef82545b16283e499a3d4caf14; output-bytes=42; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: ce contrôle échoue sur un témoin (question absente, fichier cité inexistant)
  CHECK: node work/refonte-frontend/checks/check-phase6.mjs --control
  EXPECT: CONTROL OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=4989fcdab02f68bd409ceb10dc811faa4517a1ff92fd3f726cf9e96543a3532a; exit=0; EXPECT=matched; output-sha256=ab62ce483ccb54d6320cab7ad8f0a0b326a49ceb36fe50d35a89c19848e08643; output-bytes=1502; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: les 6 diagrammes Mermaid de l'architecture s'analysent sans erreur
  CHECK: node work/refonte-frontend/checks/check-mermaid.mjs docs/architecture/README.md docs/architecture/hop-logic.md
  EXPECT: MERMAID OK 6
  EVIDENCE: automatic-evidence=v1; definition-sha256=d98a0f73814f4da8e9125892a679a421f3d0df6d32c3b8f5bcd584d63fd9a72f; exit=0; EXPECT=matched; output-sha256=ce1cb75d9efc279e3a8ec5033f875c044a8cf9f40cf5f5667761c87647243ee4; output-bytes=13; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: le validateur Mermaid rejette un diagramme cassé
  CHECK: node work/refonte-frontend/checks/check-mermaid.mjs --control
  EXPECT: CONTROL OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1ec4c8f593e0c4fc60159f8e69da91d18363875edba9999e7e80bdf326a4acce; exit=0; EXPECT=matched; output-sha256=89be9cfc129858539fc464df2194aa065313875b6c533538a450bd2e7dcbbdf5; output-bytes=148; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: au moins 80 % des phrases des specs et de l'architecture font 25 mots au plus et n'ont pas de voix passive repérable
  CHECK: node work/refonte-frontend/checks/check-ste.mjs 80 docs/specs/houblons.md docs/specs/glossary.md docs/architecture/README.md docs/architecture/hop-logic.md
  EXPECT: STE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=ccdaa7f7f2b32adf1ef2ab0185aa08980f10640de61e80c58c05e19767c056f2; exit=0; EXPECT=matched; output-sha256=14d0a885eacaeb1b328519106b41282e21d2f6997d586aa9d125a602028314f6; output-bytes=890; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: relecture Opus : les règles de la spec (classement F1, ressemblance F4, poids d'arôme F3, formule IBU) égalent celles du prototype et du code cité ; aucun fait d'architecture n'est repris sans sa source
  EVIDENCE: Opus 18.10 04:00 — F1 : spec « (wanted − unwanted) / (n + 2) », prototype `fit` identique (app.html) ; clés 1 à 4 identiques (usage, adéquation, alpha si amertume, nom). F3 : poids 1 / 0,8 / 0,5 / 0,2 / 0,05 identiques à `weightOf` ; IBU : formule relue dans src/services/brewingMath.ts:96-141 (G, f(t), 1er moût × 1,1, whirlpool × 2^((T−100)/10), à cru 0), reprise à l'identique dans `ibu()` du prototype (whirlpool 20 min à 80 °C par défaut, comme brewingMath). F4 : spec « familles de descripteurs en commun / toutes les familles », prototype `sim` = Jaccard sur `fam` ; dose au même IBU par `doseFor`. Architecture : chaque section cite son fichier ; 2 faits corrigés (9 fonctions de conseil, Tinseth non comparés) ; l'adresse e-mail de firestore.rules n'est pas reprise.

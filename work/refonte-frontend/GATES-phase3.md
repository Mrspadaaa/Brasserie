# Gates: phase 3 — causes racines

OWNS: docs/qualite/causes-racines.md, work/refonte-frontend/**

Scope: pourquoi des règles du brasseur ont été ignorées et pourquoi les défauts UX majeurs ont passé les revues, avec preuves retrouvables, hypothèses du brief testées, et un garde-fou par cause.

- [x] G0: ce registre de critères énonce des résultats qui peuvent échouer
  CHECK: node .claude/skills/unlazy/scripts/gate-lint.mjs work/refonte-frontend/GATES-phase3.md
  EXPECT: LINT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=e534050d4ffb374ca063ec17799077c2476dc511ca2bd24f0f5221c7c43c4283; exit=0; EXPECT=matched; output-sha256=112fe49c37a08f75586e7a49a7c51c87d0dc7c431fd3f5ad55ad6c1ceaa6c079; output-bytes=179; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G1: chaque citation de preuve se retrouve mot pour mot dans son fichier à la ligne dite ; H1 à H8 ont un verdict et au moins 2 preuves vérifiées ; chaque cause renvoie à un garde-fou ; une section de contre-preuves existe
  CHECK: node work/refonte-frontend/checks/check-phase3.mjs
  EXPECT: CAUSES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=0d47179607e7579773096896a3ad621e3e1b4014fc9c854f01df82cd895d3d61; exit=0; EXPECT=matched; output-sha256=1d6ad35cd46ff7b0958032c5adb6d95a5f1b9043c0e24570c8d08c5719299ef2; output-bytes=13; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: le contrôle échoue sur un témoin (citation inventée)
  CHECK: node work/refonte-frontend/checks/check-phase3.mjs --control
  EXPECT: CONTROL OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=5f60233e72964f2c2bb2cf065e92e33329cdb0ced7a7fd849215ab39fb11b2f2; exit=0; EXPECT=matched; output-sha256=e531307aa3a742d5c4f64a57203e93dba33229f8de7295d9951b0274f1c10f7e; output-bytes=449; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: docs/qualite ne contient aucune clé, adresse électronique, IBAN, téléphone ni clé privée
  CHECK: node work/refonte-frontend/checks/check-phase2.mjs secrets
  EXPECT: SECRETS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=1078b7bee18bc0e51d633131176c7d0f9cddad1dfa19ebef26a283b5d40e8d8e; exit=0; EXPECT=matched; output-sha256=1d1eb9fe06f7a7ad470bc20bdd3c156eebca3bca927e809d21da78da71f2e8a5; output-bytes=11; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: relecture Opus : les preuves décisives de l'agent sont revérifiées par Opus, et le mécanisme commun proposé s'appuie sur des preuves, pas sur une opinion
  EVIDENCE: Opus 18.10 01:05 — revérifiées à la main : brief V5.5 L3 (« Aucun nouvelavis/corpus/historique »), UX-WIZ L64-67 (« deux appuis » sous « Décisions produit »), check-recipe-journey-ui L173 (pas de 390), rapport de mise en ligne L19 (« l'agent ne se connecte jamais ») ; commit 4add7b51 et test L394-396 relus par git show. Ajouts Opus : banc QA main.tsx L38 (catalogue complet), scan des 17 contrôles houblons (aucun ne cherche le stock à l'écran), maquettes V5.5 jouées (A4). Chaque ligne du tableau « Mécanisme commun » renvoie à une section prouvée (H1, H2, H5, H3, H7) ; les contre-preuves sont gardées et expliquées.

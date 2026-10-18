# Gates: phase 4 — garde-fous

OWNS: docs/qualite/garde-fous.md, docs/qualite/protocole-revue-ux.md, docs/qualite/hooks-settings.json, .github/ISSUE_TEMPLATE/interface.yml, scripts/check-issue-closure.mjs, scripts/check-hop-one-tap.mjs, scripts/check-hop-ux-rules.mjs, scripts/check-hop-budget.mjs, scripts/hop-one-tap/**, .claude/hooks/guards.mjs, tests/fixtures/production/**, tests/qa/hop-recipe/main.tsx, work/refonte-frontend/**

Scope: garde-fous qui imposent le besoin du brasseur ; chaque contrôle passe sur un témoin positif et échoue sur l'app actuelle (témoin négatif), sur les données de production.

Prérequis des gates G5, G7, G9 et G10 : banc QA construit dans TEMP/laffinee-hop-qa-one-tap (adaptateur qa-bench sans SKIP_BUILD) ; build de l'app dans TEMP/laffinee-dist-mesure (`npx vite build --outDir`).

- [x] G0: ce registre de critères énonce des résultats qui peuvent échouer
  CHECK: node .claude/skills/unlazy/scripts/gate-lint.mjs work/refonte-frontend/GATES-phase4.md
  EXPECT: LINT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=25a69703c2dbe44ec23b80c9a442a7c1c9069bdf766775d9d0a71e23f54816e1; exit=0; EXPECT=matched; output-sha256=21f54892c4208e639208a1fce2f9017f6be7d04d4a056f727e7b49a0e0ae1e88; output-bytes=510; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G1: le script de clôture refuse une issue d'interface sans citation exacte du brasseur, sans question de la banque, sans contrôle, sans sortie collée, avec un bloquant ouvert ou un verdict bloquant, et accepte une issue conforme
  CHECK: node scripts/check-issue-closure.mjs --selftest
  EXPECT: SELFTEST OK 8
  EVIDENCE: automatic-evidence=v1; definition-sha256=b39ee7130ddeae64daf7bfc458e56ec04df82f070b2aaccd058296bf3673827c; exit=0; EXPECT=matched; output-sha256=ea557e71e498e3915653fd939b6e3f0b985940870daafb419ce2d8f28c553ff6; output-bytes=14; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: les trois hooks préparés bloquent les cas visés et laissent passer les autres
  CHECK: node .claude/hooks/guards.mjs --selftest
  EXPECT: HOOKS SELFTEST OK 8
  EVIDENCE: automatic-evidence=v1; definition-sha256=a2747ae91c2815a47f7c984ea1e8894536656f9324f6be5fe71e87de007ed8a9; exit=0; EXPECT=matched; output-sha256=699750e79836a0af3879e74edc362608399e0dfc537416761a6a21eef85d02f3; output-bytes=20; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G3: le contrôle « un toucher, sans défiler » passe sur les fils de fer (direction A), stock de production
  CHECK: node scripts/check-hop-one-tap.mjs --adapter scripts/hop-one-tap/wireframe.mjs
  EXPECT: ONE-TAP OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=308958c5820228059d73914953697ef47a28836c1fc13348327772afe0d229ff; exit=0; EXPECT=matched; output-sha256=e62408b21b2ee383006c1123d6181359d9409652f995e78379ab3951807066c3; output-bytes=210; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G4: le contrôle « un toucher, sans défiler » passe sur les fils de fer (direction B, un toucher)
  CHECK: node -e "process.env.DIRECTION='B';import('./scripts/check-hop-one-tap.mjs')" -- --adapter scripts/hop-one-tap/wireframe.mjs
  EXPECT: ONE-TAP OK meilleur état : 1 toucher
  EVIDENCE: automatic-evidence=v1; definition-sha256=b37b173c487e1956f216a2723894b65993250e1845571b1cfbfcb896f63485e1; exit=0; EXPECT=matched; output-sha256=20d658ac7f53ef4587e50e8ce3289b0663e169b6c61872fe2452874f610b441e; output-bytes=236; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G5: le contrôle « un toucher, sans défiler » échoue sur l'app actuelle, banc QA sur l'instantané de production (témoin négatif)
  CHECK: node -e "Object.assign(process.env,{SKIP_BUILD:'1',QA_CATALOGUE:'production'});import('./scripts/check-hop-one-tap.mjs')" -- --adapter scripts/hop-one-tap/qa-bench.mjs --witness
  EXPECT: WITNESS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=848752d036c2af1ea6a8e8ff38c9f704994b97d0c3a808c22e036bb8ff8d303d; exit=0; EXPECT=matched; output-sha256=4b4f474ba1d9012f39f90c7f1580066a1000098f2eeafb89a125b87936bedce3; output-bytes=211; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G6: les règles d'utilisabilité passent sur les fils de fer
  CHECK: node scripts/check-hop-ux-rules.mjs --adapter scripts/hop-one-tap/wireframe.mjs
  EXPECT: UX-RULES OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=3d12e62d374208f15513721cdd7b63828dd3e8ecfea574ffecfbdd92643795b5; exit=0; EXPECT=matched; output-sha256=d03c6fef71327780fce7669d7d3d519105eca9e7e05d9dfba9d92dd571141d18; output-bytes=36; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G7: les règles d'utilisabilité échouent sur l'app actuelle, instantané de production (témoin négatif)
  CHECK: node -e "Object.assign(process.env,{SKIP_BUILD:'1',QA_CATALOGUE:'production'});import('./scripts/check-hop-ux-rules.mjs')" -- --adapter scripts/hop-one-tap/qa-bench.mjs --witness
  EXPECT: WITNESS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=a69516d6fe9247ffc95c6edf477f78ad91add999b3dc613dd7613c5f849d0acf; exit=0; EXPECT=matched; output-sha256=12ccff1f426991376f432842284e805aee9ffc5d715f42972a509c41d999567b; output-bytes=303; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G8: les budgets B3 et B4 sont tenus par les fils de fer
  CHECK: node scripts/check-hop-budget.mjs --adapter scripts/hop-one-tap/wireframe.mjs
  EXPECT: BUDGET OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=6d130d7d6b4f870bb29514c9f5b0411e248b0cc7d414858ecde1aa7346415f9d; exit=0; EXPECT=matched; output-sha256=ca921eab405a93db1c39f69a1f8d80e8df0114afb46022d35a5253dc8c63da1a; output-bytes=121; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G9: le build actuel de l'app dépasse les budgets B1 et B2 (témoin négatif)
  CHECK: node -e "process.argv.push('--dist',require('path').join(process.env.TEMP,'laffinee-dist-mesure'),'--witness');import('./scripts/check-hop-budget.mjs')"
  EXPECT: WITNESS OK 2 budget
  EVIDENCE: automatic-evidence=v1; definition-sha256=7b9634771fb944418d74cc8f63df6bfd915ead9c412d61e4bdaf6dc531e50229; exit=0; EXPECT=matched; output-sha256=10fd58eed3217100ecfe7bd75d00ab657d6d88fa8b79eb1fded1296f522933f8; output-bytes=189; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G10: l'app actuelle dépasse le budget B3 sur l'instantané de production (témoin négatif)
  CHECK: node -e "Object.assign(process.env,{SKIP_BUILD:'1',QA_CATALOGUE:'production'});import('./scripts/check-hop-budget.mjs')" -- --adapter scripts/hop-one-tap/qa-bench.mjs --witness
  EXPECT: WITNESS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=c39ea801cd47437f6f18bda8dd1c39f796f765e1ed9aa56c3850d38839d43042; exit=0; EXPECT=matched; output-sha256=e17048d7d1df04d69540ad9bdba2f59bd2346373dd9fbb863b7cb3972547655c; output-bytes=164; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G11: chaque cause de la phase 3 a son garde-fou, et chaque outil cité existe
  CHECK: node work/refonte-frontend/checks/check-phase4.mjs
  EXPECT: GARDE-FOUS OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=26fe1d7f9b147da83744bc7b931bf90ae6b1e7c4eef2934a11f67923ee2dfd86; exit=0; EXPECT=matched; output-sha256=8e267ceaa3997ed7043a3e8c6eaeecbaf7fc90a9c136424b473b2cf30600e9b0; output-bytes=17; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G12: le contrôle du document des garde-fous échoue sur un témoin (outil inexistant, cause sans ligne)
  CHECK: node work/refonte-frontend/checks/check-phase4.mjs --control
  EXPECT: CONTROL OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=8fdaca451aba33a7da449a7148f0557d3e816766bb49220bbdc8f0d63d345a0e; exit=0; EXPECT=matched; output-sha256=40aaa99e3a3aef94cf5a673cd089404e5eb2d400ccc718b66a37e9d928e636db; output-bytes=149; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G13: relecture Opus : le contrôle de production est prêt mais non joué (aucun Chrome QA), les hooks ne sont pas actifs (aucun .claude/settings.json ne les référence), et les chiffres de garde-fous.md égalent les sorties des gates G5, G7, G9 et G10
  EVIDENCE: Opus 18.10 02:10 — production : « PRODUCTION NON JOUÉE : Failed to fetch browser webSocket URL from http://127.0.0.1:9222 » (exit 1), aucun clic possible hors SAFE_TAPS ; hooks : .claude/ ne contient aucun settings.json (ls), seul docs/qualite/hooks-settings.json porte la configuration ; chiffres rejoués sur QA_CATALOGUE=production : one-tap 0 houblon sur 18 commandes, UX U4 8 / U5 1 / U6 8 / cibles 6, B1 918 ko, B2 772 ko, B3 jamais en 10 s, B4 74 Mo (document corrigé de 73 à 74 Mo). Banc QA vérifié : 12 variétés avec le filtre, 136 sans. Faux positifs écartés : contenu inerte et rogné ; recouvrements U6 restants examinés un par un (commandes de l'ancien éditeur sous le panneau de l'atelier).

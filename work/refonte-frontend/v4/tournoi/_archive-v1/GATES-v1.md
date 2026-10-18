# Gates: maquette houblons v4 « lu au style » (#119, après D19)

OWNS: prototypes/houblons-v4/**, work/refonte-frontend/v4/**, .impeccable/**

Scope : une maquette pour remplacer l'étape houblons V5.5, selon la phase maquette de `docs/qualite/methode-conception-frontend.md`, le brief `work/refonte-frontend/v4/brief-v4.md` et le contrat `.impeccable/surfaces/prototypes-houblons-v4-index-html.md`.

Révisé le 18.10.2026 sur demande du brasseur : « Playwright ne me semble pas utile pour la conception […] c'est pour le moment juste des maquettes ». La version précédente de ce registre (Storybook, Playwright, axe-core, régression visuelle, un toucher, règles U, budgets, revue finale et documentation impeccable) est reportée à la phase intégration, après son accord. Aucune de ses gates n'avait de preuve.

- [x] G0: ce registre énonce des résultats qui peuvent échouer
  CHECK: node .claude/skills/unlazy/scripts/gate-lint.mjs work/refonte-frontend/v4/GATES.md
  EXPECT: LINT OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=b2f14f8232e17c6abdbe62baaebc010ef7d7d5454ae7a6dd31804fd7710bbeec; exit=0; EXPECT=matched; output-sha256=e7e33c711bfeb9b2492068ab858546e6c2305706d59c268f8eeb2f645f2b4029; output-bytes=2063; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G1: aucun fichier de l'app n'a changé depuis c8f4c3ae (src, functions, public, package.json de l'app, config, règles Firebase)
  CHECK: node work/refonte-frontend/v4/outils/check-app-intacte.mjs
  EXPECT: APP-INTACTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=91c23e12d03796eaef270c50b42c9e6d372841863be86e700d2ef3a98d19a72f; exit=0; EXPECT=matched; output-sha256=a1dac226bc06c643d8d13a59b8486c4b01391e9efa596d8f2fa62beaa1e50a4e; output-bytes=56; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: le jeu de données commun sort du moteur de l'app : voies du stock pour S1, écart qui pèse plus en lager qu'en IPA, « ≈ » quand les plages se recouvrent, inconnue jamais à zéro, style non documenté annoncé en échelle absolue
  CHECK: npm --prefix prototypes/houblons-v4 run check:engine
  EXPECT: ENGINE-V4 OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=5118c9bec4d2119c17e042e72d8185734715b79cf97b8a96f216cf300ab36ce4; exit=0; EXPECT=matched; output-sha256=f63f96cab9921e124560a06cf96f6ce56e6aafb7170b051c5cfc8e39abfde90e; output-bytes=544; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [ ] G3: tournois M1 à M5 menés jusqu'au bout : au moins 6 mini-maquettes par étape, capturées, jugées à l'aveugle, moitié éliminée avec raison, consolidation qui nomme ses greffes
  CHECK: node work/refonte-frontend/v4/tournoi/outils/check-tournoi.mjs
  EXPECT: TOURNOI OK
  EVIDENCE: pending

- [ ] G4: les 3 maquettes finales (demande du brasseur : « me faire 3 version à la fin plutôt qu'une ») se chargent sans erreur de page à 390 et à 1280
  CHECK: node -e "process.env.CAPTURE_EXTRA='412';process.exitCode=require('child_process').spawnSync(process.execPath,['work/refonte-frontend/v4/tournoi/outils/capture.mjs','prototypes/houblons-v4/maquettes','version-a','version-b','version-c'],{stdio:'inherit',env:process.env}).status"
  EXPECT: CAPTURE OK 3/3
  EVIDENCE: pending

- [ ] G5: cadrage écrit avant les maquettes (brief, contrat, tirage 36178972) ; exigences retrouvées vérifiées (60 citations sur 61 mot pour mot) et chacune traitée ou écartée avec sa raison (brief § 9)
  EVIDENCE: pending

- [ ] G6: échelles au style : table bande ↔ mots BJCP sourcée, mention « à valider » visible dans la maquette
  EVIDENCE: pending

- [ ] G7: revue des 3 maquettes finales : critique impeccable notée pour chacune, puis relecteur Fable à l'aveugle qui joue S1 à S3 dans chacune ; aucun mensonge sur les données ni blocage de tâche laissé ouvert
  EVIDENCE: pending

- [ ] G8: captures 390 et 1280 des 3 maquettes finales regardées par le pilote après la dernière correction
  EVIDENCE: pending

- [ ] G9: livraison : commits locaux sans .codex/hooks.json, source4-portable-bundle-manifest-01.json ni functions/.env ; Artifact privé à la même adresse ; commentaire #119
  EVIDENCE: pending

- [ ] G10: porte B : choix du brasseur parmi les 3 maquettes finales, et avis sur les finalistes des étapes serrées s'il le veut
  EVIDENCE: pending

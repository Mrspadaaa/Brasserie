# Gates: tranche A du prototype houblons v4 (moteur, échelles au style, pack des mini-prototypes)

OWNS: prototypes/houblons-v4/**, work/refonte-frontend/v4/**

Scope : reprise exacte de G1 à G3 de work/refonte-frontend/v4/GATES.md pour la tranche A, après le changement de cap du coordinateur du 18.10.2026 (plus de page, de Storybook ni de Playwright). Le ledger complet n'est pas exécuté ici : G4 à G11 appellent des contrôles de la tranche B qui n'existent pas encore.

- [x] G1: aucun fichier de l'app n'a changé depuis c8f4c3ae (src, functions, public, package.json de l'app, config, règles Firebase)
  CHECK: node work/refonte-frontend/v4/outils/check-app-intacte.mjs
  EXPECT: APP-INTACTE OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=91c23e12d03796eaef270c50b42c9e6d372841863be86e700d2ef3a98d19a72f; exit=0; EXPECT=matched; output-sha256=a1dac226bc06c643d8d13a59b8486c4b01391e9efa596d8f2fa62beaa1e50a4e; output-bytes=56; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [x] G2: moteur, échelles au style et pack testés : direction relative à la recette, voies du stock puis à acheter, remplacement à IBU égal à 0,5 IBU près et à masse égale, assemblage marqué estimé, conversion bande de style vers piste, seuil d'écart, recouvrement des plages qui donne « ≈ », inconnue jamais nulle, style non documenté qui revient à l'échelle absolue, écart lager rendu plus grand qu'en IPA pour une même différence absolue, pack identique à la sortie du moteur
  CHECK: npm --prefix prototypes/houblons-v4 run check:engine
  EXPECT: ENGINE-V4 OK
  EVIDENCE: automatic-evidence=v1; definition-sha256=5118c9bec4d2119c17e042e72d8185734715b79cf97b8a96f216cf300ab36ce4; exit=0; EXPECT=matched; output-sha256=8489c08f142e8b7d9d62a03774d1b830a846c2869dea7e1bb7ed046d47f2b623; output-bytes=543; shell=C:\WINDOWS\system32\cmd.exe; cwd=C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie; path=e6b74341549f/27 entries

- [ ] G3: la page statique se construit depuis les données du dépôt et le moteur importé
  CHECK: npm --prefix prototypes/houblons-v4 run check:build
  EXPECT: BUILD-V4 OK
  EVIDENCE: pending

ABANDON: G3 abandonné sur instruction du coordinateur (18.10.2026 : page React et check:build retirés de la tranche A, « juste des maquettes ») ; aucune page n'est construite, le pack data/pack-mini-protos.json la remplace.

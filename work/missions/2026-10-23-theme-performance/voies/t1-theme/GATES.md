# Gates: voie t1-theme — le thème clair des maquettes dans toute l'app

OWNS: tailwind.config.js, src/index.css, src/main.tsx, src/theme, scripts/theme, DESIGN.md, src/pages/PageShell.tsx, src/pages/BrewWizard.tsx, src/components, src/ui, work/missions/2026-10-23-theme-performance/voies/t1-theme

Scope: toute l'app en clair par défaut et en cave au choix, contrastes mesurés, écrans vérifiés en deux thèmes, build et tests verts.

- [ ] G1: le build de l'app passe
  CHECK: npm run build
  EXPECT: /built in/
  EVIDENCE: pending

- [ ] G2: les tests de l'app passent
  CHECK: npm test
  EXPECT: /Test Files\s+\d+ passed/
  EVIDENCE: pending

- [ ] G3: l'app s'ouvre en clair par défaut, passe en cave par le réglage, et le garde au rechargement
  CHECK: node scripts/theme/verifier-theme.mjs
  EXPECT: THEME OK
  EVIDENCE: pending

- [ ] G4: un clair qui ne serait pas le thème par défaut fait échouer la vérification
  CHECK: node scripts/agents/systeme.mjs echoue "par défaut" -- node scripts/theme/verifier-theme.mjs --defaut=cave
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G5: les textes tiennent les seuils de contraste de DESIGN.md dans les deux thèmes
  CHECK: node scripts/theme/contraste.mjs
  EXPECT: CONTRASTE OK
  EVIDENCE: pending

- [ ] G6: la maquette jouable, reconstruite sur le nouveau thème, ouvre toutes ses routes
  CHECK: node prototypes/houblons-v4/parcours/outils/jouer-parcours.mjs --dossier=prototypes/houblons-v4/maquettes/parcours-theme --routes
  EXPECT: /ROUTES OK/
  EVIDENCE: pending

- [ ] G7: DESIGN.md décrit les deux thèmes
  CHECK: node scripts/agents/systeme.mjs note DESIGN.md --contient "clair,cave,THEMES.md,data-theme"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G8: la NOTE dit le mécanisme, les couleurs en dur, le réglage, les écrans vérifiés et les restes
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-theme-performance/voies/t1-theme/NOTE.md --exiger "Mécanisme,Couleurs en dur,Réglage,Écrans vérifiés,Restes"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G9: les captures sont nommées et regardées
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-theme-performance/voies/t1-theme/RESULTAT.md --exiger "Captures regardées" --contient "390,1280,clair,cave"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G10: la règle n° 1 reste verte sur la maquette reconstruite avec le nouveau thème (ses choix, écran par écran)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs prototypes/houblons-v4/maquettes/parcours-theme
  EXPECT: /CHOIX OK/
  EVIDENCE: pending

- [ ] G11: le parcours complet de la maquette passe encore avec le nouveau thème
  CHECK: node prototypes/houblons-v4/parcours/outils/parcours-complet.mjs --dossier=prototypes/houblons-v4/maquettes/parcours-theme --captures prototypes/houblons-v4/maquettes/parcours-theme/captures-parcours
  EXPECT: /PARCOURS OK/
  EVIDENCE: pending

- [ ] G12: la maquette reconstruite sur le thème de l'app garde les couleurs de ses maquettes choisies (D106)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-teinte.mjs prototypes/houblons-v4/maquettes/parcours-theme
  EXPECT: /TEINTE OK/
  EVIDENCE: pending

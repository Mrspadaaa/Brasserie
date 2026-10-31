# Gates: voie p5 — r4e : tout ce que la ligne montre se change sur la ligne

OWNS: work/missions/2026-10-31-ecran-fermentescibles/v4/r4e-a/, work/missions/2026-10-31-ecran-fermentescibles/v4/r4e-b/, work/missions/2026-10-31-ecran-fermentescibles/voies/p5/RESULTAT.md

Scope: r4d telle quelle, plus la part, le moment et la couleur réglés sur la ligne (D211) ; plateau toujours visible (D212) ; deux variantes.

- [ ] G1: r4e-a, chaque réglage de la ligne se change sur la ligne
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-volee.mjs work/missions/2026-10-31-ecran-fermentescibles/v4/r4e-a/etat.html
  EXPECT: VOLEE OK
  EVIDENCE: pending

- [ ] G2: r4e-a, les gestes de r4d tiennent (masse, retrait, ajout, détail)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-gestes-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v4/r4e-a/etat.html
  EXPECT: GESTES OK
  EVIDENCE: pending

- [ ] G3: r4e-a se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-10-31-ecran-fermentescibles/v4/r4e-a/etat.html --min-images 0
  EXPECT: PAGE OK
  EVIDENCE: pending

- [ ] G4: r4e-a, 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/missions/2026-10-31-ecran-fermentescibles/v4 r4e-a --page=etat.html --max=80 --profil=sans-houblons
  EXPECT: MOTS OK
  EVIDENCE: pending

- [ ] G5: r4e-a, le cadre commun tient, couleurs mises à part comme r4c
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/missions/2026-10-31-ecran-fermentescibles/v4 r4e-a --page=etat.html --profil=sans-houblons --sans=couleurs
  EXPECT: COMMUN OK
  EVIDENCE: pending

- [ ] G6: r4e-a, contraste
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-contraste.mjs work/missions/2026-10-31-ecran-fermentescibles/v4 r4e-a --page=etat.html
  EXPECT: CONTRASTE OK
  EVIDENCE: pending

- [ ] G7: r4e-a, hauteur
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-hauteur.mjs work/missions/2026-10-31-ecran-fermentescibles/v4 r4e-a --page=etat.html
  EXPECT: HAUTEUR OK
  EVIDENCE: pending

- [ ] G8: r4e-b, chaque réglage de la ligne se change sur la ligne
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-volee.mjs work/missions/2026-10-31-ecran-fermentescibles/v4/r4e-b/etat.html
  EXPECT: VOLEE OK
  EVIDENCE: pending

- [ ] G9: r4e-b, les gestes de r4d tiennent (masse, retrait, ajout, détail)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-gestes-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v4/r4e-b/etat.html
  EXPECT: GESTES OK
  EVIDENCE: pending

- [ ] G10: r4e-b se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-10-31-ecran-fermentescibles/v4/r4e-b/etat.html --min-images 0
  EXPECT: PAGE OK
  EVIDENCE: pending

- [ ] G11: r4e-b, 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/missions/2026-10-31-ecran-fermentescibles/v4 r4e-b --page=etat.html --max=80 --profil=sans-houblons
  EXPECT: MOTS OK
  EVIDENCE: pending

- [ ] G12: r4e-b, le cadre commun tient, couleurs mises à part comme r4c
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/missions/2026-10-31-ecran-fermentescibles/v4 r4e-b --page=etat.html --profil=sans-houblons --sans=couleurs
  EXPECT: COMMUN OK
  EVIDENCE: pending

- [ ] G13: r4e-b, contraste
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-contraste.mjs work/missions/2026-10-31-ecran-fermentescibles/v4 r4e-b --page=etat.html
  EXPECT: CONTRASTE OK
  EVIDENCE: pending

- [ ] G14: r4e-b, hauteur
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-hauteur.mjs work/missions/2026-10-31-ecran-fermentescibles/v4 r4e-b --page=etat.html
  EXPECT: HAUTEUR OK
  EVIDENCE: pending

- [ ] G15: le résultat cite la plainte, le choix du plateau et les captures
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-fermentescibles/voies/p5/RESULTAT.md --contient "D211,Toujours visible,captures"
  EXPECT: NOTE OK
  EVIDENCE: pending

- [ ] G16: les captures de r4e-a se refont sans erreur
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/v4/r4e-a/capturer.mjs
  EXPECT: CAPTURES OK
  EVIDENCE: pending

- [ ] G17: les captures de r4e-b se refont sans erreur
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/v4/r4e-b/capturer.mjs
  EXPECT: CAPTURES OK
  EVIDENCE: pending

# Gates: voie p6b — la masse sans clavier sur chaque ligne, côté b (barre tirée)

OWNS: work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b1/, work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b2/, work/missions/2026-10-31-ecran-fermentescibles/voies/p6b/COMPRIS.md, work/missions/2026-10-31-ecran-fermentescibles/voies/p6b/RESULTAT.md

Scope: v5/m1/b.html telle quelle, plus la masse de chaque ligne changée d'un geste sans clavier (D219), par − / + ou par un mini curseur ; deux variantes.

- [ ] G1: la voie est comprise avant de construire
  CHECK: node scripts/agents/systeme.mjs comprendre work/missions/2026-10-31-ecran-fermentescibles/voies/p6b
  EXPECT: COMPRIS OK

- [ ] G2: p6-b1, la masse de chaque ligne se change sans clavier, d'un geste (D219)
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/controle-masse-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b1/etat.html
  EXPECT: MASSE OK

- [ ] G3: p6-b1, le moment de la ligne n'a pas l'air d'un bouton (D218)
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/controle-moment-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b1/etat.html
  EXPECT: MOMENT OK

- [ ] G4: p6-b1, chaque réglage de la ligne se change toujours sur la ligne (D211)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-volee.mjs work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b1/etat.html
  EXPECT: VOLEE OK

- [ ] G5: p6-b1, les gestes de r4d tiennent (masse tapée, retrait, ajout, détail)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-gestes-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b1/etat.html
  EXPECT: GESTES OK

- [ ] G6: p6-b1 se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b1/etat.html --min-images 0
  EXPECT: PAGE OK

- [ ] G7: p6-b1, 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/missions/2026-10-31-ecran-fermentescibles/v6 p6-b1 --page=etat.html --max=80 --profil=sans-houblons
  EXPECT: MOTS OK

- [ ] G8: p6-b1, le cadre commun tient, couleurs mises à part comme r4c
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/missions/2026-10-31-ecran-fermentescibles/v6 p6-b1 --page=etat.html --profil=sans-houblons --sans=couleurs
  EXPECT: COMMUN OK

- [ ] G9: p6-b1, contraste
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-contraste.mjs work/missions/2026-10-31-ecran-fermentescibles/v6 p6-b1 --page=etat.html
  EXPECT: CONTRASTE OK

- [ ] G10: p6-b1, hauteur
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-hauteur.mjs work/missions/2026-10-31-ecran-fermentescibles/v6 p6-b1 --page=etat.html
  EXPECT: HAUTEUR OK

- [ ] G11: les captures de p6-b1 se refont sans erreur
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b1/capturer.mjs
  EXPECT: CAPTURES OK

- [ ] G12: p6-b2, la masse de chaque ligne se change sans clavier, d'un geste (D219)
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/controle-masse-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b2/etat.html
  EXPECT: MASSE OK

- [ ] G13: p6-b2, le moment de la ligne n'a pas l'air d'un bouton (D218)
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/controle-moment-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b2/etat.html
  EXPECT: MOMENT OK

- [ ] G14: p6-b2, chaque réglage de la ligne se change toujours sur la ligne (D211)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-volee.mjs work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b2/etat.html
  EXPECT: VOLEE OK

- [ ] G15: p6-b2, les gestes de r4d tiennent (masse tapée, retrait, ajout, détail)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-gestes-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b2/etat.html
  EXPECT: GESTES OK

- [ ] G16: p6-b2 se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b2/etat.html --min-images 0
  EXPECT: PAGE OK

- [ ] G17: p6-b2, 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/missions/2026-10-31-ecran-fermentescibles/v6 p6-b2 --page=etat.html --max=80 --profil=sans-houblons
  EXPECT: MOTS OK

- [ ] G18: p6-b2, le cadre commun tient, couleurs mises à part comme r4c
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/missions/2026-10-31-ecran-fermentescibles/v6 p6-b2 --page=etat.html --profil=sans-houblons --sans=couleurs
  EXPECT: COMMUN OK

- [ ] G19: p6-b2, contraste
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-contraste.mjs work/missions/2026-10-31-ecran-fermentescibles/v6 p6-b2 --page=etat.html
  EXPECT: CONTRASTE OK

- [ ] G20: p6-b2, hauteur
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-hauteur.mjs work/missions/2026-10-31-ecran-fermentescibles/v6 p6-b2 --page=etat.html
  EXPECT: HAUTEUR OK

- [ ] G21: les captures de p6-b2 se refont sans erreur
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/v6/p6-b2/capturer.mjs
  EXPECT: CAPTURES OK

- [ ] G22: le résultat cite sa demande, le slider et les captures
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-fermentescibles/voies/p6b/RESULTAT.md --contient "D219,slider,captures"
  EXPECT: NOTE OK

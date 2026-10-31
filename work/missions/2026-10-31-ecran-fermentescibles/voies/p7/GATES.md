# Gates: voie p7 — la recherche du champ d'ajout : sous le champ, dans la liste, ou en menu

OWNS: work/missions/2026-10-31-ecran-fermentescibles/v7/s1/, work/missions/2026-10-31-ecran-fermentescibles/v7/s2/, work/missions/2026-10-31-ecran-fermentescibles/v7/s3/, work/missions/2026-10-31-ecran-fermentescibles/voies/p7/COMPRIS.md, work/missions/2026-10-31-ecran-fermentescibles/voies/p7/RESULTAT.md

Scope: v6/p6-b2 telle quelle (son choix, D220), plus l'affichage de la recherche et l'alias ; trois variantes.

- [ ] G1: la voie est comprise avant de construire
  CHECK: node scripts/agents/systeme.mjs comprendre work/missions/2026-10-31-ecran-fermentescibles/voies/p7
  EXPECT: COMPRIS OK

- [ ] G2: s1, la recherche trouve, dit « déjà là », crée, et « Munich » donne Münchner Malz (D220)
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/controle-recherche.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s1/etat.html
  EXPECT: RECHERCHE OK

- [ ] G3: s1, la barre porte toujours la masse (D219)
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/controle-masse-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s1/etat.html
  EXPECT: MASSE OK

- [ ] G4: s1, le moment sans pilule (D218)
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/controle-moment-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s1/etat.html
  EXPECT: MOMENT OK

- [ ] G5: s1, chaque réglage de la ligne se change sur la ligne (D211)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-volee.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s1/etat.html
  EXPECT: VOLEE OK

- [ ] G6: s1, les gestes de la ligne tiennent
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-gestes-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s1/etat.html
  EXPECT: GESTES OK

- [ ] G7: s1 se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s1/etat.html --min-images 0
  EXPECT: PAGE OK

- [ ] G8: s1, 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/missions/2026-10-31-ecran-fermentescibles/v7 s1 --page=etat.html --max=80 --profil=sans-houblons
  EXPECT: MOTS OK

- [ ] G9: s1, le cadre commun tient, couleurs mises à part
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/missions/2026-10-31-ecran-fermentescibles/v7 s1 --page=etat.html --profil=sans-houblons --sans=couleurs
  EXPECT: COMMUN OK

- [ ] G10: s1, contraste
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-contraste.mjs work/missions/2026-10-31-ecran-fermentescibles/v7 s1 --page=etat.html
  EXPECT: CONTRASTE OK

- [ ] G11: s1, hauteur
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-hauteur.mjs work/missions/2026-10-31-ecran-fermentescibles/v7 s1 --page=etat.html
  EXPECT: HAUTEUR OK

- [ ] G12: les captures de s1 se refont sans erreur
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/v7/s1/capturer.mjs
  EXPECT: CAPTURES OK

- [ ] G13: s2, la recherche trouve, dit « déjà là », crée, et « Munich » donne Münchner Malz (D220)
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/controle-recherche.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s2/etat.html
  EXPECT: RECHERCHE OK

- [ ] G14: s2, la barre porte toujours la masse (D219)
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/controle-masse-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s2/etat.html
  EXPECT: MASSE OK

- [ ] G15: s2, le moment sans pilule (D218)
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/controle-moment-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s2/etat.html
  EXPECT: MOMENT OK

- [ ] G16: s2, chaque réglage de la ligne se change sur la ligne (D211)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-volee.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s2/etat.html
  EXPECT: VOLEE OK

- [ ] G17: s2, les gestes de la ligne tiennent
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-gestes-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s2/etat.html
  EXPECT: GESTES OK

- [ ] G18: s2 se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s2/etat.html --min-images 0
  EXPECT: PAGE OK

- [ ] G19: s2, 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/missions/2026-10-31-ecran-fermentescibles/v7 s2 --page=etat.html --max=80 --profil=sans-houblons
  EXPECT: MOTS OK

- [ ] G20: s2, le cadre commun tient, couleurs mises à part
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/missions/2026-10-31-ecran-fermentescibles/v7 s2 --page=etat.html --profil=sans-houblons --sans=couleurs
  EXPECT: COMMUN OK

- [ ] G21: s2, contraste
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-contraste.mjs work/missions/2026-10-31-ecran-fermentescibles/v7 s2 --page=etat.html
  EXPECT: CONTRASTE OK

- [ ] G22: s2, hauteur
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-hauteur.mjs work/missions/2026-10-31-ecran-fermentescibles/v7 s2 --page=etat.html
  EXPECT: HAUTEUR OK

- [ ] G23: les captures de s2 se refont sans erreur
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/v7/s2/capturer.mjs
  EXPECT: CAPTURES OK

- [ ] G24: s3, la recherche trouve, dit « déjà là », crée, et « Munich » donne Münchner Malz (D220)
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/controle-recherche.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s3/etat.html
  EXPECT: RECHERCHE OK

- [ ] G25: s3, la barre porte toujours la masse (D219)
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/controle-masse-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s3/etat.html
  EXPECT: MASSE OK

- [ ] G26: s3, le moment sans pilule (D218)
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/controle-moment-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s3/etat.html
  EXPECT: MOMENT OK

- [ ] G27: s3, chaque réglage de la ligne se change sur la ligne (D211)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-volee.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s3/etat.html
  EXPECT: VOLEE OK

- [ ] G28: s3, les gestes de la ligne tiennent
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-gestes-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s3/etat.html
  EXPECT: GESTES OK

- [ ] G29: s3 se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-10-31-ecran-fermentescibles/v7/s3/etat.html --min-images 0
  EXPECT: PAGE OK

- [ ] G30: s3, 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/missions/2026-10-31-ecran-fermentescibles/v7 s3 --page=etat.html --max=80 --profil=sans-houblons
  EXPECT: MOTS OK

- [ ] G31: s3, le cadre commun tient, couleurs mises à part
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/missions/2026-10-31-ecran-fermentescibles/v7 s3 --page=etat.html --profil=sans-houblons --sans=couleurs
  EXPECT: COMMUN OK

- [ ] G32: s3, contraste
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-contraste.mjs work/missions/2026-10-31-ecran-fermentescibles/v7 s3 --page=etat.html
  EXPECT: CONTRASTE OK

- [ ] G33: s3, hauteur
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-hauteur.mjs work/missions/2026-10-31-ecran-fermentescibles/v7 s3 --page=etat.html
  EXPECT: HAUTEUR OK

- [ ] G34: les captures de s3 se refont sans erreur
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/v7/s3/capturer.mjs
  EXPECT: CAPTURES OK

- [ ] G35: le résultat cite sa question, Munich et les captures
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-31-ecran-fermentescibles/voies/p7/RESULTAT.md --contient "D220,Munich,Dans la liste,captures"
  EXPECT: NOTE OK

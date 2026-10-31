# Gates: voie p4 — r4d, les gestes sur la ligne

OWNS: work/missions/2026-10-31-ecran-fermentescibles/v3/r4d/, work/missions/2026-10-31-ecran-fermentescibles/voies/p4/RESULTAT.md

Scope: r4c reprise telle quelle, avec modifier, retirer et ajouter sur la ligne, et le détail au toucher du nom (D208, D209).

- [ ] G1: les quatre gestes passent au repos et en #replie, à 390 et à 1280
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-gestes-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v3/r4d/etat.html --etats=,replie
  EXPECT: GESTES OK
  EVIDENCE: pending

- [ ] G2: le témoin négatif r4c échoue toujours
  CHECK: node scripts/agents/systeme.mjs echoue "GESTES ECHEC" -- node work/refonte-frontend/v4/tournoi/outils/controle-gestes-ligne.mjs work/missions/2026-10-31-ecran-fermentescibles/v2/r4c/etat.html
  EXPECT: ECHOUE OK
  EVIDENCE: pending

- [ ] G3: la page se rend sans erreur
  CHECK: node scripts/agents/verifier-page.mjs work/missions/2026-10-31-ecran-fermentescibles/v3/r4d/etat.html --min-images 0
  EXPECT: PAGE OK
  EVIDENCE: pending

- [ ] G4: 80 mots au plus au premier écran
  CHECK: node work/refonte-frontend/v4/tournoi/outils/mots-premier-ecran.mjs work/missions/2026-10-31-ecran-fermentescibles/v3 r4d --page=etat.html --max=80 --profil=sans-houblons
  EXPECT: MOTS OK
  EVIDENCE: pending

- [ ] G5: le cadre commun tient, couleurs mises à part comme r4c
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-commun.mjs work/missions/2026-10-31-ecran-fermentescibles/v3 r4d --page=etat.html --profil=sans-houblons --sans=couleurs
  EXPECT: COMMUN OK
  EVIDENCE: pending

- [ ] G6: contraste
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-contraste.mjs work/missions/2026-10-31-ecran-fermentescibles/v3 r4d --page=etat.html
  EXPECT: CONTRASTE OK
  EVIDENCE: pending

- [ ] G7: hauteur
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-hauteur.mjs work/missions/2026-10-31-ecran-fermentescibles/v3 r4d --page=etat.html
  EXPECT: HAUTEUR OK
  EVIDENCE: pending

- [ ] G8: les captures se refont sans erreur, rien de tronqué
  CHECK: node work/missions/2026-10-31-ecran-fermentescibles/v3/r4d/capturer.mjs
  EXPECT: CAPTURES OK
  EVIDENCE: pending

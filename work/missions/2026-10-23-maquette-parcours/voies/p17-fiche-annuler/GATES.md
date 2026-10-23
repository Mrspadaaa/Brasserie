# Gates: voie p17-fiche-annuler — la fiche (D115) et Annuler (D120)

OWNS: prototypes/houblons-v4/parcours/src/ecrans/fiche/**, prototypes/houblons-v4/parcours/src/ecrans/substituer/**, prototypes/houblons-v4/parcours/src/ecrans/levure/**, prototypes/houblons-v4/parcours/src/ecrans/dryhopper/**, prototypes/houblons-v4/maquettes/parcours-p17/**, work/missions/2026-10-23-maquette-parcours/voies/p17-fiche-annuler/RESULTAT.md

Scope: le radar avant la liste dans la fiche g1, et « Annuler » sans effet à côté de l'action sur Substituer, Levure et Dryhopper ; rien d'autre ne change à l'écran.

- [ ] G1: la maquette se construit dans la sortie de la voie
  CHECK: node prototypes/houblons-v4/parcours/outils/construire.mjs --sortie=prototypes/houblons-v4/maquettes/parcours-p17
  EXPECT: CONSTRUIT OK
  EVIDENCE: pending

- [ ] G2: le dossier est typé sans erreur
  CHECK: node prototypes/houblons-v4/parcours/outils/verifier-types.mjs
  EXPECT: TYPES OK
  EVIDENCE: pending

- [ ] G3: le radar passe avant la liste, dans le premier écran (D115)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-fiche-radar.mjs prototypes/houblons-v4/maquettes/parcours-p17
  EXPECT: FICHE-RADAR OK
  EVIDENCE: pending

- [ ] G4: Annuler à côté de l'action, sans effet sur la recette, sur les trois outils (D120)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-annuler.mjs prototypes/houblons-v4/maquettes/parcours-p17
  EXPECT: ANNULER OK
  EVIDENCE: pending

- [ ] G5: la fiche reste g1 (règle n° 1)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-choix.mjs prototypes/houblons-v4/maquettes/parcours-p17 --ecran=fiche
  EXPECT: CHOIX OK
  EVIDENCE: pending

- [ ] G6: le parcours entier joue encore
  CHECK: node prototypes/houblons-v4/parcours/outils/parcours-complet.mjs --sans-construire --dossier=prototypes/houblons-v4/maquettes/parcours-p17
  EXPECT: PARCOURS OK
  EVIDENCE: pending

- [ ] G7: aucun fichier de l'app n'a changé
  CHECK: node prototypes/houblons-v4/parcours/outils/app-intacte.mjs
  EXPECT: APP INTACTE OK
  EVIDENCE: pending

- [ ] G8: le rapport nomme ses captures, côte à côte avec la fiche g1, et la forme d'Annuler
  CHECK: node scripts/agents/systeme.mjs note work/missions/2026-10-23-maquette-parcours/voies/p17-fiche-annuler/RESULTAT.md --contient "D115,D120,consolide-fiche-390,Annuler,390,1280"
  EXPECT: NOTE OK
  EVIDENCE: pending

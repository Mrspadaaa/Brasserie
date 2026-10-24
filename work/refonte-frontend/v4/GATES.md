# Gates : maquette houblons v4, méthode v2 (#119, après D23–D25)

OWNS: prototypes/houblons-v4/**, work/refonte-frontend/v4/**, .impeccable/**

Scope : l'écran 1 de l'outil houblons (« l'arôme de ma recette, lu au style »), conçu selon
`docs/qualite/methode-conception-frontend.md` v2, à partir de `v4/SPEC-BRASSEUR.md`, jusqu'au
choix du brasseur entre trois versions. Révisé le 18.10.2026 : la version précédente
(tournois M1 à M5, archivée dans `tournoi/_archive-v1/GATES-v1.md`) est remplacée ; ses
gates G3 et G4 n'avaient pas de preuve.

- [ ] G0: ce registre énonce des résultats qui peuvent échouer
  CHECK: node .claude/skills/unlazy/scripts/gate-lint.mjs work/refonte-frontend/v4/GATES.md
  EXPECT: LINT OK
  EVIDENCE: pending

- [ ] G1: aucun fichier de l'app n'a changé depuis c8f4c3ae (src, functions, public, package.json de l'app, config, règles Firebase)
  CHECK: node work/refonte-frontend/v4/outils/check-app-intacte.mjs
  EXPECT: APP-INTACTE OK
  EVIDENCE: pending

- [ ] G2: le jeu de données sort du moteur de l'app, avec les ajouts v4 testés (classement au style, citations, plages non situées)
  CHECK: npm --prefix prototypes/houblons-v4 run check:engine
  EXPECT: ENGINE-V4 OK
  EVIDENCE: pending

- [ ] G3: toutes les paroles du brasseur citées dans SPEC-BRASSEUR.md se retrouvent mot pour mot dans une source
  CHECK: node work/refonte-frontend/v4/outils/check-spec.mjs
  EXPECT: SPEC OK
  EVIDENCE: pending

- [ ] G4: le second lot de fils de fer passe tous les contrôles automatiques : au plus 80 mots et au moins 0,80 de remplissage en A et en B, un écran, aucune erreur, au moins 4 boosters qui changent l'écran dont la bascule radar, et les houblons de la recette d'abord avec un ajout en un toucher (D13)
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-lot.mjs work/refonte-frontend/v4/ecran-1/fils2 --mots=80 --fill=0.8 --boosters=4 --radar --recette
  EXPECT: LOT OK
  EVIDENCE: pending

- [ ] G5: les trois versions finales passent les mêmes contrôles automatiques
  CHECK: node work/refonte-frontend/v4/tournoi/outils/controle-lot.mjs prototypes/houblons-v4/maquettes --mots=80 --fill=0.8 --boosters=4 --radar --recette
  EXPECT: LOT OK
  EVIDENCE: pending

- [ ] G6: jury par paires des fils de fer et des versions, dans les deux ordres, avec le taux d'incohérence consigné
  EVIDENCE: pending

- [ ] G7: coup d'œil du brasseur sur les fils de fer consigné mot pour mot dans SPEC-BRASSEUR.md
  EVIDENCE: pending

- [ ] G8: revue des trois versions : impeccable critique, puis relecture neuve qui joue les récits ; captures 390, 412 et 1280 regardées par le pilote après la dernière correction
  EVIDENCE: pending

- [ ] G9: livraison : commits locaux sans .codex/hooks.json, source4-portable-bundle-manifest-01.json ni functions/.env ; Artifact privé ; commentaire #119
  EVIDENCE: pending

- [ ] G10: porte B : choix du brasseur parmi les trois versions, consigné
  EVIDENCE: pending

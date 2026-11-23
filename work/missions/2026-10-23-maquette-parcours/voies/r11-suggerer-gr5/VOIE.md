# Voie r11-suggerer-gr5 — les traits de gr5 dans Suggérer (« top à mettre dans la vraie version »)

- Mission : 2026-10-23-maquette-parcours ; contrat commun des reprises : `../REPRISE-D124.md` (à lire)
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 80 tours ; 3 essais par critère
- Décideur en cas de doute : pilote ; aucune question bloquante
- Étape : reprise

## Ses mots (24.10, soir, sur gr5 dans « Planches · 24.10 »), mot pour mot
« Ça c'est top à mettre dans la vraie version ». gr5 : `work/refonte-frontend/v4/ecran-1/fils24-graphes/gr5/` (NOTE.md, etat.html,
captures `…/fils24-graphes/captures/gr5-repos.png`, `gr5-toucher.png`, `gr5-toucher-c.png`). Il veut ses deux lectures :
- **b, le cran au doigt** : le doigt sur un picto → « Agrumes · +1,6 cran du 16D · ton objectif · avec Motueka » près de lui, le picto cerné ;
- **c, les crans comptés** : au repos, chaque picto montre aussi ses crans vides jusqu'au plus grand de la liste ; on compte sans légende.

## Ce que tu fais
Rends b et c dans Suggérer de la maquette (`prototypes/houblons-v4/parcours/src/ecrans/suggerer/`), sur q2b tel qu'il est rendu, sans
rien perdre : les 18 états de Suggérer (`work/refonte-frontend/v4/choix/etats/suggerer.json`) restent verts, les traits de q2b
gardent leur encodage (contour si la famille baisse, orangé hors du style, D39). Les valeurs viennent du moteur (`data-crans`),
jamais écrites à la main ; l'inconnu n'est pas 0. Note ce que tu as fait dans `NOTE.md` de l'écran (« Reprise gr5 »). Ajoute à
`work/refonte-frontend/v4/choix/etats/suggerer.json` deux états, `etat-sugg-gr5-cran` (toucher d'un picto) et
`etat-sugg-gr5-crans-comptes` (repos), relevés sur sa page gr5 (`page_choisie` = `work/refonte-frontend/v4/ecran-1/fils24-graphes/
gr5/etat.html`, sélecteurs et mots mesurés sur elle, jamais devinés), et pose leurs `data-etat` dans la maquette.

## Possède
`prototypes/houblons-v4/parcours/src/ecrans/suggerer/**`, `prototypes/houblons-v4/maquettes/parcours-suggerer/**`,
`work/refonte-frontend/v4/choix/etats/suggerer.json` (les deux états seulement),
`work/missions/2026-10-23-maquette-parcours/voies/r11-suggerer-gr5/RESULTAT.md`. Construis avec
`--sortie=prototypes/houblons-v4/maquettes/parcours-suggerer`. D'autres voies travaillent sur Substituer et Comparer : n'y touche pas.

## Critères
Dans `GATES.md`. Captures du repos et du toucher, ouvertes à côté de gr5 (L12). Réponse finale : une ligne.

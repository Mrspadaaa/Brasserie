# Voie u-mat — série u, Stocks › Matériel, v0

- Mission : 2026-11-14-materiel
- Agent : concepteur
- Modèle : opus
- Niveau : conception
- Plafond : 60 tours
- Dépend de : a1-analyse
- Décideur en cas de doute : pilote

## Objectif
Quatre mini maquettes statiques (uq1 uq2 uq3 uq4), série libre au brief minimal : ne lis que BRIEF-AUTEUR.md §1 à §6, pas les axes ni les séries : uq1 froide, uq2 tiède, uq3 et uq4 chaudes.
M = `C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-14-materiel`.

## Entrées
- `M/BRIEF-AUTEUR.md` (dossier de conception : lis-le à la place des sources).
- `M/analyse/ANALYSE.md` (problèmes P, parcours manquants M), `M/banc/*.png` (l'actuel, et `ref-articles-*` : la langue d'Articles).
- Sa capture `M/brasseur/14-11-stocks-materiel.jpg`.

## Possède
- `M/v0/u/`, `M/voies/u-mat/`. Rien d'autre.

## Consignes
- Skills `boosters-ux`, `impeccable`, `ui-design-system` chargés avant de dessiner.
- Par variante : `M/v0/u/<id>/etat.html` (états `repos`, `geste`, thème `&theme=cave`) et `NOTE.md`.
- Captures : `node M/socle/capt.mjs v0/u repos,geste uq1 uq2 uq3 uq4` → `<id>-repos-390.png`, `<id>-geste-390.png`, `<id>-repos-cave-390.png`.
  Ouvre chacune (L12), corrige débordement, chevauchement, texte < 12 px, puis recapture.

## Exigences transversales (recopiées, L05)
Baseline = plancher à enrichir (L07) ; en-tête, sous-navigation Stocks, barre du bas et « + » identiques ; 60 mots au plus au
premier écran hors noms ; aucune phrase d'aide au repos ; l'inconnu n'est jamais 0 ; aucun total inventé ; Fable interdit.

## Critères
`GATES.md` du même dossier ; ne pas le modifier.

## Rendre
- `RESULTAT.md` tenu au fil, mis à jour tous les 5 éléments.
- La ligne « Tests » écrite dans un fichier : sans objet (maquettes statiques, pas de `--reporter=dot > …`) : « Tests : sans objet » dans RESULTAT.md.
- Voie d'écran : captures 390 tactile, clair et cave (la 1280 en passe 2), toutes ouvertes.
Réponse finale : une ligne.

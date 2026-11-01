OK — série e : 6 concepts « échelle du matériel », 2 froides, 2 tièdes, 2 chaudes, jouables

## Fichiers écrits (tous sous `work/missions/2026-10-31-ecran-identite/v0/`)
- `e1/` à `e6/` : `etat.html` (390 × 844, classes préfixées par l'id), `NOTE.md`, `eN-haut.png`, `eN-page.png`,
  `etats/{neuve,plein,nolo,long,geste-avant,geste-pendant,geste-apres}.png`.
- `e-serie/src/` : l'assembleur (`assemble.mjs` : en-tête, fil, bandeau, pied et + communs, modèle de calcul commun),
  les corps des six concepts, `etats.mjs` (états et geste), `bandes.mjs` (bandes vides d'une capture), `boites.mjs`.
- `e-serie/controles.txt` : sortie complète de la dernière passe des contrôles.

| id | chaleur | idée | mots | rempli |
|---|---|---|---|---|
| e1 | froide | le champ volume est la jauge du fermenteur, l'ébullition remplit la cuve à côté | 76 | 0,48 |
| e2 | froide | cuve et fermenteur sur une seule règle de 0 à 45 L | 72 | 0,50 |
| e3 | tiède | les deux contenants dessinés à la même échelle, la vapeur, le transfert | 54 | 0,51 |
| e4 | tiède | formulaire à gauche, fermenteur debout gradué à droite, relié au volume | 72 | 0,64 |
| e5 | chaude | cadran d'ébullition tournant, la cuve en coupe perd ~3 L | 55 | 0,61 |
| e6 | chaude | le fermenteur plein écran, l'identité en étiquette collée dessus | 62 | 0,76 |

## Sorties décisives
- `verifier-page.mjs --min-images 0` (×6) : PAGE OK (390 px, sans erreur).
- `mots-premier-ecran.mjs v0 e1…e6 --page=etat.html --max=80` : 76 / 72 / 54 / 72 / 55 / 62, MOTS OK.
- `controle-panel.mjs v0/e*/e?-haut.png` : médiane 0,61, 1 sous 0,50, ressemblance 0,89, 0/15 paire identique, PANEL OK.
- `controle-commun.mjs v0 e1…e6 --page=etat.html --sans=mots,au-style,fiche,trait` : couleurs, survol, blocs, contraste,
  légende, parlant, brutes OK ; standard ECHEC S3 seul (rayons 10 px et 16 px). au-style, fiche et trait visent les
  houblons et leurs familles, absents d'Identité (raison écrite dans chaque NOTE).
- `etats.mjs` : 4 états par concept, le geste change l'écran, retour sous le doigt, mouvement réduit stable, ETATS OK.
- `type="number"` : 0.
- Honnêteté : évaporation de repli marquée « ~ », conseil de 20 % en pointillé vert dit « provisoire » dans la légende
  « ? », limite de 35 L « à vérifier » ; recette neuve : 30 L par défaut dans 30 L → « Fermenteur plein » affiché (le
  défaut réel de l'app, inventaire) ; inconnu en « — », jamais 0.

## Captures à ouvrir
`v0/e1/e1-haut.png` … `v0/e6/e6-haut.png` (toutes ouvertes), et `v0/e3/etats/neuve.png`, `v0/e6/etats/plein.png`,
`v0/e5/etats/geste-apres.png`, `v0/e4/etats/plein.png`, `v0/e1/etats/neuve.png` (ouvertes).

## Prédiction
« e6 et e4 c'est vachement parlant, on voit direct si ça rentre dans le fermenteur ; e5 joli mais l'ébullition prend trop
de place » — e6 et e4 en tête, e1 jugé « trop proche de l'actuel ».

DÉCISION À PRENDRE : `controle-standard.mjs` S3 exige les rayons 2/4/8 px des lots houblons, DESIGN.md fixe 10/16/24 px.
J'ai gardé DESIGN.md (il fait autorité, boosters-ux § 1) ; le contrôle échoue donc sur les six pages. À trancher pour les
7 étapes : aligner S3 sur DESIGN.md, ou les maquettes sur 8 px et pilules (langue de l'étape Houblons).

CONNAISSANCE : `controle-panel.mjs` prend l'id d'une capture dans son nom de fichier : six `capture-haut.png` de dossiers
différents donnent « ressemblance 1,00, 100 % de doubles ». Nommer les captures `<id>-haut.png`
(`verifier-page --captures <dossier>/<id>`).

LEÇON PROPOSÉE : aucune

OK — Comparer r6j : vraies valeurs en colonnes sourcées, lecture « à ta dose », simulé l5b, radar r2

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6j/generer.mjs` : écrit `etat.html` depuis `donnees/comparer-stout.json`.
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6j/etat.html`.
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6j/NOTE.md` : choix portés, ce qui tient, ce qui casse, contrôles, pire contraste.
- Captures dans `work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/` :
  - `r6j-390.png`, `r6j-premier-ecran.png`, `r6j-fiche-390.png`, `r6j-toucher-390.png` ;
  - en plus : `r6j-dose-390.png`, `r6j-legende-390.png`.
- Scripts de capture et de débogage écrits hors du dépôt (`%TEMP%`), rien d'autre dans le dépôt. Des fichiers inconnus sont à la racine (`loupe.html`, `loupe.png`, `pistes-l5f.png`) : ils ne viennent pas de cette voie.

## Critères (rejoués depuis la racine, dernière passe)
- G1 : `COMMUN OK`. COULEURS, AU-STYLE, SURVOL, BLOCS, CONTRASTE, FICHE, STANDARD, TRAIT, LEGENDE, PARLANT et BRUTES sont OK.
- G2 : `r6j 79 mots` → `MOTS OK`.
- G3 : `UNE-QUESTION OK (1 groupe libre : houblon)`. Contexte : bière, base, moment, levure.
- G4 : `ACQUIS OK (4/4 : radar, chimie, osu, valeurs)`. Radar, chimie et OSU sont au repos, les valeurs à un toucher.
- G5 : `ALPHA OK` (3 houblons).
- G6 : `SANS-FAMILLE OK (1 houblon(s) au-dessus de 25 %, part « autres » visible)`. C'est Galaxy, à 29 %.
- G7 : `EXISTENT OK 7`.
- G8 : `NOTE OK`.
- G9 : ce fichier.

Essais :
- G1 en a pris 2 : les rayons de 13 et 11 px des sélecteurs étaient hors échelle, ils sont passés en pilule.
- G2 en a pris 3 : 106, puis 86, puis 79 mots. Le texte a été réduit et le radar repoussé sous le premier écran.
- Les autres critères ont passé au premier essai.

## Captures ouvertes et jugées
- `r6j-premier-ecran.png` :
  - en haut, trois cartes : α, rôle, bande d'arômes (gris « autres » pour Galaxy), dose d'agrumes égaux ;
  - en dessous, la phrase « Plus floral, Idaho 7, mais plus résineux ~ », puis les cinq lignes de vraies valeurs et le simulé en barres de l5b.
- `r6j-390.png` : la page entière, avec le radar r2 (Cascade plein), le panel OSU et le pont vers Dryhopper.
- `r6j-fiche-390.png` : l'appui long sur Galaxy ouvre la fiche courte, avec α du lot et des fiches, « autres : cannabis, dank 29 % », la silhouette et « 9 non décrites ».
- `r6j-toucher-390.png` : Idaho 7 mis en avant (radar bleu plein et sa plage) et « En bière, mesuré » ouvert, avec ses sources.
- Deux défauts vus sur les captures et corrigés :
  - le linalol d'Idaho 7 affichait 12 µg/L : c'était la ligne d'Azacca de E03, c'est maintenant 38 ± 13 µg/L ;
  - des arrondis effaçaient des nombres (10,4 → 10 ; 3,86 → 3,9).
- `r6j-dose-390.png` et `r6j-legende-390.png` ont aussi été regardées.

**Prédiction** : « Là on voit enfin les vrais valeurs côte à côte et pourquoi Idaho 7 est plus floral, c'est pas mal, mais le radar est encore chargé avec la bande. »

## Doutes et limites
- La réponse en une phrase repose sur les centres du simulé ; les plages se recouvrent toutes. La lecture « dose » (dose × huile × part) va dans le même sens, mais c'est un ordre de grandeur : le % d'huile est une aire GC.
- La couleur d'Idaho 7 passe du rouge du lot 21 au bleu pétrole (#17659a), pour qu'il se distingue de Cascade (bordeaux) sur le radar. Cela touche D51 et la cohérence entre variantes.
- Sur le radar, un axe inconnu porte 0 dans `data-valeurs`, parce que le contrôle exige un nombre. `data-inconnu` le signale et le dessin le hachure.
- Deux lectures hors de `comparer-stout.json` : les titres des sources et les liens composé → famille, pris dans composes-houblon.json. Ce fichier est cité par `sources.composes`, et aucune valeur chiffrée n'en vient.
- Le stock d'Idaho 7 n'est pas montré : son α est « lu sur l'article », sans quantité.

DÉCISION À PRENDRE : quelle couleur pour Idaho 7 dans Comparer ?
- Options : (a) le bleu pétrole de r6j ; (b) le rouge #e80030 du lot 21, proche du bordeaux de Cascade.
- Recommandation : (a) dans tout le lot 22, pour que les trois séries du radar se distinguent. À fixer par le pilote, puisque toutes les variantes doivent partager les mêmes couleurs.

CONNAISSANCE : dans `comparer-stout.json`, `echelle.parFamille[f].domaine` est une plage `[0, max]`, pas un nombre. Les mesures de panel (`panels[].mesures`) mêlent plusieurs variétés : il faut filtrer sur `variete` (E03 contient aussi Azacca et Sultana). À agrumes égaux, Idaho 7 (~7,5 g/L) charge le plus de géraniol (≈0,38–2,3 µL/L contre ≈0,02–0,52 pour Cascade à 4 g/L), mais aussi le plus de myrcène. Cela concorde avec le simulé (floral +32 contre +16, résineux +29 contre +19).

LEÇON PROPOSÉE : avant de lire un champ de mesure dans un JSON de panel, filtrer sur la variété et rouvrir la capture en comparant chaque nombre à la source. La valeur d'Azacca (12 µg/L) était passée pour celle d'Idaho 7, et aucun contrôle ne l'a vu : seule la relecture de la capture l'a trouvée.

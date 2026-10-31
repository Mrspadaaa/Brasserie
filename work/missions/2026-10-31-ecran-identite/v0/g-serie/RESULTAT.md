OK — série g : 6 concepts « le geste d'abord » (2 froides, 2 tièdes, 2 chaudes), PANEL OK, MOTS OK

## Fichiers écrits (seulement dans v0/g*/)
- `v0/g1` à `v0/g6` : `etat.html`, `NOTE.md`, `capture-haut.png`, `capture-page.png`, `capture-apres.png` (après un geste joué).
- `v0/g4` à `v0/g6` en plus : `capture-etat-plein.png` et `capture-etat-neuve.png`.
- `v0/g-serie/RESULTAT.md`.
- Hors dépôt, dans le brouillon de session : le socle (en-tête, fil, bandeau, pied tels que sa capture), l'assembleur et les scripts de
  gestes et d'états.

| id | chaleur | idée (une seule) | mots | remplissage |
|---|---|---|---|---|
| g1 | froide | la baseline en rangées ; chaque valeur a son − + au bord droit et son effet dessous | 67 | 0,34 |
| g2 | froide | l'œil en haut (jauges fermenteur et cuve), le pouce en bas (console de réglage) | 73 | 0,58 |
| g3 | tiède | trois questions numérotées, trois rails de puces ; la puce choisie est la réponse | 77 | 0,50 |
| g4 | tiède | deux molettes ; celle du volume est le fermenteur (moût gris, repère, mur « plein ») | 75 | 0,61 |
| g5 | chaude | une seule réglette sombre, branchée sur Volume, Ébullition ou Espace libre | 75 | 0,56 |
| g6 | chaude | deux anneaux concentriques à tourner ; l'anneau extérieur est le fermenteur | 74 | 0,56 |

## Sorties décisives
- `verifier-page.mjs` × 6 : `PAGE OK (0 images chargées, 390 px, sans erreur)`.
- `mots-premier-ecran.mjs v0 g1…g6 --max=80 --page=etat.html` : `MOTS OK` (67 à 77).
- `controle-panel.mjs` (sur des copies renommées g1.png…g6.png, voir CONNAISSANCE) : `remplissage médian 0,56, 1 sous 0,50 ·
  ressemblance moyenne 0,86 · paires presque identiques 0/15` → `PANEL OK`.
- `controle-commun.mjs v0 g1…g6 --page=etat.html --sans=mots,fiche,trait,legende,au-style` : couleurs, survol, blocs, contraste,
  parlant et brutes OK ; `COMMUN ECHEC 1` = STANDARD.
  - Raison des `--sans` : fiche, trait, legende et au-style ne visent que les houblons, absents de l'écran Identité ; mots est joué à
    part, à 80.
  - STANDARD, S3 : rayons de 10, 16 et 24 px, ceux de DESIGN.md, contre 2, 4 et 8 px attendus.
  - STANDARD, S4 : le seul trait d'icône à 2,3 px est le + flottant, commun aux 7 étapes et hors périmètre (J12).
- `type="number"` : 0 dans les 6 pages.
- Captures ouvertes : `capture-haut` des 6, `capture-apres` de g4 et g6, `capture-page` de g1, états plein (g5) et neuve (g6).

## Prédiction
Il s'arrêtera sur g4 (la molette-fermenteur) et sur g6 (l'anneau), « visuellement frappant ». Il trouvera g1 juste, mais
trop proche de l'actuel, et g3 claire, mais vide en bas.

## DÉCISION À PRENDRE
- STANDARD S3 :
  - `controle-standard.mjs` impose les rayons de la base Houblons (2, 4, 8 px), DESIGN.md ceux de l'app (10, 16, 24 px) ;
  - J3 (« dans la langue de l'étape Houblons ») les met en conflit pour Identité ;
  - j'ai suivi DESIGN.md (lecture étroite, réversible) ;
  - au pilote : fixer l'échelle des rayons des écrans refaits « comme houblons ».

## CONNAISSANCE
- Trois pièges des outils de lot, vus le 31.10 :
  1. `controle-panel.mjs` prend le nom de base du fichier comme identifiant : six `capture-haut.png` donnent une ressemblance de 1,00 et
     100 % de doubles (faux échec). Il faut des noms distincts, ou identifier les captures par le chemin.
  2. `mots-premier-ecran.mjs` compte le texte d'un `<details>` fermé : Chrome lui donne une boîte, et g1 passait de 67 à 98 mots.
  3. `mots-premier-ecran.mjs` compte aussi les rangs d'un conteneur à défilement, rognés hors de sa boîte (une molette : 101 mots).
  Un repli se fait en `hidden`, avec `[hidden]{display:none!important}` : sinon `display:grid` l'écrase.
- `controle-contraste` mesure un texte sur le fond de son propre élément : une bande de sélection posée en frère (absolue) donne un faux
  1,09:1. Le fond va sur la rangée elle-même.

## LEÇON PROPOSÉE
Avant de corriger un échec de contrôle, lire ce que l'outil mesure. Ici, 3 des 5 échecs venaient de l'outil (identifiant par nom de
fichier, texte replié compté, fond d'un frère ignoré), pas de la maquette. Rôles : concepteur, exécutant.

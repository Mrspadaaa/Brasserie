# Fil de fer gris, lot 2 — écran 1 (brief auteur, une page)

Tu dessines un **fil de fer basse fidélité** d'un écran mobile de L'Affinée (app de
micro-brasserie) : des gris, un seul accent, une police système. On juge la structure, la
densité et les gestes, pas la décoration. Écris en français. Répertoire :
C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie (chemins absolus). Texte avec
barres obliques inverses ou accents graves : outil Write, jamais Bash. Fichiers de travail
dans un sous-dossier à toi du scratchpad.

## Ce qui a changé depuis le lot 1

Le brasseur a vu les 3 meilleurs fils de fer du lot 1 : « C'est mieux […] pas assez
dense. » ; « on peut aussi basculer d'un affichage à un autre, type bare graph à radar
graph. » ; « D'autres type de UX booster du genre doivent être mis en avant. » Le lot 1
laissait la moitié basse de l'écran vide et n'avait aucun geste.

## Changement d'ordre (prime sur tout le reste)

Le brasseur, après le lancement de ce lot : « Comme pour les Malts j'ai besoin d'avoir des
le premier coup d'œil, quel matière première j'ai, et et je peux ajouter en un click ultra
facilement. Ensuite seulement je peux ouvrir mon panel de comparatif ». Lis la section
« Ordre de l'écran » de `PRIORITE.md` et regarde la capture de l'étape Malts :
`C:\Users\mrspa\.claude\uploads\055d83f7-e384-467e-9f02-749828cb09f6\290e929c-image.jpg`.

- `index.html` (état A) : **l'étape Houblons de la recette** : en-tête, houblons de la
  recette d'abord (`data-role="houblons-recette"`, lignes `data-role="ligne-houblon"`),
  ajout en un toucher (`data-role="ajout-rapide"` : un toucher ajoute une ligne), puis la
  ligne qui ouvre le panneau d'analyse (`data-role="panneau"`), avec un aperçu dense de la
  lecture au style si la place le permet.
- `etat-b.html` : le panneau ouvert, après « + floral, − résineux » : lecture au style,
  voies, comparer.
- `radar.html` : le panneau ouvert, lentille Radar.
- Contrôle : ajoute `--recette` à la commande `controle-lot.mjs` ; il doit imprimer `LOT OK`.

## Lis (et rien d'autre)

1. `work/refonte-frontend/v4/ecran-1/CADRAGE.md` et `PRIORITE.md` (même dossier), **section
   « Lot 2 » comprise** : le plan 1 complété (12 familles visibles en compact, bascule
   Barres / Radar, houblons de la recette, houblons du stock adaptés au style en A, voies
   en B).
2. `docs/ux-boosters.md` : le catalogue des boosters.
3. `work/refonte-frontend/v4/DEFAUTS-RECURRENTS.md` : les défauts qui font échouer un fil de
   fer, avec les mots du brasseur.
4. `work/refonte-frontend/v4/reference/brasseur-2026-10-18/README.md` et, avec Read,
   `clyhealth-3.png`, `solaire-ia-1.png`, `stardog-2.png`.
5. Les chiffres : `prototypes/houblons-v4/data/pack-mini-protos.json` (extrais avec node :
   `styles.16D`, `scenarios.S1.before`, `S1.direction`, `S1.voies` (5 premières), `stock`
   (noms, quantités, `exhausted`), `S1.recipe`).

## Livrable, pour chaque numéro que ton message te donne

`work/refonte-frontend/v4/ecran-1/fils2/pNN/` : `index.html` (état A, lentille Barres),
`etat-b.html` (état B, après « + floral, − résineux »), `radar.html` (état A, lentille
Radar), et `NOTE.md` (5 lignes : le parti ; les boosters et le récit que chacun sert ; ce
qui est replié).

## Règles

- 390 × 844 : tout le plan 1 dans le premier écran, **sans moitié vide** (remplissage
  ≥ 0,80), **80 mots au plus**, **3 tailles de texte au plus**, aucun bloc de texte de plus
  de 2 lignes, pas de légende, pas de note du moteur.
- **Au moins 4 boosters qui marchent au toucher**, chacun marqué `data-booster="nom"` sur
  l'élément qu'on touche, dont la **bascule Barres / Radar** (`data-booster="lentille
  radar"`) qui change l'affichage pour les mêmes données. Un geste de glisser a toujours
  une alternative au simple toucher (WCAG 2.5.7) : c'est elle qui porte `data-booster`.
- Le radar reste **au style** : axes zoomés sur la bande de chaque famille, bande dessinée.
- Gris de #111 à #f5f5f5, un seul accent ; police système ; cibles d'au moins 24 px ; pas
  de texte anglais, pas de « (s) », virgule décimale.

## Contrôle, avant de t'arrêter

`node work/refonte-frontend/v4/tournoi/outils/controle-lot.mjs work/refonte-frontend/v4/ecran-1/fils2 pNN [pMM] --radar`

Il doit imprimer `LOT OK`. Regarde aussi tes captures (`fils2/captures/pNN-390.png`,
`pNN-b-390.png`, `pNN-radar-390.png`, `pNN-oeil.png`, et `captures/boosters/`). Corrige
jusqu'à `LOT OK` (trois passes au plus), puis arrête-toi. Réponse finale : une ligne par
fil de fer (parti, mots A/B, remplissage A/B, boosters).

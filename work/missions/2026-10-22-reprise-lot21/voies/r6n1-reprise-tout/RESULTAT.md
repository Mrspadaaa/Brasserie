OK — r6n1 : r6a et les 37 éléments de l'inventaire au repos, en 70 mots

## Fichiers écrits
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6n1/generer.mjs` (copie enrichie de r6a), qui écrit `r6n1/etat.html`
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6n1/NOTE.md` (Choix portés, règle du radar D103, `## Reprise`, ce qui tient et ce qui casse)
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/r6n1/captures.mjs`
- `work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/r6n1-*.png` (10 captures)

## Tableau de reprise (27 repris, 2 en contexte, 8 en pont, 0 écarté)
| Élément | Statut | Où |
|---|---|---|
| y1b-face-a-ta-stout | repris | réponse en tête, recalculée au toucher ; « pourquoi ? » à un toucher |
| y1b-pastille-critere | repris | « par [floral ⌄] » : floral, agrumes, tropicaux ; range les colonnes, met le premier en avant |
| y1b-jauge-amertume | repris | « IBU ? » hachuré à cru, et ≈ IBU à 10′ du houblon en avant (suit l'α) |
| y1b-dock-pouce | en pont | Dryhopper : frise du brassin en miniature, jeton sur « après » |
| y1b-plan-d-avant | repris | trait noir de ta stout dans chaque barre et piste |
| y1b-bandes-style | repris | barres au style : zone 16D, orangé, hachuré, flèche au-delà |
| y1b-ligne-contexte | en contexte | 16D, = 4 g/L, après 3 j, US-05 |
| y1b-defi | repris | « Défi 2/4 », quatre cases à un toucher |
| y1b-tirage-preuve | repris | « Tire 20 » (points sur les barres) et « Preuve » (chimie, vraies valeurs) |
| y1b-levure-pastilles | en pont | Levure : US-05 contre Pomona en deux barres |
| y1b-second-houblon-puis | en pont | Dryhopper : second jeton en pointillé sur « puis » |
| y3-panel-osu | repris | vignette à côté du radar, sans molette |
| y3-pour-egaler | repris | dose d'effet égal sous agrumes et tropicaux (« > 8 g/L » : jamais) |
| v1-vraies-valeurs | repris | trait fin mesuré sous la barre simulée ; nombres sous Preuve |
| v1-en-a-plus | repris | qui en a le plus prend sa couleur dans le trait mesuré |
| v1-linalol-en-biere | repris | vignette log 10–1000 µg/L, ≠ pas comparables |
| w2-piste-commune | repris | pistes d'objectif : une règle, un trait par houblon |
| w2-cartes-verdict | repris | ✓ dans / ⚠ sort en tête de colonne |
| x3b-cuve-jour-apres-jour | en pont | Dryhopper, nommé dans le lien |
| a2b-ce-que-la-levure-change | en pont | Levure, aperçu Pomona |
| d1-tout-ouvert | repris | chimie ouverte mais rangée : un trait par rangée de famille |
| l5b-barres-voie | repris | barres de chaque cellule |
| l5b-pistes-objectif | repris | Floral ↑ et Résineux ↓, visée, verdict en mot |
| l8-disposition | repris | objectifs en tête, colonnes, rangées de familles communes |
| l8b-verdicts-pictos-trait | repris | ✓ →\| ∅, pictos au trait |
| l8b-legende-cachee | repris | « ? » en haut à droite |
| l5f-carte-role-alpha | repris | tête : nom, α, rôle en mot, familles, stock en icône |
| m4-radar-degustation | en contexte | « trop » résineux, « plus » floral dans la ligne de contexte |
| h4-radar-demande | repris | flèches au bout des axes Floral et Résineux |
| p03-plages-sources | repris | α en tête ; plages par source sous Preuve |
| p03-radar-superpose | repris | radar r2 |
| p06-grille-familles | repris | familles marquées et citées en tête de colonne |
| p02-radar-intervalle | repris | intervalle en trait sur chaque axe (D103) |
| s5-deux-objectifs | en pont | Suggérer, dans la piste Résineux |
| p4-plus-comparaison | repris | « + » : Nelson Sauvin en 4e colonne ; × le retire |
| g1-fiche | en pont | ⓘ de chaque colonne, ou appui long |
| fiche-citra-cryo | en pont | même ⓘ, fiche courte |

## Sorties décisives (rejouées depuis la racine)
- G1 : `COMMUN OK`
- G2 : `r6n1 70 mots` puis `MOTS OK`
- G3 : `UNE-QUESTION OK (1 groupe libre : houblon)`
- G4 : `ACQUIS OK (4/4 : radar, chimie, osu, valeurs)` (radar et OSU au repos, chimie et valeurs à un toucher)
- G5 : `ALPHA OK`
- G6 : `REPRISE OK (27 repris, 2 en contexte, 8 en pont, 0 écartés)` avec `--premier-ecran`
- G7 : `PAGE OK (0 images chargées, 390 px, sans erreur)`
- G8 : `EXISTENT OK 7`
- G9 : `NOTE OK`
- `captures.mjs` : `CAPTURES r6n1 OK`, sans erreur de console ni de page.

## Captures ouvertes (`work/refonte-frontend/v4/ecran-1/fils22-comparer/captures/`)
r6n1-premier-ecran.png, r6n1-390.png, r6n1-toucher-390.png (Défi ouvert et Tire 20), r6n1-fiche-390.png (appui long
sur Cascade, fiche g1), r6n1-preuve-390.png, r6n1-critere-390.png, r6n1-agrumes-390.png, r6n1-nelson-390.png,
r6n1-absolu-galaxy-390.png et r6n1-legende-390.png. Défauts vus sur capture puis corrigés :
- barres de Preuve invisibles : collision de classe interne `r6n1-vb` ;
- note du linalol en bière placée avant les cellules ;
- noms en quatre colonnes qui se chevauchaient ;
- rayons du radar trop épais.

## Prédiction
« Là c'est r6a avec tout dedans, ça répond direct, Idaho 7 et pourquoi. Mais c'est dense, et c'est quoi les petits
traits sous les barres et les "=" ? »

DÉCISION À PRENDRE :
- La visée des objectifs (« un cran du style ») vient de moi, pas des données. Elle fait « Atteint » pour Idaho 7.
  Il faut la valider ou la fixer, par exemple dans le registre des objectifs du brasseur.
- L'IBU de la stout (≈ 60 dans y1b) n'est pas dans `comparer-stout.json`. La jauge ne dit que « ? » à cru, avec
  l'IBU à 10′ calculé. Faut-il ajouter l'IBU de la recette aux entrées du lot ?
- Couleur de Nelson Sauvin : #1a5e8a, prise pour cette page, à fixer pour toute l'app (D51, D83).

CONNAISSANCE :
- `mots-premier-ecran` découpe sur `\s`, qui couvre aussi les espaces insécables U+00A0 et U+202F. Un « ? » français
  compte donc pour un mot. « 7,5g/L », sans espace, en compte un seul.
- Le script de la fiche (`runtime` de `noyau.mjs`) déclare des constantes globales (`NS`, `h`, `css`…). Le code
  client d'une variante doit être enveloppé dans une fonction immédiate.
- Après fermentation, Pomona et US-05 donnent le même profil dans la grille. Seul le dry hop actif les distingue.

LEÇON PROPOSÉE : L26 étendue. Préfixer protège du socle, mais pas des collisions internes à la variante.
`r6n1-vb` (verdict de piste) a effacé les barres de Preuve, sans qu'aucun contrôle bouge ; seule la capture de
l'état ouvert l'a montré. Faire : un nom de classe par rôle, vérifié par une recherche des sélecteurs en double dans
le CSS généré, et capturer chaque état ouvert.

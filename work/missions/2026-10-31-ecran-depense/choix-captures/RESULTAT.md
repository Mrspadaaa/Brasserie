OK — page de choix, 6 options (A référence, B à F) en 18 mini maquettes

C-CAPTURES OK — 6 options — choix-captures/index.html

Voie c-captures, 02.11, agent concepteur (Opus). Je n'ai touché ni au code de l'app ni aux données réelles. Aucun commit, aucun serveur Vite. Skill `boosters-ux` chargé. `impeccable` n'a pas été chargé : j'ai repris telle quelle la forme acceptée de `choix-nom` et son verdict e-t8.

## Fichiers écrits (tous sous `choix-captures/`)
- `index.html` : la page de choix. Titre daté du 02.11, `#a-choisir` en tête, `[data-choix="plusieurs-captures"]`. A est en `data-reference`, B à F en `data-variante`. Chaque vignette est un lien vers son image et s'ouvre dans la visionneuse `dialog`.
- `maquettes/{a..f}-{entree,pendant,lue}.html` : 18 pages statiques à 390 px, en thème clair.
- `img/*.png` : les 18 captures (×2).
- `outils/gen.mjs` écrit et capture les maquettes. `outils/page.cjs` et `outils/page.css` écrivent la page (la feuille vient de `choix-nom`, avec une règle de hauteur de tête en plus).
- `controle-haut.png`, `controle-page.png`, `controle-ordinateur.png` : les captures du contrôle 2.

## Les options (seuls le geste d'entrée des pages et leur trace dans l'en-tête varient)
Trois vues par option : **Entrée** (l'état vide d'ExpenseSheet), **Pendant l'ajout**, **Dépense lue** (en-tête, justificatif ouvert au toucher, bandeau, preuve, bandes, pied). Un cadre bleu marque ce qui change. Les vignettes identiques au pixel (vérifié par md5) sont grisées et portent un badge « = X » : b-entree = A, e-entree = C, f-pendant = D, c/d/e/f-lue = B.
- **A, aujourd'hui** : un seul fichier. Pendant l'ajout, un cadre jaune pointillé montre l'étape faite hors de l'app (« 3 captures → 1 PDF »), puis l'état « lecture » actuel du PDF. Dépense lue : l'icône du document, « Ouvrir le PDF original » et « Changer », comme dans `Entete.tsx` aujourd'hui. Sous la tête de A, la mesure du pilote : PDF de 3 pages lu 9/12 en ligne, 3 images lues 11/12 au banc (doc10).
- **B, « + page »** : l'entrée est celle d'aujourd'hui. Ensuite, une rangée de vignettes numérotées avec un ×, une tuile « + page » et le bouton « Lire 2 pages ». **Sans délai** automatique : pendant qu'il cherche la page suivante dans Photos, un délai lancerait la lecture trop tôt. Prix : un toucher de plus pour une facture d'une page.
- **C, plusieurs d'un coup** : l'entrée a une icône « plusieurs fichiers » et la note « PDF ou images, plusieurs d'un coup ». La lecture part tout de suite. On voit la page 3 soulevée, glissée avant la page 2 (barre bleue d'insertion), pendant la frise « envoi ✓ · lecture ».
- **D, mode pages à l'appareil photo** : bouton « Photographier les pages ». Après chaque photo : la feuille en grand, les pages déjà prises, « + page » et « Terminer · 2 pages ». Les captures d'écran restent comme aujourd'hui (un seul fichier).
- **E, ajoutée (B + C)** : plusieurs pages choisies d'un coup, « + page » pour ajouter une photo (la page 3 porte un picto d'appareil), puis « Lire 3 pages ».
- **F, ajoutée (C + D), proposée** : les captures comme C, le papier comme D. Une facture d'une page reste un seul geste, comme aujourd'hui.
- **Trace dans l'en-tête (B à F, la même)** : à la place de l'icône du document, une petite pile de trois pages et « 3 ». Au toucher, un panneau s'ouvre avec les trois vignettes numérotées et « Changer ».

Valeurs, toutes fictives : Malzhaus Nord, 14.10.2026, 48,70, 6 lignes. Malts 26,40 (9,60 + 14,50 + 2,30), Houblons 12,30 (5,80 + 6,50), Levures 10,00. Fichier « commande-malzhaus.pdf » de 1,4 Mo ; les pages font 2,1 Mo. Rien n'est recopié des captures f3 : elles n'ont servi que pour l'aspect (`e-bout/essai3/390-01-etat-vide.png`, `p3c-port/captures/tactile390-lecture.png`, `f3-rangees/captures/tactile390-clair-repos.png`).

## Contrôles et sorties
1. `controle-page-choix.mjs … --min=3` → `plusieurs-captures : OK (5 variantes, 6 par rangée à 1280, 2 à 390)`, puis `PAGE-CHOIX OK (1 choix)`. Le premier passage donnait 5 par rangée : la tête de A était plus haute. J'ai raccourci les textes et fixé la hauteur des têtes (9,6em à 1280).
2. `verifier-page.mjs … --page-lot --captures …/choix-captures/controle` → `PAGE OK (18 images chargées, lisible à 390 et 1280 px, sans erreur)`.
3. `controle-choix` est sans objet : l'écran Dépense n'est pas dans `ecrans.json` (`grep -ci depense` → 0). La base est l'écran actuel (f3 et p3c-port : état vide, état « lecture », Entete, Bandeau, Preuve, rangées, pied).
4. `grep CHF` sur les maquettes : 6 occurrences, toutes l'étiquette « CHF » du bandeau, aucune valeur réelle.

## Captures ouvertes
- `img/b-lue.png` : la pile « 3 » encadrée, le panneau 1 · 2 · 3, puis le bandeau et les bandes, lisibles.
- `img/a-lue.png` : la référence PDF.
- `img/c-pendant.png` : le glisser se lit (page soulevée, barre d'insertion).
- `img/d-pendant.png` : l'écran sombre de l'appareil, « + page » / « Terminer ».
- `img/e-pendant.png` : deux captures et une photo.
- `img/f-entree.png` : deux cadres, bouton et photo.
- `img/a-pendant.png` : l'étape « ailleurs » en jaune.
- `controle-ordinateur.png` : 6 colonnes alignées, les « = A / = C / = D » visibles.
- `controle-haut.png` : la question, la proposition, puis A et B au premier écran.
- `controle-page.png` : 2 vignettes par rangée, sans débordement.

## Ce qui reste douteux
- Dans B, B et E, le bas de « Pendant l'ajout » est vide : avant « Lire », l'écran n'a rien d'autre. C'est fidèle, mais ce blanc se voit.
- D-lue est identique à B-lue : la trace montre des pages au format capture, alors que les pages de D sont des photos de papier. La trace ne change pas d'une option à l'autre, seul le contenu des vignettes changerait.
- La revue photo de D et F (« + page », « Terminer ») est un écran neuf de l'app, après chaque retour de l'appareil (`capture="environment"`). Ce n'est pas un viseur intégré.
- La proposition F est mon avis, pas celle du pilote. Le pilote peut l'enlever (une ligne dans `outils/page.cjs`).

Prédiction : il regarde A, voit « un PDF à faire ailleurs », et dit « C, et D pour le papier, donc F ; mais pas de bouton Lire en plus ».

DÉCISION À PRENDRE : aucune dans ce contrat.
CONNAISSANCE : aujourd'hui, l'entrée d'ExpenseSheet n'accepte qu'un fichier. `fileInput` : `accept` sans `multiple`. `cameraInput` : `capture="environment"`. `onChange` ne lit que `files?.[0]`, et le dépôt par glisser aussi (`dataTransfer.files?.[0]`). C et F devront changer ces trois endroits.
LEÇON PROPOSÉE : aucune

## Reprise e-t10 (verdict `critique/VERDICT-c-captures.md`, ACCEPTÉ, deux majeurs)
- **Majeur 1, le bas vide de B et E** : sous la rangée de pages de `b-pendant` et `e-pendant`, la même partie basse que `c-pendant`.
  - La frise : « envoi ✓ » pour les pages déjà choisies, « lecture » et « vérification » en gris. La lecture attend « Lire ».
  - Puis le cadre « Les lignes arrivent ici », « Pour quoi ? après la lecture » et « Règlement Déjà payé · À payer ».
  - Les trois « Pendant » se comparent à hauteur égale.
- **Majeur 2, « Proposée : F »** : l'en-tête devient « Proposée : F — captures plusieurs d'un coup, papier page à page ; une page reste un geste. Mais pas de + page après coup : pour ça, E. ». La phrase « les six restent ouvertes… un seul justificatif va au Drive » passe au paragraphe suivant. La tête de F se termine par « ; pas de + page après coup ».
- **Mineurs faits** :
  - « CARABELGE » devient « Malt caramel belge ». « Malt Pilsner » devient aussi « Malt pâle » : le grep a trouvé « Malt Pilsner Premium » dans `f3-rangees/bout/E/report.json`, une de ses vraies pièces (doc14).
  - La légende « captures choisies ensemble · photo ajoutée » est ôtée de `e-pendant`. Celle de B, « ajoute la suivante, puis Lire », est gardée.
  - La preuve « Lectures 2/2 » devient « ✓ 3 pages lues », dans les six `*-lue`.
  - La tête de D devient « Après chaque photo : « + page » ou Terminer. Les captures : comme aujourd'hui. »
- **Mineurs laissés** :
  - Le panneau des pages de `*-lue` n'est pas compacté.
  - Le cadre « ailleurs » de A reste, avec sa tête.
  - Rien n'est ajouté sur le recadrage de f3.
  - Ces trois points n'étaient pas dans la demande du pilote.
- **Grep des noms de ses pièces** sur `maquettes/` et `index.html` : carabelge, rauchshop, carafa, wiener, melanoidin, pilsner, special w, styrian, wyeast, ekuanot, target, omega, candi, maris, gersten, röst, caramünch, weizen, hafer, goldings, galaxy, nelson, sabro, hallertau → 0, à part `e.target` dans le script de la visionneuse.
  - Saaz et Cascade (fictifs ici) ne paraissent dans aucune pièce de la mission. « Cascade CH » n'apparaît que comme exemple dans BRIEF-ECRAN et COMMUN.
- **Vignettes identiques au pixel** : inchangées, b-entree = A, e-entree = C, f-pendant = D, c/d/e/f-lue = B.
- **Rejoué** :
  - `controle-page-choix.mjs --min=3` → `plusieurs-captures : OK (5 variantes, 6 par rangée à 1280, 2 à 390)`, `PAGE-CHOIX OK (1 choix)`.
  - `verifier-page.mjs --page-lot` → `PAGE OK (18 images chargées, lisible à 390 et 1280 px, sans erreur)`.
- **Ouvertes** :
  - `img/b-pendant.png` : frise envoi ✓, lecture grise, cadre, Pour quoi et Règlement.
  - `img/e-pendant.png` : idem, sans légende.
  - `img/b-lue.png` : « Malt pâle », « Malt caramel belge », « ✓ 3 pages lues ».
  - `controle-haut.png` : la ligne « Proposée : F — … pour ça, E. », puis le paragraphe des six.

## Son choix (02.11, D291) et maquette retenue
- Page : en tête, une ligne « Son choix (02.11) : B, avec le bouton noir coupé en deux » ; badge « choisie » sur B ; les six colonnes inchangées.
- Rejoué :
  - `PAGE-CHOIX OK (1 choix)` (5 variantes, 6 par rangée à 1280, 2 à 390) ;
  - `PAGE OK (18 images chargées, lisible à 390 et 1280 px, sans erreur)` ;
  - `controle-ordinateur.png` ouvert.
- `outils/gen.mjs` exporte ses pièces (exécution gardée) et attend 250 ms avant chaque capture. Le rendu variait d'un passage à l'autre ; les groupes « = X » ont été revérifiés au md5 sur la dernière génération.
- Maquette retenue : `retenue/`, 9 états (3 formes de la coupe, un document = aujourd'hui, plusieurs ×3, lue ×2). Voir `retenue/RESULTAT.md`.

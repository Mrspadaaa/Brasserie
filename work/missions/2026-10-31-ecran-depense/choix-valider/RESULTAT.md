OK — page de choix D313, reprise 1 : « Tout valider » prend le ↻ de la puce, 4 options sur son 2 D

L2B-VALIDER OK — 3 options et sa référence, reprise 1 (majeur e-t14 levé) — choix-valider/index.html

Voie l2b-valider, 02.11, agent concepteur (Opus), le même que l2-lignes. Je n'ai touché ni au code de l'app ni aux données réelles. Aucun
appel Gemini, aucun commit, aucun serveur Vite. J'ai écrit dans `choix-valider/`, et dans `choix-lignes-38/` pour une seule réparation, dite
plus bas (§ « Réparation »). J'ai suivi le skill `boosters-ux`, déjà chargé pour l2-lignes. J'ai lu les verdicts e-t13 (`VERDICT-l2-lignes.md`)
et `VERDICT-l3-cas.md`, et je n'ai pas refait leurs défauts :
- aucun nombre de l'en-tête ne change sans marque : l'imprimé reste 46,40 partout ;
- aucun pointillé ne recouvre le filet de famille ;
- le mot est « pas retrouvée » ;
- une seule action noire par vue (Confirmer).

## La base (règle n° 1)
Sa maquette est `choix-lignes-38/maquettes/q2-d-arrivee.html`, son choix 2 D. Elle est reprise par son propre code : `outils/gen.mjs` recopie
celui de choix-lignes-38, avec `ecran()`, `ligne()`, `Q2V` et `page()` inchangés. Deux preuves d'identité :
- `HAUT=780 node outils/gen.mjs --identite-2d` → `IDENTITE-2D OK (20142 octets, HAUT=780)`. `Q2V['q2-d-arrivee']` rend sa maquette octet
  pour octet.
- `HAUT=700 … --identite` → `IDENTITE OK (15347 octets, HAUT=700)`, la maquette d-lue.

La seconde ligne, Amarillo (Houblons, après Citra), est posée par split/join (L26), avec la rangée barrée de sa maquette. L'écran fait
860 px de haut au lieu de 780. Sinon le bandeau en liste (C) et les rangées à gestes (D) cachaient Sucre candi. Le générateur le vérifie :
« CACHE UNE RANGÉE » sort pour 0 vue.

`controle-choix` : sans objet. L'écran Dépense n'est pas dans `work/refonte-frontend/v4/choix/ecrans.json` (`grep -ci "depense\|dépense"`
→ 0). La base vient de son choix D313 (2 D).

## Les options
Les données sont fictives : Brauhaus Ouest, Avoine maltée 0,5 Kg × 3,40 = 1,70 et Amarillo 25 g × 0,088 = 2,20.
- À l'arrivée : les deux sont hors des sommes (7 lignes, 7/7, Somme = imprimé 46,40) et comptent dans « ↻ 5 corrigées » (3 + 2).
- Après « Garder » sur Avoine maltée :
  - Malts passe à 4 · 10,5 Kg · 25,80 ;
  - on lit 8 lignes, 8/8, 7 reliés ;
  - « Somme ≠ imprimé 48,10 » en attention ;
  - « ↻ 4 corrigées », car Amarillo attend encore.
- Après « Tout valider » : les deux partent, et l'écran est d-lue (= `Q2V['q2-a']`).

Les options :
- **A (référence, son 2 D tel quel)** : son bandeau d'une ligne, avec « pas retrouvée · 1/2 », puis « 2/2 » pour Amarillo, sans « Tout valider ».
- **B (mon avis)** : son bandeau sur deux lignes :
  - en haut, la ligne en cours (« pas retrouvée · 1/2 ») et « ✓✓ Tout valider » à droite ;
  - dessous, Garder et Retirer.

  Il défile : un geste passe à la suivante (« 2/2 »).
- **C (bandeau en liste)** :
  - en tête, « 2 pas retrouvées » et « Tout valider » ;
  - puis une rangée par ligne, chacune avec Garder et Retirer ;
  - après un « Garder », il reste « 1 pas retrouvée » et sa rangée.

  Au-delà de trois lignes, la tête de C dit « les trois premières, puis + N ». Ce n'est pas dessiné.
- **D (la question sur la rangée)** : Garder et Retirer sur chaque rangée barrée, la forme de 2 B. Le bandeau, d'une ligne, ne porte que
  « 2 pas retrouvées · Tout valider ». C'est la greffe « 2 D + 2 B » prédite par e-t13.
- « Tout valider » a sa propre forme : un contour brun d'attention, une double coche, et aucun noir. Confirmer reste la seule action noire.
- Vue sombre : B à l'arrivée.
- Après « Tout valider », B, C et D donnent la même dépense. Elle est montrée une fois, sous les options (« = ta maquette lue »), comme
  dans choix-lignes-38.

Critère 5, changé par le pilote (D314, son « B » à la question 1) : la page ne rappelle plus la question 1. Aucune vue ne montre de ligne
ajoutée, donc la forme 1 B n'a pas à paraître. La page dit ce qu'on attend de lui : « Une lettre : où mettre « Tout valider », et comment
trancher chaque ligne. »

## Contrôles et sorties
1. `controle-page-choix.mjs …/choix-valider/index.html --min=3` → `tout-valider : OK (3 variantes, 4 par rangée à 1280, 2 à 390)`,
   `PAGE-CHOIX OK (1 choix)`.
2. `verifier-page.mjs … --page-lot --captures …/choix-valider/controle` → `PAGE OK (10 images chargées, lisible à 390 et 1280 px, sans
   erreur)`. J'ai ouvert `controle-ordinateur.png` et `controle-page.png`.
3. `node outils/mesure-2d.mjs` → `MESURE-2D OK`. La mesure compare `a-arrivee` à `q2-d-arrivee.png` :
   - Exclus : la rangée Amarillo (y 547 à 575 px) et les deux bandeaux, avec leur ombre de 12 px. Le pied est ramené au bas.
   - 1 114 620 pixels comparés, 204 différents.
   - Une seule boîte réelle : x 298–306, y 205–213, « 4 » → « 5 corrigées ». C'est le compte de la seconde ligne.
   - Le reste : quatre points de 1 px, du lissage du texte.
   - Le blanc sans équivalent (51 px) est uni : 0 pixel non blanc.
4. `controle-choix` : sans objet, voir plus haut.

## Captures ouvertes (L12)
`img/a-arrivee.png`, `img/b-arrivee.png`, `img/b-garder.png`, `img/b-arrivee-sombre.png`, `img/c-arrivee.png`, `img/d-arrivee.png`,
`img/d-garder.png`, `controle-ordinateur.png`, `controle-page.png`.

## Réparation (à lire par le pilote)
En fin de l2-lignes (reprise 1), une commande de shell a exécuté par erreur des passages entre accents graves de mon texte. Mon RESULTAT de
l2-lignes disait qu'elle n'avait rien changé : **c'était faux**.

- **Ce qui s'est passé** : elle a régénéré les maquettes et les captures de `choix-lignes-38/` à 700 px au lieu de 780. Je l'ai vu ici, quand
  la preuve `--identite-2d` a échoué (`height:700px` dans le fichier).
- **Ce que j'ai fait** : j'ai régénéré `choix-lignes-38/` par la commande de la reprise 1 (`node outils/gen.mjs`, sans HAUT).
- **Ce que j'ai vérifié ensuite** :
  - toutes les maquettes sont à 780 px, et `q2-d-arrivee.png` fait 780 × 1560 ;
  - `mesure-a.mjs` → `MESURE-A OK` ;
  - `controle-page-choix.mjs --min=3` → `PAGE-CHOIX OK (2 choix)` ;
  - `verifier-page.mjs --page-lot` → `PAGE OK` ;
  - `index.html` est inchangé.

Le commit 63f62ddf (« D310 : page … publiée ») a enregistré les 16 maquettes à 700 px : `git diff` montre `height:700px` → `780px`, une
ligne par fichier. Les images (`img/`) ne sont pas suivies par git. La page publiée a donc très probablement montré des images de 700 px,
où le bandeau de 2 D cachait Sucre candi. Il reste deux choses à faire, et elles reviennent au pilote :
- commiter les 16 maquettes réparées ;
- republier la page depuis l'état actuel.

## Boosters UX
- « Tout valider » (déclencher, toutes) : un bouton avec un mot et une double coche, au pouce, distinct de Garder (simple coche) et de
  Confirmer (noir).
- « 1/2 », « 2/2 » (suivre) : dans B et A, en mono ; le compte « N pas retrouvées » dans C et D.
- La preuve « Somme ≠ imprimé » après un Garder : le chiffre qui lui dit si garder était juste (B8).
- B2 : une seule action noire. B3 : aucune phrase dans un écran, au plus « pas retrouvée » et « N pas retrouvées ». B6 : chiffres en mono.

## Doutes
- Dans B, le bandeau prend deux lignes (95 px) contre une (49 px) en A. C'est le prix de « Tout valider » à côté de la question.
- « Tout valider » en brun d'attention se lit comme un bouton, mais moins fort que Confirmer : c'est voulu, et c'est à confirmer par lui.
- D réunit deux endroits : le geste sur la rangée, et « Tout valider » au pouce. C'est cohérent avec son « un à 1 », mais ce n'est plus son
  bandeau pour la question elle-même.
- C, avec plus de trois lignes : pas dessiné.

## Prédiction
« B c'est ça, mon bandeau avec Tout valider. Le C pas mal aussi on voit les deux d'un coup. »

DÉCISION À PRENDRE : aucune.

CONNAISSANCE : aucune.

LEÇON PROPOSÉE : un texte qui cite des commandes ne passe jamais par une chaîne shell entre guillemets doubles, où les accents graves
s'exécutent. Écrire un RESULTAT avec l'outil d'écriture ou d'édition. Après une exécution accidentelle, vérifier les fichiers produits (taille,
contenu) avant d'écrire qu'elle n'a rien changé : ici elle avait réécrit 16 maquettes à la mauvaise hauteur.

## Reprise 1 (02.11, verdict e-t14, `critique/VERDICT-l2b-valider.md`)
- **Majeur levé : l'icône de « Tout valider »** (`outils/gen.mjs`, `TOUT`). La double coche, à côté de « ✓ Garder », se lisait « garder
  tout ». Elle est remplacée par le « ↻ » de la puce « corrigées », en 15 px, brun. C'est mon avis, plutôt qu'aucune icône : le ↻ dit déjà, dans
  sa maquette, « ce que la 3e lecture a fait ». « Tout valider » applique la 3e lecture, et les lignes partent. La puce et le bouton parlent
  donc la même langue, et le ↻ ne ressemble ni à ✓ Garder ni à ✕ Retirer. Sans icône, le bouton serait un mot seul à côté de deux boutons
  à icône. Le mot « Tout valider » reste, c'est le sien.
- **Mineurs** : aucun ne demande de dessin dans cette passe. Le critique les laisse ou les renvoie au port :
  - le blanc de l'écran de 860 px ;
  - « Tout valider » pour une seule ligne restante ;
  - la puce qui retombe à 3 ;
  - le contour brun, jamais plein ;
  - la rangée de D, sur deux hauteurs.
- **Sorties rejouées** :
  - `env -u HAUT node outils/gen.mjs` : 10 maquettes, « CACHE UNE RANGÉE » sort pour 0 vue ;
  - `node outils/mesure-2d.mjs` → `MESURE-2D OK` : une seule boîte réelle, « 4 » → « 5 corrigées ». Le bandeau est exclu, et le résultat
    est inchangé ;
  - `controle-page-choix.mjs … --min=3` → `tout-valider : OK (3 variantes, 4 par rangée à 1280, 2 à 390)`, `PAGE-CHOIX OK (1 choix)` ;
  - `verifier-page.mjs … --page-lot` → `PAGE OK (10 images chargées, lisible à 390 et 1280 px, sans erreur)`.
- **Captures rouvertes (L12)** : `img/b-arrivee.png` et `img/c-arrivee.png`. On y lit « ↻ Tout valider », puis « ✓ Garder » et
  « ✕ Retirer » : trois icônes distinctes.
- Je n'ai rien écrit dans `choix-lignes-38/` pendant cette reprise.

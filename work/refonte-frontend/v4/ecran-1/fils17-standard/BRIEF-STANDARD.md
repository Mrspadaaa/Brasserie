# Lot 17 · Le jeu commun : couleurs, icônes, formes (#142)

Maquettes statiques, en français. Répertoire : C:\Users\mrspa\.codex\worktrees\openai-clean-start\Brasserie (chemins absolus).
Texte avec barres obliques inverses ou accents graves : outil Write, jamais Bash. Pas de git.
Écris seulement dans `work/refonte-frontend/v4/ecran-1/fils17-standard/v1`, `v2` et `v3`, et dans `fils17-standard/captures/`.

## Les mots du brasseur

- « "normaliser" l'affichage, les forme. couleur aromonisé ça coorectement » ;
- « regarde aussi pour la standardisation, UX booster, petit icone et autres » ;
- sur la planche du lot 14 : « j'aime bien les petit logo sapin fleur » ;
- sur le picto épicé : « très étrange, plutôt vanille, canelle ? ». Il est redessiné en grains de poivre.

## Priorité du projet (`.claude/rules/affinee-frontend.md`)

Densité utile sur mobile : seulement l'utile au premier plan, le détail à un toucher, un chrome compact. À lire, pour leurs parties utiles :
- `PRODUCT.md` ;
- `DESIGN.md` : « Colors », « Dimensions compactes », « Interface », dont « Pas d'emoji en guise d'icône. Les icônes sont dessinées, d'une seule bibliothèque, d'un seul poids de trait » ;
- `docs/ui-compacte.md`.

L'app utilise **lucide-react**. Les tracés sont dans `node_modules/lucide-react/dist/esm/icons/<nom>.mjs` (`__iconNode`), avec un trait de 2 sur une grille de 24. Prends-y les icônes d'action et d'état. N'invente pas une deuxième bibliothèque.

## Ce que l'inventaire a trouvé (`controle-standard.mjs`, D83 ; `fils17-standard/inventaire.json`)

Sur la base v4.9 et q2b :
- Le bleu #0072B2 sert à Nugget (Comparer, Substitution), à « ma dégustation » (Ma bière) et à « après Golding » (Suggestions).
- Le vert sert à East Kent Goldings dans Comparer et à Magnat dans Substitution : la couleur d'un houblon dépend de sa place, pas du houblon.
- La matrice de Comparer peint les cases de famille à la couleur du houblon.
- q2b ajoute des teintes hors palette (#4f46e5, #0e7490, et trois tons de texte foncés).
- Il y a 20 rayons d'angle différents et 5 groupes d'épaisseur de trait d'icône.

## Ce qui existe déjà, à reprendre

- **Les familles** : `fils17-standard/jetons-familles.json` donne trois tons par famille.
  - `base` : pictos, barres ;
  - `texte` : contraste d'au moins 4,6:1 sur blanc et sur le fond ;
  - `fond` : pâle.
- **Les pictos des familles** : `fils15-s5-complexe/pictos-familles.html`.
- **La couleur d'alerte** : l'orangé #c2410c, seulement pour « hors du style ».
- **La base** : `ecran-1/base/consolide/`. Lis `etat-b.html`, `comparer.html` et `fiche.html`.
- **La variante retenue** : `fils15-s5-complexe/q2b/etat-b.html` et `comparer.html`.

## Les trois variantes (une par dossier)

- **v1 · plein** : les pictos des familles tels quels (pleins, en couleur). Les autres icônes sont des lucide au trait. Seuls les pictos de famille restent pleins, comme code des arômes.
- **v2 · trait** : tout au trait lucide, d'une seule épaisseur. Les 12 familles sont redessinées au trait, chacune dans son ton `base`, en gardant leur silhouette (fleur, sapin, poivre…).
- **v3 · duo** : un fond pâle (`fond`) et un trait (`base`), pour les familles comme pour les états.

## Contenu de chaque variante

Dans `vN/planche.html`, une page de référence à 390 px. Un mot sous chaque élément est permis ; aucun paragraphe.

1. **Les 12 familles** : le picto et ses trois tons.
2. **Les moments** :
   - 60′, 10′, whirlpool ;
   - dry hop en fermentation active, dry hop après fermentation ;
   - levure, une cellule qui bourgeonne.
3. **L'usage d'un houblon** : amérisant, aromatique, double, chacun attesté (fournisseur) ou déduit (règle de l'α).
4. **Le stock**, en marque passive : en stock, manque, à acheter.
5. **Les états** :
   - inconnu, non situé, estimé ;
   - hors du style ;
   - zone du style, visée, ma bière.
6. **Les actions** :
   - « + » vers Comparer, ✓ ajouté, retirer ;
   - ouvrir, retour ;
   - la lentille au style / absolu, et Barres / Radar.
7. **Les couleurs des houblons** :
   - une palette de sélection (4 à 6 teintes, écartées des tons de famille et de l'orangé) ;
   - la règle : la couleur suit le houblon dans ma sélection, sur tous les écrans de la session ;
   - ma bière en noir, jamais une couleur de houblon.
8. **Les formes** :
   - l'échelle des rayons : 2, 4 et 8 px, pilule, rond ;
   - une seule épaisseur de trait.

Dans `vN/exemple.html`, une ligne de voie de q2b recomposée dans le style, plus la frise des moments, un en-tête de colonne de Comparer et une case de la matrice de Comparer. La case garde la couleur de sa famille ; le houblon est dit par sa colonne.

## Contrôles (tous à OK), puis regarde chaque capture

1. Captures, pour planche puis exemple :

   `node work/refonte-frontend/v4/tournoi/outils/capture-page.mjs work/refonte-frontend/v4/ecran-1/fils17-standard/vN/planche.html work/refonte-frontend/v4/ecran-1/fils17-standard/captures/vN-planche-390.png 1688`

   Même commande pour `exemple.html` → `vN-exemple-390.png`.
2. `node work/refonte-frontend/v4/tournoi/outils/controle-standard.mjs work/refonte-frontend/v4/ecran-1/fils17-standard/vN/planche.html work/refonte-frontend/v4/ecran-1/fils17-standard/vN/exemple.html` → `STANDARD OK`.
   - Mets `data-famille` sur chaque élément de famille et `data-couleur` (avec `data-houblon`) sur chaque élément de houblon.
   - La base et q2b y échouent.
3. `node work/refonte-frontend/v4/tournoi/outils/controle-sens-survol.mjs work/refonte-frontend/v4/ecran-1/fils17-standard vN --pages=planche.html,exemple.html` → `SURVOL OK`.
4. **Contrastes** : chaque texte coloré atteint au moins 4,5:1 sur son fond réel. Mesure-le et écris le pire cas dans la NOTE.

## Réponse

Dans `vN/NOTE.md`, trois lignes : ce qui tient, ce qui casse, le pire contraste. En réponse finale, une ligne par variante.

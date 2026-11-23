OK — Comparer, Choisir, Supprimer corrigés : suite à droite, écartés lisibles, lien sans aperçu, Supprimer net

Lot C3-L2-comparer-choisir-supprimer, correction 3 du port du carnet (18.11). Worktree `port-carnet`, branche `claude/port-carnet-1711`, sans commit.
CRITIQUE-3.md absent : problèmes pris dans le brief (numéros de vision-3).

## Fichiers écrits (seulement ceux possédés)
- `src/ui/carnets/Comparer.tsx` : ombre de bord et « → n de plus » ; ligne « Écartés » sous le tableau ; « Lien sans aperçu ». Nouveaux exports : `sansApercu`, `domaineDe`, `nonLusDe`, `apercuLigne`, et la prop optionnelle `nonLus`.
- `src/ui/carnets/Choisir.tsx` : offre non lue nommée honnêtement. La 1re offre non lue ne se choisit pas. Les ✓ et ✕ sont nommés.
- `src/ui/carnets/SupprimerCarnet.tsx` : `data-allume` à 0 lien. Avec au moins un lien, un `title` dit « Réglez d'abord le lien ».
- `src/ui/carnets/carnets-decider.css` (neuf, préfixe `cn-`, variables de thème) : il est importé par les trois écrans. `carnets.css` n'est pas touché.
- `tests/unit/carnetsCorrection3Decider.test.tsx` (neuf, 9 tests).
- Ici : `captures.cjs`, `sonde.cjs`, 40 captures `m390-*` et `d1280-*` (clair et sombre). Les 4 fichiers `*-echec.png` viennent des premiers essais (banc sans variables Firebase). Ils n'ont pas pu être supprimés : la garde `rm` a refusé. Ils sont à ignorer.

## Problème → fait → preuve
1. **m390-P4, la 3e colonne est coupée sans indice.**
   - Fait : la colonne des noms reste collée, avec un trait plus net. Une ombre de bord est faite de l'encre du thème à 22 %. L'ancien fondu vers le fond ne se voyait pas sur une colonne blanche. Sous le tableau, à droite, « → n de plus » compte les colonnes d'article qui ne sont pas entièrement visibles. L'indice disparaît quand tout tient ou qu'on a défilé jusqu'au bout.
   - Preuve, test : « → 3 de plus » sur une mise en page simulée, et rien quand tout tient.
   - Preuve, banc : 390 donne `suite:true, indice:"→ 3 de plus"`, 1280 donne `suite:false, indice:null`.
   - Captures ouvertes : `m390-clair-27-comparer.png` (ombre et indice), `m390-clair-27c-comparer-defile-droite.png` (indice parti, 5e et écarté visibles), `d1280-clair-27-comparer.png` (tout tient, sans indice).
2. **m390-P4, la case « Écarté » paraît vide.**
   - Fait : à 390, la rangée « Écarté » du tableau n'avait de texte que dans les colonnes écartées, hors de l'écran. Elle devient la ligne « Écartés · n » sous le tableau, avec le nom puis la raison de chaque écarté (D-52), comme `p2:h04-7`, maquette figée de R06. Sans écarté, la ligne n'est pas dessinée.
   - Ce qui reste : l'écarté garde sa colonne grisée à la fin du tableau, et `td.cn-ecarte-raison` garde la raison. Le test de tour 2 (`carnetsEcrans` « écartés à la fin ») reste vert.
   - Preuve, test : nom et raison sous le tableau, aucune case vide dans le tableau, aucune ligne sans écarté.
   - Preuve, banc : `ecartes:["Ventilateur de plafond 130 cm … écartée : brasse la buée sans la sortir"]`.
   - Capture ouverte : `m390-clair-27b-comparer-ecartes.png`.
3. **m390-P5 et d1280-constat 5, une offre ou une colonne vide, ou le domaine seul.**
   - Fait : `sansApercu` reprend le libellé de la carte R04, « Lien sans aperçu » puis « <domaine> · page non lue ». Pendant la lecture : « <domaine> · lecture… ». Le domaine vient de l'adresse s'il n'est pas lu. Le libellé sert dans la colonne de Comparer, dans les offres « autres » de Choisir et dans la ligne des écartés.
   - Une 1re offre non lue garde « Choisir » grisé, avec la phrase « Page non lue : ni nom, ni prix connus. Elle se choisit une fois lue. ». Elle n'a pas de « Part dans À venir » vide. Aucun 0 n'est inventé.
   - Comparer reconnaît une ligne non lue par `nonLus` quand le conteneur le donne. Sinon, il la reconnaît à un nom qui n'est qu'un domaine, sans aucune valeur ni prix (c'est le cas où `nomArticle` retombe sur le domaine).
   - Preuve, test : libellés, choix refusé puis accepté, et un nom en forme de domaine qui porte des valeurs n'est pas pris pour un lien sans aperçu.
   - Preuve, banc : la colonne dit `5e Lien sans aperçu exemple.invalid · page non lue` ; Choisir dit `5 Lien sans aperçu exemple.invalid · page non lue`.
   - Captures ouvertes : `m390-clair-28b-choisir-5e.png`, `d1280-clair-27-comparer.png`.
4. **d1280-36 et 38, « Supprimer » allumé peu net.**
   - Fait : à 0 lien, contour plein de 2 px, texte rouge, fond de page, comme dans `g4:v02-18`. Avec au moins un lien : contour `--c-line2` de 2 px, texte `--c-mut`, désactivé.
   - Preuve, test : contraste calculé depuis `themes.css`. Il vaut au moins 4,5:1 pour le rouge et pour le gris, en clair et en `cave` (calcul : 7,0:1 en clair, 5,2:1 en sombre pour le rouge).
   - Preuve, banc (styles calculés) : en clair, `2px rgb(168,41,31)` sur `rgb(255,255,255)` ; en sombre, `2px rgb(220,95,88)` sur `rgb(18,16,14)`. Avec 1 lien : `disabled=true`, `rgb(102,102,102)`.
   - Captures ouvertes : `m390-clair-36-supprimer-0-lien.png`, `m390-sombre-36-supprimer-0-lien.png`, `m390-sombre-38-supprimer-1-lien.png`.
5. **m390-40b et icônes, un ✕ sans texte accessible.**
   - Fait : les ✓ et ✕ de « Pourquoi ce choix » sont `role="img"`, avec `aria-label` « retenu » ou « écarté ». La balance du compromis porte `aria-label` « Compromis ». Le lien « Ouvrir » se nomme (« Ouvrir la page de <vendeur>, nouvel onglet »). Les autres icônes sont décoratives (`aria-hidden`), dans un bouton qui porte du texte.
   - Preuve, test : sur les 3 écrans (Choisir et Choisi compris), chaque `svg` a un `aria-label`, ou bien il est `aria-hidden` dans un bouton ou un lien qui se nomme.
   - Le ✕ de 40b lui-même, sur la puce « IA en cours », n'est pas dans ces écrans : il est hors de mon lot.

## Sorties décisives
- `npx vitest run tests/unit/carnetsCorrection3Decider.test.tsx tests/unit/carnetsEcrans.test.tsx` : 2 fichiers, 63 tests verts.
- `npx tsc --noEmit -p .` : exit 0, 0 erreur.
- Toute la série `tests/unit/carnets*` et `port-q*` : 429 verts, 8 rouges. Les rouges sont dans `carnetsLireLien`, `carnetsModele` et `carnetsRattacher`, tests du domaine modifiés en ce moment par d'autres lots. Aucun ne touche mes fichiers.
- Banc : vite dev sur le port 5391, avec des variables `VITE_FIREBASE_*` fictives et l'IA simulée. Les hôtes Google sont coupés. Aucun `pageerror`. Le serveur est arrêté (0 écoute sur 5391).

Essais : P4 1, P5 1, Supprimer 1, icônes 1. Les captures ont demandé 4 lancements : il manquait les variables Firebase, puis le titre « ZZ TEST — » ne se trouvait pas avec `startsWith`.

## Doutes et limites
- La ligne « Écartés » a quitté le tableau pour se placer dessous. C'est la disposition de `p2:h04-7`, compagnon figé de R06. `g01-8` ne montre aucun écarté. Je le signale au titre de la règle n° 1.
- `nonLus` n'est pas encore passé par `CarnetsVue.tsx`, que je ne possède pas. Le repli par la forme du nom suffit au banc. Pour deux liens non lus du même domaine, `nomsDistincts` ajoute le chemin, et seul `nonLus` les reconnaît. Une ligne suffit à brancher : `nonLus={nonLusDe(ouvert.carnet.articles as never)}` sur `<Comparer …>`.
- La raison de l'écarté vient de `comparer.ts` et répète le nom de la façon (« Ventilateur de plafond écartée : … »). C'est la donnée du lot A, pas touchée ici.
- À 390, le domaine d'en-tête se coupe dans le mot (`exemple.in|valid`, à cause de `overflow-wrap: anywhere`). C'est mineur.

DÉCISION À PRENDRE : brancher `nonLus` dans `CarnetsVue.tsx`.
- Options : (a) le lot qui possède CarnetsVue ajoute la ligne ; (b) le repli par la forme du nom suffit.
- Recommandation : (a). C'est une ligne, et elle couvre les homonymes.

CONNAISSANCE : le banc `?preview=carnets` du worktree `port-carnet` ne démarre en vite dev qu'avec des `VITE_FIREBASE_*` fictifs dans l'environnement. Sinon : « Impossible de charger la brasserie » (auth/invalid-api-key).
LEÇON PROPOSÉE : aucune

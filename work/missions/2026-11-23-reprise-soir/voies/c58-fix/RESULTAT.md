OK — c58Regles 53/53 vert, c48..c58 et carnets* verts : nombres entiers, compromis gain et perte, prix à place fixe. PRÊT À METTRE EN LIGNE 348534698

# RESULTAT c58-fix

Commit du code : `348534698` (par chemins : `src/ui/carnets`, `src/domain/carnets`). Registre : C58-1 à C58-6, C56-3, C50-5, C55-2 « corrigé en local 348534698 », `controle-bugs.mjs` → BUGS OK.

## Plan réalisé : par règle, chaque endroit et son correctif

### R31 (C58-2, BLOQUANT) et R34 C58-1 : un nombre n'est jamais coupé ni restylé
Cause (deux, comme annoncé) : (1) `insecable.tsx` n'enveloppait que le DERNIER chiffre (`(\d[ ]unité)`) ; (2) `carnets.css` l.730 `.cn-ouvert :is(span, …) { font-size: 14px !important }` rapetissait l'enveloppe dans un titre de 18 px.
- `insecable.tsx` réécrit : le nombre ENTIER (« 50 », « 2,6 », « 1 000 », « 2 697,74 », lookbehind pour ne pas commencer au milieu d'un autre) + son unité tiennent dans UN `<span class="cn-nombre">` ; `liesParNbsp` lie aussi les milliers ; nouveau `InsecMarque` (recherche : le gras prend le nombre entier, jamais « 4,0|6 »).
- `carnets.css` : `.cn-nombre { white-space: nowrap; font-size: inherit !important }` (bat la règle l.730) ; `.cn-carac dd { font-size: inherit }` (le dd à 16 px contre un texte à 14/15 px restylait la valeur).
- Endroits traités : titre du carnet ouvert (`CarnetOuvert` : un seul nœud, `liesParNbsp`, aucun élément dans le h2), lien retour et en-têtes de Comparer, fil d'Ariane et héros de la fiche (déjà `Insec`, maintenant entier), liste des carnets (déjà `liesParNbsp`), noms d'articles (ArticlesCarnet, CarteArticle ×3, Comparer ×3, FicheArticle h2, Choisir ×3, TableauCarnet, Bandeau, LectureLien, ListeCarnets) par `liesParNbsp` (le texte reste UN nœud : les anciens tests `getByText` tiennent), compromis (`Insec`), ligne citée par la recherche (`InsecMarque`), cellules de Comparer (une espace invisible en fin de cellule : « 11,5 » et « 12,5 » ne se recollent plus en « 11,512,5 » à la copie ou à la lecture d'un bloc).

### R32 (C50-5 rouvert, C58-4) : le compromis dit le gain ET la perte, avec ou sans critère
- `comparer.ts` : `compromisDe` sans critère dit le gain puis, s'il existe une valeur chiffrée qui distingue le voisin par le prix, la perte : « la 1re, la moins chère : 289,77 CHF de moins que la 2e, mais la 2e a le volume 4,06 m³ au lieu de 2,6 m³ » ; sans valeur qui distingue : « aucun critère ne les départage » (rien d'inventé : même volume, aucune perte). Fonctions neuves `distinguerPar` et `perteDite` (le critère chiffré qui diffère d'abord, sinon la valeur chiffrée la plus parlante par `groupeDeLigne`).
- `Comparer.tsx` : `recite` n'écarte plus une phrase qui dit l'écart de prix ; un compromis d'IA qui ne dit que le gain reçoit la perte du tableau (`completeParPerte`, seulement si ses nombres n'y sont pas déjà).
- **Arbitrage R4 / R32 (décision du pilote, appliquée)** : la perte se dit par l'écart de prix et les valeurs qui DISTINGUENT les articles ; ce n'est pas une récitation du tableau (le gain n'y figure pas). `recite` ne cache plus que la phrase SANS écart de prix qui recopie le tableau. `c48Regles` R4 reste vert sur sa fixture (`chambreFroide({ prix: true })`, sans ligne Volume : aucune valeur ne distingue, donc aucune perte à dire ; IA qui récite sans écart : toujours cachée). Le cas avec critère de R4 (`it.skip`) reste caduc.

### R33 (C55-2 retombé, C58-5) : le critère affiché classe ; l'aperçu promet ce qui est créé
- `comparer.ts` : `caracteristiqueMesurable` dans `donnees()` : un critère sans caractéristique, ou dont la caractéristique (« Marmite de brassage ») n'est portée par aucun article, prend la grandeur lue dans son texte (`extraireCriteres` : le volume, L), SEULEMENT si au moins un article la porte (aucune colonne inventée) ; oui-non et « texte » voulus restent. Mémorisé par tableau de critères.
- `lignesRegles.ts` `depuisLocale` : le critère local créé porte sa caractéristique (volume, L, plus) : ce que l'aperçu promet est créé ET classe, IA simulée, muette, en échec ou éteinte.

### R34 autres
- C58-3 : `bandeauxCarnet.tsx` : dans un carnet ouvert, l'avis « L'IA n'a pas répondu » ne parle que des messages de CE carnet (écrits depuis lui ou rangés dedans) ; un message que le fil ne connaît pas reste dit.
- C58-6 : `carnets.css` : la ligne du vendeur prend toute la largeur de la carte (`flex: 1 1 100%`) ; le prix s'aligne à droite de la CARTE, pour tout vendeur ; les gestes passent dessous. (Un autre choix valide aurait été « sous le vendeur » ; à droite correspond à Galaxus et brewstore que le brasseur a vus.)

## Sorties décisives
- `npx vitest run tests/unit/c58Regles.test.tsx` : 53 passed (avant : 36 rouges). Journal : `voies/c58-fix/tests.log`, `tests2.log`.
- Rejeu large : `tests/unit/carnets*`, `c48..c58Regles`, `lot11Carnet`, `lot3CarnetOuvert`, `planning-vers-carnet`, `port-q4-carnet`, `tests/unit/proprietes`, `tests/integration/carnet*` : 66 fichiers, 1353 passed | 3 skipped ; plus 6 fichiers voisins (`planning-atelier-avenir`, `prixRendu`, `c48RouvertE47E49`, `lot7-champ-choisir`, `carnetEntreeUnique`) : 62 passed.
- `npx tsc --noEmit -p .` : 2 erreurs connues seulement (`seedData.ts` GanttTask, `enregistrerPwa.ts` virtual:pwa-register) ; `functions/` : aucune.
- `node scripts/agents/controle-bugs.mjs` : BUGS OK (2262 bugs, 510 ouverts).
- Essais : un passage par règle ; un échec de contrôle de type (`sens !== 'texte'` hors du type de `CritereLu`) et un test ancien `carnetsLot4` cassé par l'enveloppe en `<span>` des noms (corrigé en passant à `liesParNbsp`, un seul nœud de texte). Aucun critère n'a demandé trois essais.

## Doutes et limites
- Aucune capture locale (consigne de la voie) : le rendu à 390 px (nombre entier à la taille du titre, prix à droite, compromis sur deux phrases) reste à voir en ligne par le critique. jsdom ne mesure aucune boîte ; les tests lisent la cascade.
- Texte des noms : l'affichage met une espace INSÉCABLE (U+00A0) dans « 1500 x 1200 mm - 2,6 m³ » ; la donnée stockée reste à espace ordinaire (recherche, copie des données : inchangées ; une recherche dans la page du navigateur par Ctrl-F voit l'espace insécable).
- Compromis sans critère : plus long (« …, mais la 2e a le volume 4,06 m³ au lieu de 2,6 m³ ») ; sur 390 px il passe sur deux lignes. « le volume » après « a » est correct mais lourd ; le brasseur peut préférer « la 2e : 4,06 m³ au lieu de 2,6 m³ » (formulation seule, un test ne la fige pas).
- C58-5 : la cause exacte du tour 58 (réponse d'IA réelle, critère affiché sans valeur) n'est pas reproductible sans Gemini ; couvert par les quatre représentations du test. Si une IA rend une caractéristique que PERSONNE ne porte et dont le texte n'a aucune mesure, le critère reste affiché sans classer (comportement R30 : « un critère sans valeur chez personne ne compte plus »).
- C58-6 : choix « à droite de la carte » ; changer d'avis demande de changer `placeDuPrix` dans le test, pas le code seul.
- `c58Regles` : aucun test jugé faux.
- Tour de mise en ligne : le critique rejoue C58-1 à C58-6 sur les écrans cités, en ZZ TEST.

CONNAISSANCE : un nombre se rend dans UN nœud de texte : pour un texte pur (titre, nom d'article), `liesParNbsp` (espaces insécables, aucun élément) ; ailleurs `Insec` enveloppe le nombre ENTIER + unité dans `.cn-nombre` (taille héritée, `!important` compris, car `.cn-ouvert :is(span, …)` impose 14 px à tout span). Jamais une enveloppe sur le seul dernier chiffre.
LEÇON PROPOSÉE : un correctif d'affichage qui touche des nombres se teste sur le balisage ET la taille de chaque morceau, pas sur le texte rendu seul (C56-3 était « vert » sur le texte et cassait le nombre en ligne : tour 58).

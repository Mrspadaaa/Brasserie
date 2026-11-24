TESTS ROUGES 36 rouges / 53 au total (R31 13, R32 5, R33 8, R34 C58-1 6 + C58-3 1 + C58-6 3 ; 17 verts justifiés)

# RESULTAT c58-tests

Livrable : `tests/unit/c58Regles.test.tsx` (53 tests, un `describe` par règle R31, R32, R33, R34 ; R34 en trois blocs C58-1, C58-3, C58-6), fixture `tests/fixtures/c58/carnets.json` (chambre froide, joint torique, tuyau ; noms et vendeurs fictifs, valeurs des captures du tour 58 ; marmite, cellule et houblons viennent de `tests/fixtures/c56/carnets.json`). Le `.skip` du cas R4 avec critère de `c48Regles` existait déjà (voie c56-tests) : rien à y ajouter. Aucun fichier de `src/` ni `functions/` modifié (les `??` de `src/` dans `git status` sont d'avant la voie).
Sortie : `voies/c58-tests/tests-rouge.log` (`npx vitest run tests/unit/c58Regles* --reporter=dot` : 36 failed | 17 passed (53)). c48Regles rejoué : 27 passed | 1 skipped. Captures ouvertes : XA-offre.png (prix flottant), XJ-titre.png (« 2 » grand, « 0 mm » petit).

## Comment les tests lisent le rendu (jsdom ne mesure rien)
- Balisage : tous les nombres (« 50 », « 2,6 », « 2 697,74 ») doivent tenir dans UN nœud de texte ; un élément qui s'ouvre au milieu est signalé (« 5 | 0 L »).
- Cascade (postcss, @media à 390 px, `!important`) : taille de police réelle de chaque morceau « nombre + unité » contre celle du texte autour. Cause trouvée de « 0 mm » à 14 px : `carnets.css` l.730 `.cn-ouvert :is(span, p, b, …) { font-size: 14px !important }` rapetisse l'enveloppe `<span class="cn-nowrap">` dans le titre h2 de 18 px. Les enveloppes de `insecable.tsx` ne prennent que le DERNIER chiffre (`(\d[ ]unité)`).
- Texte : espace ordinaire entre nombre et unité, hors ancêtre `nowrap` les contenant tous deux.
- Le prix (C58-6) est lu dans la cascade : `.cn-offres .cn-offre-corps { flex: 1 1 170px; flex-wrap: wrap }` + `.cn-prix-mono { margin-left: auto }` : le prix s'aligne à droite d'une boîte large de 170 px, pas de la carte, donc au milieu.
- C58-3 : jeu complet dans CarnetsVue (IA en panne, phrase envoyée, 9 s d'attente, retour à la liste, ouverture du carnet de la marmite) : l'avis « L'IA n'a pas répondu : 1 message rangé tel quelRelire » s'affiche dans ce carnet.

## Les 36 rouges
- R31 (13) : lien retour de Comparer (marmite 50 L, joint 20 mm), titre du carnet ouvert (marmite, joint, tuyau « 8 mm, 5 m », cellule « 4 °C » : coupe et taille 14 px contre 18), fil d'Ariane de la fiche (marmite, joint), héros « Volume utile : 50 L », « Classé par », cellules de la chambre froide (« 230 V »), Variantes des houblons (fiche et Comparer : « 250 g », « 500 g »).
- R32 (5) : chambre froide sans critère, phrase « 289,77 CHF de moins que la 2e ; aucun critère ne les départage » (ni 4,06 ni 2,6) ; la même avec un mot qui oppose gain et perte ; marmite sans critère (218 CHF, ni 242 L ni 50 L) ; encadré rendu de la chambre froide (aucun encadré montré ou sans 4,06) ; compromis d'IA gain seul.
- R33 (8) : critère sans caractéristique et critère au nom de la phrase (« Marmite de brassage », 0 article porte la valeur) : pas de colonne critère, Comparer « Classé par Prix », compromis « aucun critère ne les départage » ; création par phrase (IA qui ne rend que l'idée, IA qui rend « Marmite de brassage 50 L » sans caractéristique, IA en échec, IA éteinte) : critère créé « Marmite de brassage 50 L », aucune colonne critère sur les articles « Volume utile ».
- R34 C58-1 (6) : noms d'articles de la feuille Articles, du carnet ouvert et des en-têtes de Comparer ; ligne citée par la recherche (« …1800 x 1500 mm - 4,0|6 m³ ») ; compromis calculé et compromis d'IA (« 289,77 CHF »).
- R34 C58-3 (1), R34 C58-6 (3 : cellule, marmite, chambre froide : « prix : marge gauche auto, … flex 1 1 170px, wrap »).

## Les 17 verts (justifiés)
Outil de lecture (garde-fou, vérifie aussi que la cascade lit le 14 px `!important`) ; liste des carnets, 4 titres (`liesParNbsp` : un seul nœud, espace insécable : déjà juste) ; lien retour et fil d'Ariane des titres à un chiffre (« 8 mm », « 4 °C » : le chiffre entier est enveloppé, taille tenue dans le fil et le lien) ; R32 cellule avec critère (le calcul local dit « 4,06 » et « 2,6 » sur le jeu c56 : le constat du tour 58 vient de données réelles où le volume n'est pas un nombre lu, voir doutes), encadré rendu de la cellule, garde-fou « même volume : aucune perte inventée » ; R33 « Volume » et « Volume utile » (la correspondance souple des noms fonctionne) et IA simulée (`extraireCriteres` rend la caractéristique « Volume »).

## Doutes et limites
- R32 contre c48Regles R4 : R4 (sans critère, « ne recopie pas le tableau ») et R32 (la perte, 4,06 m³ au lieu de 2,6, est une valeur du tableau) se touchent. Les tests R32 ne demandent que le gain (écart de prix) et la perte sur des valeurs qui DISTINGUENT les articles ; la fixture de R4 (`chambreFroide({ prix: true })`, sans ligne Volume) reste contrainte par R4. C'est l'encadré (`recite`, Comparer.tsx) qui cache aujourd'hui la perte sans critère.
- R32 cellule avec critère est verte sur la fixture, rouge en ligne (tour 58) : les vrais articles n'ont sans doute pas de valeur « Volume » lue en nombre (le volume est dans le titre). À rejouer en ligne ; sinon, un test sur une fixture issue d'une vraie lecture de page.
- R33 : la cause réelle du tour 58 (réponse d'IA réelle) n'est pas reproductible sans Gemini ; deux représentations la couvrent (idée seule, critère sans caractéristique). L'issue (critère sans mesure non affiché, ou caractéristique calculée localement) est laissée au correcteur : le test exige seulement « classe, ou n'est pas montré comme un critère » au niveau du tableau ; si le correcteur retire le critère de `criteres`, le test de création (`textes.length > 0`) le dit rouge : à lui de relire cette ligne.
- R34 C58-6 : la règle est un modèle de la cascade (à droite de la CARTE : ligne qui prend toute la largeur, ou prix sorti de la ligne du vendeur ; sous le vendeur : `flex-basis: 100 %` sans marge automatique). Une autre mise en page valide serait signalée « flotte » : adapter l'outil `placeDuPrix` si le correcteur choisit autrement.
- R34 C58-3 : le test attend 9 s (retour de bandeau éteint à 8 s) ; le fichier dure ≈ 20 s.
- Le Bash du poste perd les barres inverses : fichier écrit par Write, regex vérifiées par leur effet (outil de garde-fou, nombres coupés détectés).

CONNAISSANCE : `.cn-ouvert :is(span, p, b, button, a, div, li, strong, em, small) { font-size: 14px !important }` (carnets.css l.730) impose 14 px à TOUT élément posé dans un titre h2 du carnet ouvert : un correctif qui garde un `span` dans un titre doit le neutraliser, ou ne mettre aucun élément dans le titre (un seul nœud de texte à espace insécable, comme `liesParNbsp`).
LEÇON PROPOSÉE : aucune

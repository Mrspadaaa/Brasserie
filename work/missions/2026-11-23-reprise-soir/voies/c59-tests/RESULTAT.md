TESTS ROUGES 32 rouges / 39 au total (R35 4/4, R36 7/8, R37 11/13, R38 10/14) — tests/unit/c59Regles.test.tsx

# RESULTAT c59-tests (24.11)

Fichiers écrits : `tests/unit/c59Regles.test.tsx` (39 tests, 4 blocs R35..R38), `tests/fixtures/c59/carnets.json` (marmite + frigo 242 L, houblons Citra, deux pages HTML reconstituées), ce dossier (`tests-rouge.log` brut, `tests-rouge.txt` sans couleurs). Aucun fichier de `src/` ni `functions/` modifié (`git status src functions` : seuls les `??` d'avant la voie, `src/asset` et `src/data/hopSources/beeranalytics-*`, pas les miens). Le `.skip` du cas R4 de `c48Regles` : laissé tel quel (déjà là, « CADUC c56-tests », rien à toucher).

Lancé : `npx vitest run tests/unit/c59Regles* --reporter=dot > voies/c59-tests/tests-rouge.log` → `Tests 32 failed | 7 passed (39)`, 33 s. Chaque règle a au moins un rouge. Les 4 tests R35 rejouent le geste dans l'app (CarnetsVue, deux carnets, un message échoué dans chacun, « Relire » touché) et reproduisent le défaut du tour 59 : l'article du message de la marmite finit dans le joint.

## Rouges, par règle, avec la cause lue (l'échec dit la bonne chose, vérifié message par message)
- **R35 (C59-1, C58-3 rouvert), 4 rouges sur 4** : « Relire » du joint relance le message de la marmite (`ks240l-c59`) ; l'article de la marmite est rangé dans le joint ; le bandeau annonce « 1 message », 2 sont relancés ; « Relire » de la marmite relance le message du joint. Cause lue : `CarnetsVue.rangerMaintenant()` reprend tout `aReprendre` et `rangement.reprendre` donne à l'IA le carnet OUVERT (`deps.depuis`), non celui du message ; le bandeau, lui, filtre (`duCarnet`).
- **R36 (C59-4, C55-2 revenu), 7 rouges sur 8** : critère « Marmite de brassage 50 L » (trois formes que l'app crée : « Volume utile »/plus, « Marmite de brassage »/plus, sans caractéristique) : la 1re est le frigo KS240L 242 L (`rangs : 1:Kibernetik…, 2:Marmite…60 L, 3:Maischekessel 50 L`) ; deux articles : `{K1:1, W1:2}` au lieu de `{W1:1, K1:2}` ; hors genre (frigo 50 L pile contre marmite 45 L) ; compromis « la 1re, le volume utile 242 L au lieu de 50 L » ; pastilles de Comparer.
- **R37 (C59-6, C59-7), 11 rouges sur 13** : Brau dès 0,10 CHF rang 1 (`prixClasse 10`, sans quantité) ; aucun rang honnête sans base ; « 0,10 CHF » montré dans Comparer, feuille Articles et fiche ; lecture de page Brau : `prix 4`, sans quantité ; lecture MotlerHops : `prix 3.72`, nom « Citra US », sans « 50 g » ; C59-7 : `{"Comparer":["4"],"feuille Articles":["4"],"fiche":["3"]}` (un prix, trois valeurs).
- **R38, 10 rouges sur 14** :
  - C58-4/C50-5/C59-3 : le compromis ne dit pas la perte quand le volume est gardé en une chaîne (« 2,6 m³ ») : « la 1re, la moins chère : 289,77 CHF de moins que la 2e ; aucun critère ne les départage » (tableau, encadré de Comparer, cellule avec critère Température) ;
  - C59-2 : 2 appels pour un seul message sous « plafond atteint » (reprise après répit) ; l'écran ne dit ni « en pause » ni « plafond » ;
  - C59-5 : lien retour `display: inline-flex` : éléments flex `["ZZ TEST — marmite de brassage","50 L"]` (deux, au lieu d'un) ; Comparer de la marmite et du joint ;
  - C59-8 : la fiche dit « Citra 13,6 % » après Arômes et Origine, pas « Alpha 13,6 % » en tête (2 tests) ;
  - C59-9 : « Limette, Mango, tropische Früchte » reste allemand sur la fiche, et `traduireValeurs` ne traduit pas les arômes ;
  - C59-10 : écart jauge/« Veiller » 10 + 0 px pour un rond qui déborde de 8 px : il reste 2 px, demandé ≥ 12.

## Verts (7) : tous justifiés, des garde-fous
- R36, critère de sens « moins » : la marmite de 50 L est 1re parce que le plus petit passe devant (par coïncidence ; il garde le sens « moins » si le correctif change le classement).
- R37 : compromis sans « 0,10 CHF » (le compromis ne compare pas l'euro au franc, aucune phrase) ; garde-fou « quantités dans les noms » (Citra 1 kg à 80 CHF contre Citra US 50 g à 3,72 € : MotlerHops 1er au kilo).
- R38 : les formes « nombre + unité » et « chaîne du nombre + unité » du volume disent déjà la perte (4 tests, R32 de c58 tenu).

## Doutes et limites
- **C59-3 (compromis sans perte en ligne)** : en test, la perte manque seulement quand la valeur du volume est lue en une chaîne « 2,6 m³ ». La forme réelle des valeurs du carnet « Chambre froide » n'est pas connue (pas lue en base) : si le correcteur trouve que la cause est autre, il le dit au pilote avant de changer ces tests.
- **Page Brau reconstituée** : mon HTML (prix unitaire `UnitPriceSpecification` au gramme) est lu « 4 CHF » par `lireLien` (quatre décimales mal lues), non « 0,10 dès » comme en ligne. Les deux sont faux au regard de la règle ; le test ne vérifie que « un prix lu n'est jamais publié sans quantité » (nom avec « 50 g », ou valeur « Conditionnement/Quantité/Contenu » unique). Aucune page réelle n'est gardée au dépôt.
- **R36** : le sens « le plus proche de 50 L » ou « au moins 50 L, le plus petit d'abord » donnent la même 1re : les tests les acceptent toutes les deux.
- **R35** : la scène dure 8 s par test (attentes 1,8 s ; reprise après 400 ms) ; le correctif ne doit pas allonger ces délais. jsdom ne mesure aucune boîte : C59-5 et C59-10 sont lus par la cascade CSS ; le rendu à 390 px reste à voir en ligne.
- **C59-8, C59-9** : testés sur la fiche (la donnée stockée porte « Citra » et l'allemand), donc le correctif est au rendu (ou une reprise des données), pas seulement à la lecture ; le test serveur d'arômes est à part.
- Non couverts (hors règles) : C59-1 en ligne (Chrome 9222 non utilisé : voie sans captures).

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : aucune.
LEÇON PROPOSÉE : un test d'écran qui rejoue un geste doit d'abord atteindre l'état du constat (ici : quitter le carnet et y revenir pour que l'avis passe du retour local au bandeau de reprise, sinon « Relire » est le bouton scopé et le test est vert à tort) ; et deux carnets bâtis sur la même fixture partagent son `id` (donner un id propre).

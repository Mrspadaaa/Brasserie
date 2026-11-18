OK — module pur lireOptions : base propre, état du malt, supplément, options traduites, restes ; 73 tests verts, balayage des 14 pièces.

## TEMOIN AVANT
Module déplacé hors du dépôt, puis `npx vitest run tests/unit/depense/options --maxWorkers=2` :
`Error: Cannot find module '../../../../src/ui/depense/optionsDuNom' imported from …/options-du-nom.test.ts` → `Test Files 1 failed`, `Tests no tests`.
Le témoin montre aussi, sur le code d'aujourd'hui, le libellé collé : `libelleDeLigne('CARABELGE®, Kg', 'Mischung: Einzelprodukt, Schrotung: geschrotet [+CHF 0.10]')` = `CARABELGE®, Kg · Mischung: Einzelprodukt, Schrotung: geschrotet [+CHF 0.10]` (test « TEMOIN », vert : il fige le défaut). Module remis, même fichier de tests : voir ci-dessous.

## Fichiers écrits
- `src/ui/depense/optionsDuNom.ts` (module pur : aucun import, aucun React, aucun réseau)
- `tests/unit/depense/options/options-du-nom.test.ts` (73 tests)
- `work/missions/2026-10-31-ecran-depense/voies/f1-options/balayage-banc.ts` (script du balayage, ne sort que des comptes et des formes)
- ce RESULTAT.md

## Ce qui est fait
`lireOptions(nom, variante, unite)` rend `{ base, uniteDuNom?, etat?, supplement?, supplementPour?, options[], restes[] }`.
- **base** : le nom sans options ni suffixe d'unité (« , Kg », « , Gramm », « , 1 Kg », « Laktose 1 Kg »). Marque (®, ™) et reste inchangés. Un nom dont rien n'est reconnu (description sur plusieurs lignes) est rendu exactement tel qu'imprimé.
- **etat** : `concasse`/`grain` en français, par les mots allemands, anglais, français, italiens de la consigne, avec ou sans clé (« Schrotung: », « Crushing », « Mouture : », « Macinatura »). La négation passe d'abord (« ungeschrotet », « nicht gemahlen », « not crushed », « non concassé », « non macinato » → grain entier). Le mot « Schrotung » seul (ligne « Zuschlag Schrotung ») n'est pas un état. Deux mots contraires : aucun état, les deux dans `restes`.
- **supplement** : `[+CHF 0.10]`, `(+CHF 0.10)`, `[+0,10 CHF]`, `[ + CHF 0.0001 ]` → `{ montant, devise }`. Aucun prix recalculé. `supplementPour` dit l'option qui le porte (`concasse`). Un second supplément différent va dans `restes`.
- **options** : « Mischung: Einzelprodukt » (et équivalents en/fr/it) → rien ; autre mélange → « mélange : … » ; couleur, taille, poids, récolte traduits ; « fein/grob geschrotet » donne en plus `finesse` (fin/gros).
- **restes** : tout le reste tel qu'imprimé (couleur « ROUGE 25cm », « XL », « 11g », dates, « PostPac Priority »). Une variante déjà contenue dans le nom n'est pas répétée.
- Séparateurs tolérés : retour à la ligne, « / » entouré d'espaces, virgule (pas entre deux chiffres), « ; », « · », « | », ou juste avant une clé. Sans deux-points : la clé doit commencer le morceau (« Schrotung geschrotet »).
- `libelleDeLigne`, `ExpenseSheet.tsx`, `etat.ts`, `stockLineMatching.ts` : non touchés.

## Critères
- `npx vitest run tests/unit/depense/options --maxWorkers=2` : `Test Files 1 passed (1)`, `Tests 73 passed (73)`.
- `npx vitest run tests/unit/depense --maxWorkers=2` : `Tests 1411 passed | 3 skipped`, `Test Files 14 failed | 79 passed`. Les 14 échecs sont des suites qui ne se chargent pas, toutes pour `Failed to resolve import "zxing-wasm/reader" from "src/services/qrLecture.ts"` (le paquet manque dans ce dépôt, connu ; la consigne n'en citait qu'une, mais la chaîne d'import de `ExpenseSheet` en touche 14). Aucune ne touche mon module ; aucun test n'échoue.
- `npx tsc --noEmit -p tsconfig.json` : aucune erreur mentionnant `optionsDuNom`, `depense/options` ni `f1-options`.
- `git status --short` : seuls trois chemins neufs à moi : `src/ui/depense/optionsDuNom.ts`, `tests/unit/depense/options/`, `work/missions/2026-10-31-ecran-depense/voies/f1-options/`. Les autres fichiers modifiés viennent d'autres voies (déjà présents au départ).

## Balayage des 14 pièces du banc (Csv8+N), 232 lignes lues — aucun nom d'achat recopié
- 38 lignes ont une variante ; 26 sont comprises en entier ou déjà dans le nom, 12 restent en tout ou partie dans `restes`.
- État **concassé : 31** lignes, **grain entier : 1**. Aucun état sur les autres lignes (rien d'imprimé).
- Suppléments : **0,10 CHF : 18**, **0,0001 CHF : 13** (la mouture au gramme). Aucun autre.
- Base différente du nom imprimé : 58 lignes. Dont **36** où le suffixe d'unité est sorti du nom alors que la colonne d'unité était vide (voir DÉCISION), rendu dans `uniteDuNom`.
- 8 noms de plusieurs lignes dont rien n'est une option (descriptions avec dates) : laissés tels quels.
- 19 noms ont un retour à la ligne : 11 sont des listes d'options, 8 des descriptions.
- Restes, par forme (lettres a/A, chiffres 9) : « a 99/99/9999 a 99/99/9999 » ×6 et « a 99/99/9999 » ×1 (dates d'abonnement), « A » ×2 (une taille), « 99A » ×1 (un calibre), « AaAa Aa » ×2 (un mode d'envoi). Aucune ne ressemble à une option de mouture : rien d'important n'est tombé en `restes`.
- Aucune base ne garde « Schrotung », « Mischung » ou un crochet (hors les lignes « Zuschlag Schrotung », qui sont le nom du supplément).

## Essais utilisés
Tests : 4 passes (un « intero » mal lu par `interi?`, un test faux sur « Farbe » sans deux-points, un cas de colonne vide, des noms multi-lignes) ; typage et suites : 1 passe chacun.

## Doutes et limites
- Sans séparateur ni deux-points, « Mischung Einzelprodukt Schrotung geschrotet » (tout sur une ligne) n'est pas coupé : il reste dans `restes`. Il n'existe pas dans le banc ; le couper fait croire à « Wyeast Mix Activator » qu'il porte un mélange.
- « moulu/ground/gemahlen » après une virgule dans un nom est lu comme concassé quel que soit le produit (café, épice). Ici, les lignes de stock sont des malts.
- Une variante inconnue (couleur, taille) sort de la base ; `libelleDeLigne` l'ajoutait au nom. Si deux articles ne diffèrent que par elle, le rapprochement doit la lire dans `restes` (voir DÉCISION).
- Aucune capture : module pur, aucune interface.

DÉCISION À PRENDRE : (1) Colonne d'unité vide + suffixe d'unité dans le nom (« CARABELGE®, Kg » : c'est le cas de doc14, 36 lignes du banc). La consigne dit de retirer le suffixe quand il dit la même chose que l'unité lue ; j'ai étendu au cas « unité vide » pour que la base de doc14 soit bien « CARABELGE® » (sinon l'article neuf s'appellerait encore « CARABELGE®, Kg »). L'unité n'est pas devinée : le suffixe est rendu tel quel dans `uniteDuNom`, et f3 ou la voie des unités décide s'il le montre ou s'il s'en sert pour proposer l'unité. Recommandation : garder, et que l'écran affiche `uniteDuNom` en « unité à préciser : Kg imprimé ». Si l'unité lue diffère du suffixe (« Stk » face à « Kg »), le suffixe reste dans la base, visible. (2) Variante non reconnue (« ROUGE 25cm », « XL ») : exclue de `base`, rendue dans `restes`. Recommandation : f3 la montre au détail et le rapprochement garde `base` seule, sauf pour l'équipement où f3 pourra joindre `restes` si deux articles ne diffèrent que par elle.

CONNAISSANCE : sur la pièce doc14 de la commande en ligne, la colonne d'unité des lignes de malt est vide (36 lignes du banc) alors que le nom imprime « , Kg » ou « , Gramm » ; la lecture glisse aussi dans `name` tout le bloc « Mischung / Schrotung / [+CHF …] » avec retours à la ligne, en plus de `variant`.

LEÇON PROPOSÉE : aucune

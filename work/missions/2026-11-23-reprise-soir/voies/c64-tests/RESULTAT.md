OK — 28 tests R47..R50 écrits avant tout correctif : 24 rouges, 4 verts justifiés (tests-rouge.log)

## Fichiers écrits
- tests/unit/c64Regles.test.tsx (4 blocs : R47, R48, R49, R50)
- tests/fixtures/c64/ : carnets.json, brau-citra-136.html.gz (vraie page Brau lue le 23.11), hopfenmarkt-citra.html.gz (vraie page du tour 25 rejouée avec les prix du Citra relevés le 24.11), motlerhops-sans-tableau.html
- voies/c64-tests/fabriquer-fixtures.mjs (recrée les deux .gz), tests-rouge.log
- Aucun fichier de src/ ni functions/ modifié ; tests/unit/c48Regles.test.tsx non touché (le .skip du cas R4 y est déjà posé par c56-tests, avec son critère).

## Sortie décisive (tests-rouge.log)
Tests 24 failed | 4 passed (28). Rouges par règle : R47 4, R48 6, R49 4, R50 13 (jauge 2, prix unique 3, synonymes 2, étape caractéristiques 1, EUR dans la liste 1, bandeau interrompu 1).

## Rouge pour la bonne raison (cause constatée dans le code)
- R47 : `lireReponse` (ia.ts) garde le carnetId d'un autre carnet quand un carnet est ouvert (le garde « L-2 » ne vaut que depuis la liste) ; `ecrireIA` branche « ici » (rangementCarnets.ts) l'écrit alors : le Frigo reçoit la note, le message perd son effet dans Ventilation.
- R48 : la lecture de la page hopfenmarkt rend prix 6,70 sans conditionnement (« Conditionnement 100 g » seulement en caractéristique) ni offres ; l'IA qui rend 6,70 pour 50 g est acceptée (la paire n'est pas contrôlée) ; un article 6,70 + « 50 g » dit 134,00 CHF/kg ; Comparer dit « 50 g · 134,00 CHF/kg » au lieu de 67.
- R49 : `lignesNop`/lecture Brau rend prix 104,40 pour 1 kg (tarif de base) et garde le palier 0,08 dès 1 000 g sans l'appliquer ; Relire fait 104,40 CHF/kg ; la fiche dit « 1 kg · 104,40 CHF/kg » et « Conditionnement 1 kg ».
- R50 : jauge de la marmite 50 L à 0 %, celle du frigo 242 L à 100 % (le repère `cn-reglette-cible` laissait le test c61 passer par une échappatoire) ; carte « ≈3 », fiche/tableau « ≈4 rendu », CHF/kg 68,20 et 68,30 selon la surface ; fiche et Comparer disent « Arômes ? » alors que « Arômes et saveurs » est lu ; l'étape `caract` reste « absent » après que l'IA a ajouté des caractéristiques (completerParIA ne la met pas à jour) ; la liste dit « 3,72 EUR les 50 g » ; une lecture finie dont le jeton est resté gardé donne « Lecture de lien interrompue : 1 à reprendre ».

## Verts justifiés (déjà justes)
- R47 : la réponse simulée d'un message dans le carnet ouvert le range dans ce carnet (garde-fou).
- R49 : la lecture garde le prix à l'unité 0,1044 CHF/g et son palier (garde-fou : le correctif ne doit pas le perdre).
- R50 C64-7 : lecture gardée d'un carnet supprimé (message retiré avec le carnet) : aucun bandeau, déjà juste ; le doute du test en ligne (autre session) reste ; garde-fou d'une vraie lecture interrompue qui reste proposée.

## Essais, doutes, limites
- Essais : 2 relances (un motif « ≈ N CHF » trop étroit, un test de Comparer vide de sens corrigé). Aucune relance d'un échec tel quel.
- Doute R47 : le test impose seulement « pas d'écriture ailleurs, message gardé ici » ; la forme de la proposition (« Déplacer vers … ? ») est laissée à celui qui corrige (le garde pose déjà `carnetSuggere` pour un lien).
- Doute R50 C64-3 : le « ≈ N » arrondi peut différer du CHF/kg de moins de 10 ; le test refuse seulement « ≈4 » à côté de 68 CHF/kg et deux CHF/kg différents. Le « rendu » (port, TVA d'import) n'est pas reconstitué : la fixture n'a pas de port.
- Doute R50 C64-7 : le cas « autre session » (compte venu d'une autre session) n'est pas reproductible hors navigateur.
- jsdom : aucun rendu à 390 px ; à voir en ligne après correctif.
- R48 : le test « IA 6,70 pour 50 g » simule la réponse observée au test en ligne ; aucun Gemini appelé.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : un test c61 (`R46 C61-5`) avait une échappatoire (`if (!repere)`) qui le laissait passer alors que la jauge restait fausse en ligne : une assertion conditionnée à la présence d'un élément du correctif ne prouve rien.

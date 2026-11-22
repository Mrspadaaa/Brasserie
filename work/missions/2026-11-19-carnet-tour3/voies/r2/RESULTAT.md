OK — 6 constats jugés sur réponses enregistrées : 2 couverts (PCN-160, PCN-104), 1 partiel (PCN-8), 3 sans réponse (PCN-15, 44, 50).

Commande : `npx vitest run tests/unit/carnetsEnLigne2.test.tsx tests/unit/carnetsEnLigne4.test.tsx tests/unit/carnetsBanc.test.ts --reporter=dot` (dans port-carnet, lecture seule du code) : 3 fichiers, 43 tests, tous verts, sortie de code 0. Sortie : `voies/r2/tests.txt`.
Fixture lue : `tests/fixtures/carnets/en-ligne-2/reponses.json` (envois 1, 3, 4, 5, 7, 8, 9, 10, 11, 12). `tests/fixtures/carnets/en-ligne-4` n'existe pas ; `carnetsEnLigne4.test.tsx` lit la même fixture en-ligne-2.

id | couvert (oui/non) | test | vert/rouge | une phrase
--- | --- | --- | --- | ---
PCN-160 | oui | carnetsEnLigne2.test.tsx, n° 1 | vert | Envoi 1 : « double paroi » rangé en note « à faire » du fermenteur, la pompe garde son carnet ; le test vérifie que la note n'est pas un critère.
PCN-8 | non (partiel) | carnetsEnLigne2.test.tsx, n° 5, 6, 7 | vert | Envois 10 à 12 couvrent le CHF, le nom lu et le tableau Comparer ; photo, caractéristiques avec valeurs, marque et « lu sur la page : débit » ne sont pas dans la réponse enregistrée.
PCN-15 | non | aucun | — | Aucune réponse « condensation » dans la fixture ni dans carnetsBanc.test.ts ; « Moins de X » jamais rejoué.
PCN-44 | non | aucun | — | « 38 cm » absent de la fixture et des tests ; la conséquence reformulée n'est pas rejouée.
PCN-50 | non | aucun | — | « fond de bac 38 cm » sans réponse enregistrée ; le « 30 L » n'est pas testé (git grep dans src : rien, déjà noté dans LIGNES).
PCN-104 | oui (chemin IA) | carnetsEnLigne2.test.tsx, n° 2, 3, 4 ; carnetsEnLigne4.test.tsx, « réponse réelle du test 2 » | vert | Envois 4 et 5 : l'IA rend « Doit tenir 80 °C au moins » et le test vérifie ce texte rangé, pas la phrase brute ; le repli local « votre phrase : … » n'est pas couvert et la qualité du texte IA ne se juge pas.

Douteux : PCN-8 reste partiel ; PCN-15, 44, 50 ne sont pas couverts par la fixture (il faudrait une réponse enregistrée de plus). Aucun envoi Gemini, aucune écriture hors voies/r2/.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune

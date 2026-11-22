OK — PCN-110, v7-1, v7-2, v7-3 corrigés, commit b7bbeb52f (port-carnet), 4 états capturés et ouverts

Commit : b7bbeb52f (branche claude/port-carnet-1711), 7 fichiers : comparer.ts, operations.ts, CarnetsVue.tsx, ListeCarnets.tsx, carnets.css, pictos.tsx, tests/unit/carnetsTour3F11.test.tsx (`git show --stat HEAD` vérifié).

id | verdict | commit | test | rouge→vert | capture
---|---|---|---|---|---
PCN-110 | corrigé : `luLe` posé à la lecture d'un lien (CarnetsVue `depuisIA`) ; « lues sur la fiche du vendeur, 19 nov. » maigre 14 px à la suite de « Caractéristiques » (h01-6) ; style calculé fw 400, 14 px, même ligne (journal) | b7bbeb52f | carnetsTour3F11 (PCN-110, CSS) | tests-rouge.txt, tests-rouge-css.txt → tests-vert.txt | captures/pcn110-{390,1280}-{clair,sombre}.png (ouvertes 390 sombre, 1280 clair)
v7-1 | corrigé : règle générale `avecArticleTypo` (genre du lexique) : « Comparer sur la température mini (°C) », « le volume », « le bruit » | b7bbeb52f | carnetsTour3F11 (v7-1) | idem | captures/v7-1-*.png (ouvertes 390 clair, 1280 sombre)
v7-2 | corrigé : picto `pot` dessiné pour « Résine pour le sol du local » (résine, peinture, vernis, sol, détergent) | b7bbeb52f | carnetsTour3F11 (v7-2) | idem | captures/v7-2-*.png (ouverte 390 sombre)
v7-3 | corrigé : citation longue → « Coller un lien » dessous (`cn-carnet-long`). Seuil 28 → 26 à la reprise : la capture v7-2 montrait « « acheter 2 sachets de… » (27 signes) encore coupée ; mesuré : 26 tient, 27 coupé ; test ajouté | b7bbeb52f | carnetsTour3F11 (v7-3, 3 cas) | idem + cas 27 signes ajouté vert | captures/v7-3-*.png, v7-2-390-sombre.png (citation entière)

Sorties décisives :
- tests-final.txt : Test Files 50 passed (50), Tests 731 passed, 1 todo (fichiers carnets* présents : 50 ; l'écart avec 53/751 de la REPRISE vient des fichiers carnets* des autres voies, pas de f11).
- `npx tsc --noEmit -p .` : aucune sortie.
- carnetsTour3F11 : 11/11.
- Serveur 5199 arrêté (0 écoute).

Cause de la REPRISE (« la règle ne s'applique pas ») : le banc v3 sert sans surveillance (`watch: null`, `hmr: false`) ; la capture précédente venait d'un serveur lancé avant la règle. Serveur relancé : règle appliquée.

Prédiction : « Bon, la date est là et discrète, le pot se reconnaît ; rien à redire. »

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : le banc `voies/v3/vite.v3.config.mjs` a `watch: null` : tout changement de code exige de relancer le serveur avant de capturer.
LEÇON PROPOSÉE : un défaut « la règle ne s'applique pas » sur un banc sans surveillance : vérifier d'abord le module servi (`curl … | grep`) avant de chercher une règle plus forte.

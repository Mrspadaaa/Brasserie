OK — 6f0282d15 : P-1 et P-2 corrigés (acte = Service enregistré ; barrés « ? » tus)

id | verdict | commit | test | rouge→vert | capture
---|---|---|---|---|---
P-1 | corrige : une ligne que la famille range sous « Services » (acte LR2-7, lu `other` ou `equipment`) prend `kind: service` dès la lecture (finale.ts, `lignesDeLecture`) ; le port, la remise et une nature lue `service` gardent la leur ; la collerette reste Matériel | 6f0282d15 | tests/unit/depense/f12-tour3.test.tsx « P-1 » (2) | rouge : `expected [ 'Matériel', 'Matériel', …] to deeply equal [ 'Service', 'Service', …]` et `expected [ [ 'Sedation IM,', 'other' ], …] to deeply equal [ [ 'Sedation IM,', 'service' ], …]` (enregistré à « Confirmer ») → vert | f12-doc2-autres-{390,1280}-{clair,cave}.png : « Service » allumé sur Sedation
P-2 | corrige : `barreSansInfo` (finale.ts) compare mot à mot le barré et le même libellé tiré des valeurs d'aujourd'hui ; chaque mot du barré est « ? » ou identique (casse ignorée) → le barré ne s'affiche pas (Ligne.tsx, `corrigee.muet`). Un autre nom, quantité ou prix connu parle toujours. Le plateau « 1re lecture … » est inchangé | 6f0282d15 | f12-tour3 « P-2 » (4) | rouge : `barreSansInfo is not a function` → vert ; banc reel-doc2 : `barres: []` aux 4 combinaisons (avant : 3 barrés) | f12-doc2-autres-*.png : Collerette, Rimadyl, Combiclav sans barré

Fichiers (port-carnet) : src/ui/depense/finale.ts, src/ui/depense/Ligne.tsx, src/ui/finance/ExpenseSheet.tsx (import + `muet`), tests/unit/depense/f12-tour3.test.tsx (neuf).
Voie : g-f12.mjs, outil.mjs (copie de f10), f12-journal.log, captures/ (8), tests-rouge.txt, tests-rouge-p1-ecran.txt (P-1 écran rejoué sur le correctif retiré, puis remis depuis une copie), tests-vert.txt (6/6), tests-final.txt : 222 fichiers passés, 1 sauté ; 2843 tests passés, 4 sautés. tsc --noEmit : aucune erreur.
Commit 6f0282d15 : `git show --stat HEAD` = 4 chemins, tous de la voie. Serveur 5200 arrêté, port libre. Captures ouvertes : autres-1280-cave, autres-390-clair, autres-390-cave, autres-1280-clair.
Essais : P-1 1 (sélecteur de test corrigé deux fois, pas le code), P-2 1.

Doutes et limites :
- « 7 corrigées » devient « 6 corrigées » sur doc2 : la nature de Sedation ne varie plus d'une lecture à l'autre (les deux lues → service). Voulu (nature disputée hors compte, LR2-3).
- Les actes passés en Service s'affichent « 1 × 711,70 » (sans « pièce ») : rendu existant des lignes hors stock de nature Service.
- Vu à 1280 (hors voie, f10) : sous Fournisseur, « À confirmer · Fournisseur : lectures divergentes (… / … / …) » reste affiché alors que « Lectures 3/3 d'accord » ; f10 annonçait aucun « À confirmer » au fournisseur. À router.
- Un choix manuel « Matériel » sur un acte reste sous la bande Services (règle LR2-7 de familleDe, inchangée) : hors contrat.

DÉCISION À PRENDRE : aucune
CONNAISSANCE : la nature d'une ligne lue se pose dans `lignesDeLecture` (finale.ts, `lues`) ; la bande vient de `familleDe` : les deux doivent dire la même chose.
LEÇON PROPOSÉE : aucune

OK — Liste des fûts G4 portée : jauge à choix multiple, Voir tout, sections, lignes de L1, Tout marquer propre + Annuler.

Fichiers : src/ui/KegBoard.tsx, src/ui/keg-liste.css (neuf), src/domain/stock/futsFiche.ts (fonctions pures), tests/unit/futsListe.test.ts, tests/integration/futsListe.test.tsx, tests/integration/compactEquipment.test.tsx (puces remplacées par la jauge), capturer.mjs (port 3022).

Preuves : vitest 131 verts sur 7 fichiers (futsListe unit et intégration, futsFiche, futsPort, bStockFuts, compactEquipment, defautsStocksEcrans) ; tsc sans erreur dans src (seules erreurs : functions/, firebase-admin absent, connues) ; VITE_HOP_V4=on vite build vert ; check-no-dev-auth propre.
Captures (16, ouvertes : 390 clair ×4, 390 cave filtre, 1280 clair repos, comparées à g-1280-clair-gr.png) : liste-{repos,filtre,confirmation,apres}-{390,1280}-{clair,cave}.png.

Écarts à la maquette G4 (choix de lecture) :
1. « Voir tout » à gauche de la jauge (mots du brasseur) ; la ligne de filtre a aussi un « Voir tout » (aria « Retirer le filtre »).
2. Tri « le plus ancien d'abord » appliqué aussi à À laver et Propres : F-003, F-004, F-002 (la maquette montrait F-002 d'abord) ; la confirmation liste les numéros par ordre : F-002, F-003, F-004.
3. La confirmation s'ouvre sous le résumé (zone fixe), pas après les lignes de la section : visible sans défiler. Elle prend le focus, sans contour.
4. Lignes À laver : « Revenu le 10.11 · Bar Le Zinc » quand l'historique le dit (la maquette l'omettait pour F-003 et F-004).
5. Après « Marquer propres », le filtre est levé (comme la 3e vue de G4). Le lien « Tout marquer propre » disparaît quand la recherche cache une partie des fûts à laver. Bandeau : 15 s puis s'éteint.
6. Pleins du gabarit : teinte NEIPA fixe (--ebc-straw est le noir de l'action en clair).
7. compactEquipment : 2 tests réécrits (radios Tous/À laver · 0 → jauge ; un état à 0 n'a plus de segment ; le filtre sur un état réparé reste dit : « Filtre : État inconnu » et « Aucun fût… » avec Voir tout).

CONNAISSANCE : aucune. LEÇON PROPOSÉE : aucune.

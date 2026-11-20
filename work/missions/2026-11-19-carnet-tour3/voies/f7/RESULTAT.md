OK — 7 problèmes v5a corrigés (n° 6 en partie, maquette G4), commit 0b30c6775, 12 tests rouges→verts

Commit : 0b30c6775 (port-carnet, `claude/port-carnet-1711`), 12 chemins, vérifié par `git show --stat HEAD` (aucun fichier d'une autre session).

| n° | verdict | commit | test | rouge→vert | état à capturer |
|---|---|---|---|---|---|
| 1 bloquant, puce « Coller : e… » à côté de la bulle G8 | corrige | 0b30c6775 | tests/unit/carnetsTour3F7.test.tsx (n° 1) | 1 rouge → vert (+1 contrôle de rendu, vert avant et après) | Ventilation `&g8=1`, presse-papier = lien, champ touché, 390 et 1280 |
| 2 « Nouveau carnet · arrive ici » au-dessus de « Ouvrir ce carnet » | corrige (et Ajouter ouvre le carnet, aucun doublon) | 0b30c6775 | idem (n° 2, 2 tests) | 2 rouges → verts | liste, « Ventilation de la salle » tapé, puis Entrée |
| 3 cadre d'arrivée, nom et « Façon » coupés au bord à 390 | corrige | 0b30c6775 | idem (n° 3, 3 tests) ; PCN-121 (carnetsTour3F2) mis à la règle `data-deborde` | 3 rouges → verts | Ventilation, « autre projet, sans rapport : un frigo… » tapé, 390 |
| 4 « votre message » pour un lien ; « tient 80 °C oui » | corrige | 0b30c6775 | idem (n° 4, 2 tests) | 2 rouges → verts | liste, lien collé puis Ajouter, bandeau, 390 et 1280 |
| 5 « Choisis, pas encore dans À venir » dans l'onglet À venir | corrige : « Choisis, pas encore planifiés » | 0b30c6775 | idem (n° 5) ; 3 anciens tests mis au nouveau titre | 1 rouge → vert | onglet À venir, 390 et 1280 |
| 6 destination et genre dits deux fois | corrige en partie : le genre une fois (le cadre ne dit plus « Notes : » quand la rangée « en [Note] » est là) ; « ↓ va dans X » reste, c'est la tête du cadre de la maquette (G4, critique 5 n° 3, test carnetsCritique5Fil) : ecarte pour la destination | 0b30c6775 | idem (n° 6) | 1 rouge → vert | comme n° 3 |
| 7 « brasse la buée sans la sortir » deux fois | corrige : l'article écarté pour la raison de sa façon dit « écarté » seul | 0b30c6775 | idem (n° 7) | 1 rouge → vert | Ventilation, bas de page (façon écartée), 390 |

Le détail :
- Le n° 1 : `.cnf-aides-ligne` passe à la ligne (bulle `flex: 1 1 13rem`, puce `max-width: 100%`). À 390, la bulle tient en 3 lignes et la puce « Coller : exemple.invalid/hotte-… » est dessous, entière. À 1280, les deux restent sur une ligne (P37).
- Le n° 3 : sous 900 px, les rangs « Va dans » prennent aussi la colonne du + (342 px au lieu de 278, marge de −64 px). Le champ descend de 6 px : le + reste à 8 px sous le dernier rang, mesure du + : 736 px, rangs à 728. Le fondu et sa marge ne viennent qu'au débord réel : `data-deborde` est posé par `useDebordVaDans` dans ChampCarnet.

Sorties décisives :
- `voies/f7/tests-rouge.txt` : 11 en échec, 1 vert sur le code d'avant (fichiers de HEAD remis le temps du test, copies vérifiées par `cmp`, puis restaurées).
- `voies/f7/tests-vert.txt` : 12 verts sur 12.
- `voies/f7/tests-final.txt` : 48 fichiers, 717 verts, 1 todo.
- `voies/f7/tsc.txt` : tsc a rendu 0.

Captures ouvertes, 390 clair : `voies/f7/captures/g8coller-390-clair.png` (puce lisible), `n1-390-clair-a-frappe.png` (« Frigo de garde… » et « Ici » entiers, « Façon » entière, sans fondu, cadre sans « Notes : »), `n3-390-clair-a.png` (une seule annonce). Le serveur 5191 est arrêté et le port est libre.

Prédiction : « Là je lis le lien, et il ne me propose plus de recréer Ventilation. »

DEMANDE EXECUTANT :
1. Serveur : `cd C:/Users/mrspa/.codex/worktrees/openai-clean-start/port-carnet && npx vite --port 5191 --strictPort` (en arrière-plan).
2. `cd C:/Users/mrspa/.codex/worktrees/openai-clean-start/Brasserie/work/missions/2026-11-19-carnet-tour3/voies/f7`
   - `node rejeu.mjs g8coller,n3,n1 390,1280 clair,sombre`
   - `node rejeu.mjs coller,ecrans 390,1280 clair,sombre`
   - Cela rejoue les n° 4 et 5 : bandeau `coller-*-c-apres`, onglet À venir `ens-avenir-*`. Le n° 7 se voit en bas de `ens-ventil-390-clair` (capture pleine).
3. Sortie attendue dans `captures/journal-*.txt` : aucune ligne `ERREUR` ni `pageerror`. Pour g8coller, la ligne doit contenir « Coller : exemple.invalid ».
4. Captures à ouvrir :
   - `g8coller-390-sombre.png`, `g8coller-1280-clair.png` : bulle et puce sur une ligne à 1280 ;
   - `n1-390-sombre-a-frappe.png` ;
   - `coller-1280-clair-c-apres.png` : « votre lien », pas de « oui » seul ;
   - `ens-avenir-390-clair.png` : « Choisis, pas encore planifiés » ;
   - `ens-ventil-390-clair.png`, en bas : une seule fois « brasse la buée sans la sortir ».
5. Arrêter le serveur et vérifier que le port 5191 est libre.

DÉCISION À PRENDRE : n° 6, destination dite deux fois quand l'objet va dans un autre carnet. Elle apparaît dans la tête du cadre (« ↓ va dans X », maquette G4) et dans la rangée « Va dans [X] [Ici] » (critique 6 n° 29). En retirer une touche une maquette ou un choix : choix du brasseur, en mini maquettes.
CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune

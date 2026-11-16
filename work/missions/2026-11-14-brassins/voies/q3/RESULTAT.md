OK — e3gb porté : Carnet (fil, vrac, rangement simulé) et Dossier d'un brassin en fermentation, tsc, 16 tests, 9 captures.

## Fichiers écrits
- `src/ui/production/carnet/` : `carnetModel.ts`, `rangement.ts`, `useCarnet.ts`, `CarnetFil.tsx` (corps et pied du Carnet), `DossierFil.tsx` (corps et pied du Dossier : titre-réponse, ruban, ticket « Recette figée », plan, boutons, rappel dry hop).
- `src/ui/BatchDetailSheet.tsx` : seulement pour `status === 'fermentation'` : imports, `useCarnet(draft, …)` avant le return, `CarnetFil`/`DossierFil` à la place des blocs Carnet et Dossier, pied `CarnetPied` / `DossierPied` (rappel dry hop, jour J → `setConfirmStock('remaining')`), ligne « Ajouts réservés à confirmer · voir Mesures » masquée en fermentation tant qu'aucune erreur de stock (le titre et le pied disent déjà la même chose). Mesures et les autres états (e1a, e2a, e4c) intacts.
- `tests/unit/port-q3-carnet.test.tsx`, `voies/q3/{INVENTAIRE.md, banc.mjs, tests.txt, journal.json, captures/}`.

## Critères
- G1 : `TSC hors functions : 0` (rejoué après les dernières retouches).
- G2 : `Tests 16 passed (16)` (`tests.txt`) : aller-retour des blocs, texte ancien = vrac, verdict conservé, fil (J0, relevés, dry hop « demain »), rangement simulé (drapeau éteint : « pas encore branché », aucune écriture ; Accepter les 5, morceau vers la Stout, Annuler restaure, ✓ sans jour inactif, hors ligne : note intacte, aucune écriture sans geste), Écrire, dossier (titre, « α non saisi », plan, rappel, rendu).
- G3 : `captures/e3gb-{repos,geste,rangement,dossier,dossier-bas}-app-390-clair.png`, `-repos` et `-dossier` en `-390-cave` et `-1280-clair` ; INVENTAIRE.md écrit. Ouvertes à côté des PNG de `voies/e3g/e3gb/` : repos, geste, rangement, dossier (390 clair). Cave et 1280 prises, non ouvertes faute de contexte : à regarder par le pilote.
- G4 : `git status --short src` ne montre que `src/ui/production/carnet/`, `src/ui/BatchDetailSheet.tsx` et les chemins des voies voisines (q1, q2, q4).

## Écarts restants (combien et quels problèmes : 7)
1. Pictos de familles de houblon sur la ligne dry hop non repris (pas de composant d'app prêt).
2. En-tête de la feuille (« Brassé le … / Initialement prévu … », sous-titre « levuré le 09.11 ») et onglets : q1, pas q3.
3. Polices : l'app rend un titre plus large que la PNG de la maquette (« 6 morceaux à placer » passe sur deux lignes à 390) ; à juger au rendu final avec les polices chargées.
4. Après « Accepter les 5 », le morceau sans jour (Robinet) reste proposé : la note en vrac reste donc visible au J+5 et « Accepter les 0 » est grisé ; la maquette montre l'état où les six sont placés. Choix cohérent (la note ne disparaît qu'une fois tous ses morceaux placés).
5. L'heure d'une note ancienne est inconnue (« heure inconnue »).
6. Un avertissement React « deux enfants avec la même clé » (27 occurrences au banc) : origine non identifiée, absente de mes listes (clés uniques dans carnet/) ; peut venir de la liste ou de la feuille (q1/q2). À vérifier par le pilote.
7. Cave et 1280 non regardés (voir G3).

## ACCORD (à signaler au pilote)
- Rangement par l'IA : demande une tâche serveur neuve dans `functions/` (le service `aiTask` n'a que `tastingNotes` et `diagnoseBatch`) et son déploiement. Interface branchée sur une réponse simulée derrière `RANGEMENT_IA_BRANCHE = false` ; avec le drapeau éteint, « Ranger » dit « le rangement par l'IA n'est pas encore branché : ta note reste en vrac ». L'accord reste écrit, aucun déploiement.
- Date réelle de l'ajout du dry hop : aucun champ dans le modèle ; le geste « Dry hop ajouté · … » passe par la confirmation existante des ajouts de fermentation, sans date propre.
- « Budget · non estimé » : non écrit (libellé « Budget » seul) ; à brancher si le pilote veut lire `brewEstimate`.
- Portée : e3gb ne vaut que pour la fermentation ; les autres états gardent leur Carnet et Dossier.

## Essais
G1 : 2 passes ; G2 : 2 (un test de fil corrigé : la ligne « aujourd'hui » n'existe que s'il y a une note ce jour) ; banc : 2 passes (corrections : vrac masqué pendant le geste, kg sans zéros inutiles, pied du Dossier en 14 px, bandeau de stock redondant).

CONNAISSANCE : le carnet range ses entrées dans `notesTasting` et `notesBrewDay` par lignes de tête datées (`14.11.2026 07:40 · Vrac : …`, `Prochain essai : …`), sans champ Firestore neuf ; un texte ancien reste lu comme vrac.
LEÇON PROPOSÉE : aucune

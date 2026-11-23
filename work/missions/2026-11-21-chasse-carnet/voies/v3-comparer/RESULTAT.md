OK — Comparer V3 commité (516b9b439), vert sur l'arbre, rouge sur tour8 ; la suite attend le choix Comparer (D415). REPRISE de ce fichier.

# V3 Comparer (Chasse Carnet, 21.11) — arrêtée sur la décision D415

Code : worktree `port-carnet`, commit `516b9b439` (par chemins, index temporaire). Rien déployé, aucun Gemini, aucune donnée réelle.

## Fichiers écrits
- `src/domain/carnets/comparer.ts` : `LigneTableau.dispo/vendeur/pays` ; `rangVisible(t, l)` (CRB-5) ; `groupeDeLigne` (CRB-14).
- `src/ui/carnets/Comparer.tsx` : `colonnesComparer` (prix toujours en tête, livraison, ordre), « prix ? », `estMesure`/`genreCellule`/`Mesure` (mono pour les mesures seulement), fil « ‹ Carnets » sans redite du titre, pastille de rang seulement si `rangVisible`, tolérance de 2 px de l'ombre. `colonnesVue` (utilisée par CarnetOuvert) n'est pas touchée.
- `src/ui/carnets/carnets-decider.css` : échelle 18 / 14 / 12 dans Comparer, libellés qui passent à la ligne, valeurs qui passent à la ligne, texte à gauche.
- `tests/unit/carnetsComparerPrix.test.ts` (27 tests verts ; tous les `tests/unit/carnets*` : 54 fichiers, 807 verts ; ct4c, levureMontage, port-p2-bilan verts).
- `scripts/parcours/carnet-etapes/comparer.mjs` : un contrôle par id (CRB-2, CRB-3, CRB-5, CRB-13, CRB-14, CRU-5, CRU-6, CRU-11, CRU-13), 390 clair et cave, 1280.

## Critères
- Arbre : `node scripts/parcours/carnet.mjs <dossier> --seulement comparer` → « PARCOURS CARNET OK » (dix-huit lignes ok).
- Tour8 : `… --ref en-ligne/2026-11-21-tour8 --seulement comparer` → 8 contrôles KO à 390 (CRB-2, CRB-3, CRB-5, CRB-13, CRB-14, CRU-5, CRU-6, CRU-11), 7 à 1280. CRU-13 est vert aussi sur tour8 : l'ombre disparaît déjà au bout du défilement au banc (non reproduit ; tolérance de 2 px posée pour l'écran dense du brasseur).
- Captures ouvertes : `%TEMP%/v3-arbre/390-v3-chambre-comparer.png` et `1280-v3-chambre-comparer.png` (prix « prix ? » en tête, volume, dimensions un terme par ligne en mono, deux articles visibles à 390). Non ouvertes : cave et Ventilation.
- BUGS.md : CRB-2, CRB-13, CRB-14, CRU-6 « corrigé » ; CRB-5, CRB-3, CRU-1, CRU-5, CRU-11, CRU-13 « en cours » ; chaque note dit « attend le choix Comparer (D415) ». `controle-bugs.mjs` : « BUGS OK ».

## Attend le choix Comparer (D415) — arrêté ici
- La mise en cartes (D1 : CRB-3, CRU-1, CRU-5, CRU-13) et l'en-tête compact.
- La forme de la rangée prix épinglée (CRB-2) : elle existe, sa place visuelle dépend de D1.
- Une partie de CRU-6 et CRU-13 tombe si les cartes sont retenues.

## Hors V3, à faire par V4 / le pilote
- CRB-5 sur la liste du carnet : `CarnetOuvert.tsx:717/768/849` et `CarnetsVue.tsx:1284` doivent lire `rangVisible(t, l)` au lieu de `l.rang` (la pastille « 1 » verte y reste tant que non fait).
- CRU-11 pour la liste et la fiche (V4).

## Doutes
- « L'en-tête répété » lu comme la redite du titre (fil + titre, CRU-5). Les noms d'article collants à l'horizontale ne sont pas faits.
- Une dimension « 1800 x 1500 x 2100 mm » s'écrit un terme par ligne sans L / P / H : l'ordre des côtés n'est pas donné par la page, je ne l'invente pas.
- Prix toujours en tête : écart avec g01-8 (critère d'abord, prix ensuite), voulu par le pilote ; à confirmer dans D1.

CONNAISSANCE : aucune
LEÇON PROPOSÉE : aucune

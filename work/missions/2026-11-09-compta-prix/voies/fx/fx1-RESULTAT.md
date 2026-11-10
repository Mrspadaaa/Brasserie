OK — fx1 : palette v6b en clair, puce IA calculée, Budget sans Ventes, Sources en deux lignes, plage gardée.

## Fichiers écrits
- `src/ui/finance/operations.css` (bloc clair `.ops` : 18 jetons de la cave repris sous `.ops` seulement ; hachure jaune de v6b en clair), `src/ui/finance/operations/assistant.ts` (neuf : `questionPoste`), `src/ui/finance/TransactionJournal.tsx` (puce clonée avec `pose`), `src/ui/finance/FinanceAssistant.tsx` (une prop `pose`).
- `src/domain/finance/analyse.ts` (`apportsCents`, `resteCents` dans `Cascade` ; `autresMouvementsCents` gardé), `src/ui/finance/analyse/Sources.tsx`, `Budget.tsx`, `analyse.css` (`.ana-entrees`).
- `src/ui/finance/FinanceOverview.tsx` (props `plage`, `onPlage`, repli local si absentes), `src/components/tabs/FinancesTab.tsx` (état `plage`).
- Tests : `tests/unit/fx1Analyse.test.ts` (5), `tests/integration/fx1.test.tsx` (28). Rouge d'abord : les deux fichiers échouaient (exports absents, `apportsCents` undefined).
- Preuves : `fx1-tests.txt`, `fx1-tests-voisins.txt`, `fx1-build.txt`, `fx1-tsc.txt` (vide), `fx1-capturer.mjs`, `fx1-capturer-riche.mjs`, `fx1-captures/`, `fx1-captures-riche/` (Sources avec solde).

## Critères
1. Palette : clair 390 et 1280, piles `rgb(86,210,123)` Ventes, `(210,179,86)` Brassage, `(86,123,210)` Matériel ; cercles pleins fond sombre, trait clair (mesurés au rendu) ; cave inchangée (mêmes jetons). Contraste trait/fond des 5 cercles > 4,5 (test). Hachure « à payer » aux bandes jaunes de v6b en clair.
2. Puce : « Pourquoi les autres frais pèsent autant ? » (plus gros poste de la démo : Autres 250,20) ; la question envoyée parle du même poste ; sans poste, « Vérifier mes opérations ». Accords : les charges fixes pèsent / le brassage pèse.
3. Budget : la liste ne garde que les dépenses ; ligne à part « Entrées 5 695,00 · rien de prévu › » (renvoi ventes) ; dépensé inchangé (265,40). Légende « ventes au-delà du prévu » retirée (plus de barre de ventes).
4. Sources : le « +400,00 » n'était PAS des apports : c'était du reste à payer (apports = 0 dans la démo). Deux lignes : « Apports privés » (paiements d'apport − retraits, exacts, renvoi journal catégorie Apports) et « Reste à payer » (hachuré, renvoi filtre « À payer ») ; un reste négatif se dit « Payé hors période ». Zéro ou inconnu : pas de ligne.
5. Plage : l'état remonte dans FinancesTab ; mesuré au rendu (3 configs) : « Août – nov. 2026 » avant et après Opérations → Synthèse ; test vert.

Tests : fx1 + voisins (analyse, opérations, synthèse, renvoisPartout, f2Reel) : 107/107 verts. `tsc` : 0 erreur (hors paquets exclus). Build vert. Serveur 3014 arrêté.
Échec voisin, pas à moi : `tests/integration/financeWorkspace.test.tsx` (« ne redemande pas le solde… », bandeau CP-4 de Prévisions attendu ≥ 2, reçu 1) : `Previsions.tsx` est en cours de modification par fx2 (regroupement des bandeaux) ; à adapter par fx2.

## Captures ouvertes (L12) : combien et quels problèmes ?
Ouvertes : clair-390 ops-haut (avant : `vo/captures/app-clair-390-haut.png`), cave-390 ops-haut, clair-390 budget, riche clair-390 sources. Non ouvertes en image : cave 390 budget/sources, clair 1280 (captées, mesures lues).
Problèmes vus : 3.
1. Opérations clair : pile « Autres » et son cercle sont gris neutres (pas dans v6b) : pas de teinte de maquette à reprendre ; laissé.
2. Budget : la ligne « Entrées » est un peu plus à gauche que le texte des règles (4 px contre 10 px de padding de panneau) : retouche d'un trait possible.
3. Le titre de l'outil dit « oct. → nov. » pour « 30 j » (existant, hors fx1).

## Doutes et limites
- « Avant » : captures de `vo` et `an` (HEAD), faute de pouvoir refaire HEAD sans `git stash`.
- `controle-choix.mjs` (`work/refonte-frontend/v4/tournoi/outils/`) demande un dossier construit et un registre : non rejoué.
- Reste négatif nommé « Payé hors période » sans renvoi filtré (ventes à encaisser ou paiements d'une autre période, non séparés par le domaine).
- En-têtes collants de v6b non repris (noté « à juger » dans l'audit) : hors consigne.

DÉCISION À PRENDRE : aucune
CONNAISSANCE : l'ancien libellé « Pas encore payé, apports » masquait que l'écart de la caisse est surtout du reste à payer ; les apports privés se calculent exactement sur les paiements.
LEÇON PROPOSÉE : aucune

OK — f3 : BR-27 et TE-36 corrigés (e1500f2e8, 54ac4ab82), TE-35 prouvé, BE-26 écarté

Dépôt `port-carnet`, branche `claude/port-carnet-1711`. Commits par chemins, vérifiés par `git show --stat HEAD` (seulement mes fichiers).

id | verdict | commit | test (fichier) | rouge→vert | écran touché
---|---|---|---|---|---
BR-27 | corrige | e1500f2e8 | tests/integration/carnetTour3F3.test.tsx (« BR-27 … », 4 tests) | 4 rouges → verts | oui
TE-35 | corrige (déjà corrigé avant cette voie par MoneyInput/ChampNombre, BE-64/71 ; preuve ajoutée sur livraison « abc », prix « −5 » après 120, installation « -5 ») | e1500f2e8 (test seul) | tests/integration/carnetTour3F3.test.tsx (« TE-35 … », 3 tests) | verts d'emblée : le défaut n'existe plus au code | non
TE-36 | corrige (registre : « caduc » ; faux : la feuille du projet affichait « Dans mes prévisions » (ProjetPiste:87), la fiche À venir aussi (UpgradeWorkspace:323), la liste et le nom lu « Inclure dans mes prévisions ») | 54ac4ab82 | carnetTour3F3.test.tsx (« TE-36 … ») + equipmentProjects.test.tsx (« TE-36 … ») | 2 rouges → verts | oui
BE-26 | ecarte (caduc : CreativePricing.tsx supprimé, 934f9a80, accord du 10.11 ; borne d'un format : BORNES_FINANCE.formatCents ; prix de tarif : BE-98, eae00e02) | — | — | — | non

## Ce qui a changé
- BR-27 (`src/ui/finance/BrewBudgetSheet.tsx`) : champ local `ChampCHF`, mêmes refus et même phrase que `ChampNombre` (BE-71) :
  « « -1 » : une valeur négative n’existe pas ici. La valeur précédente (8) est conservée. » Il refuse aussi « abc », plus de
  2 décimales et plus de 250 000 CHF (`BORNES_FINANCE.operationCents`). Rien n'est retenu, la valeur d'avant revient à la sortie
  du champ. Le message est posé sous la rangée, en `role="alert"`, relié au champ par `aria-describedby`.
  Champs touchés : les 4 frais (énergie, nettoyage, emballage, impôt saisi à la main), les charges fixes et l'usure annuelles,
  le prix du format d'un ingrédient (sans limite de décimales : un prix au gramme peut en avoir 3).
  `ChampNombre` n'a pas été repris tel quel : il n'a pas `disabled`, dont les postes décochés ont besoin, et son message se pose
  dans la case de 148 px. Saisie : `type="text"`, `inputMode="decimal"`, jamais `type="number"`.
- TE-36 : « Inclure dans mes prévisions » partout (ProjetPiste, fiche UpgradeWorkspace ; commentaire de UpgradeSheet).

## Preuves
- Tests : rouges `voies/f3/tests-rouge.txt` (carnetTour3F3 : 4 échecs BR-27, 3 TE-35 réussis, sur 7) et `voies/f3/tests-rouge-te36.txt`
  (2 échecs, 23 réussis, sur 25). Vert : `voies/f3/tests-vert.txt`, 11 fichiers, 137/137 (carnetTour3F3, equipmentProjects,
  upgradeSheetTe35, fixMateriel, projetPiste, u2FeuilleProjet, previsionsPrevoir, brewBudgetSheet, budgetPiles,
  coutBrassinCorrections, coutBrassinRenvois). `npx tsc --noEmit -p tsconfig.json` : 0 erreur.
- Captures dans `voies/f3/captures/`, prises avec `captures.mjs` (Vite 5183, `?dev-local`, réseau externe coupé, données simulées), en
  390 tactile et 1280, en thème clair et en thème cave. Serveur arrêté ensuite.
  - `br27-*.png` : wizard (`?dev-local&etape=levure`) › Récap. › « Estimer le budget de ce brassin » › Frais › Énergie « -1 », puis sortie
    du champ. Le journal dit, pour les 4 captures : `champ:"" invalide:"true"` et l'alerte « « -1 » : une valeur négative n’existe pas ici.
    Le champ reste vide. » Ouvertes : 1280 clair et 390 cave. Le message rouge est sous Énergie, entre la rangée et « Déjà prévu ».
  - `te36-fiche-*.png` (fiche À venir, interrupteur) et `te36-feuille-*.png` (« Modifier », station « Prêt à acheter ») : « Inclure
    dans mes prévisions » s'affiche sur une ligne à 390. Ouvertes : fiche 1280 clair et 390 cave, feuille 1280 clair et 390 clair.

## Pour la vision du pilote
- Budget du brassin › Frais (aussi Charges fixes et usure, et le prix d'un ingrédient) : taper « -1 », puis quitter le champ.
- Atelier ou Stocks › Matériel › À venir : la fiche d'un projet, son interrupteur, puis « Modifier » › « Prêt à acheter ».

## Doutes et limites
- Après la sortie du champ, le champ refusé est `aria-invalid`, mais seul le message est rouge, pas le bord. C'est le comportement de
  `ChampNombre` (le bord rouge seulement pendant la frappe), gardé pour la cohérence.
- `ChampCHF` reprend 20 lignes de logique de `ChampNombre` : `ChampNombre` n'est pas dans mon périmètre.
- La TVA d'un poste (0–100 %) et la quantité du prix restent sur `NumberInput`, qui ramène la valeur à la borne en silence à la sortie
  du champ. Ce ne sont pas des coûts négatifs (hors BR-27), mais c'est le même genre de défaut.

DÉCISION À PRENDRE : donner à `ChampNombre` les options `disabled` et « message posé par l'appelant », pour supprimer `ChampCHF`.
Options : (a) garder `ChampCHF` local ; (b) étendre `ChampNombre` dans une voie qui le possède. Recommandation : (b), sans urgence.

CONNAISSANCE : le banc `?dev-local&etape=levure` ouvre le wizard sur une recette de démonstration, et Récap. › « Estimer le budget de ce
brassin » atteint BrewBudgetSheet sans aucune donnée. `?dev-local&preview=carnets` atteint la fiche et la feuille d'un projet de matériel.
LEÇON PROPOSÉE : aucune.

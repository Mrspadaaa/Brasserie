OK — frise des jours s2ap2 dans Opérations : deux poignées, filtre au jour, champs « du … au … » à 1280 ; 5 critères tenus

## Décision d'état de l'art (L29)
- Problème type : plage à deux poignées = motif WAI-ARIA « multi-thumb slider » ; intervalle fermé de dates [du, au] ; deux champs `input type="date"` natifs.
- Examiné : `RatioSlider` / `SliderField` (une poignée, valeur numérique : ne servent pas à deux bornes de dates) ; pointer events standards (`setPointerCapture`) ; react-day-picker (non : pas de calendrier demandé, pas de nouvelle dépendance).
- Décision : deux `role="slider"` (flèches ±1 jour, Page ±7, Origine/Fin), pointer events, `input type="date"`, clés ISO `AAAA-MM-JJ` bornes incluses. Aucun `type="number"`. Un ancien état `AAAA-MM` se lit (du 1er au dernier jour).

## Fichiers écrits
- `src/ui/finance/operations/plage.ts` (neuf, règles pures), `Frise.tsx` (neuf), `Bande.tsx`, `Piles.tsx` (la frise se pose entre les piles et la légende, comme la maquette ; en plage vide, la boîte « Ni vente ni dépense » garde la hauteur des piles pour que les poignées ne sautent pas), `src/ui/finance/TransactionJournal.tsx`, `src/ui/finance/operations.css`.
- `tests/unit/operationsPlageJours.test.ts` (7 tests).
- `f1/` : `controle-frise.mjs`, `capturer.mjs`, `temoin-head.txt`, `tests.txt`, `INVENTAIRE.md`, `cap/` (captures + `planche-s2ap2-390-clair.png`).
- `PlageMois.tsx` : non touché (Synthèse et analyse l'utilisent).

## Critères (rejoués depuis la racine)
- G1 `controle-frise.mjs 3000` : `FRISE OK` (25 vérifications : repos sans frise ; frise 54 px ≤ 56 ; plage 1er → 14 nov. au clavier ; 1er → 13 nov. : opérations du 14 sorties, loyer en « hors plage », « Ni vente ni dépense », pas de légende à 0 ; ‹ › glissent de 13 jours ; poussée au bord 29 oct. ; « × mois entier » ; à 1280 deux champs date visibles qui posent la plage tapée ; légende de la plage 5 oct. recalculée ; aucun `type="number"` ; 0 erreur console). Jeu : `?dev-local&finance-demo` (brasserie complète).
- G2 `TEMOIN OK` : HEAD servi par `git archive` dans un dossier temporaire (port 3018, serveur arrêté), même contrôle : `FRISE ECHEC` (pas de bouton « Déplier », pas de champs date).
- G3 `controle-v6a.mjs 3000` : `V6A OK` (rejoué après chaque changement, dernier après la bulle).
- G4 `VITEST OK` : 24 fichiers, 276 tests (unité financière et Opérations). Voir les limites.
- G5 `INVENTAIRE OK` : 18 éléments + 2 retouches, colonne « Vu » remplie.
- `npx tsc --noEmit` : aucune erreur hors `functions/`.
- Essais : 1 par critère après les corrections ci-dessous.

## Captures ouvertes (L12)
Planche 390 clair maquette contre app (4 états), `acheval-390-cave`, `apres-390-cave`, `frise-1280-cave`, `hors-1280-clair`, `tenue-390-clair`, `pousse-390-clair`, `tenue-gauche-390-clair`. Les autres (`repos`, `frise`, `apres`, `acheval`, `hors` × 390/1280 × clair/cave) sont produites et sans erreur console ; non toutes ouvertes une à une.
Défauts vus et corrigés : 1) frise au-dessus des piles, la maquette la met dessous ; 2) « 29 oct. » chevauchait « 1er nov. » sur l'axe (étiquettes sans chevauchement, test unitaire) ; 3) bulle de poignée coupée au bord gauche (collée à gauche/droite près d'un bord) ; 4) la plage vide faisait sauter la frise (hauteur de la boîte vide fixée).

## Défauts restants et limites
- À cheval du 29 oct. : la note « aucune opération saisie » n'est pas vue (le jeu n'a pas de mois vide dans la fenêtre) ; règle seulement testée en unité.
- La bulle recouvre « N jours · N opérations » quand la poignée est près de la gauche (la maquette n'a pas ce cas).
- Le 390 « Compagnon hors connexion · mode local » recouvre les boutons du bas : bandeau de dev, pas de f1.
- Tests hors voie, environnement : 3 fichiers unitaires financiers (`brewerBudgetLedger`, `financeDocumentHistory`, `financeDocumentMigration`) et une trentaine d'autres de `tests/unit` ne se chargent pas dans ce worktree (`firebase-admin`, `firebase-functions`, `cheerio` absents de `functions/`) ; `tests/unit` entier non vert ici pour cette seule raison (sortie complète non gardée dans la voie).
- Tests d'intégration à mettre à jour (hors Possède) : `tests/integration/operationsPeriode.test.tsx` (c) et (c bis) échouent : ils cherchent « Autre période » / « Du mois » et attendent que ‹ défasse la plage ; s2ap2 les remplace (frise, champs « Du » / « Au », ‹ › glissent). Les autres fichiers listés (operationsV6bMois, financeJournalUx, fx1, mobileDailyViews, financeArchives) passent.

## DÉCISION À PRENDRE
- `periodeSynthese` / `dansPeriode` (domaine, hors Possède) ne filtrent qu'au mois ; contournement dans `periodeSurJours` (pièces hors jours demandés datées `1900-01-01` avant l'appel). Limite : le contrôle « avoir daté après sa facture » n'est pas rejoué si la facture est hors plage. Recommandation : étendre `dansPeriode` aux bornes `AAAA-MM-JJ` (3 lignes rétro-compatibles) et supprimer `periodeSurJours` ; à confier à une voie qui possède `src/domain/finance`.
- Frise au-delà de 400 jours : barres non dessinées (piste, poignées, compteur restent). À valider.
- « hors plage » : ligne non cliquable comme la maquette ; ouvrir la fiche demanderait un rappel depuis `FinancesTab.tsx`.
- Le bouton « … » (Autre période) est retiré d'Opérations (la maquette n'en a pas) ; la loupe reste.

## À faire par le pilote
Mettre à jour `tests/integration/operationsPeriode.test.tsx` (c), (c bis) ; `git status --short` fait : seuls les fichiers de f1 sont à moi (les autres modifications viennent d'autres voies).

CONNAISSANCE : aucune
LEÇON PROPOSÉE : un auteur qui lit toute la maquette et tous les fichiers avant d'écrire atteint le plafond avant le premier test ; lire par grep ciblé et écrire plus tôt. Une capture au repos ne suffit pas : l'ordre des blocs (frise sous les piles), un chevauchement d'étiquettes et une bulle coupée ne se voient que sur la planche côte à côte avec la maquette et sur un état tenu au pointeur.

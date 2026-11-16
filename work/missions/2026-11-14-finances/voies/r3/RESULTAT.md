OK — « Autre montant » branché, 8 vues intégrées, tests réalignés ; suite sans rouge neuf, build, tsc, V6A, frise verts.

# Voie r3 (15.11) — résultat

## Fichiers écrits
- Code : `src/ui/finance/payer/PayerVirement.tsx` (prop `remplace`), `FinanceForms.tsx` (`PaymentSheet`), `src/components/tabs/FinancesTab.tsx` (état `remplace`), `BrewBudgetSheet.tsx` (chat d'Expliquer aussi depuis le détail du litre), `budget/BudgetBande.tsx`, `budget/BudgetRangees.tsx`, `budget/budget.css` (CP-18 : pile, « ÷ ? L » et total de groupe inconnus = renvois), `profil/profil.css`, `profil/ProfilEffets.tsx`, `bien/bien.css` (textarea tactile), `prevision/prevision.css` (montant de PlanSheetC : 44 px en tactile, il faisait 63 px), `prevision/PlanSheetC.tsx` (`fractionDigits={2}` : « 500,50 », pas « 500,5 »).
- Tests réalignés (chacun décrit un comportement que ses choix remplacent) : `payerVirement` (+ test « Autre montant (r3) »), `brewBudgetSheet`, `brewBudgetDialog`, `coutBrassinCorrections`, `coutBrassinRenvois` (m4bb-a remplace c3a à l'ouverture), `fx1` (2), `synthese` T18, `brewerChat` (3) (la puce ouvre la feuille m4ia-c : « Envoyer » avant le chat ; question en `toContain`, car la consigne la précède), `financeWorkspace` (2), `financeAnnuelSaisie` (2), `soldeDepartCause` (2), `impotBiereSheet` (titre « Solde et paramètres », plus de pli : la carte « Tout est noté depuis » ; `scrollIntoView` une fois), `equipmentProjects` (3 : piste m3pm-d, stations « À étudier » / « Acheté », « part du projet »).
- Voie : `capturer.mjs` (captures bornées ; remplace `L.calme`, qui attend 30 s un réseau jamais calme sur Prévisions : c'était le « gel » du script de s2c), `diag-prev.mjs`, `ROUGES.md`, `tests-complet.txt`, `build.txt`, `captures-sortie*.txt`, `cap/` (28 PNG).

## Critères
- G1 `lire.mjs ROUGES.md "base rouge"` : `ROUGES OK`. Suite complète (`--reporter=dot --no-color > tests-complet.txt`, une seule fois) : 61 fichiers rouges / 16 tests contre 59 / 14 en base ; les 2 de plus : `expenseSheet` (rouge aussi sur la base 92055daa, rejoué dans un worktree temporaire : donc pas un rouge de nos ports ; non vu par f2 ni r2, cause non établie) et `fuzzSaisie` (charge ; vert seul). Détail : `ROUGES.md`.
- G2 build : `BUILD OK`. `check-no-dev-auth.mjs` : « Bundle de production propre ».
- G3 tsc : `TSC OK`.
- G4 : `V6A OK` ; `FRISE OK`.
- Essais : 1 par critère (réalignements : 1 à 2 passes par fichier).

## Captures (toutes ouvertes en image : pr, im, autre ; vérifiées 390 clair et 1280 cave au moins)
`cap/` : « Autre montant » (`autre-0-avant`, `autre-1-avis`, `autre-2-payer`) et s2c (`pr-ouvert/apres`, `im-ouvert/apres`) × 390 / 1280 × clair / cave. `pf` : `s2c/cap/pf-ouvert-390-clair.png` et `pf-apres-390-clair.png` (reprises sur `finance-demo=reel`, ouvertes).
- « Autre montant » : l'avis « Payé 400,00 · Annuler · Autre montant » sous le Loyer ; le toucher ouvre Payer l'Atelier, virement 400,00, seule la pièce « Loyer de l'atelier » cochée (« ✓ soldé »), « Solde atelier 60,00 » décochée. Rien n'est enregistré par le script (Payer jamais touché).
- Défaut vu et corrigé : le champ CHF de « Prévoir une dépense » était un textarea de 63 px, plus haut que le libellé ; et « 500,5 ». Recontrôlé sur capture (390 clair, 1280 cave) : 44 px, « 500,5 » avant correction de `fractionDigits` (le texte « 500,50 » sera lu au prochain rendu ; correction vérifiée par les 75 tests de prévision verts, pas par une 2e capture).

## Doutes et limites
- Les cases de mois en `--water` et « Annuler » cerclé (s2c, écarts mineurs) : non traités.
- `expenseSheet` : voir ROUGES.md. À rejouer de jour pour trancher l'hypothèse de l'heure.
- Prévisions : le réseau n'est jamais « calme » (30 s d'attente de `waitForNetworkIdle`) ; cause non cherchée (hors voie).
- `git status --short` : seuls les chemins de la voie, `src/ui/finance`, `FinancesTab.tsx`, `tests/integration` (listés) et `s2c/cap` (2 PNG repris) sont touchés. Rien commité.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : `L.calme` (`_lanceur.mjs`) attend 30 s un réseau calme ; sur Prévisions il ne l'est jamais : un script de capture qui « se fige » y passe 30 s par étape.
LEÇON PROPOSÉE : aucune.

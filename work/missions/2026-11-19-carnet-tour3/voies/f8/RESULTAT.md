OK — v3-6 corrigé (retrait voulu ≠ manque), deux tests périmés réparés ; eea71e779, 26bcc7ac2

id | verdict | commit | test | rouge→vert | état à capturer
---|---|---|---|---|---
v3-6 | corrige | eea71e779 | tests/unit/depense/f8-tour3.test.tsx (4 unitaires + 1 rendu ExpenseSheet) | 3 rouges (« expected '2,40 CHF manquants' not to match /manquant/ », pied, feuille) → vert | oui : banc `../v3/` M9-3 (3 lignes, 86,50), « Retirer la ligne 3 » (2,40), bloc et pied ; puis « ↶ Annuler »
expenseSheet « confirmation explicite » | ecarte (test périmé, pas un défaut de donnée) | 26bcc7ac2 | tests/integration/expenseSheet.test.tsx | 1 rouge → vert | non
serveur.test empreinte | corrige (aide du test) | 26bcc7ac2 | tests/unit/depense/lecture-d/serveur.test.ts | 3 rouges ENOENT → vert | non

## Fichiers écrits (port-carnet)
- src/ui/finance/controlesCroises.ts : entrée `retraitsBrasseur {n, cents}`. Écart en CHF couvert exactement (±5 ct) → rangée Somme neutre
  « Somme = imprimé − 1 ligne retirée · 2,40 », sans geste ; écart d'articles couvert → « Articles lus 22 · 1 retirée », neutre ; en-tête sans « manquants ».
  Un manque plus grand que le retrait reste un manque (testé).
- src/ui/depense/phrasePied.ts : 5e paramètre optionnel `retires` → « Lignes 84,10 = total 86,50 − 2,40 retiré (Bouchons) », sans attention.
- src/ui/finance/ExpenseSheet.tsx : `retiresLus` = lignes lues retirées par la corbeille, encore absentes du brouillon (les lignes ajoutées à la main exclues ;
  « ↶ Annuler » les rend → le contrôle d'avant revient). Branché au bloc, au pied et à la bande « non retrouvé » (articlesManquants).
- tests/unit/depense/f8-tour3.test.tsx (neuf), tests/integration/expenseSheet.test.tsx, tests/unit/depense/lecture-d/serveur.test.ts.

## Point 2 : verdict
Pas une donnée fausse : l'objet enregistré a bien `amount: 555` et, ajouté au test, la ligne 1 `amount: 505` (les deux valeurs corrigées). Le seul écart :
`equipmentAction: 'new'` sur « Fermenteur 30 L ». Comportement voulu depuis 2eb6d551d (14.11, « Stock cx 5 (ST-T34) : les lignes « Matériel de brassage »
proposent leur fiche dans Stocks › Matériel (présélectionnée, changeable) », src/ui/depense/finale.ts:131, test tests/unit/cxMaterielPropose.test.ts). Attendu mis à jour.

## Point 3
`engineDigestOf` suit les imports jusqu'à `hopAdviceContentReference`, livré en JS : functions/src n'a que `hopAdviceContentReference.d.ts`. L'aide du test
lit `.ts`, sinon `.d.ts`. Rien changé sous functions/.

## Sorties décisives
- voies/f8/tests-rouge.txt : « Tests 7 failed | 46 passed (53) ».
- voies/f8/tests-vert.txt : « Tests 53 passed (53) ».
- voies/f8/tests-final.txt (tests/unit/depense, tests/integration/expense*, tests/unit/finance/controlesCroises*) : « Test Files 223 passed | 1 skipped (224) ; Tests 2871 passed | 4 skipped ».
- tsc : code 0, 0 erreur (voies/f8/tsc.txt).
- `git show --stat` : eea71e779 = mes 4 chemins ; 26bcc7ac2 = mes 2 chemins. Les « failed to delete …/worktrees/… Permission denied » viennent du nettoyage auto de git, sans effet sur les commits.

## État à capturer (voie v5b, 390 tactile et 1280, deux thèmes)
Banc `../v3/` M9-3 : après « Retirer la ligne 3 » : bloc « Somme = imprimé − 1 ligne retirée · 2,40 » neutre (ni rouge ni vert), « Articles lus · 1 retirée »
si le compte était imprimé, pied « Lignes 84,10 = total 86,50 − 2,40 retiré (<nom>) » sans ton d'alerte, aucun « Ajouter la ligne manquante », aucune bande
« non retrouvé ». Puis « ↶ Annuler » : « Somme = imprimé » revient. Regarder la longueur du libellé de la rangée Somme à 390.

## Doutes et limites
- Rangée Somme neutre (pas verte) : le total imprimé n'est plus égal à la dépense ; c'est son choix, pas une erreur. Mot « retirée » plutôt que « supprimée » (le bouton dit « Retirer »).
- Le retrait n'est connu que pendant la saisie (état React, remis à zéro à une nouvelle lecture) ; à la réouverture d'un brouillon, l'écart redevient un manque.
- Hors périmètre : sous Vitest, `invoiceEngineDigest()` (functions/src/invoiceScanCore.ts) ne trouve pas non plus `hopAdviceContentReference.ts` et prend une empreinte au hasard
  (journal « Empreinte du moteur de lecture illisible »). Déployé, il lit lib/*.js : non touché.
- v3-7 (bouton hors écran à 390) n'est pas dans cette voie.

DÉCISION À PRENDRE : aucune.
CONNAISSANCE : la présélection « Créer la fiche de ce matériel » pour une ligne Matériel de brassage lue vient de ST-T34 (2eb6d551d) ; un test qui attend « none » est antérieur.
LEÇON PROPOSÉE : aucune.

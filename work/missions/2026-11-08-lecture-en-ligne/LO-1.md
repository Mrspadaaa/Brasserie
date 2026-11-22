# LO-1 — doc3, deux bulletins QR : « lu sur la page 300,00 » (gravité B)

## Constat (reproduit sur HEAD par le test `tests/unit/depense/qr/bulletins-lo1.test.ts`, 9 rouges avant correction)
Écran : tuile « lu sur la page 300,00 » face à « QR-facture 150,00 », sceau « 150,00 », Total TTC 300,00, rangée « Somme = imprimé 300,00 », aucun mot sur les deux bulletins.
C'est exactement le texte du rapport du 08.11.

## Cause
1. Pas une régression de code : `git diff 4a07d674 HEAD` est vide sur `functions/src/{invoiceVisionReview,prompts,invoiceControls,ai}.ts`, et `qrFacture.ts`, `qrVue.ts` (hors LP-1), `purchasePrefill.ts` (hors LP-4 et TVA) n'ont pas bougé.
   Les suspects (0c3f4d41, 636586c7, e65490b4, 92de7371, 75609ea4) ne touchent pas ce chemin : 92de7371 ne change que les totaux des lectures EN MORCEAUX et le placeholder « — » ; 75609ea4, la TVA et « Pour quoi ».
2. Variance de Gemini, jamais gardée par un contrôle. Les trois lectures brutes du banc k7 de doc3 (`banc-k7-prod/raw`, hors Git) disent : 150 (1 ligne), 150 (1 ligne), 300 (2 lignes de 150 et un avertissement « Deux bulletins de versement QR de 150.00 CHF chacun »).
   Le vote est 2 contre 1 sur `amountTTC` (`settledHeader` : écart non pesant). Au banc, la lecture finale est tombée à `null` (« à trancher », total-absent pèse) ; en ligne, deux lectures sur trois ont additionné et 300 a gagné.
3. Une fois 300 retenu, plus rien ne bronche : la somme des lignes (150 + 150) lui donne raison (`sumCheck` ok), `invoiceTotalProposal` le tient pour imprimé (`calculated: false`), `sourceTotalBasis: 'printed'`. Le QR (150) contredit, mais le duel l'appelle « lu sur la page ».
   Le total est une somme présentée comme une lecture : seul le QR, lu dans l'appareil, sait que la pièce porte DEUX bulletins.
4. LP-1 (984d3b40) avait déjà compté les bulletins (`classer`) et ajouté une ligne de résumé « 2 bulletins QR sur la pièce » ; le sceau, le duel, le total et l'enregistrement l'ignoraient.

## Décision (à la racine : le QR est la preuve déterministe, le modèle ne l'est pas)
Un total de page égal à la somme des montants des bulletins QR, et à aucun d'eux, est un total CALCULÉ. Il se dit, il ne s'appelle plus « lu », il reste à trancher, il n'est jamais enregistré « imprimé ».
Pas de rustine par pièce : la règle ne regarde ni le fournisseur ni le nombre (n bulletins), seulement « somme des montants QR = total lu, aucun montant seul ne l'est ».
Le serveur ne change pas (le prompt dit déjà « la somme des lignes n'est PAS un total imprimé » ; un contrôle serveur ne peut pas distinguer un total imprimé égal à la somme des lignes, cas courant et juste).

- `src/services/qrLecture.ts` : `classer` garde le montant de CHAQUE bulletin (`montantsBulletins`, `null` si sans montant / non conforme / autre devise : jamais 0) ; le même texte décodé deux fois n'est qu'un bulletin.
- `src/ui/depense/qrVue.ts` : `sommeDesBulletins` (pur). Sceau « 2 QR » (plus « 150,00 ») ; feuille : ligne « Bulletins · 2 bulletins QR sur la pièce : 150,00 + 150,00 = 300,00 · total non imprimé », le montant du QR devient « 1er bulletin » et sa note « somme 300,00 » ; un total égal au premier bulletin ne donne plus « QR ✓ » (« 2 QR », partiel).
- `src/ui/depense/Qr.tsx` : tuiles du duel « somme des 2 bulletins » / « 1er bulletin QR » (même état de la maquette z2, deux mots changés). Les gestes sont inchangés : rien ne change sans le toucher du brasseur (300 gardé par défaut, 150 d'un toucher, retour d'un toucher).
- `src/ui/finance/ExpenseSheet.tsx` : mention sous le total « Somme des 2 bulletins QR (150,00 + 150,00 = 300,00). Le total n'est pas imprimé sur la pièce. » ; rangée du récap « Total non imprimé · somme de 2 bulletins » à la place de « Somme = imprimé 300,00 » ; `sourceTotalBasis` posé à `line_sum` (jamais `printed`).
- Le statut reste « à trancher » (le duel non tranché met la lecture en `disputed`).

## Preuves
- `tests/unit/depense/qr/bulletins-lo1.test.ts` : 15 tests (fixture « Assurance Fictive SA », IBAN et référence publics SIX, montants seuls gardés ; zxing et Gemini simulés). Rouge sur HEAD (9), vert après.
- Base Dépense (commande de la voie) : 10 échecs, tous antérieurs (8 `expenseSheet.test`, 2 `expenseSheetMouture`) ; 6 fichiers « suite non chargée » = `functions/node_modules` et `src/data/seedData` absents de ce worktree (environnement, rien à voir). `jus0Journey` : 2 échecs antérieurs. `tests/unit/depense/qr` : 8 fichiers, 128 verts.

## Limites
- Aucun rendu Chrome pris (pas de serveur de dev par Bash) : à voir sur doc3 réel, 390 et 1280, deux thèmes (le mot « 2 QR » doit tenir dans le sceau de 64 px ; « somme des 2 bulletins » dans une tuile du duel).
- Ne couvre pas la lecture à 300 SANS QR lisible (photo où zxing ne décode rien) : le total reste présenté comme lu, comme avant. Seul un contrôle serveur sur la preuve imprimée la couvrirait ; il n'existe pas de signal fiable (voir ci-dessus).
- Aucun appel Gemini ; la variance 150 / 300 de la lecture n'est pas réduite, seulement rendue visible.

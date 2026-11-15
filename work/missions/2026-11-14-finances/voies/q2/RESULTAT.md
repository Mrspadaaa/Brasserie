REPRISE — q2 : code, test et typage faits ; captures 390/1280, clair/cave, à produire par un exécutant puis à juger (contexte de l'auteur plein, 201 k).

## Plan
Porter m5ap-a dans `MovementSheet` (sans avoir : formulaire d'avant intact), justificatif = pièce de l'opération par la file des justificatifs existante, test d'intégration, captures.

## Fait
Fichiers écrits (tous dans « Possède ») :
- `src/ui/finance/MovementSheet.tsx` : sans `original`, rend `ApportPoches` (titre « De ta poche à la brasserie » / « De la brasserie à ta poche », bouton « Enregistrer l’apport » / « Enregistrer le prélèvement ») ; avec `original` (avoir, remboursement) : formulaire et boutons d'avant, mots inchangés (« Avoir ou remboursement », « Enregistrer ce mouvement »). Le remboursement n'a pas de place dans la maquette : son comportement est resté tel quel, sans justificatif.
- `src/ui/finance/mouvement/ApportPoches.tsx` : l'écran m5ap-a (Ta poche → La brasserie, montant sur la flèche 56 px, « ⇄ Dans l’autre sens : je reprends », effet Caisse / Ventes − dépenses / « inchangé : un apport n’est pas une vente », Quand [aujourd’hui · date / autre date…], Sur quel compte [Banque, Espèces, TWINT, Autre], Motif, « Justificatif · relevé ou quittance » en deux boutons pointillés Photo / Fichier ou PDF, vignette « ✓ joint · date · montant » + Changer / Retirer une fois posé).
- `src/ui/finance/mouvement/effetMois.ts` : calcul de l'effet lu du registre (`summarizeLedger` à la fin du mois moins la veille du 1er ; caisse `null` sans solde de départ confirmé, jamais 0 ; sans montant : « — »).
- `src/ui/finance/mouvement/justificatif.ts` : lecture du fichier (JPG/PNG/WebP/PDF, 4 Mo), contrôle `prepareFinanceDocument`, nom Drive « <date> Apport privé.<ext> » (`driveProofFileName`), mise en file (`enqueueProof`, `transactionId` = l'opération, `proof-<id>`), repli sans file : `saveFinanceDocumentConfirmed` AVANT l'écriture ; `runProofQueue('save')` après l'écriture.
- `src/ui/finance/mouvement/mouvement.css` : classes `mvt-`, jetons de thème (clair et cave), mesures de la maquette.
- `tests/integration/apportPoches.test.tsx` : 10 tests (maquette, effet, caisse inconnue, apport + justificatif : sens, montant, compte, file puis lien, résultat du mois inchangé ; prélèvement + photo ; prefill ; sans justificatif ; fichier refusé ; sans file : Drive avant l’écriture et refus Drive = rien d’écrit ; avoir inchangé).
- `work/missions/2026-11-14-finances/voies/q2/capturer.mjs` : script de captures (écrit, pas encore lancé ; PNG de test produit par zlib, `node --check` à faire).

Preuves :
- G1 : `NO_COLOR=1 FORCE_COLOR=0 npx vitest run tests/integration/apportPoches.test.tsx --reporter=dot > …/q2/tests.txt` donne « Tests 10 passed » et `vitest-lu.mjs` → `VITEST OK`. Remarque : la même commande SANS `NO_COLOR` écrit des codes ANSI dans `tests.txt` et `vitest-lu.mjs` répond alors `VITEST ECHEC` (la regex `Tests\s+\d+ passed` ne passe pas les codes couleur). À rejouer avec `NO_COLOR=1` (ou corriger l'outil, hors de ma voie).
- G2 : `npx tsc --noEmit` hors `functions/` : 0 erreur dans `mouvement/` ou `MovementSheet` (aux deux passes ; une erreur transitoire de `FinanceForms.tsx` `PayerVirement` venait d'une autre voie et avait disparu au second passage). `tsc.mjs` imprime TSC ECHEC à cause des erreurs de `functions/` (firebase-admin absent du worktree), à ignorer comme dit.
- Tests voisins rejoués (`movementSheet`, `financeWorkspace`, `depenseMedicament`, `financeJournalUx`, `be71-montant-refus`) : 46 verts, 3 rouges, tous hors Possède :
  1. `depenseMedicament.test.tsx` « le renvoi mène au geste existant » : cherche le titre « Apport ou prélèvement privé » ; le titre est désormais celui de la maquette (« De la brasserie à ta poche » pour le renvoi, qui ouvre un prélèvement). À mettre à jour : `findByRole('heading',{name:'De la brasserie à ta poche'})`.
  2. `financeWorkspace.test.tsx` « un apport privé change le solde sans gonfler les ventes » : cherche le bouton « Enregistrer ce mouvement » ; devient « Enregistrer l’apport » (maquette). Le reste du test (libellés « Montant (CHF) » et « Motif ») passe.
  3. `financeWorkspace.test.tsx` « demande une date réelle au paiement historique » : cherche « Date réelle du paiement » (PaymentSheet) ; sans rapport avec ma voie, vraisemblablement le travail en cours de q1 (Payer).

## Écarts à la maquette (assumés)
- Libellé « Ventes − dépenses » sur une ligne (colonne de 118 px au lieu de 96) : défaut 2 du critique (« coupé sur deux lignes »), corrigé.
- Cibles : boutons du justificatif 44 px (maquette 44), « Dans l’autre sens » 44 px de haut (lien de 28 px dans la maquette), « Changer / Retirer » 44 px ; pastilles Quand / compte à 32 px comme la maquette (choisie).
- Ajouts que la maquette ne montre pas : le prélèvement (même disposition, poche et brasserie échangées, flèche et trace rouges, titre « De la brasserie à ta poche », lien « Dans l’autre sens : j’apporte », « inchangé : un prélèvement n’est pas une dépense ») ; « autre date… » ouvre un champ date (max aujourd’hui) ; l'état « joint » (greffe du critique) ; message « caisse actuelle inconnue (solde de départ à confirmer) » quand le solde de départ n'est pas confirmé ; le champ montant vide affiche « 0,00 » grisé en indication, pas 500,00 (aucune valeur par défaut inventée).
- Titre, croix et poignée viennent de la feuille partagée `Sheet` (non modifiable ici) ; le pied « Enregistrer l’apport » est dans le pied de la feuille, pas dans le corps (même rendu, collé en bas).
- `aria-label` du montant : « Montant (CHF) » (comme le reste de l'app et les tests existants), pas « Montant en CHF » de la maquette.

## DEMANDE EXECUTANT :
Série de captures (12 + 12 côte à côte), script déjà écrit.
1. Racine du dépôt (`C:/Users/mrspa/Documents/Brasserie/.claude/worktrees/festive-wilbur-d80f3a`), le banc `http://localhost:3000/?dev-local&finance-demo` tourne déjà (ne pas le relancer).
2. `node --check work/missions/2026-11-14-finances/voies/q2/capturer.mjs`
3. `node work/missions/2026-11-14-finances/voies/q2/capturer.mjs tous tous > work/missions/2026-11-14-finances/voies/q2/captures.txt 2>&1`
   (sort : clair et cave × 390 et 1280 ; ne clique jamais sur Enregistrer ; coupe tout appel hors localhost).
   Sortie attendue : `CAPTURES OK`. Si une étape échoue (ex. clé de thème `cave` différente de `laffinee.theme=cave`, bouton « Apport ou prélèvement privé » introuvable) : noter l'erreur dans captures.txt, corriger le script seulement pour le sélecteur, 3 essais au plus.
4. Fichiers attendus dans `work/missions/2026-11-14-finances/voies/q2/cap/` :
   `ouvert-{clair,cave}-{390,1280}.png`, `joint-…`, `preleve-…`, et les côte à côte `cote-ouvert-…`, `cote-joint-…` (maquette m5ap-a à gauche, app à droite).
5. Ouvrir en image au minimum : `cote-ouvert-clair-390.png`, `cote-joint-clair-390.png`, `cote-joint-cave-390.png`, `ouvert-clair-1280.png`, `joint-cave-1280.png`, `preleve-clair-390.png`. Les autres au besoin.
6. Rendre au pilote : la sortie de captures.txt et la liste des PNG obtenus. Puis un auteur Sonnet neuf juge (hiérarchie, débordements, thème cave, flèche et chiffre lisibles à 390, vignette jointe, ligne « Ventes − dépenses » sur une ligne, bande « Caisse » cohérente) et corrige `mouvement.css` / `ApportPoches.tsx` si besoin ; il rejoue `NO_COLOR=1 FORCE_COLOR=0 npx vitest run tests/integration/apportPoches.test.tsx --reporter=dot > work/missions/2026-11-14-finances/voies/q2/tests.txt` puis `node work/missions/2026-11-14-finances/outils/vitest-lu.mjs work/missions/2026-11-14-finances/voies/q2/tests.txt` (VITEST OK).

## Reste à faire (aucune capture n'est encore prise ni vue : validation visuelle NON effectuée)
- Captures ci-dessus, puis revue visuelle (en particulier : la feuille s'ouvre-t-elle assez haute à 390 pour voir le justificatif sans défiler ; le cadre du montant avec `ChampNombre` sur écran tactile, où `Input` rend un textarea ; le thème cave de la tuile « Ta poche » ; à 1280 la feuille `finance-sheet` est bornée à 720 px).
- `git status --short` de fin de voie : non lancé (Bash bloqué par le plafond de contexte). Fichiers touchés par cette voie : ceux de la liste ci-dessus, tous dans « Possède ».
- Mettre à jour les deux tests voisins (1 et 2) : hors de ma voie, à confier au pilote.

DÉCISION À PRENDRE : les deux tests voisins (`depenseMedicament`, `financeWorkspace` apport) suivent la maquette (titre, bouton). Option A (recommandée) : un auteur met leurs deux noms à jour. Option B : garder « Enregistrer ce mouvement » dans la feuille, contre la maquette : refusée (règle n° 1).

CONNAISSANCE : une opération privée (apport, prélèvement) peut porter un justificatif par `enqueueProof({submissionId: <id de l'écriture>, transactionId: <id de l'écriture>})` : le travailleur de la file (`judgeExpense`, `linkJob`) lit l'écriture par son identifiant, quel que soit son genre, et pose `finance.proofDocumentId` ; aucune modification des services n'a été nécessaire.
LEÇON PROPOSÉE : aucune

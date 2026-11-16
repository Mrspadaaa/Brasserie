ECHEC — G1 : 1 rouge hors voie (expenseSheet « attend une confirmation explicite », déjà rouge à HEAD) ; les 10 constats sont traités, 14 tests neufs verts

Base des tests rouges : 18abc69f (HEAD 8e68161d). Les 14 tests de `tests/integration/x2Constats.test.tsx` : 13 rouges avant correction (ligne d'échec par constat ci-dessous), 14 verts après.

## Une ligne par constat

- **FN-30** « Autre montant » ouvre la fiche. Cause (reproduite au banc, clic réel : `click BUTTON.ops-main`) : `.ops-main::after {position:absolute; inset:0}` couvre toute la ligne (`.ops-row` est `position:relative`) et l'avis `.ops-avis` n'avait ni position ni z-index : le toucher tombait sur la ligne, donc la fiche (la garde FN-33 de 0,8 s ne faisait que masquer le cas). Rouge : `expected ' grid-column:1 / -1; … ' to match /position:\s*relative/`. Correction : `position:relative; z-index:2` (paire.css). Vert ; banc : le clic réel arrive sur `BUTTON.ops-avis-b`, feuille « Payer l'Atelier ». Captures fn30-avis, fn30-feuille-payer. « Annuler » de l'avis avait le même défaut.
- **FN-31** FIFO à même date. Rouge : `expected [ 'A-id-1', 'Z-id-9' ] to deeply equal [ 'Z-id-9', 'A-id-1' ]`. Correction : `PieceAPayer.saisieLe` (= `finance.recordedAt`), départage avant l'identifiant (`repartition.ts`). Vert.
- **FN-32** « zz 8,00 ». Rouge : `expected 'zz 8,00reste 17,00' to match /pièce A 8,00/`. Correction : `etiquettesPieces` calculé sur toutes les pièces de la feuille, lu par id (PayerVirement). Vert.
- **FN-34** Échap / fournisseur. **Voulu : B2 (test en ligne n° 40, 09.11)** : fermer une saisie remplie, Échap compris, demande « Abandonner cette saisie ? » (rien ne se perd ; « Continuer la saisie » est proposé en premier). Ce champ n'a pas de liste de suggestions. « Fournisseur perdu en section repliée » : non reproduit ; au banc (sonde34, 390) le résumé replié de « Fournisseur et catégorie » affiche « ZZ TEST — Fournisseur · Brassage », et le texte reste dans le champ après Échap. Le jeu de z3 tapait au clavier dans un champ masqué (la frappe allait ailleurs). Rien changé, aucun test.
- **FN-36** aperçu « après ». Rouge : `expected 'ZZ TEST — pièce A8,00✓ payé aujourd'hui…' to match /2,00 à récupérer/`. Correction : `RangeeApercu` reçoit `aRecupererCents` ; pastille « 2,00 à récupérer » (« à rembourser » en entrant) à côté du « payé », seulement avec « J'ai bien payé ». Vert ; capture fn36-apercu (390 et 1280, clair et cave).
- **FN-38** créance sur le doublon. Rouge : `expected <button …> to be null` (A2 montrait la créance de A). Correction : `modifier/origineCreance.ts` : (1) exacte : la pièce qui porte un paiement écrit au même instant que la créance (la correction écrit contre-écriture, complément et créance avec le même `maintenant`) ; (2) à défaut : la plus ancienne pièce de ce nom ayant un paiement vivant, jamais une pièce sans paiement. Aucun identifiant montré. Vert. Limite : deux pièces de même nom toutes deux payées, créance ancienne sans instant commun : la plus ancienne l'emporte.
- **FN-39** « Doublons » désactivé. Rouge : `toHaveAccessibleName` échoue. Correction : désactivé → `aria-label="Doublons : aucun doublon"` et `title="Aucun doublon à montrer"` ; la garde de saisie n'est pas touchée. Vert ; capture fn39-pied. Limite : l'infobulle n'existe pas au toucher ; le nom accessible dit la raison aux lecteurs d'écran.
- **FN-40** bandeau « Opération mise à jour ». Rouge : l'avis reste après « Archives » (`not.toBeInTheDocument` échoue) ; le délai : `Test timed out` (avis jamais effacé). Correction (FinancesTab) : effacé après 6 s, et au changement d'onglet ou d'étendue du journal. Verts (le test du délai attend 6 s réelles).
- **FN-41** fiche, Payé / Annuler / Payé. Rouge : `expected '16 nov. 2026 · banque · corrigé10,00' to match /annulé/`. Lecture : le « −10,00 » avec « Corriger ce paiement… » est le second paiement, vivant et légitime (une sortie s'affiche « − ») ; il garde son lien. Corrections : la paire dont la contre-écriture porte la note « Correction d'un paiement saisi par erreur » (Annuler, correction) se lit « annulé » (« corrigé » reste le mot d'un montant changé, FN-6 inchangé) ; le compteur « Paiements » compte les lignes affichées (2, plus 3). Aucun lien de correction dans la paire repliée. Vert ; capture fn41. Doute : si le brasseur veut aussi masquer le « − » du paiement vivant, c'est un choix de maquette m5fo-a.
- **FN-42** créance coupée à 390. Rouge : `expected 'À récupérer : trop payé sur « ZZ TEST…' to be 'ZZ TEST — pièce B · trop payé'`. Correction : `nomAffiche` (calculs.ts), lu par TransactionRow : « ZZ TEST — pièce B · trop payé » en tête, étiquette « à récupérer 2,00 · sorti … » inchangée ; la donnée écrite ne change pas. Vert ; capture fn42-creance.

## Critères
- G1 `vitest-lu` : VITEST ECHEC. 127 tests, 126 verts. Le rouge : `tests/integration/expenseSheet.test.tsx` « attend une confirmation explicite des valeurs corrigées » (`equipmentAction: 'none'` attendu, `'new'` reçu). Déjà rouge à HEAD, noté dans voies/u1/RESULTAT.md l. 32 (« échoue aussi avec ExpenseSheet.tsx remis à HEAD »). Non touché par cette voie.
- G2 `tsc.mjs` : TSC OK.
- G3 `controle-v6a.mjs 3000` : V6A OK. G4 `controle-frise.mjs 3000` : FRISE OK.
- G5 : tous les constats sont nommés ci-dessus.
- Émulateur : `emulateur.txt` : EMULATEUR OK : 12 contrôles.
- Essais : 1 par critère.

## Fichiers
src/ui/finance/operations/paire.css, src/domain/finance/repartition.ts, src/ui/finance/payer/PayerVirement.tsx, src/ui/finance/modifier/ApercuRangee.tsx, src/ui/finance/modifier/origineCreance.ts (neuf), src/components/EditTransactionModal.tsx, src/ui/finance/TransactionDetails.tsx, src/ui/finance/TransactionRow.tsx, src/ui/finance/operations/calculs.ts, src/ui/finance/TransactionJournal.tsx, src/components/tabs/FinancesTab.tsx, tests/integration/x2Constats.test.tsx (neuf), voies/x2 (tests.txt, emulateur.txt, capturer.mjs, sonde30.mjs, sonde34.mjs, cap/).
Captures ouvertes en plein format : fn30-feuille-payer-390-clair, fn41-fiche-paiements-390-clair, fn36-apercu-390-clair, fn42-creance-390-clair, fn36-apercu-1280-cave, fn39-pied-1280-clair, sonde30-avis/apres (avant correction, puis retirées). Les 18 autres (390 et 1280, clair et cave) sont prises par `capturer.mjs`, non ouvertes une à une ; journal sans erreur de page.

## Limites
- FN-31 et FN-32 : prouvés en test, pas en capture (le banc n'a pas deux pièces ZZ de même nom).
- FN-38, FN-39, FN-40 : pas de capture dédiée (FN-40 : l'avis se voit dans fn42 avant de s'effacer).
- Le test de délai de FN-40 dure 6 s.

DÉCISION À PRENDRE : le test expenseSheet « equipmentAction » est rouge à HEAD (code `'new'`, test `'none'`) : le test décrit-il l'ancien choix ou le code a-t-il dérivé ? Recommandation : voie de lecture sur la ligne Stock cx 4 / ExpenseSheet ; G1 de cette voie ne peut passer sans cela.
CONNAISSANCE : `.ops-main::after` couvre toute `.ops-row` : tout élément posé dans la ligne (avis, boutons) doit avoir `position:relative` et un z-index.
LEÇON PROPOSÉE : un test jsdom ne voit pas le CSS ; un toucher qui « ouvre la fiche » se prouve au banc par le clic réel (journal du `event.target`), pas par `fireEvent`.

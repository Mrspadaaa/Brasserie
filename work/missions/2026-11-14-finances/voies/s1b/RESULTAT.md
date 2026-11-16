OK — Doublons m1do-a, Archives m1ar-c, FN-2 testés (41 tests), typés, captures vues ; « Autre montant » attend Payer.

# Voie s1b (15.11)

## Fichiers écrits (Possède)
- `src/ui/finance/TransactionRow.tsx` : « Autre montant » n'écrit plus rien (décision du pilote) : il appelle `onPay(paiementRapide)` (prop `onPay?: (remplace?: FinancialPayment) => void`), ou `onOpen()`. « À confirmer » appelle `onPay()` sans argument (le clic ne passe plus son événement).
- `src/ui/finance/TransactionJournal.tsx` : le filtre « Doublons » n'ajoute plus la pastille « Doublons possibles × » sous le mois ni le « 1 » de « Filtres » (la maquette n'en a pas ; la pastille « Doublons » pleine porte l'état et se touche pour fermer).
- `src/ui/finance/operations.css` : « Doublons » ouvert = pastille pleine texte inversé + compte en pastille inverse (le contour d'alerte écrasait la couleur).
- `src/ui/finance/operations/archives.css` : l'icône « rangée » reste dans la ligne (le préflight mettait le svg en bloc, la ligne se coupait en deux).
- Tests : `doublonsPaire.test.tsx` (neuf, 6 tests), `archivesFrise.test.tsx` (8, tournent), `operationsPeriode.test.tsx` ((d bis) remplacé ; (d ter) et (d quater) ajoutés), `financeJournalDoublons.test.tsx` (textes de la paire), `financeArchives.test.tsx` (2e test : frise, « Ranger <an> » écrit sans confirmation, « Remettre » puis « Remettre <an> »).
- `voies/s1b/capturer.mjs`, `tests.txt`, `cap/`.

## Critères
- G1 `vitest-lu.mjs voies/s1b/tests.txt` → VITEST OK (5 fichiers, 41 tests).
- G2 `tsc.mjs` → TSC OK (à la première passe, une erreur dans `projet/ProjetPiste.tsx`, voie voisine, disparue ensuite).
- G3 `controle-v6a.mjs 3000` → V6A OK. Acquis : `controle-frise.mjs 3000` → FRISE OK.
- Essais : 2 passes de tests ; aucun critère au-delà du 2e essai.

## Tests : ce qui est prouvé
- Paire : avis ×2, cadre « Même facture, n° F-2024-117 · 2 écritures », deux lignes complètes, « saisies le 14 et le 15 janv. », la pièce seule hors de la paire.
- « Annuler celle-ci » : barré, « annulée le … », « Rétablir » ; rien d'écrit pendant 8 s ; « Rétablir » rend la ligne, aucune écriture ensuite.
- Après 8 s : `CONTRE-PAY-<id>` (reversalOfId, direction inversée) PUIS `revertTransaction(id)`, dans cet ordre, une seule fois.
- Refus (stock consommé) : ligne remise, message + « Déjà écrit : paiement inversé ».
- Quitter l'écran pendant le délai écrit l'annulation tout de suite.
- « Ce n'est pas un doublon » : cadre fermé, filtre refermé, clé écartée, rien d'écrit.
- FN-2 : avis « Payé 100,00 · Annuler · Autre montant » 10 s, geste de droite masqué, puis « Annuler » seul ; « Annuler » = `CONTRE-<id>` ; « Autre montant » = AUCUNE écriture, `onPay(paiement)` appelé, l'avis reste (fermer la feuille ne change rien).

## Captures (`cap/`, 390 et 1280, clair et cave ; ouvertes : planches dbl et arc en 390 clair, 390 cave, 1280 cave ; fn2 en 390 clair)
- `planche-dbl-<largeur>-<thème>.png` et `planche-arc-…` : app avant | app après le geste | maquette. Brutes : `dbl-repos`, `dbl-annule`, `arc-repos`, `arc-poignee`, `arc-range`, `arc-consulte`, `fn2-avis`, `fn2-autre`.
- Doublons : proche de m1do-a (avis ×2, cadre, saisies, pastille pleine, barré + Rétablir). Corrigés en voie : pastille « Doublons possibles × » en trop, « Filtres 1 », pastille « Doublons » au contour d'alerte. Écarts restants : le jeu de démonstration n'a pas de paire : écrite au banc local par le script (« ZZ-DBL », import dynamique, jamais de donnée réelle) ; textes de ligne tronqués (« payé aujourd'hui · ba… ») à 390 car la ligne reprend la liste ; les légendes d'effet de la maquette (« octobre, brassage −94,50 », « le filtre se referme ») ne sont pas du texte.
- Archives : frise, poignée, pastille rouge « 60,00 reste au suivi ↓ », pointillé, « rangé jusqu'à fin … », « 15 → 13 pièces », lignes d'années, pied « Remettre / Ranger … » conformes. Écarts : pas d'icône dans le titre ni de × propre (le `Sheet` de l'app) ; barres de 2024 et 2025 minuscules (le banc n'a que 1 et 2 pièces ; la maquette en a 268 et 241), donc la frise paraît vide à gauche ; le bouton dit « Ranger 2024 à 2025 » quand la poignée couvre deux années non rangées (la maquette a 2024 déjà rangée).
- FN-2 (`fn2-avis`) : « Payé 400,00 · Annuler · Autre montant » sous la ligne, liens de 44 px.

## DÉCISION À PRENDRE (bloquant pour FN-2) : « Autre montant » n'est pas fini
`fn2-autre-390-clair.png` : « Autre montant » ouvre Payer sur une AUTRE pièce (« Payer l'Atelier · Solde atelier · ancienne année », 60,00) : la feuille ne liste que les pièces ouvertes, et le loyer vient d'être payé. La décision du pilote (inversion + nouveau paiement à l'enregistrement de Payer, un lot par étape) demande de changer des fichiers hors de ma voie :
- `src/ui/finance/payer/PayerVirement.tsx` : prop `remplace?: FinancialPayment` ; la pièce payée se remet dans la liste avec reste = montant du paiement ; à « Payer », `recordPayment(contrePaiement(remplace))`, `await Promise.resolve()`, puis les paiements du virement (un lot par étape, `contrePaiement` de `operations/calculs.ts`) ; si l'inversion échoue, rien d'autre n'est écrit ; Annuler la feuille n'écrit rien.
- `src/ui/finance/FinanceForms.tsx` (`PaymentSheet`, passe `remplace`) et `src/components/tabs/FinancesTab.tsx` (`onPay={r => { setPaying(t); setRemplace(r ?? null); }}`).
Recommandation : confier ce petit lot à la voie qui possède Payer. En attendant, ne pas déployer « Autre montant » (il montre une mauvaise pièce). Alternative sans toucher Payer : retirer le lien de l'avis (garder « Annuler »).

## Autres décisions appliquées
- « Rétablir » 8 s après « Annuler celle-ci » est gardé ; l'avis ne le dit pas encore en toutes lettres : les règles Firestore (`updatedTransactionGuard`) interdisent de rouvrir une écriture annulée, donc l'écriture part à la fin du délai, au départ de l'écran ou à `pagehide`. À dire dans l'avis si le pilote le veut (non fait : la maquette a son texte).
- Plancher à enrichir : notes gardées dans Archives (règlements à confirmer, pièces sans date) ; « Classer » en lien dans la ligne d'une année rangée ; rien de plus.

## Doutes et limites
- Le glisser de la poignée au pointeur n'est testé qu'au clavier et au toucher d'année (jsdom) ; la capture ne montre pas un glissé.
- Les 3 tests de `financeJournalDoublons` ont perdu l'ancien paragraphe « 26 petites lignes anciennes (libellé « Cmd 686863 »)… » : la maquette n'a que « Même commande · n° 686863 » (ses choix remplacent ce texte).
- `git status` : seuls mes chemins touchés par la voie ; `ArchiveManagerSheet.tsx`, `TransactionRow.tsx`, `archive.ts`, `duplicates.ts` viennent aussi de s1.

CONNAISSANCE : le préflight met les svg en `display:block` : toute icône dans une ligne de texte demande `display:inline`. Dans ce poste, un script Bash avec une regex perd les `\` (3 remplacements ratés) : Edit seulement.
LEÇON PROPOSÉE : aucune

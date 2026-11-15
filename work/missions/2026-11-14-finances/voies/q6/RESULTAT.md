OK PARTIEL — 11 points corrigés dans le code, G1 G2 G3 G4 verts ; captures 390 et 1280 clair et cave à prendre (DEMANDE EXECUTANT)

Plafond de contexte atteint avant les captures : le code, les tests, l'émulateur, la règle v6a et le typage sont faits ; les captures et leur ouverture en image restent à jouer et à juger.

## Points (une ligne chacun)
1. Modifier, baisse sous le payé : `baisseSousLePaye` (correctionMontant.ts) ; le plan ignore « reste » sous le payé (le paiement suit toujours, aucune échéance inventée) ; la fiche n'offre que « Le paiement suit · payé 30,00 » (un seul radio, `.mod-ch-un`) et la ligne « Trop payé 12,00 ? Enregistre un avoir depuis la fiche (« Avoir ou remboursement »). ». Une hausse garde les deux choix. Tests unitaires et d'intégration ; émulateur rejoué (scénario « reste demandé » = plan du « suit », accepté par les règles).
2, 3, 9. Payer : nouveau `payer/ChampVirement.tsx`. Au-delà du total, le champ est ramené au total sur-le-champ, message « Ramené à 460,00 CHF : c'est tout ce qui reste à payer. » en un `<p>` sous le champ ; la valeur dérivée est `min(saisi, total)`, donc décocher une pièce recale le montant, et champ, barre et bouton disent le même nombre. Tests.
4. Apport : `effetMouvement` prend ventes et dépensé de `periodeSynthese` (la fonction de la bande d'Opérations, matériel à part exclu), plus aucun calcul propre. Test : banc m5ap-a (720,00 de ventes, 696,80 dépensés, 28,60 de matériel) = +23,20 (−5,40 avant).
5. Payer à 1280 : plafond `max-width: 560px` du corps retiré (payer.css) : le corps prend la largeur de la feuille.
6. Valeurs centrées à 390 : `line-height` égale à la hauteur du champ (textarea d'une ligne du tactile) pour Payer (50 px), Modifier (`.mod-in`, `.mod-mt-in` : 42 px, « sans TVA » et le montant sur la même ligne) et Apport (Motif, 42 px).
7. « Autre » date vide : le bouton dit « Choisis la date » (aria-disabled, `data-attend`), un toucher met le focus sur le champ date. Test.
8. Titre « Payer l'Atelier » : article élidé devant a, e, i, o, u (accents ignorés) ; sinon « Payer Müller » ; sans tiers, la description comme avant. Test.
10. Pastille d'une pièce en partie payée : « Reste 160,00 · 25 nov. · dans 10 j » (sans « CHF à payer », le geste dit déjà « Payé »), la rangée peut passer « sans pièce » dessous (`data-partiel`, operations.css) ; le nom accessible garde la phrase entière. G3 : V6A OK. À CONFIRMER SUR CAPTURE 390 (voir demande).
11. Apport : cause = `.mvt button { background:none; border:0; color:inherit }` (spécificité 0,1,1) qui écrasait `.mvt-c` et `.mvt-lien` ; devenu `.mvt :where(button)`. Les pastilles gardent leur bord, « ⇄ Dans l'autre sens » est en bleu de la maquette. À CONFIRMER SUR CAPTURE.

## Fichiers écrits
src/domain/finance/correctionMontant.ts, src/components/EditTransactionModal.tsx, src/ui/finance/modifier/modifier.css, src/ui/finance/payer/PayerVirement.tsx, src/ui/finance/payer/ChampVirement.tsx (nouveau), src/ui/finance/payer/payer.css, src/ui/finance/mouvement/effetMois.ts, src/ui/finance/mouvement/mouvement.css, src/ui/finance/TransactionRow.tsx, src/ui/finance/operations.css, tests/unit/correctionMontant.test.ts, tests/integration/modifierMontant.test.tsx, tests/integration/payerVirement.test.tsx, tests/integration/apportPoches.test.tsx, work/missions/2026-11-14-finances/voies/q5/emulateur.mjs (un scénario), voies/q6/{tests.txt, emulateur.txt, RESULTAT.md}.

## Critères
- G1 : `VITEST OK` (4 fichiers, 74 tests).
- G2 : `EMULATEUR OK` (7 contrôles joués contre les règles, témoins refusés).
- G3 : `V6A OK` (banc 3000, après la pastille du point 10).
- G4 : `TSC OK`.
Essais : un par critère après deux corrections de test (regex, bouton « Choisis la date »).

## DEMANDE EXECUTANT :
Pas de capture prise par moi. Une écriture de script puis rejeu, modèle de `work/missions/2026-11-14-finances/voies/q5/capturer.mjs` (lanceur `.claude/skills/webapp-testing/examples/_lanceur.mjs`, banc `http://localhost:3000/?dev-local&finance-demo`, ne pas relancer le banc). Écrire `voies/q6/capturer.mjs`, sorties dans `work/missions/2026-11-14-finances/voies/q6/cap/` ; 390 tactile (mobile) et 1280 ; clair et cave (`localStorage 'laffinee.theme'`).
Captures, nom `<état>-<largeur>-<thème>.png` :
1. `payer-ouvert` : Opérations > fiche du loyer > « Noter un paiement » (deux pièces de l'Atelier). Titre attendu « Payer l'Atelier » ; « 460,00 » centré dans son champ ; à 1280 le corps pleine largeur de la feuille (points 5, 6, 8).
2. `payer-trop` : taper 700 dans le champ. Attendu : champ 460,00, message d'une ligne sous le champ, barre et bouton à 460,00 (2, 3).
3. `payer-decoche` : taper 300, décocher le loyer. Attendu : 60,00 partout (9).
4. `payer-autre` : « autre » (date vide). Attendu : bouton « Choisis la date » (7).
5. `modif-30` : fiche du Nettoyant alcalin (42,00 payé) > Modifier > montant 30. Attendu : un seul choix « Le paiement suit · payé 30,00 », ligne « Trop payé 12,00 ? », aperçu sans « à payer » ; Nom, Date, Montant centrés, « sans TVA » sur la ligne du montant (1, 6).
6. `apport-ouvert` et `apport-500` : « Apport ou prélèvement privé », puis 500. Attendu : « Ventes − dépenses +23,20 » (4) ; pastilles avec bord, lien « ⇄ Dans l'autre sens » en bleu, Motif centré (6, 11).
7. `ops-apres` : Payer 300,00 sur le loyer (virement), retour Opérations. Attendu : pastille « Reste 160,00 · 25 nov. · dans 10 j » entière à 390 (10).
Sorties attendues : fichiers présents (28 environ), `V6A OK` rejoué (`node work/missions/2026-11-14-finances/voies/o1/controle-v6a.mjs 3000`). Captures à ouvrir une à une et comparer à `voies/m5/m5pa-d`, `m5mo-c`, `m5ap-a` ; l'écriture des paiements du banc 3000 est locale (`?dev-local`), rien de réel.

## Doutes et limites
- « Trop payé 12,00 ? … avoir » : c'est une phrase qui renvoie à « Avoir ou remboursement » de la fiche, pas un bouton ; `EditTransactionModal` n'a pas de rappel pour ouvrir l'avoir et son parent n'est pas dans « Possède ». Le plan sous le payé reste « contre-paiement + montant + paiement du nouveau montant » (le solde réglé ne dépasse jamais le montant : règles Firestore) ; les 12,00 versés en trop ne sont pas encore une écriture.
- Point 10 : la pastille raccourcie et le retour à la ligne de « sans pièce » sont une proposition ; à juger sur la capture 390 (hauteur de rangée comprise).
- Article élidé : seulement devant a, e, i, o, u (pas h muet ni y).
- Test d'intégration du point 7 : le toucher sur « Choisis la date » ne paie rien (vérifié) ; le focus du champ date n'est pas asserté.

CONNAISSANCE : le Bash de ce poste perd aussi une barre inverse dans une chaîne JS d'un script `node` écrit par heredoc (`'\\s'` devient `s`) ; Edit pour tout code avec regex.
LEÇON PROPOSÉE : aucune

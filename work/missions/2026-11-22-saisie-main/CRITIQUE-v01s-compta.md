OK — v01s garde la nature comptable des 7 genres demandés ; 1 bloquant (tuile « Impôts, TVA » sans nature dans le modèle), 10 mineurs

# v01s : regard de fiduciaire (22.11)

Persona : fiduciaire d'une micro-entreprise suisse (raison individuelle).
Légende : **B** bloquant (erreur comptable, ou valeur fausse au regard du modèle) ; **m** mineur ; **d** doute, non compté.

Captures ouvertes (`captures/v01s/`) :
- la planche ;
- en grand : repos, achat, abo, apport, okb, rpiece, okr, hab, ok.

Code relu :
- `choix-saisie.html` : table `G`, `S1`, `v01s`, `v1sRec`, `mm`, `okSheet`, `v1sOkR` ;
- dans `port-carnet/src` :
  - `types/index.ts` (`FinanceCategory`) ;
  - `periodeSynthese.ts:150-180` ;
  - `ledger.ts:73` (`refundLinkIssue`) ;
  - `correctionMontant.ts:144` ;
  - `forecast.ts:178-200` ;
  - `venteSuites.ts:43` (`planSoldeParDepense`).

## Ce que la simplification garde juste (vérifié)

| Genre | Ce que pose le genre | Lecture comptable |
|---|---|---|
| Achat | sortie, `brassage`, puces Brassage · Matériel · Nettoyage · Rénovation | juste ; la passe 1 m11 (cuve en charge) est corrigée, les 4 puces sont bien dans `FinanceCategory` |
| Vente | entrée, `recettes` | juste (sauf m1) |
| Apport | entrée, `apports`, « Mon mois inchangé », « Caisse +2 000 » | **juste** : `periodeSynthese.ts:155` saute `contribution`. Le B1 de la passe 1 est corrigé, dans la carte comme dans la confirmation |
| Pour moi | sortie, `apports`, hors résultat (commentaire de `G`) | juste sur le papier, mais pas dessiné (m2) |
| Loyer, Abonnement | sortie, `chargesFixes`, chaque mois, « dès le 22.11.26 » touchable | juste : Σ 12 mois −4 800,00 et −358,80 ; l'abonnement « 12 fois » finit au 22.10.27 (12 échéances) |
| Remboursement | hors des deux bandes, « De quelle pièce ? », sens lu sur la pièce (achats ↓ rentre, ventes ↑ sort) | **juste** : `refundOfId`, sens inverse de la facture (`ledger.ts:78`), « Brassage réduit de 18,40 », coût net 168,00 = 186,40 − 18,40. Le B2 de la passe 1 est corrigé |
| Habituel Loyer | « solde l'échéance du 22.12 · pas de second plan » | bonne règle : aucun doublon de plan. Le code reste à écrire (`planSoldeParDepense` exclut `recurrence`, NOTES le dit) |

## Problèmes

1. **B — « Impôts, TVA » n'a pas de nature.**
   - La tuile porte la catégorie `imp`, qui n'existe pas dans `FinanceCategory`. La liste du modèle s'arrête à `apports, recettes, brassage, materiel, nettoyage, chargesFixes, renovation, divers`.
   - Au port, le paiement tomberait donc en `divers`, c'est-à-dire en charge dans Mon mois. NOTES dit « Genre → … rien de neuf » : c'est faux pour cette tuile.
   - Or la tuile mélange trois natures :
     - l'impôt sur la bière (OFDF) est une vraie charge de la brasserie ;
     - le décompte TVA payé à l'AFC n'est pas une charge en méthode effective : il solde une dette ;
     - les impôts directs (revenu, fortune) d'une raison individuelle sont privés, donc un prélèvement.
   - Remède :
     - garder une tuile « Impôts » qui ouvre trois puces : « Impôt sur la bière » (charge, `divers` ou `subcategory`), « TVA à l'AFC » (montrée seulement si `fiscal.isTvaRegistered`, hors Mon mois, plan `source:'tax'`), « Impôts privés » (renvoie à Pour moi, hors résultat) ;
     - seule la puce TVA demande une règle neuve (catégorie `impots`, ou `kind` exclu des charges) : à écrire dans « Champs neufs ».
2. **m — Les sous-textes des tuiles sont définis, mais aucun ne s'affiche.**
   - `G` porte `sub` : « employé », « prélèvement privé », « sans articles », « de ma poche ». Mais `v1sTile` n'affiche que `g.n` (capture repos).
   - Conséquences :
     - « Salaire » posé juste à côté de « Pour moi » invite l'exploitant à saisir sa propre paie en charge, ce qui minore le bénéfice imposable ;
     - « Vente » ne dit plus qu'elle ne décompte pas le stock (passe 1, m10).
   - Remède : afficher `sub` en 11 px sous le nom de la tuile, au moins pour Salaire et Vente.
3. **m — « Pour moi » (prélèvement) n'est dessiné dans aucun état.**
   - Aucun `S1.prel` : on ne voit ni « Mon mois inchangé », ni « Caisse −300,00 », ni la confirmation.
   - Remède : un état et une confirmation, symétriques de l'apport (« un prélèvement n'est pas une dépense »).
4. **m — Un apport ou un prélèvement récurrent serait compté deux fois au Calendrier.**
   - La puce « Une fois ⌄ » de l'apport permet « Chaque mois ».
   - Or `forecast.ts:181` ne rattache au plan que les transactions `expense` ou `income`. Un `contribution` payé ne solde donc jamais son échéance : la prévision reste, et la caisse compte l'apport deux fois.
   - Remède, au choix :
     - pas de rythme pour Apport et Pour moi (le plus simple) ;
     - ou, dans le code, rattacher `contribution` et `withdrawal` aux plans `apports`.
5. **m — Le pli « Fournisseur, TVA, référence » ne suit pas le genre.**
   - Il s'affiche aussi sur l'apport (capture apport) : ni fournisseur ni TVA n'y ont de sens.
   - Sur la vente, il dit « Fournisseur » au lieu de « Client ».
   - Remède :
     - Apport et Pour moi : « Note, référence » seulement ;
     - Vente : « Client, TVA, référence » ;
     - TVA cachée si `isTvaRegistered` est faux ;
     - taux pré-rempli par genre (passe 1, point 9 ; invisible ici, pli fermé partout).
6. **m — La date de l'opération disparaît une fois le genre choisi.**
   - Au repos, la puce « 22.11.26 » est dans la carte. Après le genre, elle cède la place au badge de catégorie. Pour un achat ou une vente « une fois », il ne reste que « Calendrier 22.11 ✓ », qui n'est pas présenté comme touchable.
   - Un ticket du 18 saisi le 22 doit garder sa date : mois de Mon mois, trimestre TVA, et règle « l'avoir suit la facture » (`ledger.ts:77`).
   - Remède : la puce date reste dans la carte, à côté du badge ; ou « Payé le 22.11 ⌄ ».
7. **m — Le remboursement garde deux réglages qui n'ont pas lieu d'être.**
   - La puce « Revient · Une fois ⌄ » est affichée : un avoir récurrent n'existe pas. Remède : la cacher.
   - « tout : 186,40 » : `refundLinkIssue` ne plafonne pas le montant. Après un premier avoir, « tout » doit valoir le reste remboursable, et un montant supérieur est refusé à la saisie.
8. **m — Le paiement d'un loyer doit écrire `occurrenceId`, pas seulement `planId`.**
   - Sans `occurrenceId`, `forecast.ts:182` lève la note « Récurrence : confirmer l'échéance des factures liées » à chaque paiement.
   - Cela vaut pour le premier loyer (« Payé aujourd'hui » + chaque mois) comme pour l'habituel.
   - Dans l'habituel, « Payé aujourd'hui » à côté de « solde l'échéance du 22.12 » ne dit pas quel jour on est. Remède : « Payé le 22.12 · solde l'échéance du 22.12 ».
9. **m — « À payer » n'est toujours montré ni pour un loyer récurrent ni pour une facture à échéance (passe 1, m5).**
   - Attendu :
     - pour le loyer à payer : un plan seul, aucune transaction, « 1.12 » sans ✓ ;
     - pour l'achat à payer : une puce d'échéance (`dueDate`) qui apparaît sous « À payer ».
10. **m — L'apport dit « Caisse +2 000,00 … sur Banque ».**
    - Pour une fiduciaire, la caisse (espèces) et la banque sont deux comptes distincts : la ligne se contredit.
    - Remède : « Argent dispo +2 000,00 · sur Banque », ou « Banque +2 000,00 ».
11. **m — « Autre » sous « Ça rentre » compte en recette (`divers`, `income`).**
    - Un prêt reçu (banque, proche) y tomberait, ce qui gonfle le chiffre d'affaires (seuil TVA à 100 000).
    - Remède : sous-texte « pas un prêt, pas un apport ». Le prêt reste hors de cet écran (aucun `kind` dans le modèle).

## Doutes (non comptés)

- d — `FinancialPlan.subcategory` reste absent. Loyer, Abonnement et Salaire partent en `chargesFixes` ; seul le titre les distingue (passe 1, m4).
- d — Un avoir sur une pièce de matériel (Fûts inox) réduit `materielBrut`, pas Brassage (`periodeSynthese.ts:168`). La confirmation devra lire la catégorie de la pièce, et non pas un « Brassage » écrit en dur (`v1sOkR`).
- d — Un avoir daté de novembre sur une facture d'octobre réduit le poste de novembre (`dansPeriode` sur la date de l'avoir). C'est conforme au modèle et à l'Annuel, à garder tel quel.
- d — La greffe « Payé de ma poche » (passe 1) n'est pas reprise. Des frais avancés par l'exploitant restent à saisir en deux gestes (achat + apport).

## Synthèse

- La simplification tient la nature comptable de Achat, Vente, Apport, Pour moi, Loyer, Abonnement et Remboursement :
  - l'apport est hors Mon mois, dans la carte et dans la confirmation ;
  - le remboursement est lié à sa pièce et prend son sens ;
  - les échéances sont récurrentes, avec début, fin et Σ ;
  - le paiement du mois solde son échéance sans second plan.
- Les deux bloquants de la passe 1 sont levés.
- Le seul bloquant neuf est la tuile ajoutée sans nature (« Impôts, TVA »).
- La TVA et le justificatif restent légers : pli facultatif, icône document en haut. Il reste à faire suivre le pli au genre (m5).

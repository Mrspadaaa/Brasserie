OK — E41-1 à E41-6 et E40-4 corrigés en local (tests verts, tsc sans erreur neuve) ; reste la preuve en ligne par le pilote

PRÊT À METTRE EN LIGNE b9946ae38 (code : a2c85b6ea ; registre : b9946ae38)

## Plan (cause, fichier:ligne, correctif)
| constat | cause | correctif |
|---|---|---|
| E41-1 retrait d'un achat qui a un remboursement muet | `retirerEcriture.ts` refusait (`obstacleAuRetrait`, « Un avoir est lié ») mais le refus s'écrivait dans `<p role=alert>` en HAUT de la fiche (`TransactionDetails.tsx`, hors écran) et la confirmation se refermait : un bouton muet | `ecrituresLiees(pieceId)` : les remboursements liés se retirent AVEC l'achat (contre-paiements puis annulation, plus éloigné d'abord) ; la confirmation dit « Son remboursement lié (… +1,00) est retiré avec elle, paiement inversé compris » ; un refus s'écrit sous « Confirmer le retrait », la confirmation reste ouverte, et dit ce qui est déjà retiré |
| E41-2 « De quelle pièce ? » ne montre que les ZZ saisis | `modele.ts` `piecesRemboursables` jugeait « payée » sur la seule étiquette `finance.paymentStatus` ; les vraies pièces (« consomable » 23,00, « Brau- und Rauchshop » 110,40) portent « à confirmer » ou rien, et leurs paiements vivent au registre des paiements | 5e paramètre `paiements` : `paymentState` du registre décide (payée = proposée ; à payer / en partie = écartée ; aucun paiement connu : l'étiquette décide comme avant) ; `SaisieMain.tsx` passe `FinanceService.getPayments()` |
| E41-3 « Facturer » sur la bande d'un apport | `CalendrierTab.tsx` : `onFacturer` posé sur toute chose Ventes de source plan non probable | `peutFacturer(chose)` (`calendrier.ts`) écarte `horsVentes` (apport, autre entrée) |
| E41-4 / E40-4 Modifier ≠ saisie | (a) pas de « changer » (b) `Input` rend un `<textarea>` au toucher : `.sai-amt input` (saisie.css) ne le visait pas, le grand montant restait petit (c) Payé / À payer / compte dans un bloc « Règlement » à part (d) bloc « Pas encore de pièce » en tête | (a) bouton « changer » dans la bande : sortes voisines de même sens et même nature (jamais apport, Pour moi, remboursement ; pièce qui revient : même catégorie), pose catégorie et précision ; (b) `modifier.css` : mêmes règles pour `input` et `textarea` ; (c) pastilles Payé le jj.mm / À payer / compte et « d'ici le » dans la carte, sous le montant ; (d) la pièce passe après « Sans justificatif » |
| E41-5 date d'un achat payé ne bouge que dans la fiche | Modifier n'écrivait que la date de la pièce ; le paiement (écrit par la saisie au même jour) gardait l'ancien | `deplacerPaiement.ts` `planDeplacerPaiement` : contre-paiement + paiement réécrit au nouveau jour (même montant, sens, moyen ; notes dites) quand tous les paiements vivants sont au jour de la pièce, date non future, pas de changement de montant ; la pastille dit déjà « Payé le 04.11 » avant Enregistrer |
| E41-6 curseur de date : moitié inutile, seul « déc. » écrit | `ChoixDate` `plageDate` ±5 ans, `DureeFenetre` centre le repère : 21 jours après aujourd'hui, mois du 1er qui reste visible = déc. | `DureeFenetre` prop optionnelle `jourMax` : la piste s'arrête 2 unités après le jour max (repère entier), jamais de défilement au-delà ; le mois du premier jour visible s'écrit au bord gauche s'il n'y a pas de 1er proche. `ChoixDate` la passe en mode `saisie` avec `max` (et réduit `dernier`) ; sans `jourMax`, rien ne change |

## Fichiers écrits
src/ui/finance/modifier/retirerEcriture.ts, executerCorrection.ts (note facultative d'étape), modifier.css ; src/ui/finance/TransactionDetails.tsx ; src/ui/saisie/modele.ts, SaisieMain.tsx ; src/domain/finance/deplacerPaiement.ts (neuf), correctionMontant.ts (type d'étape : `note?`) ; src/domain/calendrier.ts (`peutFacturer`, classement) ; src/components/tabs/CalendrierTab.tsx (une ligne : `peutFacturer`) ; src/components/EditTransactionModal.tsx ; src/ui/ChoixDate.tsx, src/ui/calendrier/frise/DureeFenetre.tsx (E41-6, option `jourMax`, rien ne change sans elle ; fichiers hors liste nommée mais indispensables : la piste est là) ; tests/unit/ecr4Ecritures.test.ts, ecr4Calendrier.test.ts, ecr4Modifier.test.tsx (neufs) ; work/missions/BUGS.md.

## Critères
- tsc : 2 erreurs connues seulement (`GanttTask`, `virtual:pwa-register`).
- Tests neufs : 16 verts (E41-1 domaine et fiche, E41-2 dont paiement inversé, E41-3, E41-4 trois, E41-5 plan et geste, E41-6 avec témoin « sans borne »).
- Lot large (saisie, modif, ecr, ecritures, calendrier, finance, operations, choixDate, Date, retrait, frise, duree, plage, proprietes, lot6, forecast…) : 94 fichiers, 1099 verts (`tests-large.log`) ; `tests/unit/proprietes` inclus.
- Rouge avant correction : tests écrits avant le code ; je n'ai pas relancé la version d'avant, le rouge se lit dans les appels (ancien `piecesRemboursables` sans 5e paramètre, ancien refus « Un avoir est lié », piste sans `jourMax` : le témoin du test E41-6 mesure l'ancien comportement, repère + 100 px).

## Décisions et limites
- Pas de capture (consigne) : le dessin de Modifier (bande « changer », carte avec règlement, grand montant au toucher en `textarea`) et la piste de date ne sont vérifiés que par DOM et tests. À ouvrir en ligne, 390 px : Modifier sur Achat payé, Vente, Apport, un loyer ; « changer » ouvert ; le grand montant ; le curseur de date de Saisir à la main (butée au jour, « nov. » écrit).
- E41-5 : le déplacement du paiement ne vaut que sans changement de montant en même temps, et seulement pour des paiements au jour de la pièce ; un paiement d'un autre jour reste tel quel (on ne devine pas). Dates dans une année close : non traité (Modifier laisse déjà passer la date seule).
- E41-1 : un achat dont le stock est consommé ou lié à un amortissement reste refusé, avec sa raison, sous le bouton ; les remboursements déjà retirés sont nommés (« Déjà retiré … »).
- « changer » : le règlement (Payé / À payer) reste lecture seule dans Modifier ; il se change par « Noter un paiement » dans la fiche.
- DÉCISION À PRENDRE : aucune.

CONNAISSANCE : `Input` (src/ui/Input.tsx) rend un `<textarea>` au pointeur tactile : tout style écrit `X input` ne s'applique pas sur téléphone ; viser `:is(input, textarea)`. Une règle de la saisie reprise ailleurs (E40-4) a perdu son grand montant ainsi.

LEÇON PROPOSÉE : un refus affiché loin du bouton touché (alerte en haut d'une feuille défilée) équivaut à un bouton muet (E41-1) : écrire l'erreur dans le bloc où le geste a eu lieu, et garder le bloc ouvert.

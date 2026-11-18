# Inventaire g5-tests

Fichiers examinés : 184 (tests/unit/depense/** et les tests de finances/facture hors dépense). Tests avant : 2924 ; après : 2872 ; retirés : 52 dans 16 fichiers (0 fichier vidé).
Les comptes sont ceux de vitest (un `it.each` compte pour chacun de ses cas). « Retirés » = avant − après.

Classes : **vert par construction** (rendu jsdom qui relit une classe CSS, un data-*, un libellé, un attribut posé à la main, ou recopie de l'implémentation) ; **doublon** ; **caduc**. Tout le reste est gardé : il prouve une règle ou un état.
Couverture de lecture : 16 fichiers `.tsx` (rendu jsdom) lus en entier, les autres `.tsx` sur leurs titres et une recherche de classes CSS ; les fichiers de logique pure (`.test.ts`) et les tests hors dépense ont été classés sur leurs titres, ouverts seulement quand le titre laissait un doute. Voir RESULTAT.md, limites.

## Par fichier

| fichier | gardés | retirés | raison |
|---|---|---|---|
| banc-lecture-facture.test.ts | 108 | 0 | |
| brewBudget.test.ts | 30 | 0 | |
| brewBudgetScaling.test.ts | 7 | 0 | |
| brewStockConsumption.test.ts | 14 | 0 | |
| depense/banc-k6/arrondi-d261b.test.ts | 7 | 0 | |
| depense/banc-k6/genres-d262c.test.ts | 9 | 0 | |
| depense/banc-k6/historique-d264a.test.ts | 13 | 0 | |
| depense/banc-k6/ht-d272.test.ts | 6 | 0 | |
| depense/banc-k6/troisieme-d261c.test.ts | 13 | 0 | |
| depense/banc-k6/tva-d262a.test.ts | 11 | 0 | |
| depense/banc-k6/vote-d272b.test.ts | 5 | 0 | |
| depense/banc-k7/arrondi.test.ts | 14 | 0 | |
| depense/banc-k7/categorie.test.ts | 38 | 0 | |
| depense/bandes/categorie-famille.test.ts | 18 | 0 | |
| depense/bandes/familles-d273.test.ts | 32 | 0 | |
| depense/bandes/familles.test.ts | 32 | 0 | |
| depense/bandes/langues.test.ts | 6 | 0 | |
| depense/bandes/renovation-d306.test.ts | 23 | 0 | |
| depense/bandes/sous-groupes-d307.test.ts | 27 | 0 | |
| depense/bandes/sous-groupes-d311.test.ts | 15 | 3 | voir détail |
| depense/bandes/unites-d273f.test.ts | 11 | 0 | |
| depense/confiance/niveaux.test.ts | 32 | 0 | |
| depense/confiance/points.test.ts | 20 | 0 | |
| depense/confiance/unites.test.ts | 9 | 0 | |
| depense/doublon/feuille.test.tsx | 7 | 0 | |
| depense/doublon/regles.test.ts | 11 | 0 | |
| depense/drive-fond/confirmer.test.ts | 1 | 0 | |
| depense/drive-fond/contrat-synchrone.test.ts | 5 | 0 | |
| depense/drive-fond/echecs.test.ts | 21 | 0 | |
| depense/drive-fond/envoi.test.ts | 29 | 0 | |
| depense/drive-fond/feuille.test.tsx | 4 | 0 | |
| depense/drive-fond/fiche.test.tsx | 8 | 0 | |
| depense/drive-fond/file.test.ts | 7 | 0 | |
| depense/drive-fond/notification.test.tsx | 15 | 0 | |
| depense/drive-fond/renvoi.test.ts | 9 | 0 | |
| depense/ecran/bande.test.tsx | 10 | 0 | |
| depense/ecran/ecran.test.tsx | 5 | 0 | |
| depense/ecran/etat.test.ts | 16 | 0 | |
| depense/ecran/finitions.test.tsx | 6 | 2 | voir détail |
| depense/ecran/fixture.test.ts | 2 | 0 | |
| depense/ecran/groupes.test.ts | 20 | 0 | |
| depense/ecran/libelle.test.ts | 4 | 0 | |
| depense/ecran/libelles.test.tsx | 4 | 0 | |
| depense/ecran/p3c.test.tsx | 19 | 5 | voir détail |
| depense/ecran/sous-groupes-d307.test.tsx | 9 | 2 | voir détail |
| depense/ecran/sous-groupes-d311.test.tsx | 9 | 1 | voir détail |
| depense/ecran/tri.test.tsx | 12 | 7 | voir détail |
| depense/enregistrement/doublon-commande.test.ts | 9 | 0 | |
| depense/enregistrement/justificatif-nom.test.ts | 16 | 0 | |
| depense/enregistrement/justificatif-persistance.test.ts | 9 | 0 | |
| depense/enregistrement/mouture-prix.test.ts | 11 | 0 | |
| depense/enregistrement/paiement-prix.test.ts | 17 | 0 | |
| depense/enregistrement/unites.test.ts | 5 | 0 | |
| depense/enrichir/cle.test.ts | 13 | 0 | |
| depense/enrichir/faits.test.ts | 4 | 0 | |
| depense/enrichir/file.test.ts | 26 | 0 | |
| depense/enrichir/interrupteur.test.ts | 15 | 0 | |
| depense/enrichir/learn.test.ts | 6 | 0 | |
| depense/enrichir/levure.test.ts | 16 | 0 | |
| depense/enrichir/malts-completer.test.tsx | 2 | 0 | |
| depense/enrichir/malts.test.ts | 32 | 0 | |
| depense/enrichir/procedure.test.ts | 8 | 0 | |
| depense/enrichir/temoin-e4.test.ts | 2 | 0 | |
| depense/enrichir/temoin.test.ts | 8 | 0 | |
| depense/enrichir/valeurs.test.ts | 10 | 0 | |
| depense/fiche/donnees.test.ts | 54 | 0 | |
| depense/fiche/ecran.test.tsx | 15 | 4 | voir détail |
| depense/fiche/ecriture.test.ts | 17 | 0 | |
| depense/fiche/fiche.test.ts | 16 | 0 | |
| depense/fiche/fixture-s6.test.ts | 2 | 0 | |
| depense/fiche/lignes-372765.test.ts | 2 | 1 | voir détail |
| depense/fiche/regle.test.ts | 21 | 0 | |
| depense/g2a/plier-regrouper.test.tsx | 3 | 0 | |
| depense/g2a/rangee.test.tsx | 21 | 0 | |
| depense/g2a/tout-valider.test.tsx | 11 | 0 | |
| depense/g2b/mesure-banc.test.ts | 1 | 0 | |
| depense/g2b/regles-g2b.test.ts | 5 | 0 | |
| depense/lecture-d/ecran.test.tsx | 16 | 0 | |
| depense/lecture-d/finale.test.ts | 20 | 0 | |
| depense/lecture-d/finitions.test.tsx | 17 | 0 | |
| depense/lecture-d/flux.test.ts | 25 | 0 | |
| depense/lecture-d/serveur.test.ts | 25 | 0 | |
| depense/lecture/corrections.test.ts | 21 | 0 | |
| depense/lecture/document.test.ts | 16 | 2 | voir détail |
| depense/lecture/facture-372765.test.ts | 7 | 0 | |
| depense/lecture/lignes.test.ts | 8 | 0 | |
| depense/lecture/pdf.test.ts | 11 | 0 | |
| depense/lecture/plafond-38.test.ts | 1 | 0 | |
| depense/lecture/somme.test.ts | 11 | 0 | |
| depense/lecture/taille.test.ts | 2 | 0 | |
| depense/lecture/tva.test.ts | 11 | 0 | |
| depense/lecture/unites.test.ts | 11 | 0 | |
| depense/n3-ht/lignes-ht.test.ts | 19 | 0 | |
| depense/nom-b/appris.test.ts | 10 | 0 | |
| depense/nom-b/cle-f4.test.ts | 1 | 0 | |
| depense/nom-b/confiance-b.test.ts | 4 | 0 | |
| depense/nom-b/conserve.test.ts | 7 | 0 | |
| depense/nom-b/ecran-nom-b.test.tsx | 14 | 0 | |
| depense/nom-b/fiche-fr.test.ts | 3 | 0 | |
| depense/nom-b/fiche-n5.test.tsx | 4 | 0 | |
| depense/nom-b/lien.test.ts | 16 | 0 | |
| depense/nom-b/nom.test.ts | 9 | 0 | |
| depense/nom-b/refus.test.ts | 4 | 0 | |
| depense/nom-b/table-i-f.test.ts | 37 | 0 | |
| depense/noms-fr/aiTask-traduireNoms.test.ts | 5 | 4 | voir détail |
| depense/noms-fr/cleBase.test.ts | 18 | 0 | |
| depense/noms-fr/ecran-noms.test.tsx | 3 | 0 | |
| depense/noms-fr/nom-affiche.test.ts | 2 | 0 | |
| depense/noms-fr/traduireLignes.test.ts | 28 | 0 | |
| depense/onglets/ta2-compteur.test.tsx | 6 | 0 | |
| depense/onglets/ta3-a-payer.test.ts | 10 | 0 | |
| depense/onglets/ta4-sans-echeance.test.ts | 12 | 0 | |
| depense/onglets/ta6-tendance.test.ts | 7 | 0 | |
| depense/options/options-du-nom.test.ts | 73 | 0 | |
| depense/pages/alleger.test.tsx | 6 | 0 | |
| depense/pages/encodeur.test.ts | 4 | 0 | |
| depense/pages/entree.test.tsx | 7 | 3 | voir détail |
| depense/pages/lecture-client.test.ts | 8 | 0 | |
| depense/pages/lecture-serveur.test.ts | 12 | 0 | |
| depense/pages/parcours.test.tsx | 17 | 1 | voir détail |
| depense/pages/pdf.test.ts | 5 | 0 | |
| depense/pages/rangee.test.tsx | 15 | 0 | |
| depense/port/port-banc-juge.test.ts | 27 | 0 | |
| depense/port/port-controle-somme.test.ts | 4 | 0 | |
| depense/port/port-enregistrement.test.ts | 12 | 0 | |
| depense/qr/confronter.test.ts | 10 | 0 | |
| depense/qr/ecran-qr.test.tsx | 30 | 3 | voir détail |
| depense/qr/lecture.test.ts | 23 | 0 | |
| depense/qr/qr-facture.test.ts | 13 | 0 | |
| depense/qr/s1.test.ts | 7 | 0 | |
| depense/qr/vue.test.ts | 26 | 0 | |
| depense/raccord/autre-original.test.ts | 2 | 0 | |
| depense/raccord/changer-fichier.test.tsx | 14 | 0 | |
| depense/raccord/ecran-lecture.test.tsx | 9 | 0 | |
| depense/raccord/ecran-recu.test.tsx | 21 | 0 | |
| depense/raccord/rattachement-en-cours.test.ts | 2 | 0 | |
| depense/raccord/unites-enregistrement.test.ts | 32 | 0 | |
| depense/rangees/rangees.test.tsx | 13 | 7 | voir détail |
| depense/rapprochement/desaccords.test.ts | 10 | 0 | |
| depense/rapprochement/lecture-coupee.test.ts | 8 | 0 | |
| depense/rapprochement/points-uniques.test.ts | 9 | 0 | |
| depense/rapprochement/recalcul.test.ts | 14 | 0 | |
| depense/rapprochement/relais.test.ts | 6 | 0 | |
| depense/rapprochement/source-unique.test.ts | 2 | 0 | |
| depense/rapprochement/statut.test.ts | 30 | 0 | |
| depense/rapprochement/troisieme-lecture.test.ts | 48 | 0 | |
| depense/stock/chasse-17-10.test.ts | 28 | 1 | voir détail |
| depense/stock/chasse-etendue.test.ts | 132 | 0 | |
| depense/stock/ecran.test.ts | 5 | 0 | |
| depense/stock/facture-372765.test.ts | 25 | 0 | |
| depense/stock/identite.test.ts | 29 | 0 | |
| depense/stock/perf.test.ts | 1 | 0 | |
| depense/stock/relecture.test.ts | 142 | 6 | voir détail |
| depense/stock/renovation-d306.test.tsx | 6 | 0 | |
| depense/stock/unites.test.ts | 12 | 0 | |
| equipmentUpgrades.test.ts | 10 | 0 | |
| finance.test.ts | 16 | 0 | |
| financeArchiveContinuity.test.ts | 8 | 0 | |
| financeDates.test.ts | 2 | 0 | |
| financeDocumentHistory.test.ts | 4 | 0 | |
| financeDocumentMigration.test.ts | 11 | 0 | |
| financeDocuments.test.ts | 4 | 0 | |
| financeForecast.test.ts | 6 | 0 | |
| financeInvoice.test.ts | 2 | 0 | |
| financePaymentSync.test.ts | 2 | 0 | |
| financeRefunds.test.ts | 11 | 0 | |
| financeService.test.ts | 5 | 0 | |
| financialArchiveService.test.ts | 27 | 0 | |
| forecastHorizon.test.ts | 10 | 0 | |
| fribourgTax.test.ts | 12 | 0 | |
| geminiModelRouting.test.ts | 25 | 0 | |
| geminiScanner.test.ts | 7 | 0 | |
| incomeEntry.test.ts | 4 | 0 | |
| invoiceScanBudget.test.ts | 30 | 0 | |
| invoiceScanCache-d273c.test.ts | 5 | 0 | |
| invoiceScanCore.test.ts | 10 | 0 | |
| invoiceScanCsv8.test.ts | 31 | 0 | |
| invoiceScanMontantSeul.test.ts | 15 | 0 | |
| invoiceScanTransport.test.ts | 12 | 0 | |
| invoiceScanVote.test.ts | 55 | 0 | |
| invoiceVisionReview.test.ts | 44 | 0 | |
| monthlyAiBudget.test.ts | 41 | 0 | |
| purchaseEntry.test.ts | 29 | 0 | |
| swissBeerTax.test.ts | 4 | 0 | |

## Détail des retraits (une ligne par test)

### depense/ecran/p3c.test.tsx
- ligne 61 (état avant retrait) — **vert par construction** : T14 : vérifie l'absence d'un libellé dans le rendu jsdom, aucune règle
- ligne 140 (état avant retrait) — **vert par construction** : T10 : aria-pressed, bouton actif et étiquette « hors ligne » du pied ; le hors ligne est prouvé par drive-fond et pages
- ligne 155 (état avant retrait) — **vert par construction** : T11 : classes CSS h-full / rounded-none de ModalShell
- ligne 163 (état avant retrait) — **vert par construction** : T12 : absence de deux data-dp dans le pied, sous un IntersectionObserver simulé
- ligne 176 (état avant retrait) — **vert par construction** : T13 : classe hidden et aria-expanded d'un panneau

### depense/ecran/tri.test.tsx
- ligne 151 (état avant retrait) — **vert par construction** : R2 : jsdom sans IntersectionObserver, attributs hidden/style absents
- ligne 172 (état avant retrait) — **vert par construction** : critique R1 : classes block/hidden du panneau Payé
- ligne 195 (état avant retrait) — **vert par construction** : critique R2 : nombre de <p> et texte du libellé de commande
- ligne 204 (état avant retrait) — **vert par construction** : barre p3c-3 : classes bg-* et dp-p3c-hachure ; les 23 segments sont prouvés par T2 de p3c.test.tsx
- ligne 214 (état avant retrait) — **vert par construction** : critique R5 : libellé « Envoi au Drive · 0,7 Mo »
- ligne 227 (état avant retrait) — **doublon** : critique R6 : même entrée et mêmes attentes que T19 de p3c.test.tsx (Sabro 30 g sans niveau)
- ligne 236 (état avant retrait) — **doublon** : relecteur R6 : le choix « new » devenu « existing » est prouvé par le test R6 du même fichier ; reste un libellé

### depense/ecran/finitions.test.tsx
- ligne 94 (état avant retrait) — **vert par construction** : critique 2 : sélecteurs span.flex / span.block de la tuile Règlement, texte « 0 nouveau » absent
- ligne 107 (état avant retrait) — **doublon** : point 2 : la pastille « proposé » du récap est prouvée par T15 de p3c.test.tsx et par rangees.test.tsx

### depense/ecran/sous-groupes-d307.test.tsx
- ligne 90 (état avant retrait) — **vert par construction** : ouvre le plateau en posant d.open = true à la main puis vérifie d.open === true
- ligne 153 (état avant retrait) — **caduc** : « aucun bouton Tout plier / Tout déplier » : D311 a posé le segment « Plié | Déplié » (d311.test.tsx)

### depense/ecran/sous-groupes-d311.test.tsx
- ligne 151 (état avant retrait) — **vert par construction** : M1 : style inline minWidth / marginRight (calc(57px…)), recopie de l'implémentation CSS

### depense/fiche/ecran.test.tsx
- ligne 150 (état avant retrait) — **doublon** : n° 6 : les mêmes boutons « Garder le nouvel article » et ⇄ que R2 et R3 du même fichier
- ligne 158 (état avant retrait) — **vert par construction** : n° 7 : classe text-attention de la pastille
- ligne 166 (état avant retrait) — **vert par construction** : n° 8 : présence du libellé « Libellé de la facture »
- ligne 205 (état avant retrait) — **vert par construction** : n° 15 : classe scroll-mt-9 de chaque ligne

### depense/pages/parcours.test.tsx
- ligne 248 (état avant retrait) — **vert par construction** : T-A12 : noms accessibles et texte d'en-tête d'un fichier seul, rendus et relus

### depense/pages/entree.test.tsx
- ligne 41 (état avant retrait) — **vert par construction** : T-E2 : attributs capture / multiple / accept des champs fichier
- ligne 68 (état avant retrait) — **vert par construction** : T-E4 : classes bg-ebc-straw / text-cave-950 du bouton
- ligne 101 (état avant retrait) — **vert par construction** : preuve : classes min-w-0, shrink-0, whitespace-normal, truncate des rangées

### depense/rangees/rangees.test.tsx
- ligne 53 (état avant retrait) — **vert par construction** : classes font-semibold et dp-p3c-nom
- ligne 108 (état avant retrait) — **doublon** : date rouge au bandeau : déjà prouvée par bande.test.tsx (D233)
- ligne 165 (état avant retrait) — **vert par construction** : compte les occurrences du texte « nouvel article » / « approchée » dans le DOM
- ligne 173 (état avant retrait) — **vert par construction** : matériel : position d'un <select> dans le plateau, texte absent
- ligne 211 (état avant retrait) — **vert par construction** : placeholder « ? » et data-dp-niveau d'un champ
- ligne 217 (état avant retrait) — **vert par construction** : présence/absence de [data-dp-barre] selon details.open posé à la main ; le ⇄ unique est prouvé par fiche/ecran.test.tsx R2
- ligne 232 (état avant retrait) — **doublon** : la date rouge ouvre le bloc : déjà prouvée par bande.test.tsx ; reste la classe whitespace-nowrap

### depense/qr/ecran-qr.test.tsx
- ligne 215 (état avant retrait) — **vert par construction** : classes space-y- / grid du bandeau
- ligne 256 (état avant retrait) — **vert par construction** : ordre d'éléments dans le DOM (① Total avant ② Règlement), mise en page vue dans Chrome
- ligne 264 (état avant retrait) — **vert par construction** : ordre d'éléments dans le DOM à grand écran, mise en page vue dans Chrome

### depense/bandes/sous-groupes-d311.test.ts
- ligne 90 (état avant retrait) — **vert par construction** : M1 : reserveInconnu(…, false) rend {} ; recopie de la fonction de style
- ligne 93 (état avant retrait) — **vert par construction** : M1 : attend les chaînes CSS « max(54px, 10ch) » et « calc(57px - …) » recopiées de l'implémentation
- ligne 98 (état avant retrait) — **vert par construction** : M1 : attend « max(54px, 11ch) », même recopie

### depense/noms-fr/aiTask-traduireNoms.test.ts
- ligne 50 (état avant retrait) — **vert par construction** : compare la consigne de la tâche à la constante qui l'a fournie (SYSTEME_NOMS_FR, NOMS_SCHEMA)
- ligne 105 (état avant retrait) — **vert par construction** : instantané sha256 de TASKS.scanInvoice : tout changement de consigne le rougit, aucune règle derrière
- ligne 109 (état avant retrait) — **vert par construction** : instantané sha256 des consignes de lecture, déjà mis à jour à la main le 02.11 (5 100 → 8 192)
- ligne 115 (état avant retrait) — **vert par construction** : instantané sha256 des seize autres tâches d'aiTask

### depense/lecture/document.test.ts
- ligne 132 (état avant retrait) — **vert par construction** : le prompt contient les mots vat, vatCode, alphaPct… : relit le texte qu'on vient d'écrire
- ligne 136 (état avant retrait) — **vert par construction** : le schéma contient les champs proForma, vat… avec leur type : recopie du schéma

### depense/fiche/lignes-372765.test.ts
- ligne 16 (état avant retrait) — **vert par construction** : n'a aucune assertion : un console.log « pour RESULTAT »

### depense/stock/chasse-17-10.test.ts
- ligne 74 (état avant retrait) — **vert par construction** : expect(CAS).toHaveLength(27) : compte un tableau de données

### depense/stock/relecture.test.ts
- ligne 20 (état avant retrait) — **doublon** : « Pilsner » chez « Bio Malz AG » : couvert par la boucle DESCRIPTEURS (mot « bio »)
- ligne 29 (état avant retrait) — **doublon** : « Citra » chez « Cryo » : même forme que le test « Cascade » chez « Cryo Hops AG » (ligne 23)
- ligne 32 (état avant retrait) — **doublon** : « Pilsner » chez « Dunkel Mühle » : couvert par la boucle DESCRIPTEURS (mot « dunkel »)
- ligne 238 (état avant retrait) — **doublon** : « Rye Mühle AG » : même entrée que la boucle des mots (Rye) juste dessous
- ligne 241 (état avant retrait) — **doublon** : « Leaf Hops AG » : même entrée que la boucle des mots (Leaf) juste dessous
- ligne 275 (état avant retrait) — **doublon** : « Cascade du Banc » chez la Malterie du Banc : déjà prouvé ligne 59


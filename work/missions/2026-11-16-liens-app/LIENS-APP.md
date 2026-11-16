# Liens de l'app v2 : tout lié à tout, sans alourdir (2026-11-16)

Sources : INVENTAIRE-CODE.md (IC), INVENTAIRE-DOCS.md (ID), ETAT-ART.md (EA). v2 d'après trois regards : B Brasseur, S Simplicité, A Architecte des données.
Ses mots : « tout a un lien avec tout » ; « Clicker pour ouvrir le clavier et taper c'est déjà beaucoup d'action ».
Portée (L01) : ses exemples (+ du calendrier, fût lavé, Star San) illustrent une règle générale ; ils n'en fixent pas le périmètre.
État : E = existe (réf. IC), P = partiel, C = à créer. Gestes = touchers ; F = frappes clavier.

## Verdicts
g garder, m modifier, r retirer. Règle : un lien retiré par deux regards part, un « m » est corrigé, un manque cité par deux regards entre. Aucun lien ne part : L17 n'a qu'un r.
| Lien | B | S | A | v2 |
|---|---|---|---|---|
| L1 | g | m | m | m |
| L2 | m | m | m | m |
| L3 | g | g | g | g, même toucher que L4 |
| L4 | m | m | m | m |
| L5 | g | g | g | g |
| L6 | g | g | m | m |
| L7 | g | m | m | m |
| L8 | m | m | g | m |
| L9 | m | m | m | m, cascade générique |
| L10 | m | m | g | fondu dans L9 |
| L11 | m | g | m | m |
| L12 | g | g | g | g |
| L13 | m | g | m | m |
| L14 | g | m | m | m |
| L15 | g | m | m | m |
| L16 | g | g | m | m |
| L17 | m | m | r | m, garé |
| L18 | g | g | g | g |
| L19 | g | m | m | m |
| L20 | g | g | g | g |
| L21 | g | g | g | g |
| L22 | g | g | m | m |
| L23 | g | g | g | g |
| L24 | g | g | g | g |
| L25 | g | g | m | m |
| L26 | g | g | g | g |
| L27 | m | m | g | m |
| L28 | m | m | m | m |
| L29 | g | m | g | m |
| L30 | g | g | g | g |
| L31 | m | g | m | m, kyh1 inchangée |
| L32 | g | g | m | m |
| L33 | g | m | g | m, prioritaire |
| L34 | g | m | m | m |
| L35 | g | m | m | m |
| L36 | — | manque | manque | entre (traçabilité) |
| L37 | manque | manque | — | entre (retour de dégustation) |
| L38 | manque | manque | manque | entre (hausse de prix) |
| L39 | manque | manque | manque | entre (impôt sur la bière, à vérifier) |

## 1. Principes
1. **Une maison par chose.** Un brassin, une idée, une facture vivent à un seul endroit ; ailleurs, un filtre ou une pastille, jamais une copie. Le lien est un champ d'id dans le document propriétaire ; l'inverse se calcule à la lecture (EA 2.1, 2.5).
2. **Le + ouvre la saisie, contexte rempli.** Toucher une case jour × rangée ouvre la saisie du module propriétaire, champ actif, dictée prête, sans menu de type : la rangée donne le type, le jour la date. Sur une fiche, le + porte le lien (matériel, lot, client).
3. **« Lié à » sur la fiche ouverte.** Au plus 3 pastilles, « +n » au toucher ; jamais sur les cartes des listes, sans répéter le lien évident du contexte.
4. **L'état se déduit, la suite se propose.** Un état vient d'un événement déjà saisi (scan, conditionnement, retour du fût) plutôt que d'un statut tenu à la main ; aucun parcours à étapes (ky, kz : « trop contraignant »). Une transition propose la suite pré-remplie en un toucher ; sans suite sensée, pas de bouton (ni grisé, ni raison écrite).
5. **Rien à retaper, rien par nom.** Client, fournisseur, article se choisissent dans une liste (id) ; une correspondance se fait une fois, puis se propose (EA 3, Ekos).
6. **Les cascades s'appliquent, puis s'annulent.** Bandeau « −50 ml Star San · Annuler » ; aperçu avant écriture seulement pour l'argent réel (vente, paiement, migration). Chaque effet porte une clé d'opération : double toucher ou rejeu hors ligne ne double rien.
7. **Compta et calendrier sont des vues honnêtes.** On modifie à la source ; un seul sélecteur de dates les nourrit ; rollups calculés. Ce qui n'est pas décidé reste « envisagé », en pointillé, hors total (EA 2.2, 2.7).
8. **Sans alourdir, surtout le calendrier.** En plein, seulement ce qui demande une action datée ; le dérivé en trait léger ou point discret. Des dates, ni compteurs ni barres d'alerte (zq1 « anxiogène », za3 « une date, pas un compteur »).
## 2. Matrice (ligne = déclencheur, colonne = effet ; cases = n° de lien)
| de \ vers | Calendrier | Carnet | Production | Stock | Fûts | Matériel | Finances | Clients | Fournisseurs |
|---|---|---|---|---|---|---|---|---|---|
| Calendrier | — | L1 | L3 L28 | · | · | L18 | L25 | · | · |
| Carnet | L2 | — | L20 | · | · | L19 | L2 L13 | L21 | L15 |
| Production | L4 L5 L39 | L37 | — | L9 | L6 | · | L4 L23 L24 L39 | L36 | · |
| Stock | L14 | · | L27 | — | · | · | L14 | · | L16 |
| Fûts | L8 | · | · | L9 | — | · | L7 | L7 L36 | · |
| Matériel | L18 | L19 | · | · | · | — | L18 | · | · |
| Finances | L12 L26 | L11 | L38 | L11 | · | L11 | — | L22 | L16 L38 |
| Clients | L35 | L37 | · | · | L35 | · | L22 | — | · |
| Fournisseurs | L4 L14 | L15 | · | L16 | · | · | L16 | · | — |
Transversaux : L29 « lié à », L30 recherche, L31 À venir, L32 partage entrant, L33 suppression, L34 GanttTask, L17 veille (externe → carnet).

## 3. Liens
**L1** Calendrier, toucher une case jour × rangée (Idées, Activité, Achat) → saisie ouverte, champ actif, dictée prête ; rangée → type CreativeItem (recipe-idea, event, equipment), jour → date ISO ; l'idée reparaît sur la case. Achat d'un article connu → ligne aux Courses. Titre en puces ou à la voix. Cal→Carnet. P : FAB sans contexte (App.tsx:549). 1 toucher + titre, 0 F de date.
**L2** Idée datée → au calendrier, 0 geste. Son budget entre à la caisse en « envisagé » (pointillé, hors total) ; il compte au total une fois le choix fait (L13) ou la mise de côté réglée (L25), dédoublonné par sourceCreativeItemId. Carnet→Cal/Fin. C.
**L3** Calendrier, case jour × rangée Brassage → brassin planifié (plannedBrewDate seul), dernière recette présélectionnée ; fermenterConflict signale la cuve prise. Le même toucher déclenche L4. Cal→Prod. P : QuickAction sans date. 1 toucher, 0 F.
**L4** Brassin planifié → sans bouton ni feuille : manques aux Courses (articlesACommander) et jalon « commander avant J−x » calculés depuis plannedBrewDate, délai réglé une fois par fournisseur (L16). Seul le plan de dépense s'écrit, un par batchId, retiré si le brassin est annulé. Prod→Stk/Fin/Cal. P : brewBudget.ts. 0 geste.
**L5** Brassin → jalons fermentation, dry hop, garde, conditionnement au calendrier, provisoires dès la planification ; glisser une barre (K11) écrit une date du Batch, la suite se recalcule. Prod→Cal. P : batchSchedule.ts. 0 geste, 1 glisser.
**L6** Brassin conditionné → fûts propres proposés, nombre tiré du volume déjà coché ; « valider » pose lot et date. Keg.batchRef canonique, packaging.kegIds calculé ou écrit dans le même writeBatch. Prod→Fûts. P. 1 toucher, 0 F.
**L7** Fût livré → client proposé d'office (réservation L35 ou dernier client du fût), vente pré-remplie (bière, tarif, volume) dans la même feuille : un toucher valide les deux ; la vente reste décochable (dépôt, facture au mois). clientId sur Keg et Transaction, clientName en repli. Fûts→Cli/Fin. C. 1 toucher, 0 F.
**L8** Fût livré → date de reprise prévue (livraison + délai habituel du client), glissable ; ni « depuis N jours » ni couleur qui vire. « Rentré » → à laver, sans autre étape. Date de livraison stockée sur le fût, rien d'écrit au calendrier. Fûts→Cal. C. 1 toucher.
**L9** Cascade générique (absorbe L10) : table « geste → article, quantité » en config, pré-remplie, valable pour tout geste (fût lavé, brassin mis en route, mise en bouteille… sont des exemples) ; appliquée tout de suite avec Annuler, clé idempotente (objet + cycle) ; côté brassin, prolonge Batch.stockConsumption. →Stk. P : la recette seule. 0 geste.
**L11** Facture scannée → stock (E, storage.ts:576), matériel et actif (E, ExpenseSheet:777), et le besoin du carnet qu'elle solde, relié seul : creativeItemId écrit une fois sur la transaction. Confirmation dans la dépense seulement si le lien est incertain ; aucune mention « Scan relié ». « Soldé » calculé : receipt-reversal rouvre le besoin. Fin→Stk/Mat/Carnet. Lien besoin C. 0 geste.
**L12** Facture fournisseur à échéance → date au calendrier et à la caisse (dueDate) ; « payé » → FinancialPayment. Fraîcheur affichée (collections hors LIVE_COLLECTIONS). Fin→Cal. C. 1 toucher.
**L13** Choix final noté au carnet, avec son pourquoi → met à jour le plan d'upgrade existant (mergeUpgradePlans, upgrades.ts:25) : date, fournisseur ; jamais un second plan, aucun bouton de stade. Carnet→Fin. P. 1 toucher.
**L14** Courses → dépense prévue sans geste ; « commandé » par fournisseur, facultatif, pose la livraison attendue (délai appris, L16) et un plan par commande (planId), retranché du brewEstimate des mêmes articles ; la facture (L11) le solde. Stk→Fin/Cal. C. 0 à 1 toucher.
**L15** Fournisseur choisi → le choix (prix comparés, date) s'enregistre seul sur la fiche fournisseur, sa maison ; « pourquoi » facultatif, en puces ou dicté ; le carnet l'affiche par filtre. Four↔Carnet. C (demande du 16.11). 0 geste.
**L16** Collection suppliers {id, nom, alias[]}, supplierId optionnel à côté du texte supplier/vendor → fiche : factures, articles, derniers prix, délai, choix. Fusion des noms existants en aperçu, rien d'écrit sans son accord. Stk/Fin→Four. P : suggestions.ts. 0 geste, fusion 1 toucher.
**L17** Bascule « veille » sur une idée ou un article → baisse de prix ou retour en stock en pastille sur l'article, au carnet ; jamais au calendrier. Appel externe sans serveur planifié : garé jusqu'à mesure (coût, hors ligne) et son accord. Externe→Carnet. C. 1 toucher.
**L18** Matériel, date d'entretien (za3) → au calendrier ; « fait » en un toucher ; la pièce achetée vient du scan (L11, equipmentRef). Mat→Cal/Fin. C. 1 toucher.
**L19** Fiche matériel, un seul + → idée liée (equipmentRef sur CreativeItem), sans choisir entre panne et besoin ; puis choix (L13), facture (L11). Mat→Carnet. C. 1 toucher + titre.
**L20** Idée recette → recette brouillon (E, CreativeLabTab:165 ; sourceIdeaId à stocker) → brassin planifié (L3). Carnet→Prod. P. 1 toucher.
**L21** Idée prospect → client (E, CreativeLabTab:176), gardé dans le nouveau carnet ; ventes par id (L22). Carnet→Cli. E. 1 toucher.
**L22** Vente ou reçu → clientId (choix en liste ou correspondance proposée une fois), nom en repli pour l'historique ; stats client calculées. Fin→Cli. P : par nom (clientStats.ts:21). 0 F.
**L23** Recette → coût au litre et marge au tarif (TarifSheet, kxc). Prod→Fin. P. 0 geste.
**L24** Brassin terminé → coût réel (consommations × prix des factures) à côté de l'estimé. Prod→Fin. P : FinancesTab:178. 0 geste.
**L25** Activité (f1 : sol, semaines 20 à 40, 600 CHF ; ou sans budget) → barre dans fb, durée au glisser (date de fin à ajouter à CreativeItem) ; épargne mensuelle = un plan récurrent unique par sourceCreativeItemId. Cal→Fin. C. 1 toucher + titre, jours et montant.
**L26** TVA et clôtures → échéances au calendrier (FinancialPlan source tax). Fin→Cal. P. 0 geste.
**L27** Levure (yeastLot) → alerte sur le brassin planifié dont la levure sera périmée ou trop faible à sa date ; aucune barre de péremption au calendrier ; date de péremption ajoutée si absente. Stk→Prod. C. 0 geste.
**L28** Mesure de densité depuis la barre de fermentation du lot (et le compagnon p2a) → pavé numérique, valeur proposée (dernière densité moins la pente) ; Batch.gravityLog en arrayUnion ; pas de note couplée. Cal/Prod→Prod. C. 1 toucher + nombre.
**L29** Fiche ouverte → pastilles « lié à » (inverse calculé en mémoire, 3 au plus, « +n ») ; un id inconnu donne « supprimé ». Transversal. C. 1 toucher pour suivre.
**L30** Recherche (r3p2, choisie) → tout objet, avec ses liens. Transversal. P. 1 toucher + mot.
**L31** À venir (kyh1) reste sa maquette telle quelle (besoins, graphe kh1r 1:1, dans Atelier) ; ses dates lisent le sélecteur commun (§ 4). Un bandeau 7 jours, si voulu, va au Bord comme vue de fb. Transversal. P. 0 geste.
**L32** Partage depuis le navigateur (cible PWA) → idée avec titre et URL, sans aperçu (fetch bloqué par CORS) ; domaine connu → fournisseur par alias (L16). Externe→Carnet/Four. C. 2 touchers, 0 F.
**L33** Suppression : généraliser liensArticle/motifNonSuppression (stock) à brassin, client, matériel, fût, idée ; refus avec raison ou archivage, jamais de cascade, audit écrit. Corrige deleteCreativeItem (sans audit, plan d'upgrade orphelin). Pastille « supprimé » seulement dans l'historique comptable. Transversal. C, prioritaire. 0 geste.
**L34** planning/GanttTask → lu dans la rangée Activité de fb, gelé en écriture, seulement si des données existent ; conversion en idées après son accord. Inachevé récupérable. C. 0 geste.
**L35** Client, + commande → réservation (collection reservations : kegId, clientId, date) et livraison au calendrier, client rempli ; aucun état neuf sur Keg ; L7 la clôt. Cli→Fûts/Cal. P. 1 toucher + date.
**L36** Traçabilité lot → fûts → clients : Keg.batchRef et clientId (L7) donnent « qui a reçu ce lot » (retrait, plainte). Prod→Cli. C. 0 geste.
**L37** Retour de dégustation ou de client « à corriger » → idée au carnet liée à la recette et au lot (prochaine version), dictée. Prod/Cli→Carnet. C. 1 toucher + dictée.
**L38** Prix d'une facture plus haut que le dernier → coût des recettes et marge de Tarifs (kxc) recalculés, pastille sur la fiche fournisseur ; brassin planifié ré-estimé, recipeSnapshot figé après brassage. Sans alerte bloquante. Fin→Prod/Four. C. 0 geste.
**L39** Volumes conditionnés → impôt sur la bière (OFDF), échéance au calendrier, volume prérempli. À vérifier selon son statut de producteur avant de dessiner. Prod→Cal/Fin. C. 0 geste.
## Top 15 par valeur (fréquence × frappes évitées × oubli évité)
1. **L5** jalons sans saisie · 2. **L1** son exemple, le + contextuel · 3. **L11** la Todo se vide au scan (kh1)
4. **L3 + L4** brassin d'un toucher, courses et « commander avant » seuls · 5. **L12** échéances, argent réel · 6. **L7 + L22** client et vente par id
7. **L6** fûts pleins d'un toucher · 8. **L9** cascade générique annulable · 9. **L18** entretien daté (za3)
10. **L29** « lié à » sans panneau · 11. **L33** prérequis de tout lien · 12. **L16** fiche fournisseur, socle de L4, L14, L15
13. **L36** traçabilité, obligation alimentaire · 14. **L14** pas de commande en double · 15. **L25** f1, ses mots
## Pour le calendrier (fb tel que choisi)
- En plein, action datée : L1 idées et achats posés au +, L3 brassins planifiés, L5 jalons (provisoires puis fermes), L12 échéances fournisseurs, L18 entretiens, L25 activités et mises de côté, L26 TVA et clôtures, L35 livraisons commandées, L39 impôt si applicable.
- En trait léger ou point discret : L2 idées datées sans action, L4 « commander avant », L8 date de reprise des fûts, L14 livraison attendue, L34 tâches dans la rangée Activité.
- Gestes : toucher une case (L1, L3) ; glisser une barre (L5, L8, L25) ; mesure depuis la barre de fermentation (L28) ; un toucher sur une pastille ouvre la source (L29).
- Jamais : veille de prix (L17), péremptions (L27), compteurs « depuis N jours », barres d'alerte. La caisse liée montre L2 en pointillé, hors total.
## Pour le carnet
- Entrées : L1 (+ du calendrier), L19 (+ de la fiche matériel), L32 (partage du navigateur), L37 (retour de dégustation), prospects (L21).
- Sorties : L20 recette brouillon puis L3 ; L13 choix noté, avec son pourquoi, puis plan daté ; L21 prospect puis client.
- Montre : besoin soldé par le scan, sorti seul de la Todo (L11) ; pourquoi du fournisseur par filtre (L15) ; pastille de veille (L17) ; budget envisagé (L2) ; « lié à » sur l'idée ouverte (L29).
- Aucun stade idée → devis → prêt : le choix se fait dans le carnet, avec son pourquoi.
## 4. Architecture et limites
- Source : Firestore avec persistentLocalCache (firebase.ts:73), hors ligne par le cache ; Dexie pour les magasins annexes seulement. Un lien = un champ d'id ; registre générique {de, vers, type} retiré (seconde source, orphelins).
- Champs neufs : CreativeItem.equipmentRef et date de fin ; Keg.clientId et date de livraison ; Transaction.clientId et creativeItemId ; Recipe.sourceIdeaId ; suppliers et supplierId ; péremption de levure si absente.
- Écriture : tout lien neuf par put doc par doc, en merge, tableaux en arrayUnion (gravityLog, kegIds). syncCollection (storage.ts:288 ; creativeItems, planning) réécrit la liste et peut effacer une idée créée sur un autre appareil (cas AM-53).
- Argent sans doublon : un plan par clé idempotente (sourceCreativeItemId, batchId, commande), le reste calculé (L2, L4, L13, L14, L25).
- Un sélecteur evenements(debut, fin) normalise les 6 sources de dates et les 2 formats (JJ.MM.AAAA des transactions, ISO ailleurs) ; fb, kyh1 et la caisse le lisent. Quelques centaines de documents : inverse et calendrier en mémoire, sans serveur ni index.
- Avant le lot : L33, le sélecteur, la règle d'écriture, et le compte des ids orphelins (stockItemRef, equipmentRef, batchRef, kegIds, planId, sourceCreativeItemId) sur fixture, en lecture seule.
- Son accord, groupé : L17 (appel externe), migrations des noms vers les ids (L7, L16, L22), conversion L34.
- En réserve, un seul regard : conditionnement en bouteilles ou canettes (B ; il travaille sur l'embouteillage, à reproposer d'abord), cuves libres au calendrier, rétroplanning d'un événement, factures clients, jour J vers d1b et p2a, fûts propres suffisants, ventes vers produits finis, consigne des fûts, stock sous le seuil daté, recette ↔ stock réservé, valeur du stock, + des Finances, annulation d'une transition.
- À montrer en mini maquettes, artefact neuf, sur fb tel que choisi (règle n° 1, D123) : la case jour × rangée qui s'ouvre, les pastilles « lié à », le jalon de L4, le bandeau Annuler de L9. Rien ici ne remplace une maquette choisie.

## Ses choix (16.11)
- Gardés : L5, L1, L11, L3+L4, L12, L7+L22, L6, L9, L29, L33, L16, L36, L25.
- Retiré : L18, l'entretien du matériel daté au calendrier.
- L14 : gardé, compris dans « Tous » (seul L18 est retiré). Plus une question ouverte (16.11 soir : « tout les choix que tu m'a présenté je le ai fait ou refusé »).
- **L1, à reprendre sans intrusion (LIENS-PLACE)** : pas de rangée « Idées » ni de case dédiée. L'idée datée se crée par le + volant (« Idée » dans le menu de la frise) ou par un appui long sur une semaine. Elle apparaît ensuite en point discret sur la frise.
- **L9, prioritaire, à généraliser partout** : chaque geste qui consomme décompte ses consommables (laver un fût, brasser, embouteiller, nettoyer une cuve, conditionner…). Le décompte suit une table réglée une fois par geste, avec un bandeau d'effet et Annuler. C'est une règle de l'app, pas un écran.

## Gestes choisis (16.11 nuit)
- « Liens interactions · L9 b+c · L1 a+b · L4 a+b · L29 b (corrigé ensuite en a : « a est meilleur effectivement ») · L14 a+b » (page https://claude.ai/artifact/GWus9iVdYSBKtM2mBt1kb6, maquettes inter/). Restes du critique à corriger avant le port : Porter unique d'un écran à l'autre, pastille cohérente, « Lié à » à une seule place, liens de L29 b visibles comme touchables.

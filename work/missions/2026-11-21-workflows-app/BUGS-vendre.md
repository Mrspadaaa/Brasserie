# Bugs de la chaîne VENDRE (21.11)

Banc : build de test de `port-carnet` (HEAD d5a2f056c + modifications non commitées d'une autre session), `?dev-local`, fixture simulée `vendre/fixture.mjs`
(Pale Ale conditionnée 120 × 33 cl + 3 fûts, NEIPA terminée 24 × 75 cl + 1 fût, 5 fûts, 3 clients, 3 tarifs, une facture due, une vente promise au calendrier).
390 × 844 tactile (`touchscreen.tap`), CPU ×1. Captures : `vendre/captures/`. Statut : **vu** = joué et regardé dans l'app ; **code** = lu dans le code, pas encore joué jusqu'au bout (rejeu demandé dans ANALYSE-vendre.md).

| N° | Genre | Statut | Constat | Preuve |
|---|---|---|---|---|
| WFV-1 | intégration | code | Vendre un fût à la caisse ne touche pas le fût : il reste « plein en cave » dans Stocks › Fûts, sans client ni date de livraison. Le brasseur doit refaire « Livrer » sur la fiche du fût, client et date ressaisis. À l'inverse, « Livrer » un fût ne prépare aucune vente. | `ui/vente/enregistrerVente.ts` n'écrit qu'une `Transaction` ; `domain/stock/futsFiche.ts` `livrer()` n'est appelé que depuis la fiche du fût |
| WFV-2 | intégration | code + vu | La vente réelle ne solde pas la vente prévue du même client et du même brassin : « La Cigogne, 2 fûts +280 » (plan) reste au calendrier et dans « à dépenser » après la facture des 2 fûts. La caisse risque de compter deux fois. | `preparerVente` ne lit aucun `FinancialPlan` ; `c2-00-cal-avant` : rangée Ventes = facture + plan |
| WFV-3 | intégration | vu | La vente encaissée du jour n'apparaît pas comme chose dans la rangée Ventes du calendrier. Elle n'est que dans l'étiquette de la courbe (« Vente 6 × Pale Ale +27 ») ; la rangée reste « +420 » (140 + 280). | `c1-v-Calendrier.png` |
| WFV-4 | intégration | vu | Le Bord ignore les ventes : après +167 CHF entrés, la carte Finances dit toujours « Charges 0,00 CHF » et rien d'autre. | `c1-v-Bord.png`, texte relevé |
| WFV-5 | intégration | vu | Les bières en vente sont invisibles dans Brassins : Pale Ale (conditionnée) et NEIPA (terminée) n'apparaissent pas, et les filtres disent « Conditionnés 0 · Terminés 0 », alors que la caisse les vend. Cause probable : le filtre de période par défaut « Nov. + en cours ». | `c1-v-Brassins.png` |
| WFV-6 | intégration | vu | Aucun stock de produit fini : après 6 × 33 cl vendues, aucun écran ne dit qu'il en reste 114. La seule trace est la jauge en litres de la caisse, dans la caisse. Stocks n'a que Articles, Courses, Fûts, Matériel et Houblons. | `c1-v-futs.png`, onglets relevés |
| WFV-7 | visuel | vu | Jauge de la caisse : « 99.6 L nets », avec un point au lieu de la virgule de l'app (`Math.round(j.nets * 10) / 10` affiché brut). | `c1-02-caisse.png` ; `Caisse.tsx` l. 330 |
| WFV-8 | interaction | vu | « TWINT » et « Espèces » font 58 × 30 px, sous les 44 px d'une cible au doigt, alors que la caisse refuse d'encaisser tant qu'aucun des deux n'est choisi. C'est le geste obligatoire de chaque vente payée. | journal : `« TWINT » 58×30 px` |
| WFV-9 | interaction | vu | Passer en « Facture QR » sans client : la consigne « une facture a besoin d'un client » s'affiche tout en bas, sous le bouton grisé. La rangée des clients est hors de l'écran, en haut. Rien ne la ramène ni ne l'ouvre. | `c2-02-apres.png` |
| WFV-10 | interaction | vu | La feuille « Tes finances, avant → après » [Annuler] [OK] reste posée sur tous les onglets tant qu'on n'a pas touché OK. À 390 px, elle cache environ 180 px du bas de chaque écran, dont la rangée Ventes du calendrier. | `c1-v-Calendrier.png`, `c1-v-Brassins.png` |
| WFV-11 | texte | vu | En mode « Payé ici », la date garde l'étiquette « Date de la facture » (nom accessible), alors que la pièce est une quittance. | boutons relevés `APRES-TWINT` |
| WFV-12 | interaction | à rejouer | Dans la caisse, toucher le nom « La Cigogne » a touché une cible de 28 × 28 px. Le client n'a pas été choisi, et le formulaire « Ligne libre » s'est ouvert ensuite. Cause non établie : soit l'avatar a une cible trop petite, soit le geste a traversé la feuille. | `c2-01-panier.png`, `c2-02-apres.png` |

Hors bugs, mesuré : INP de 16 à 128 ms par geste (CPU ×1, aucun au-delà de 200 ms) ; démarrage en 240 à 290 ms. La lenteur n'a pas été mesurée sous CPU ×4 (voir ANALYSE, regard 4).

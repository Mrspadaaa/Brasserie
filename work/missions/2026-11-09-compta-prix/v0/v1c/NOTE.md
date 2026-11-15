# v1c — Vendre comme à la caisse, chaud

**Chaleur** : chaude. **Idée** : une seule façon de vendre, comme une caisse : à qui (avatars), quoi (grosses tuiles de formats
avec compteur), puis comment il paie (« Payé là » TWINT · espèces, ou « Facture QR » 30 j). Une vente, deux sorties.

**Où (déplacement proposé)** : le + flottant › « Vendre », partout ; remplace Clients › Facturer **et** + › Encaisser une vente
(problème 20). La fiche client garde un raccourci qui ouvre cette caisse avec le client choisi.

## Problèmes de l'inventaire résolus
- 20 : deux chemins de vente fusionnés ; le client se choisit aussi pour une vente payée sur place (« sans nom » possible).
- 21 : facture à 30 j par défaut (9 déc.).
- Lien vente ↔ brassin (« pas de lien avec le brassin ni avec le stock vendu ») : la jauge dit combien de litres du brassin de
  septembre ce panier emporte (12,4 L sur 27 L nets) ; elle passe au rouge si le panier dépasse le brassin (v1c-apres-fut.png : 32,4 L).
- 10 : adresse manquante signalée sous l'action (« adresse ? + adresse »).

## Baseline (où part chaque fonction)
Date : aujourd'hui, modifiable dans le ticket (passe 2). Échéance : dans le segment « Facture QR · 30 j ». Désignation : tuile
(format) + bière. Prix unitaire : appui long sur la tuile (passe 2). Retirer : « − » de la tuile. Annuler : × de l'en-tête.

## Honnêteté
Prix marqués « prix exemple ». La jauge ne prétend pas connaître le reste en stock (déjà vendu au marché) : elle ne montre que
la part du brassin dans ce panier. Annexe « payé là, sans client » : la vente au marché de la fixture (720,00 CHF), quittance.

## Boosters UX (boosters-ux)
- avatars-client — choisir ; ronds à initiales, anneau finances sur le choisi.
- tuiles-caisse — ajuster ; toucher = +1, « − » en coin ; pastille noire du compte.
- jauge-brassin — suivre ; litres du panier sur les 27 L nets ; rouge au-delà.
- segment-paiement — choisir ; « Payé là » / « Facture QR » ; l'action devient « Encaisser » ou « Facturer ».
- B1 OK · B2 OK (le ticket et son total ; 1 primaire) · B3 OK (59 mots) · B4 OK · B5 non mesuré · B6 OK · B7 OK · B8 OK (adresse
  inconnue, dépassement du brassin) · B9 s.o. · B10 OK · B11 « Je vends 24 × 33 cl et 6 × 75 cl à Café du Bourg, 186 CHF en
  facture QR » · B12 partiel (S4) · B13 OK (tuiles 96 px, avatars 44 px).

## Ce qui tient / ce qui casse
Tient : le geste du marché et celui du café deviennent le même ; très peu de saisie. Casse : plus de 4 formats ou plusieurs bières
demandent un sélecteur de bière (la pastille « + bière ») ; prix par client (Pro / Privé) à prévoir.

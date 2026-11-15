# v1a — Facturer, froid (affine la baseline InvoiceSheet)

**Chaleur** : froide. **Idée** : la feuille « Facturer » d'aujourd'hui, retournée : le total et l'échéance en tête (récap qu'il a aimé
dans la Dépense), les articles groupés par bière avec un compteur −/+, et une seule action noire « Créer la facture QR ».

**Où** : Clients › client › Facturer (inchangé) ; page poussée avec ‹ retour, barre du bas et + gardés.

## Problèmes de l'inventaire résolus
- 21 : l'échéance part à 30 j (segment à réception / 10 j / 30 j), la date se calcule (9 déc. 2026).
- 10 : n° « 2026-·· » en suite de l'année (attribué à l'enregistrement, pas aléatoire) ; l'adresse manquante est une pastille
  hachurée « adresse ? + adresse » au premier plan, parce que le QR l'exige.
- 9 : l'action dit « facture QR » et l'aperçu montre le bulletin QR (compte « CH·· ···· (Réglages) », jamais d'IBAN).
- Interface : « Produit » + « Désignation » fusionnés (le texte de la ligne se modifie dans Détails) ; un article = 1 ligne et
  1 compteur au lieu de 5 contrôles ; total visible avant l'enregistrement ; « sans TVA » dit en pastille (non assujetti).

## Baseline (où part chaque fonction)
Date, n°, compte, TVA, texte de ligne : repli « Détails » (un toucher). Retirer un article : compteur à 0. Ajouter : pastilles des
tarifs (+ fût 20 L, + autre bière). Annuler : ‹ retour. Drive : inchangé, hors écran. Assujetti : la pastille « sans TVA » devient
« HT · TVA 8,1 % » et le total se scinde (à dessiner en passe 2).

## Honnêteté
Prix 5,00 / 11,00 / 180,00 CHF marqués « prix exemple ». Annexe : un prix inconnu = « prix ? » hachuré, total « à compléter ».
Aucun chiffre hors fixture ; 27 L nets du brassin de septembre repris de la fixture.

## Boosters UX (boosters-ux)
- recap-total — lire ; bloc teinté finances, total en display mono ; change avec le compteur (v1a-apres.png : 25 × 33 cl → 191,00).
- segment-echeance — choisir ; segment 3 positions ; la date « dû le » suit (v1a-apres.png : 10 j → 19 nov. 2026).
- stepper-quantite — ajuster ; − n + ; total de ligne et total général.
- tarifs-en-pastilles — déclencher ; pastilles en pointillé = « ajouter ».
- pastille-adresse — suivre ; hachures attention = inconnu requis.
- apercu-pdf-qr — lire ; vignette du PDF avec son bulletin QR.
- B1 OK (6 boosters marqués) · B2 OK (total domine ; 1 primaire noir ; + flottant = chrome de l'app) · B3 OK (57 mots hors données
  et lignes) · B4 OK (bloc articles teinté, détails repliés) · B5 non mesuré · B6 OK (3 tailles : 30, 15/14, 12–13 ; mono pour les
  montants) · B7 OK (contraste OK, couleurs OK) · B8 OK (annexe prix inconnu, adresse inconnue) · B9 s.o. (statique) · B10 OK
  (aucun type="number") · B11 « Je facture 186 CHF à Café du Bourg, payable le 9 déc. » · B12 ECHEC partiel (épaisseurs d'icônes,
  S4) · B13 OK (cibles ≥ 28 px).

## Ce qui tient / ce qui casse
Tient : c'est l'écran qu'il connaît, plus court, avec la réponse en tête. Casse : reste une feuille de saisie ; aucune idée neuve.
Note : « CH·· ···· (Réglages) » est en mono alors que « Réglages » est un mot (à corriger en passe 2).
